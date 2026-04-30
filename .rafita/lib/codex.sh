#!/usr/bin/env bash
# codex.sh - wrapper around `codex exec`.
#
# Contract mirrors claude::run / opencode::run:
#   codex::run <prompt> <label> <model> [session_id] [session_mode]
#     stdout = final assistant text
#     rc 0 ok, rc 1 hard fail, rc 42 rate-limit exhausted
#
# Session model:
#   first call:  codex exec ... -
#   resume:      codex exec resume ... <thread_id> -
# The thread_id is read from JSONL `thread.started` in stream mode or from the
# plain stderr header (`session id: ...`) in buffered mode.

# shellcheck disable=SC2155

codex::_bin() { printf '%s' "${RAFITA_CODEX_BIN:-codex}"; }

codex::_sandbox() { printf '%s' "${RAFITA_CODEX_SANDBOX:-workspace-write}"; }

codex::_parse_thread_id() {
  local msg="$1"
  python3 - "$msg" << 'PYEOF'
import re, sys
msg = sys.argv[1]
m = re.search(r"session id:\s*([0-9a-fA-F-]{20,})", msg)
if m:
    print(m.group(1))
PYEOF
}

codex::_base_args() {
  local model="$1"
  [[ -n "$model" ]] && printf '%s\0%s\0' "--model" "$model"
  printf '%s\0' "--skip-git-repo-check"
  local sandbox; sandbox=$(codex::_sandbox)
  [[ -n "$sandbox" ]] && printf '%s\0%s\0' "--sandbox" "$sandbox"
  if [[ "${RAFITA_YOLO:-1}" == "1" ]]; then
    printf '%s\0' "--full-auto"
  fi
}

# Populate RAFITA_CLAUDE_* globals for compatibility with the shared retry loop.
codex::_invoke() {
  local prompt="$1" model="$2" session_id="${3:-}" session_mode="${4:-}"
  RAFITA_CLAUDE_OUT=""
  RAFITA_CLAUDE_RC=0
  RAFITA_CLAUDE_ERR=""
  RAFITA_CODEX_THREAD_ID=""

  if [[ "${RAFITA_DRY_RUN:-0}" == "1" ]]; then
    RAFITA_CLAUDE_OUT="<dry-run>no output</dry-run>"
    return 0
  fi

  local codex_bin; codex_bin=$(codex::_bin)
  local prompt_tmp stdout_tmp stderr_tmp last_tmp thread_tmp rc
  prompt_tmp=$(mktemp); stdout_tmp=$(mktemp); stderr_tmp=$(mktemp); last_tmp=$(mktemp); thread_tmp=$(mktemp)
  printf '%s' "$prompt" > "$prompt_tmp"

  local -a args
  args=(exec)
  if [[ "$session_mode" == "resume" && -n "$session_id" ]]; then
    args+=(resume)
  fi
  while IFS= read -r -d '' arg; do args+=("$arg"); done < <(codex::_base_args "$model")
  # Auto-enable JSON streaming when debug>=2, unless explicitly turned off.
  local _stream="${RAFITA_STREAM_OUTPUT:-}"
  if [[ -z "$_stream" ]]; then
    if [[ -n "${RAFITA_STREAM:-}" ]]; then
      _stream="$RAFITA_STREAM"
    elif [[ "${RAFITA_DEBUG:-1}" -ge 2 ]]; then
      _stream=1
    else
      _stream=0
    fi
  fi
  if [[ "$_stream" == "1" ]]; then
    args+=(--json)
  fi

  args+=(--output-last-message "$last_tmp")
  if [[ "$session_mode" == "resume" && -n "$session_id" ]]; then
    args+=("$session_id")
  fi
  args+=("-")

  local spawn=(python3 "$RAFITA_SCRIPTS_DIR/bin/spawn-session.py")
  if [[ "$_stream" == "1" ]]; then
    local parser="$RAFITA_SCRIPTS_DIR/bin/stream-parser-codex.py"

    exec 3>&2
    local _had_pipefail=0
    if [[ -o pipefail ]]; then _had_pipefail=1; fi
    set -o pipefail

    if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
      "${spawn[@]}" timeout "$RAFITA_WORKER_TIMEOUT" "$codex_bin" "${args[@]}" \
        2>"$stderr_tmp" <"$prompt_tmp" \
        | RAFITA_CODEX_THREAD_FILE="$thread_tmp" python3 "$parser" >"$stdout_tmp" 2>&3 &
    else
      "${spawn[@]}" "$codex_bin" "${args[@]}" \
        2>"$stderr_tmp" <"$prompt_tmp" \
        | RAFITA_CODEX_THREAD_FILE="$thread_tmp" python3 "$parser" >"$stdout_tmp" 2>&3 &
    fi
    local leader=$!
    claude::_register_child "$leader"
    wait "$leader"
    rc=$?
    claude::_unregister_child "$leader"
    exec 3>&-
    if (( _had_pipefail == 0 )); then set +o pipefail; fi
  else
    if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
      "${spawn[@]}" timeout "$RAFITA_WORKER_TIMEOUT" "$codex_bin" "${args[@]}" \
        >"$stdout_tmp" 2>"$stderr_tmp" <"$prompt_tmp" &
    else
      "${spawn[@]}" "$codex_bin" "${args[@]}" \
        >"$stdout_tmp" 2>"$stderr_tmp" <"$prompt_tmp" &
    fi
    local leader=$!
    claude::_register_child "$leader"
    export RAFITA_CHILD_PID="$leader"
    export RAFITA_STDOUT_TMP="$stdout_tmp"
    export RAFITA_STDERR_TMP="$stderr_tmp"

    local stream_pid=""
    if [[ "${RAFITA_STREAM_OUTPUT:-0}" == "1" ]]; then
      claude::_stream_output "$stdout_tmp" &
      stream_pid=$!
    fi

    wait "$leader"
    rc=$?

    if [[ -n "$stream_pid" ]]; then
      kill "$stream_pid" 2>/dev/null || true
      wait "$stream_pid" 2>/dev/null || true
    fi

    claude::_unregister_child "$leader"
    unset RAFITA_CHILD_PID RAFITA_STDOUT_TMP RAFITA_STDERR_TMP
  fi

  RAFITA_CLAUDE_OUT=$(cat "$stdout_tmp")
  RAFITA_CLAUDE_ERR=$(cat "$stderr_tmp")
  RAFITA_CLAUDE_RC=$rc

  if [[ -s "$last_tmp" ]]; then
    RAFITA_CLAUDE_OUT=$(cat "$last_tmp")
  fi
  if [[ -s "$thread_tmp" ]]; then
    RAFITA_CODEX_THREAD_ID=$(cat "$thread_tmp")
  else
    RAFITA_CODEX_THREAD_ID=$(codex::_parse_thread_id "$RAFITA_CLAUDE_ERR")
  fi
  export RAFITA_CODEX_THREAD_ID

  if [[ -z "$RAFITA_CLAUDE_OUT" && "$RAFITA_CLAUDE_RC" -eq 0 ]]; then
    common::log WARN "codex produced no output (rc=0); forcing rc=2"
    RAFITA_CLAUDE_RC=2
  fi
  rm -f "$prompt_tmp" "$stdout_tmp" "$stderr_tmp" "$last_tmp" "$thread_tmp"
}

