#!/usr/bin/env bash
# claude.sh — wrapper around the `claude` CLI.
#   claude::run <prompt> <label> <model_alias>
#     stdout = response body
#     rc 0 success, rc 1 hard failure, rc 42 rate-limit exhausted
# Captures stderr. Retries: 3 for rate limit (parsing reset time) and 3 for
# transient errors with exp backoff 2/4/8s. Dry-run short-circuits.

# shellcheck disable=SC2155

claude::_resolve_model() {
  local alias="${1:-}"
  case "$alias" in
    dev)      printf '%s' "${RAFITA_DEV_MODEL:-}" ;;
    reviewer) printf '%s' "${RAFITA_REVIEWER_MODEL:-}" ;;
    planner)  printf '%s' "${RAFITA_DEV_MODEL:-}" ;;
    closer)   printf '%s' "${RAFITA_CLOSER_MODEL:-${RAFITA_DEV_MODEL:-}}" ;;
    "")       printf '' ;;
    # Unknown alias: treat as a literal model name. Logged so a typo (or a
    # forgotten case branch like `closer` used to be) is visible instead of
    # silently sending nonsense to --model.
    *)
      common::log WARN "claude::_resolve_model: unknown alias '${alias}', passing through as literal model name"
      printf '%s' "$alias"
      ;;
  esac
}

# Parse rate-limit reset epoch from a message. Prints epoch (or empty).
# Recognizes: "resets at 10:30am", "resets at 10am", "resets at 22:30",
# with optional timezone suffix.
claude::_parse_rate_limit() {
  local msg="$1"
  python3 - "$msg" << 'PYEOF'
import sys, re, time, datetime
msg = sys.argv[1].lower()
# Quick gate: must look like a rate-limit message.
if not re.search(r"(usage limit|hit your limit|rate limit)", msg):
    print(""); sys.exit(0)
# Extract time token.
m = re.search(r"reset[s]?\s*(?:at)?\s*([0-9]{1,2})(?::([0-9]{2}))?\s*(am|pm)?", msg)
if not m:
    print(""); sys.exit(0)
h = int(m.group(1))
mi = int(m.group(2) or 0)
ap = m.group(3)
if ap == "pm" and h < 12: h += 12
if ap == "am" and h == 12: h = 0
# Compute next occurrence of this time in local tz.
now = datetime.datetime.now()
target = now.replace(hour=h % 24, minute=mi, second=0, microsecond=0)
if target <= now:
    target = target + datetime.timedelta(days=1)
secs = int((target - now).total_seconds())
# Clamp to [60, 21600].
secs = max(60, min(secs, 21600))
epoch = int(time.time()) + secs
print(epoch)
PYEOF
}

