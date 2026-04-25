#!/usr/bin/env bash
# rafita v2 — entrypoint. Parses args, loads libs, orchestrates epics.
# Business logic lives in lib/ and phases/. This file stays thin.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export RAFITA_SCRIPTS_DIR="$SCRIPT_DIR"
export RAFITA_DIR="${RAFITA_DIR:-.rafita}"

# Load libs in dependency order. shellcheck source=/dev/null
for lib in common ui config state git flowctl vcs stream claude opencode worker review quality notify orchestrator session; do
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
  --current-branch   Stay on current branch (override config branchMode)
  --current-worktree Force an isolated worktree for this run (override config worktreeEnabled)
  --dry-run          Run the loop without invoking claude (for smoke tests)
  --debug[=N]        Debug level: 0 clean, 1 logs (default), 2 stream, 3 verbose
  --resume           Resume from .rafita/state.json if present
  --resume-task ID   Resume a specific in-progress task (skips next-task lookup)
  --reset            Clear .rafita/state.json and start fresh
  -h, --help         This help
EOF
}

main() {
  local epic_arg=""
  local -a cli_overrides
  cli_overrides=()
  local resume=0 reset=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --current-branch) cli_overrides+=("RAFITA_BRANCH_MODE=current"); shift ;;
      --current-worktree) cli_overrides+=("RAFITA_WORKTREE_ENABLED=1"); shift ;;
      --dry-run) cli_overrides+=("RAFITA_DRY_RUN=1"); shift ;;
      --resume) resume=1; shift ;;
      --resume-task) export RAFITA_RESUME_TASK_ID="$2"; shift 2 ;;
      --reset) reset=1; shift ;;
      --debug) cli_overrides+=("RAFITA_DEBUG=2"); shift ;;
      --debug=*) cli_overrides+=("RAFITA_DEBUG=${1#--debug=}"); shift ;;
      fn-*) epic_arg="$1"; shift ;;
      *)
        echo "unknown arg: $1" >&2
        usage; exit 2
        ;;
    esac
  done

  # Traps: clean up UI timer, persist checkpoint on interrupt.
  trap 'rafita::_on_interrupt' INT TERM
  trap 'rafita::_on_exit' EXIT

  config::load "${RAFITA_DIR}/config.json"
  if (( ${#cli_overrides[@]} > 0 )); then
    config::apply_overrides "${cli_overrides[@]}"
  fi

  # Absolutize RAFITA_DIR so state/runs survive a cd into a worktree.
  if [[ "$RAFITA_DIR" != /* ]]; then
    mkdir -p "$RAFITA_DIR"
    RAFITA_DIR="$(cd "$RAFITA_DIR" && pwd)"
    export RAFITA_DIR
  fi

  common::check_dependencies

  # Reap any claude processes left alive by a previous run that crashed.
  rafita::_reap_orphans

  if (( reset )); then state::clear; fi

  export RAFITA_SOURCE_BRANCH
  RAFITA_SOURCE_BRANCH=$(git::current_branch)

  # Resume flow.
  if (( resume )) || state::has_checkpoint; then
    if state::has_checkpoint; then
      rafita::_resume_flow
      return 0
    fi
    if (( resume )); then
      common::fail "--resume requested but no state.json found"
    fi
  fi

  git::ensure_clean_tree
  git::ensure_gitignore
  common::init_run_dir
  common::counters_init
  ui::header
  ui::config_summary

  # Worktree: isolate this run in a dedicated checkout. Branches are still
  # created/switched inside it; state/artifacts stay in the original RAFITA_DIR.
  rafita::_enter_worktree_if_enabled

  local -a epics=()
  if [[ -n "$epic_arg" ]]; then
    epics=("$epic_arg")
  else
    while IFS= read -r line; do
      [[ -n "$line" ]] && epics+=("$line")
    done < <(flowctl::open_epics)
  fi

  if (( ${#epics[@]} == 0 )); then
    ui::info "no open epics; nothing to do"
    return 0
  fi

  for epic in "${epics[@]}"; do
    # run_epic returns 0 on happy path; any non-zero here is a handled failure
    # already logged. Don't let set -e trip on it.
    orchestrator::run_epic "$epic" || true
  done

  state::clear
  ui::complete_summary \
    "$RAFITA_TASKS_DONE" \
    "$RAFITA_TASKS_SKIPPED" \
    "$RAFITA_TASKS_FAILED" \
    "$(common::elapsed)"
  # Completion notification fires from _on_exit so it also covers errors and
  # interrupts; don't duplicate here.
}

rafita::_resume_flow() {
  local state; state=$(state::load_checkpoint)
  [[ -z "$state" ]] && common::fail "no resume state found"
  local epic; epic=$(common::json_get "$state" epic_id)
  local task; task=$(common::json_get "$state" task_id)
  local branch; branch=$(common::json_get "$state" branch)
  local snap; snap=$(common::json_get "$state" snapshot_sha)
  local completed; completed=$(common::json_get "$state" completed_tasks)
  local run_id; run_id=$(common::json_get "$state" run_id)

  common::init_run_dir "$run_id"
  common::counters_init
  ui::header
  ui::info "resuming run: epic=${epic} task=${task}"

  rafita::_enter_worktree_if_enabled

  # Checkout saved branch.
  if [[ -n "$branch" ]]; then
    git checkout -q "$branch" 2>/dev/null || common::fail "resume: cannot checkout ${branch}"
  fi
  # Validate snapshot reachable.
  if [[ -n "$snap" ]] && ! git cat-file -e "$snap" 2>/dev/null; then
    common::fail "resume: snapshot ${snap} not reachable; aborting"
  fi

  export RAFITA_COMPLETED_CSV
  RAFITA_COMPLETED_CSV=$(printf '%s' "$completed" | python3 -c 'import sys,json
try: d=json.loads(sys.stdin.read())
except: d=[]
print(",".join(d) if isinstance(d,list) else "")')

  # If state has a specific task, tell the epic runner to resume it first.
  if [[ -n "$task" ]]; then
    export RAFITA_RESUME_TASK_ID="$task"
  fi

  orchestrator::run_epic "$epic" || true
  state::clear
  ui::complete_summary \
    "$RAFITA_TASKS_DONE" \
    "$RAFITA_TASKS_SKIPPED" \
    "$RAFITA_TASKS_FAILED" \
    "$(common::elapsed)"
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
  common::log WARN "interrupted by signal; state preserved at ${RAFITA_DIR}/state.json"
  ui::error "interrupted — resume with: rafita.sh --resume"
  exit 130
}

rafita::_on_exit() {
  local rc=$?
  common::cleanup "$rc" || true
  # Single end-of-run notification (success / partial / failure / interrupted).
  notify::send_completion "$rc" || true
  rafita::_cleanup_worktree "$rc" || true
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

rafita::_enter_worktree_if_enabled() {
  [[ "${RAFITA_WORKTREE_ENABLED:-0}" == "1" ]] || return 0
  # Already inside a rafita worktree (e.g. re-entry via resume path).
  [[ -n "${RAFITA_WORKTREE_PATH:-}" ]] && return 0

  local wt_path
  wt_path=$(git::create_run_worktree "$RAFITA_RUN_ID") || common::fail "worktree creation failed"
  export RAFITA_WORKTREE_PATH="$wt_path"
  cd "$wt_path" || common::fail "cannot cd into worktree: $wt_path"
  ui::info "worktree: $wt_path"
}

rafita::_cleanup_worktree() {
  local wt="${RAFITA_WORKTREE_PATH:-}"
  [[ -z "$wt" ]] && return 0
  # Keep the worktree around when asked, on interrupt, or on non-zero exit so
  # the user can inspect or resume. Only remove on clean success.
  local rc="${1:-0}"
  if [[ "${RAFITA_WORKTREE_KEEP:-0}" == "1" || "$rc" -ne 0 ]]; then
    common::log INFO "worktree kept at: $wt"
    return 0
  fi
  # cd out before removing.
  cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.." 2>/dev/null || cd / || true
  git::remove_run_worktree "$wt"
  unset RAFITA_WORKTREE_PATH
}

main "$@"
