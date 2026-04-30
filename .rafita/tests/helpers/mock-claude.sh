#!/usr/bin/env bash
# Fake claude binary used in tests. Parses args, logs invocation, returns a
# canned response. Driven by env vars:
#   FAKE_CLAUDE_RESPONSES  path to a file with lines "MATCH|RESPONSE"
#                          MATCH='default' is the fallback.
#   FAKE_CLAUDE_RC         exit code (default 0)
#   FAKE_CLAUDE_STDERR     stderr content to emit
#   FAKE_CLAUDE_LOG        JSON log of invocations (one line per call)
#   FAKE_CLAUDE_RATELIMIT_UNTIL  epoch; if set, first call prints a rate limit message
#   FAKE_CLAUDE_RATELIMIT_STATE  path to counter file (incremented each call that hits limit)
#   FAKE_CLAUDE_RATELIMIT_MAX    how many calls to return rate limit before succeeding (default 1)

set -u

prompt=""
model=""
output_format="text"
args_dump=()
while [[ $# -gt 0 ]]; do
  args_dump+=("$1")
  case "$1" in
    -p|--print)
      if [[ $# -gt 1 && "${2:-}" != --* ]]; then
        shift
        prompt="${1:-}"
      fi
      ;;
    --model)
      shift
      model="${1:-}"
      ;;
    --output-format)
      shift
      output_format="${1:-}"
      ;;
    --dangerously-skip-permissions|--verbose|--include-partial-messages)
      ;;
    *)
      ;;
  esac
  shift || true
done

# Read prompt from stdin if not provided and stdin is not tty.
if [[ -z "$prompt" && ! -t 0 ]]; then
  prompt="$(cat)"
fi

log="${FAKE_CLAUDE_LOG:-/dev/null}"
if [[ "$log" != "/dev/null" ]]; then
  python3 - "$log" "$model" "$output_format" "$prompt" << 'PYEOF' || true
import json, sys, os, time
log=sys.argv[1]
rec={"ts":int(time.time()),"model":sys.argv[2],"format":sys.argv[3],"prompt":sys.argv[4][:4000]}
with open(log,'a') as f: f.write(json.dumps(rec)+"\n")
PYEOF
fi

# Handle rate limit simulation.
if [[ -n "${FAKE_CLAUDE_RATELIMIT_UNTIL:-}" ]]; then
  state="${FAKE_CLAUDE_RATELIMIT_STATE:-/tmp/fake-claude-rlstate}"
  max="${FAKE_CLAUDE_RATELIMIT_MAX:-1}"
  n=0
  if [[ -f "$state" ]]; then n=$(<"$state"); fi
  if (( n < max )); then
    n=$((n+1))
    echo "$n" > "$state"
    # Emit a rate limit error to stderr and exit non-zero.
    reset_epoch="${FAKE_CLAUDE_RATELIMIT_UNTIL}"
    reset_human=$(python3 -c "import time,sys; print(time.strftime('%I:%M%p', time.localtime(int(sys.argv[1]))))" "$reset_epoch" | tr '[:upper:]' '[:lower:]')
    echo "You've hit your usage limit. It resets at $reset_human." >&2
    exit 1
  fi
fi

# Optional stderr emission.
if [[ -n "${FAKE_CLAUDE_STDERR:-}" ]]; then
  printf '%s\n' "$FAKE_CLAUDE_STDERR" >&2
fi

# Locate response.
response=""
if [[ -n "${FAKE_CLAUDE_RESPONSES:-}" && -f "$FAKE_CLAUDE_RESPONSES" ]]; then
  response=$(python3 - "$FAKE_CLAUDE_RESPONSES" "$prompt" << 'PYEOF'
import sys
path, prompt = sys.argv[1], sys.argv[2]
fallback=""
with open(path) as f:
    for line in f:
        line=line.rstrip("\n")
        if not line: continue
        if "|" not in line: continue
        match, resp = line.split("|",1)
        resp=resp.replace("\\n","\n")
        if match=="default":
            fallback=resp
            continue
        if match in prompt:
            print(resp,end="")
            sys.exit(0)
print(fallback,end="")
PYEOF
  )
fi

if [[ -z "$response" ]]; then
  response="<done/>"
fi

if [[ "$output_format" == "stream-json" ]]; then
  # Emit minimal stream-json events.
  python3 - "$response" << 'PYEOF'
import json, sys
text=sys.argv[1]
events=[
  {"type":"assistant","message":{"content":[{"type":"text","text":text}]}},
  {"type":"result","duration_ms":10,"usage":{"input_tokens":1,"output_tokens":1}},
]
for e in events:
    print(json.dumps(e), flush=True)
PYEOF
else
  printf '%s' "$response"
fi

exit "${FAKE_CLAUDE_RC:-0}"