# Low-level single-shot invocation. Writes result into three globals
# (RAFITA_CLAUDE_OUT, RAFITA_CLAUDE_RC, RAFITA_CLAUDE_ERR) to stay compatible
# with bash 3 (macOS default) which lacks `declare -n`.
# Args: prompt model [session_id] [session_mode]
claude::_invoke() {
  local prompt="$1" model="$2" session_id="${3:-}" session_mode="${4:-}"
  RAFITA_CLAUDE_OUT=""
  RAFITA_CLAUDE_RC=0
  RAFITA_CLAUDE_ERR=""

  if [[ "${RAFITA_DRY_RUN:-0}" == "1" ]]; then
    RAFITA_CLAUDE_OUT="<dry-run>no output</dry-run>"
    return 0
  fi

  # Streaming activation:
  #   - debug=2 → text + tool calls summarized (parser does the filtering).
  #   - debug=3 → raw JSON stream to stderr (no parser).
  #   - RAFITA_STREAM=1 forces on regardless of debug.
  #   - RAFITA_STREAM=0 forces off (override debug).
  # Caveat: the CLI's stream-json mode historically broke
  # --dangerously-skip-permissions for tool=Write (writes were gated even
  # with --yolo). If you hit permission prompts during DEV, set
  # RAFITA_STREAM=0 in your config or env to fall back.
  local stream_on=0
  if [[ -n "${RAFITA_STREAM:-}" ]]; then
    [[ "$RAFITA_STREAM" == "1" ]] && stream_on=1
  elif [[ "${RAFITA_DEBUG:-1}" -ge 2 ]]; then
    stream_on=1
  fi
  if (( stream_on )) && command -v stream::run_claude_streaming >/dev/null 2>&1; then
    stream::run_claude_streaming "$prompt" "$model"
    return 0
  fi

  local claude_bin="${RAFITA_CLAUDE_BIN:-claude}"
  local args=(-p)
  [[ -n "$model" ]] && args+=(--model "$model")
  [[ "${RAFITA_YOLO:-1}" == "1" ]] && args+=(--dangerously-skip-permissions)

  if [[ "$session_mode" == "new" && -n "$session_id" ]]; then
    args+=(--session-id "$session_id")
  elif [[ "$session_mode" == "resume" && -n "$session_id" ]]; then
    args+=(--resume "$session_id")
  fi

  # Write prompt to a temp file and feed via stdin to avoid shell
  # argument-parsing issues with prompts containing leading dashes.
  local prompt_tmp stdout_tmp stderr_tmp rc
  prompt_tmp=$(mktemp); stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  printf '%s' "$prompt" > "$prompt_tmp"

  local spawn=(python3 "$RAFITA_SCRIPTS_DIR/bin/spawn-session.py")
  if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
    "${spawn[@]}" timeout "$RAFITA_WORKER_TIMEOUT" "$claude_bin" "${args[@]}" \
      >"$stdout_tmp" 2>"$stderr_tmp" <"$prompt_tmp" &
  else
    "${spawn[@]}" "$claude_bin" "${args[@]}" \
      >"$stdout_tmp" 2>"$stderr_tmp" <"$prompt_tmp" &
  fi
  RAFITA_CHILD_PID=$!
  # Register the child PID so the interrupt handler can kill the whole
  # process group (setsid made the child a session leader → PGID == PID).
  claude::_register_child "$RAFITA_CHILD_PID"
  export RAFITA_CHILD_PID
  export RAFITA_STDOUT_TMP="$stdout_tmp"
  export RAFITA_STDERR_TMP="$stderr_tmp"

  local stream_pid=""
  if [[ "${RAFITA_STREAM_OUTPUT:-0}" == "1" ]]; then
    claude::_stream_output "$stdout_tmp" &
    stream_pid=$!
  fi

  wait "$RAFITA_CHILD_PID"
  rc=$?

  if [[ -n "$stream_pid" ]]; then
    kill "$stream_pid" 2>/dev/null || true
    wait "$stream_pid" 2>/dev/null || true
  fi

  claude::_unregister_child "$RAFITA_CHILD_PID"
  unset RAFITA_CHILD_PID RAFITA_STDOUT_TMP RAFITA_STDERR_TMP
  RAFITA_CLAUDE_OUT=$(cat "$stdout_tmp")
  RAFITA_CLAUDE_ERR=$(cat "$stderr_tmp")
  RAFITA_CLAUDE_RC=$rc
  # Empty-output guard: claude CLI sometimes returns rc=0 with no stdout
  # (network blip, tool-only conversation that ended without text, stream
  # parser anomaly already mapped to rc=2 upstream). If rc=0 and the buffer
  # is empty, force rc=2 so callers don't fabricate fake verdicts downstream.
  if [[ -z "$RAFITA_CLAUDE_OUT" && "$RAFITA_CLAUDE_RC" -eq 0 ]]; then
    common::log WARN "claude returned empty output with rc=0; forcing rc=2"
    RAFITA_CLAUDE_RC=2
  fi
  rm -f "$stdout_tmp" "$stderr_tmp" "$prompt_tmp"
}

# --- child process tracking --------------------------------------------------
# Persist PIDs of claude children to .rafita/runs/<id>/children.pids so the
# interrupt handler (or even a stale run on the next startup) can tear down
# any survivors.

claude::_children_file() {
  printf '%s' "${RAFITA_RUN_DIR:-/tmp}/children.pids"
}

claude::_register_child() {
  local pid="$1"
  local f; f=$(claude::_children_file)
  mkdir -p "$(dirname "$f")"
  printf '%s\n' "$pid" >> "$f"
}

