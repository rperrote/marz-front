#!/usr/bin/env bash
# worker.sh — provider abstraction for headless LLM CLIs.
#
# A "provider" is an identifier (e.g. "claude", "opencode") that maps to a
# concrete CLI invocation. Each phase resolves its provider via
# RAFITA_<ROLE>_PROVIDER (devProvider, reviewerProvider, plannerProvider).
# worker::run dispatches to the right backend (claude::run or opencode::run).
#
# Contract is the same as claude::run:
#   worker::run <prompt> <label> <role>
#     stdout = response text
#     rc 0 ok, rc 1 hard fail, rc 42 rate-limit exhausted
#
# <role> is one of: dev, reviewer, planner, "" (treated as dev).

# shellcheck disable=SC2155

# --- provider resolution ----------------------------------------------------

worker::_provider_for_role() {
  local role="${1:-dev}"
  case "$role" in
    dev|"")   printf '%s' "${RAFITA_DEV_PROVIDER:-claude}" ;;
    reviewer) printf '%s' "${RAFITA_REVIEWER_PROVIDER:-claude}" ;;
    planner)  printf '%s' "${RAFITA_PLANNER_PROVIDER:-${RAFITA_DEV_PROVIDER:-claude}}" ;;
    *)        printf '%s' "${RAFITA_DEV_PROVIDER:-claude}" ;;
  esac
}

worker::_model_for_role() {
  local role="${1:-dev}"
  case "$role" in
    dev|"")   printf '%s' "${RAFITA_DEV_MODEL:-}" ;;
    reviewer) printf '%s' "${RAFITA_REVIEWER_MODEL:-}" ;;
    planner)  printf '%s' "${RAFITA_DEV_MODEL:-}" ;;
    *)        printf '%s' "${RAFITA_DEV_MODEL:-}" ;;
  esac
}

# --- public entry -----------------------------------------------------------

# worker::run <prompt> <label> <role>
# Dispatches to the role's provider. Keeps claude::run's contract.
# Uses persistent per-role sessions (dev and reviewer are isolated). Each role
# remembers its own context; cross-context leakage is prevented by never mixing
# dev/reviewer sessions.
worker::run() {
  local prompt="$1" label="${2:-worker}" role="${3:-dev}"
  local provider; provider=$(worker::_provider_for_role "$role")
  local model; model=$(worker::_model_for_role "$role")
  local task_id="${RAFITA_CURRENT_TASK:-_global}"

  local session_id="" session_mode=""
  if [[ "$task_id" != "_global" && "$role" != "planner" ]]; then
    local used; used=$(session::get "$task_id" "$role" "used" 2>/dev/null || echo 0)
    [[ -z "$used" ]] && used=0
    session_id=$(session::get "$task_id" "$role" "id" 2>/dev/null || echo "")
    common::log INFO "worker::run session_check task=${task_id} role=${role} used=${used} session_id=${session_id:-none}"
    if [[ "$used" == "0" ]]; then
      session_mode="new"
    else
      session_mode="resume"
    fi
  fi

  case "$provider" in
    claude)
      claude::run "$prompt" "$label" "$role" "$session_id" "$session_mode"
      ;;
    opencode)
      opencode::run "$prompt" "$label" "$model" "$session_id" "$session_mode"
      ;;
    *)
      common::fail "unknown worker provider: $provider"
      ;;
  esac
  local rc=$?

  # Post-run: opencode needs its session id captured after the first call.
  if [[ "$task_id" != "_global" && "$role" != "planner" && "$rc" == "0" ]]; then
    if [[ "$provider" == "opencode" && "$session_mode" == "new" ]]; then
      session::capture_opencode "$task_id" "$role"
    fi
    local sf; sf=$(session::_file "$task_id")
    local file_exists="no"; [[ -f "$sf" ]] && file_exists="yes"
    common::log INFO "worker::run pre_mark_used task=${task_id} role=${role} file=${sf} exists=${file_exists} RAFITA_RUN_DIR=${RAFITA_RUN_DIR:-unset}"
    session::mark_used "$task_id" "$role"
    local used_after; used_after=$(session::get "$task_id" "$role" "used" 2>/dev/null || echo "?")
    common::log INFO "worker::run session_mark_used task=${task_id} role=${role} used_after=${used_after}"
  fi

  return $rc
}
