#!/usr/bin/env bash
# opencode.sh — wrapper around the `opencode` CLI (sst-style headless runner).
# Mirrors claude::run's contract so worker::run can dispatch to either.
#
#   opencode::run <prompt> <label> <model>
#     stdout: response text
#     rc 0 ok, rc 1 hard fail, rc 42 rate-limit exhausted
#
# Invocation shape: `opencode run <prompt> --model <provider/model>
#                    [--dangerously-skip-permissions] [--dir <cwd>]`
# Output modes:
#   default         → plain text (what we parse for the response body)
#   --format json   → JSON events (used when RAFITA_STREAM=1)

# shellcheck disable=SC2155

opencode::_bin() { printf '%s' "${RAFITA_OPENCODE_BIN:-opencode}"; }

# opencode::_invoke <prompt> <model>
# Populates: RAFITA_CLAUDE_OUT, RAFITA_CLAUDE_RC, RAFITA_CLAUDE_ERR
# (shared globals so the retry loop can reuse the same rate-limit parser).
opencode::_invoke() {
  local prompt="$1" model="$2" session_id="${3:-}" session_mode="${4:-}"
  RAFITA_CLAUDE_OUT=""
  RAFITA_CLAUDE_RC=0
  RAFITA_CLAUDE_ERR=""

  if [[ "${RAFITA_DRY_RUN:-0}" == "1" ]]; then
    RAFITA_CLAUDE_OUT="<dry-run>no output</dry-run>"
    return 0
  fi

  local oc_bin; oc_bin=$(opencode::_bin)
  local args=(run "$prompt")
  [[ -n "$model" ]] && args+=(--model "$model")
  [[ "${RAFITA_YOLO:-1}" == "1" ]] && args+=(--dangerously-skip-permissions)

  if [[ "$session_mode" == "resume" && -n "$session_id" ]]; then
    args+=(--session "$session_id")
  fi

  local stdout_tmp stderr_tmp rc
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  local spawn=(python3 "$RAFITA_SCRIPTS_DIR/bin/spawn-session.py")
  local leader

  # Auto-enable streaming when debug>=2, unless explicitly turned off.
  # Mirrors claude.sh logic so both providers behave the same.
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
    # Native JSON streaming: opencode --format json | parser → stdout_tmp
    args+=(--format json)
    local parser="$RAFITA_SCRIPTS_DIR/bin/stream-parser-opencode.py"
    {
      if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
        "${spawn[@]}" timeout "$RAFITA_WORKER_TIMEOUT" "$oc_bin" "${args[@]}" \
          2>"$stderr_tmp" </dev/null
      else
        "${spawn[@]}" "$oc_bin" "${args[@]}" \
          2>"$stderr_tmp" </dev/null
      fi
    } | python3 "$parser" > "$stdout_tmp" &
    leader=$!
  else
    # Standard buffered mode (plain text)
    if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
      "${spawn[@]}" timeout "$RAFITA_WORKER_TIMEOUT" "$oc_bin" "${args[@]}" \
        >"$stdout_tmp" 2>"$stderr_tmp" </dev/null &
    else
      "${spawn[@]}" "$oc_bin" "${args[@]}" \
        >"$stdout_tmp" 2>"$stderr_tmp" </dev/null &
    fi
    leader=$!
  fi

  claude::_register_child "$leader"
  export RAFITA_CHILD_PID="$leader"
  export RAFITA_STDOUT_TMP="$stdout_tmp"
  export RAFITA_STDERR_TMP="$stderr_tmp"

  # Only use file-polling stream for non-JSON output (claude or opencode without --format json)
  local stream_pid=""
  if [[ "${RAFITA_STREAM_OUTPUT:-0}" == "1" && -z "${parser:-}" ]]; then
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
  RAFITA_CLAUDE_OUT=$(cat "$stdout_tmp")
  RAFITA_CLAUDE_ERR=$(cat "$stderr_tmp")
  RAFITA_CLAUDE_RC=$rc
  # Empty-output guard: in stream mode the parser is supposed to always emit
  # something (final text, deltas, or exit 2). If we end up with empty stdout
  # AND rc=0, force rc=2 so the caller doesn't downstream a fake verdict.
  if [[ -z "$RAFITA_CLAUDE_OUT" && "$RAFITA_CLAUDE_RC" -eq 0 ]]; then
    common::log WARN "opencode produced no output (rc=0); forcing rc=2"
    RAFITA_CLAUDE_RC=2
  fi
  rm -f "$stdout_tmp" "$stderr_tmp"
}

