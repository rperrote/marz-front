#!/usr/bin/env bash
# stream.sh — streaming wrapper for the claude CLI. Only used when
# RAFITA_DEBUG >= 2. Writes human-readable events to stderr in real time and
# returns the final text response via RAFITA_CLAUDE_OUT (same globals that
# claude::_invoke uses, for interchangeability).

# stream::run_claude_streaming <prompt> <model>
# Populates: RAFITA_CLAUDE_OUT, RAFITA_CLAUDE_RC, RAFITA_CLAUDE_ERR.
stream::run_claude_streaming() {
  local prompt="$1" model="$2"
  RAFITA_CLAUDE_OUT=""
  RAFITA_CLAUDE_RC=0
  RAFITA_CLAUDE_ERR=""

  local parser_py="${RAFITA_SCRIPTS_DIR:-.rafita}/bin/stream-parser.py"
  if [[ ! -f "$parser_py" ]]; then
    common::warn "stream-parser.py not found at $parser_py; falling back to non-streaming mode"
    # Temporarily unset DEBUG to force the non-streaming path.
    local saved="$RAFITA_DEBUG"
    RAFITA_DEBUG=1
    claude::_invoke "$prompt" "$model"
    RAFITA_DEBUG="$saved"
    return 0
  fi

  local claude_bin="${RAFITA_CLAUDE_BIN:-claude}"
  # Note: we intentionally DO NOT pass --include-partial-messages. It floods
  # the parser with `stream_event` deltas (one per token) that dwarf the real
  # events we care about. Closed turns give us tool_use / text / tool_result
  # / result with the full payload, which is enough for live visibility.
  local args=(-p "$prompt" --verbose --output-format stream-json)
  [[ -n "$model" ]] && args+=(--model "$model")
  [[ "${RAFITA_YOLO:-1}" == "1" ]] && args+=(--dangerously-skip-permissions)

  local stdout_tmp stderr_tmp final_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp); final_tmp=$(mktemp)

  local tout="${RAFITA_WORKER_TIMEOUT:-1800}"
  local rc
  local spawn=(python3 "$RAFITA_SCRIPTS_DIR/bin/spawn-session.py")
  if command -v timeout >/dev/null 2>&1; then
    "${spawn[@]}" timeout "$tout" "$claude_bin" "${args[@]}" 2>"$stderr_tmp" \
      | python3 "$parser_py" > "$final_tmp" 2>/dev/tty </dev/null &
    local leader=$!
    claude::_register_child "$leader"
    wait "$leader"
    rc=$?
    claude::_unregister_child "$leader"
  else
    "${spawn[@]}" "$claude_bin" "${args[@]}" 2>"$stderr_tmp" \
      | python3 "$parser_py" > "$final_tmp" 2>/dev/tty </dev/null &
    local leader=$!
    claude::_register_child "$leader"
    wait "$leader"
    rc=$?
    claude::_unregister_child "$leader"
  fi

  local final; final=$(cat "$final_tmp")
  # Fallback: if parser produced nothing, scrape raw events for text blocks.
  if [[ -z "$final" ]]; then
    final=$(python3 - << 'PYEOF'
import json, sys, os
path = os.environ.get("STREAM_STDERR_PATH","")
acc = []
try:
    data = open(path).read() if path else ""
    for line in data.splitlines():
        try:
            ev = json.loads(line)
        except Exception:
            continue
        if ev.get("type") == "assistant":
            msg = ev.get("message") or {}
            for block in msg.get("content") or []:
                if isinstance(block, dict) and block.get("type") == "text":
                    acc.append(block.get("text",""))
except Exception:
    pass
sys.stdout.write("".join(acc))
PYEOF
    )
  fi

  RAFITA_CLAUDE_OUT="$final"
  RAFITA_CLAUDE_RC="$rc"
  RAFITA_CLAUDE_ERR=$(cat "$stderr_tmp")
  rm -f "$stdout_tmp" "$stderr_tmp" "$final_tmp"
}