claude::_unregister_child() {
  local pid="$1"
  local f; f=$(claude::_children_file)
  [[ -f "$f" ]] || return 0
  local tmp="${f}.tmp"
  grep -v "^${pid}$" "$f" > "$tmp" 2>/dev/null || true
  mv -f "$tmp" "$f" 2>/dev/null || rm -f "$tmp"
}

# --- heartbeat ---------------------------------------------------------------
# Writes a short status line to .rafita/runs/<id>/heartbeat every N seconds
# while claude is running. Tail-friendly. Killed when the call returns.

claude::_heartbeat_file() {
  printf '%s' "${RAFITA_RUN_DIR:-/tmp}/heartbeat"
}

claude::_heartbeat_start() {
  local label="$1" start_ts="$2"
  local f; f=$(claude::_heartbeat_file)
  mkdir -p "$(dirname "$f")"
  local interval="${RAFITA_HEARTBEAT_INTERVAL:-5}"
  (
    local first=1
    while true; do
      local now; now=$(date +%s)
      local elapsed=$((now - start_ts))
      local worker_pids
      worker_pids=$(pgrep -f 'claude -p|opencode run' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
      local line
      line="[$(date -u +%H:%M:%S)] label=${label} elapsed=${elapsed}s worker_pids=${worker_pids:-none} task=${RAFITA_CURRENT_TASK:-?} round=${RAFITA_CURRENT_ROUND:-?} phase=${RAFITA_CURRENT_PHASE:-?}"
      # Always write latest state to file.
      printf '%s\n' "$line" > "$f"
      # Echo to stderr every 30s (or on first tick) so the user sees liveness
      # in the terminal without spamming every 5s.
      if (( first == 1 || elapsed % 30 == 0 )); then
        printf 'rafita ♥ %s\n' "$line" >&2
      fi
      first=0
      sleep "$interval"
    done
  ) &
  RAFITA_HEARTBEAT_PID=$!
  export RAFITA_HEARTBEAT_PID
}

claude::_heartbeat_stop() {
  if [[ -n "${RAFITA_HEARTBEAT_PID:-}" ]] && kill -0 "$RAFITA_HEARTBEAT_PID" 2>/dev/null; then
    kill "$RAFITA_HEARTBEAT_PID" 2>/dev/null || true
    wait "$RAFITA_HEARTBEAT_PID" 2>/dev/null || true
    unset RAFITA_HEARTBEAT_PID
  fi
}

# Stream stdout tmp file to stderr while the child is alive.
# Uses a polling loop (1s) compatible with bash 3 and macOS.
claude::_stream_output() {
  local tmp="${1:-}"
  [[ -z "$tmp" || ! -f "$tmp" ]] && return 0
  local prev=0
  while kill -0 "${RAFITA_CHILD_PID:-}" 2>/dev/null; do
    local sz
    sz=$(stat -f%z "$tmp" 2>/dev/null || stat -c%s "$tmp" 2>/dev/null || echo 0)
    if (( sz > prev )); then
      tail -c +$((prev + 1)) "$tmp" >&2
      prev=$sz
    fi
    sleep 1
  done
}

# Kill every registered child (process group). Best-effort.
claude::kill_all_children() {
  local f; f=$(claude::_children_file)
  [[ -f "$f" ]] || return 0
  local pid
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    # Negative PID targets the process group (setsid made PGID == PID).
    kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  done < "$f"
  sleep 1
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL -"$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
  done < "$f"
  : > "$f"
}

# Public entry. Args: prompt label model_alias [session_id] [session_mode]
# Prints response to stdout, returns rc 0/1/42.
claude::run() {
  local prompt="$1" label="${2:-claude}" alias="${3:-}" session_id="${4:-}" session_mode="${5:-}"
  local model; model=$(claude::_resolve_model "$alias")
  local task_id="${RAFITA_CURRENT_TASK:-_global}"

  # Persist prompt artifact.
  if [[ "${RAFITA_DEBUG:-1}" -ge 1 && -n "${RAFITA_RUN_DIR:-}" ]]; then
    common::debug_save "$task_id" "${label}.prompt" "$prompt"
  fi

  local prompt_bytes=${#prompt}
  common::log INFO "claude::run start label=${label} model=${model:-default} alias=${alias:-default} session_mode=${session_mode:-none} prompt_bytes=${prompt_bytes}"
  ui::info "→ claude ${alias:-default} (${model:-default}) working on ${label}..."
  local rl_attempts=0 transient_attempts=0
  while true; do
    local t0; t0=$(date +%s)
    # Start a heartbeat monitor alongside the invocation.
    claude::_heartbeat_start "$label" "$t0"
    claude::_invoke "$prompt" "$model" "$session_id" "$session_mode"
    claude::_heartbeat_stop
    local out="${RAFITA_CLAUDE_OUT:-}"
    local err="${RAFITA_CLAUDE_ERR:-}"
    local rc="${RAFITA_CLAUDE_RC:-0}"
    local t1; t1=$(date +%s)
    local dur=$((t1 - t0))
    common::log INFO "claude::run returned label=${label} rc=${rc} duration=${dur}s out_bytes=${#out} err_bytes=${#err}"
    if (( rc == 0 )); then
      ui::info "← claude ${label} done (${dur}s, ${#out}B)"
    else
      ui::info "← claude ${label} rc=${rc} (${dur}s)"
    fi

    # Check for rate limit in stdout OR stderr.
    local combined="$out"$'\n'"$err"
    local reset_epoch
    reset_epoch=$(claude::_parse_rate_limit "$combined")
    if [[ -n "$reset_epoch" ]]; then
      export RAFITA_LAST_RESET_AT="$reset_epoch"
      rl_attempts=$((rl_attempts + 1))
      if (( rl_attempts > 3 )); then
        common::log WARN "rate limit: 3 retries exhausted"
        if [[ -n "${RAFITA_RUN_DIR:-}" ]]; then
          common::debug_save "$task_id" "${label}.response" "$combined"
        fi
        return 42
      fi
      local now sleep_for
      now=$(date +%s)
      sleep_for=$(( reset_epoch - now + 60 ))
      (( sleep_for < 60 )) && sleep_for=60
      local cap="${RAFITA_RATE_LIMIT_MAX_SLEEP:-21600}"
      (( sleep_for > cap )) && sleep_for=$cap
      common::log INFO "rate limit: sleeping ${sleep_for}s (retry $rl_attempts/3)"
      sleep "$sleep_for"
      continue
    fi

    if (( rc == 0 )); then
      if [[ -n "${RAFITA_RUN_DIR:-}" ]]; then
        common::debug_save "$task_id" "${label}.response" "$out"
      fi
      printf '%s' "$out"
      return 0
    fi

    # Timeout (rc 124) isn't retried transparently; treat as hard fail.
    if (( rc == 124 )); then
      common::log ERROR "claude timed out (workerTimeout=${RAFITA_WORKER_TIMEOUT:-unset})"
      if [[ -n "${RAFITA_RUN_DIR:-}" ]]; then
        common::debug_save "$task_id" "${label}.response" "$combined"
      fi
      return 1
    fi

    transient_attempts=$((transient_attempts + 1))
    if (( transient_attempts > 3 )); then
      common::log ERROR "claude hard failure after 3 retries (rc=$rc): ${err:0:200}"
      if [[ -n "${RAFITA_RUN_DIR:-}" ]]; then
        common::debug_save "$task_id" "${label}.response" "$combined"
      fi
      return 1
    fi
    # If the session is unavailable (dead resume or UUID already in use), fall back to a fresh call
    # and regenerate the UUID so future rounds don't retry the same broken id.
    if [[ "$session_mode" == "resume" ]] || { [[ "$session_mode" == "new" ]] && printf '%s' "$err" | grep -q "already in use"; }; then
      common::log WARN "claude session unavailable (rc=$rc); regenerating session id and retrying without session"
      if [[ "$task_id" != "_global" ]]; then
        local role_alias="${alias:-dev}"
        session::regenerate_id "$task_id" "$role_alias"
      fi
      session_mode=""
      session_id=""
    fi
    local backoff=$(( 2 ** transient_attempts ))
    common::log WARN "claude transient rc=$rc, retry $transient_attempts/3 after ${backoff}s"
    sleep "$backoff"
  done
}
