#!/usr/bin/env bash
# ui.sh — presentation layer. ANSI colors auto-disabled when stdout isn't a
# tty, NO_COLOR is set, or RAFITA_UI=0. Live timer is a background process
# that writes to the same tty with \r; cleanup must kill it.

# shellcheck disable=SC2155,SC2034

_ui_enabled() { [[ "${RAFITA_UI:-1}" == "1" ]]; }

_ui_init_colors() {
  if _ui_enabled && [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
    UI_RED=$'\033[0;31m'
    UI_GREEN=$'\033[0;32m'
    UI_YELLOW=$'\033[0;33m'
    UI_BLUE=$'\033[0;34m'
    UI_MAGENTA=$'\033[0;35m'
    UI_CYAN=$'\033[0;36m'
    UI_GRAY=$'\033[0;90m'
    UI_BOLD=$'\033[1m'
    UI_DIM=$'\033[2m'
    UI_RESET=$'\033[0m'
  else
    UI_RED=""; UI_GREEN=""; UI_YELLOW=""; UI_BLUE=""; UI_MAGENTA=""
    UI_CYAN=""; UI_GRAY=""; UI_BOLD=""; UI_DIM=""; UI_RESET=""
  fi
}
_ui_init_colors

# All UI goes to stderr so it never collides with phase outputs (plan md,
# verdict JSON) captured by $(...) in the orchestrator.
_ui_print() { _ui_enabled || return 0; printf '%s\n' "$*" >&2; }

ui::header() {
  _ui_enabled || return 0
  {
    printf '\n%s╭─ rafita v2 ─────────────────────────────────────%s\n' "$UI_CYAN" "$UI_RESET"
    printf '%s│%s run_id: %s\n' "$UI_CYAN" "$UI_RESET" "${RAFITA_RUN_ID:-?}"
    printf '%s╰─────────────────────────────────────────────────%s\n' "$UI_CYAN" "$UI_RESET"
  } >&2
}

ui::config_summary() {
  _ui_enabled || return 0
  {
    printf '%sconfig%s\n' "$UI_BOLD" "$UI_RESET"
    printf '  profile         : %s\n' "${RAFITA_PROJECT_TYPE:-generic}"
    printf '  provider        : %s\n' "${RAFITA_PROVIDER:-github}"
    printf '  branch mode     : %s\n' "${RAFITA_BRANCH_MODE:-new}"
    printf '  dev provider    : %s\n' "${RAFITA_DEV_PROVIDER:-claude}"
    printf '  dev model       : %s\n' "${RAFITA_DEV_MODEL:-default}"
    printf '  reviewer provider: %s\n' "${RAFITA_REVIEWER_PROVIDER:-claude}"
    printf '  reviewer model  : %s\n' "${RAFITA_REVIEWER_MODEL:-default}"
    printf '  max rounds      : %s\n' "${RAFITA_MAX_REVIEW_ROUNDS:-5}"
    printf '  dry run         : %s\n' "${RAFITA_DRY_RUN:-0}"
  } >&2
}

ui::epic_start() {
  local eid="$1"
  _ui_print ""
  _ui_print "${UI_BOLD}${UI_MAGENTA}═══ Epic: ${eid} ═══${UI_RESET}"
}

ui::task_start() {
  local tid="$1" title="${2:-}"
  _ui_print ""
  _ui_print "${UI_BOLD}── Task: ${tid}${UI_RESET}  ${UI_DIM}${title}${UI_RESET}"
}

ui::phase() {
  local phase="$1"; shift
  local msg="${*:-}"
  _ui_print "   ${UI_BLUE}[${phase}]${UI_RESET} ${msg}"
}

ui::phase_pass() {
  local phase="$1"; shift
  local msg="${*:-}"
  _ui_print "   ${UI_GREEN}[${phase} PASS]${UI_RESET} ${msg}"
}

ui::phase_fail() {
  local phase="$1"; shift
  local msg="${*:-}"
  _ui_print "   ${UI_RED}[${phase} FAIL]${UI_RESET} ${msg}"
}

ui::review_approved() {
  local dur="${1:-0}"
  _ui_print "   ${UI_GREEN}[REVIEW APPROVED]${UI_RESET} ${dur}s"
}

ui::review_rejected() {
  local fixes="${1:-?}" dur="${2:-0}"
  _ui_print "   ${UI_YELLOW}[REVIEW NOT APPROVED]${UI_RESET} ${fixes} fixes — ${dur}s"
}

ui::task_done() {
  local tid="$1" rounds="$2"
  _ui_print "   ${UI_GREEN}✓ DONE${UI_RESET}  ${tid} (rounds=${rounds})"
}

ui::task_skipped() {
  local tid="$1" reason="${2:-max-rounds}"
  _ui_print "   ${UI_YELLOW}⚠ SKIPPED${UI_RESET} ${tid} (${reason})"
}

ui::error() {
  _ui_enabled || return 0
  printf '%s✗ ERROR%s %s\n' "$UI_RED" "$UI_RESET" "$*" >&2
}

ui::info() {
  _ui_print "   ${UI_DIM}${*}${UI_RESET}"
}

ui::complete_summary() {
  local done="$1" skipped="$2" failed="$3" dur="$4"
  _ui_enabled || return 0
  {
    printf '\n%s── Summary ─────%s\n' "$UI_BOLD" "$UI_RESET"
    printf '  done     : %s\n' "$done"
    printf '  skipped  : %s\n' "$skipped"
    printf '  failed   : %s\n' "$failed"
    printf '  duration : %s\n' "$(common::human_duration "$dur")"
  } >&2
}

# --- live timer -------------------------------------------------------------
# Spawns a background process that refreshes the last line with elapsed time.
# Keep one at a time; ui::stop_timer must always be called before the next
# start. Must be killed in cleanup to avoid orphans.

ui::start_timer() {
  _ui_enabled || return 0
  [[ -t 1 ]] || return 0
  [[ "${RAFITA_TIMER_DISABLED:-0}" == "1" ]] && return 0
  local label="${1:-working}"
  ui::stop_timer
  (
    local start
    start=$(date +%s)
    while true; do
      local now elapsed
      now=$(date +%s)
      elapsed=$((now - start))
      printf '\r   %s[%s]%s %s (%ss)   ' "$UI_DIM" "$label" "$UI_RESET" "..." "$elapsed" >&2
      sleep 1
    done
  ) &
  RAFITA_UI_TIMER_PID=$!
  export RAFITA_UI_TIMER_PID
}

ui::stop_timer() {
  if [[ -n "${RAFITA_UI_TIMER_PID:-}" ]] && kill -0 "$RAFITA_UI_TIMER_PID" 2>/dev/null; then
    kill "$RAFITA_UI_TIMER_PID" 2>/dev/null || true
    wait "$RAFITA_UI_TIMER_PID" 2>/dev/null || true
    unset RAFITA_UI_TIMER_PID
    if [[ -t 2 ]]; then
      printf '\r%-80s\r' ' ' >&2
    fi
  fi
}