# Public entry. Same rc conventions as claude::run.
# Args: prompt label model [session_id] [session_mode]
opencode::run() {
  local prompt="$1" label="${2:-opencode}" model="${3:-}" session_id="${4:-}" session_mode="${5:-}"
  local task_id="${RAFITA_CURRENT_TASK:-_global}"
  local prompt_bytes=${#prompt}

  # Persist prompt artifact (same on-disk layout as claude).
  if [[ "${RAFITA_DEBUG:-1}" -ge 1 && -n "${RAFITA_RUN_DIR:-}" ]]; then
    common::debug_save "$task_id" "${label}.prompt" "$prompt"
  fi

  common::log INFO "opencode::run start label=${label} model=${model:-default} session_mode=${session_mode:-none} prompt_bytes=${prompt_bytes}"
  ui::info "→ opencode (${model:-default}) working on ${label}..."

  local rl_attempts=0 transient_attempts=0
  while true; do
    local t0; t0=$(date +%s)
    claude::_heartbeat_start "$label" "$t0"
    opencode::_invoke "$prompt" "$model" "$session_id" "$session_mode"
    claude::_heartbeat_stop
    local out="${RAFITA_CLAUDE_OUT:-}"
    local err="${RAFITA_CLAUDE_ERR:-}"
    local rc="${RAFITA_CLAUDE_RC:-0}"
    local t1; t1=$(date +%s)
    local dur=$((t1 - t0))
    common::log INFO "opencode::run returned label=${label} rc=${rc} duration=${dur}s out_bytes=${#out} err_bytes=${#err}"
    if (( rc == 0 )); then
      ui::info "← opencode ${label} done (${dur}s, ${#out}B)"
    else
      ui::info "← opencode ${label} rc=${rc} (${dur}s)"
    fi

    # Share the rate-limit detector with claude (pattern matching on stderr).
    local combined="$out"$'\n'"$err"
    local reset_epoch
    reset_epoch=$(claude::_parse_rate_limit "$combined")
    if [[ -n "$reset_epoch" ]]; then
      export RAFITA_LAST_RESET_AT="$reset_epoch"
      rl_attempts=$((rl_attempts + 1))
      if (( rl_attempts > 3 )); then
        common::log WARN "opencode rate limit: 3 retries exhausted"
        [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
        return 42
      fi
      local now sleep_for
      now=$(date +%s)
      sleep_for=$(( reset_epoch - now + 60 ))
      (( sleep_for < 60 )) && sleep_for=60
      local cap="${RAFITA_RATE_LIMIT_MAX_SLEEP:-21600}"
      (( sleep_for > cap )) && sleep_for=$cap
      common::log INFO "opencode rate limit: sleeping ${sleep_for}s (retry $rl_attempts/3)"
      sleep "$sleep_for"
      continue
    fi

    if (( rc == 0 )); then
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$out"
      printf '%s' "$out"
      return 0
    fi

    if (( rc == 124 )); then
      common::log ERROR "opencode timed out (workerTimeout=${RAFITA_WORKER_TIMEOUT:-unset})"
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
      return 1
    fi

    transient_attempts=$((transient_attempts + 1))
    if (( transient_attempts > 3 )); then
      common::log ERROR "opencode hard failure after 3 retries (rc=$rc): ${err:0:200}"
      [[ -n "${RAFITA_RUN_DIR:-}" ]] && common::debug_save "$task_id" "${label}.response" "$combined"
      return 1
    fi
    local backoff=$(( 2 ** transient_attempts ))
    common::log WARN "opencode transient rc=$rc, retry $transient_attempts/3 after ${backoff}s"
    sleep "$backoff"
  done
}