codex::run() {
  local prompt="$1" label="${2:-codex}" model="${3:-}" session_id="${4:-}" session_mode="${5:-}"
  local task_id="${RAFITA_CURRENT_TASK:-_global}"
  local prompt_bytes=${#prompt}

  if [[ "${RAFITA_DEBUG:-1}" -ge 1 && -n "${RAFITA_RUN_DIR:-}" ]]; then
    common::debug_save "$task_id" "${label}.prompt" "$prompt"
  fi

  common::log INFO "codex::run start label=${label} model=${model:-default} session_mode=${session_mode:-none} prompt_bytes=${prompt_bytes}"
  ui::info "→ codex (${model:-default}) working on ${label}..."

  local rl_attempts=0 transient_attempts=0
  while true; do
    local t0; t0=$(date +%s)
    claude::_heartbeat_start "$label" "$t0"
    codex::_invoke "$prompt" "$model" "$session_id" "$session_mode"
    claude::_heartbeat_stop
    local out="${RAFITA_CLAUDE_OUT:-}"
    local err="${RAFITA_CLAUDE_ERR:-}"
    local rc="${RAFITA_CLAUDE_RC:-0}"
    local t1; t1=$(date +%s)
    local dur=$((t1 - t0))
    common::log INFO "codex::run returned label=${label} rc=${rc} duration=${dur}s out_bytes=${#out} err_bytes=${#err} thread_id=${RAFITA_CODEX_THREAD_ID:-none}"
    if (( rc == 0 )); then
      ui::info "← codex ${label} done (${dur}s, ${#out}B)"
    else
      ui::info "← codex ${label} rc=${rc} (${dur}s)"
    fi

    local combined="$out"$'\n'"$err"
    local reset_epoch
    reset_epoch=$(claude::_parse_rate_limit "$combined")
    if [[ -n "$reset_epoch" ]]; then
      export RAFITA_LAST_RESET_AT="$reset_epoch"
      rl_attempts=$((rl_attempts + 1))
      if (( rl_attempts > 3 )); then
        common::log WARN "codex rate limit: 3 retries exhausted"
        [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
        return 42
      fi
      local now sleep_for
      now=$(date +%s)
      sleep_for=$(( reset_epoch - now + 60 ))
      (( sleep_for < 60 )) && sleep_for=60
      local cap="${RAFITA_RATE_LIMIT_MAX_SLEEP:-21600}"
      (( sleep_for > cap )) && sleep_for=$cap
      common::log INFO "codex rate limit: sleeping ${sleep_for}s (retry $rl_attempts/3)"
      sleep "$sleep_for"
      continue
    fi

    if (( rc == 0 )); then
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$out"
      printf '%s' "$out"
      return 0
    fi

    if (( rc == 124 )); then
      common::log ERROR "codex timed out (workerTimeout=${RAFITA_WORKER_TIMEOUT:-unset})"
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
      return 1
    fi

    transient_attempts=$((transient_attempts + 1))
    if (( transient_attempts > 3 )); then
      common::log ERROR "codex hard failure after 3 retries (rc=$rc): ${err:0:200}"
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
      return 1
    fi
    local backoff=$(( 2 ** transient_attempts ))
    common::log WARN "codex transient rc=$rc, retry $transient_attempts/3 after ${backoff}s"
    sleep "$backoff"
  done
}
