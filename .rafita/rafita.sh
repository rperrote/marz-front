#!/usr/bin/env bash
# rafita v2 — entrypoint. Parses args, loads libs, orchestrates epics.
# Business logic lives in lib/ and phases/. This file stays thin.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export RAFITA_SCRIPTS_DIR="$SCRIPT_DIR"
export RAFITA_DIR="${RAFITA_DIR:-.rafita}"

# Load libs in dependency order. shellcheck source=/dev/null
for lib in common ui config git flowctl vcs stream claude opencode codex worker review quality notify orchestrator session; do
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/lib/${lib}.sh"
done
# shellcheck source=/dev/null
source "$SCRIPT_DIR/phases/dev.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/phases/review.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/phases/final.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/phases/closer.sh"

usage() {
  cat << EOF
rafita v2 — autonomous Dev+Review loop

Usage:
  rafita.sh [EPIC_ID] [options]

Options:
  --continue         Finish the first in-progress task, then continue normally
  --branch-by-epic   Use one branch per epic instead of sharing dependency branches
  --dry-run          Run the loop without invoking claude (for smoke tests)
  --debug[=N]        Debug level: 0 clean, 1 logs (default), 2 stream, 3 raw
  --closer-only      Skip the DEV/REVIEW loop. Run only CLOSER+FINAL on the
                     already-done tasks of the given epic, then publish.
  -h, --help         This help

Worktrees: rafita does NOT manage worktrees. To run inside an isolated
worktree, create one first with .rafita/worktree-create.sh and cd into it.
EOF
}

main() {
  local epic_arg=""
  local -a cli_overrides
  cli_overrides=()
  local continue_mode=0 closer_only=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --continue) continue_mode=1; shift ;;
      --branch-by-epic) cli_overrides+=("RAFITA_BRANCH_BY_EPIC=1"); shift ;;
      --dry-run) cli_overrides+=("RAFITA_DRY_RUN=1"); shift ;;
      --closer-only) closer_only=1; shift ;;
      --debug) cli_overrides+=("RAFITA_DEBUG=2"); shift ;;
      --debug=*) cli_overrides+=("RAFITA_DEBUG=${1#--debug=}"); shift ;;
      fn-*) epic_arg="$1"; shift ;;
      *)
        echo "unknown arg: $1" >&2
        usage; exit 2
        ;;
    esac
  done

  # Traps: clean up UI timer and child worker processes.
  trap 'rafita::_on_interrupt' INT TERM
  trap 'rafita::_on_exit' EXIT

  config::load "${RAFITA_DIR}/config.json"
  if (( ${#cli_overrides[@]} > 0 )); then
    config::apply_overrides "${cli_overrides[@]}"
  fi

  # Absolutize RAFITA_DIR so paths are stable regardless of cd's later.
  if [[ "$RAFITA_DIR" != /* ]]; then
    mkdir -p "$RAFITA_DIR"
    RAFITA_DIR="$(cd "$RAFITA_DIR" && pwd)"
    export RAFITA_DIR
  fi

  common::check_dependencies

  # Reap any claude processes left alive by a previous run that crashed.
  rafita::_reap_orphans

  export RAFITA_SOURCE_BRANCH
  RAFITA_SOURCE_BRANCH=$(git::current_branch)

  if (( ! continue_mode )); then
    git::ensure_clean_tree
  fi
  git::ensure_gitignore
  common::init_run_dir
  common::counters_init
  ui::header
  ui::config_summary

  local -a epics=()
  if [[ -n "$epic_arg" ]]; then
    epics=("$epic_arg")
  elif (( closer_only )); then
    common::fail "--closer-only requires an explicit EPIC_ID (we don't infer which epic to close)"
  else
    while IFS= read -r line; do
      [[ -n "$line" ]] && epics+=("$line")
    done < <(flowctl::open_epics)
  fi

  if (( ${#epics[@]} == 0 )); then
    ui::info "no open epics; nothing to do"
    return 0
  fi

  if (( continue_mode )); then
    local found_epic="" found_task="" epic
    for epic in "${epics[@]}"; do
      found_task=$(flowctl::in_progress_task_id "$epic")
      if [[ -n "$found_task" ]]; then
        found_epic="$epic"
        break
      fi
    done
    if [[ -z "$found_epic" || -z "$found_task" ]]; then
      common::fail "--continue requested but no in-progress task was found"
    fi
    local -a reordered=("$found_epic")
    for epic in "${epics[@]}"; do
      [[ "$epic" == "$found_epic" ]] && continue
      reordered+=("$epic")
    done
    epics=("${reordered[@]}")
    export RAFITA_CONTINUE_FIRST=1
    export RAFITA_CONTINUE_TASK_ID="$found_task"
    # When the user did not pin a specific epic, --continue applies to every
    # epic in the queue: each one retakes its own in-progress task (if any)
    # before the normal ready loop. With an explicit epic_arg, --continue
    # only affects that one (legacy one-shot behavior).
    if [[ -z "$epic_arg" ]]; then
      export RAFITA_CONTINUE_ALL=1
    fi
    common::log INFO "continue mode: first task ${found_task} in epic ${found_epic}${RAFITA_CONTINUE_ALL:+ (all epics)}"
  fi

  for epic in "${epics[@]}"; do
    if (( closer_only )); then
      orchestrator::run_closer_only "$epic" || true
    else
      # run_epic returns 0 on happy path; any non-zero here is a handled
      # failure already logged. Don't let set -e trip on it.
      orchestrator::run_epic "$epic" || true
    fi
  done

  ui::complete_summary \
    "$RAFITA_TASKS_DONE" \
    "$RAFITA_TASKS_SKIPPED" \
    "$RAFITA_TASKS_FAILED" \
    "$(common::elapsed)"
  # Completion notification fires from _on_exit so it also covers errors and
  # interrupts; don't duplicate here.
}

rafita::_on_interrupt() {
  ui::stop_timer
  claude::_heartbeat_stop 2>/dev/null || true
  # Tear down every claude child (and its whole session group). spawn-session
  # made each one a session leader, so negative-PID kill reaches the entire
  # subtree (node workers, subprocesses, etc).
  claude::kill_all_children 2>/dev/null || true
  # Kill any remaining direct children of this shell (timers, python parsers).
  pkill -TERM -P $$ 2>/dev/null || true
  common::log WARN "interrupted by signal; rerun with --continue to finish an in-progress task"
  ui::error "interrupted — continue with: rafita.sh --continue"
  exit 130
}

rafita::_on_exit() {
  local rc=$?
  common::cleanup "$rc" || true
  # Single end-of-run notification (success / partial / failure / interrupted).
  notify::send_completion "$rc" || true
}

# Scan previous run dirs for surviving claude children and kill them. Runs at
# bootstrap to keep the system clean after a crash or ungraceful interrupt.
rafita::_reap_orphans() {
  local base="${RAFITA_DIR:-.rafita}/runs"
  [[ -d "$base" ]] || return 0
  local killed=0 pidf pid
  while IFS= read -r pidf; do
    [[ -f "$pidf" ]] || continue
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      if kill -0 "$pid" 2>/dev/null; then
        kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
        killed=$((killed+1))
      fi
    done < "$pidf"
    sleep 0
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      if kill -0 "$pid" 2>/dev/null; then
        kill -KILL -"$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
      fi
    done < "$pidf"
    : > "$pidf"
  done < <(find "$base" -name 'children.pids' -type f 2>/dev/null)
  if (( killed > 0 )); then
    printf 'rafita: reaped %d orphan claude process(es) from prior run(s)\n' "$killed" >&2
  fi
}

main "$@"
