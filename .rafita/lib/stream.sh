#!/usr/bin/env bash
# stream.sh — streaming wrapper for the claude CLI.
#
# Activated by RAFITA_DEBUG >= 2 (or RAFITA_STREAM=1 explicitly).
#
# - Live: stream-parser.py writes per-event human view to stderr.
# - Final: parser captures the authoritative `result.result` from the stream
#   and writes it to its stdout. We capture that as RAFITA_CLAUDE_OUT.
# - Empty-stream guard: parser exits 2 when it sees no `result` and no text.
#   That bubbles up to RAFITA_CLAUDE_RC so callers can detect the anomaly
#   instead of silently looping on a fake verdict.
#
# Globals populated (compatible with claude::_invoke):
#   RAFITA_CLAUDE_OUT    final assistant text
#   RAFITA_CLAUDE_RC     0 OK; 42 rate-limit; 2 parser empty; other CLI rc
#   RAFITA_CLAUDE_ERR    raw stderr from claude (for rate-limit detection)

stream::run_claude_streaming() {
  local prompt="$1" model="$2"
  RAFITA_CLAUDE_OUT=""
  RAFITA_CLAUDE_RC=0
  RAFITA_CLAUDE_ERR=""

  local parser_py="${RAFITA_SCRIPTS_DIR:-.rafita}/bin/stream-parser.py"
  if [[ ! -f "$parser_py" ]]; then
    common::warn "stream-parser.py not found at $parser_py; falling back to non-streaming"
    local saved="${RAFITA_STREAM:-}"
    export RAFITA_STREAM=0
    claude::_invoke "$prompt" "$model"
    if [[ -n "$saved" ]]; then export RAFITA_STREAM="$saved"; else unset RAFITA_STREAM; fi
    return 0
  fi

  local claude_bin="${RAFITA_CLAUDE_BIN:-claude}"
  # We intentionally do NOT pass --include-partial-messages. It floods the
  # stream with one stream_event per token; closed turns give us complete
  # text/tool_use/tool_result blocks plus the authoritative `result` event.
  #
  # The prompt is fed via stdin (-p alone, no value). Passing -p "$prompt"
  # works for short strings but bombs on prompts with leading dashes, very
  # long content, or shell-sensitive characters — the CLI would silently
  # exit with no events. Same convention claude::_invoke uses.
  local args=(-p --verbose --output-format stream-json)
  [[ -n "$model" ]] && args+=(--model "$model")
  [[ "${RAFITA_YOLO:-1}" == "1" ]] && args+=(--dangerously-skip-permissions)

  local prompt_tmp stderr_tmp final_tmp
  prompt_tmp=$(mktemp); stderr_tmp=$(mktemp); final_tmp=$(mktemp)
  printf '%s' "$prompt" > "$prompt_tmp"

  local spawn=(python3 "$RAFITA_SCRIPTS_DIR/bin/spawn-session.py")

  # spawn-session.py runs setsid, so the spawned child loses its controlling
  # tty. The old code wrote parser stderr to /dev/tty which then went into
  # the void. Pin parser stderr to this shell's FD 2 (which IS the user's
  # terminal) via FD duplication so live events actually show up.
  # Use fixed FD 3 instead of auto-assignment ({var}>&2) because the latter
  # requires bash 4+; macOS ships bash 3.2.
  exec 3>&2
  export RAFITA_DEBUG="${RAFITA_DEBUG:-1}"

  # pipefail makes the pipe rc reflect the worst step (claude OR parser).
  # We restore the original setting after.
  local _had_pipefail=0
  if [[ -o pipefail ]]; then _had_pipefail=1; fi
  set -o pipefail

  local cli_rc parser_rc
  if [[ -n "${RAFITA_WORKER_TIMEOUT:-}" ]] && command -v timeout >/dev/null 2>&1; then
    "${spawn[@]}" timeout "${RAFITA_WORKER_TIMEOUT}" "$claude_bin" "${args[@]}" 2>"$stderr_tmp" <"$prompt_tmp" \
      | python3 "$parser_py" > "$final_tmp" 2>&3 &
  else
    "${spawn[@]}" "$claude_bin" "${args[@]}" 2>"$stderr_tmp" <"$prompt_tmp" \
      | python3 "$parser_py" > "$final_tmp" 2>&3 &
  fi
  local leader=$!
  claude::_register_child "$leader"
  wait "$leader"
  local pipe_rc=$?
  claude::_unregister_child "$leader"

  # Close FD 3.
  exec 3>&-
  if (( _had_pipefail == 0 )); then set +o pipefail; fi

  # Try to disambiguate: if final_tmp is non-empty, the parser produced
  # output. If it is empty AND pipe_rc != 0, treat as failure. If it is
  # empty AND pipe_rc == 0 (shouldn't happen with the new parser, but just
  # in case), force rc=2 so the caller doesn't fabricate a fake verdict.
  RAFITA_CLAUDE_OUT=$(cat "$final_tmp")
  RAFITA_CLAUDE_ERR=$(cat "$stderr_tmp")
  if [[ -z "$RAFITA_CLAUDE_OUT" && "$pipe_rc" -eq 0 ]]; then
    common::log WARN "stream parser produced no output for label=${RAFITA_LABEL:-?}; forcing rc=2"
    RAFITA_CLAUDE_RC=2
  else
    RAFITA_CLAUDE_RC="$pipe_rc"
  fi

  rm -f "$prompt_tmp" "$stderr_tmp" "$final_tmp"
}
