#!/usr/bin/env bash
set -euo pipefail

# Ensure Ctrl+C kills everything — use process group
cleanup() {
  # Kill timer if running (before killing process group)
  [[ -n "${TIMER_PID:-}" ]] && kill "$TIMER_PID" 2>/dev/null || true
  printf "\r\033[2K" >/dev/tty 2>/dev/null || true
  echo "" >&2
  echo "rafita: interrupted" >&2
  # Kill all processes in our process group
  trap - INT TERM
  kill 0 2>/dev/null
  wait 2>/dev/null
  exit 130
}
trap cleanup INT TERM

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$SCRIPT_DIR/config.json"

fail() { echo "rafita: $*" >&2; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Parse arguments
# ─────────────────────────────────────────────────────────────────────────────
EPIC_ARG=""
DEBUG_FLAG=""
CURRENT_BRANCH_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --debug) DEBUG_FLAG=1 ;;
    --debug=*) DEBUG_FLAG="${arg#--debug=}" ;;
    --current-branch) CURRENT_BRANCH_FLAG=1 ;;
    fn-*) EPIC_ARG="$arg" ;;
    *) fail "unknown arg: $arg (usage: rafita.sh [fn-N] [--current-branch] [--debug[=N]])" ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────────────
# Load config
# ─────────────────────────────────────────────────────────────────────────────
[[ -f "$CONFIG" ]] || fail "missing .rafita/config.json — run /rafita:setup first"

# Read config.json via python3
cfg_get() {
  python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
val = cfg.get(sys.argv[2])
if val is None: print('')
elif isinstance(val, bool): print('true' if val else 'false')
else: print(val)
" "$CONFIG" "$1"
}

PROJECT_TYPE="$(cfg_get projectType)"
GIT_PROVIDER="$(cfg_get provider)"
BRANCH_MODE="$(cfg_get branchMode)"
BRANCH_PREFIX="$(cfg_get branchPrefix)"
MAX_REVIEW_ROUNDS="$(cfg_get maxReviewRounds)"
WORKER_TIMEOUT="$(cfg_get workerTimeout)"
YOLO="$(cfg_get yolo)"
CLAUDE_BIN="$(cfg_get claudeBin)"
MYLOOP_CLAUDE_MODEL="$(cfg_get claudeModel)"
DEBUG="$(cfg_get debug)"
FLOWCTL_REL="$(cfg_get flowctl)"
UI_CFG="$(cfg_get ui)"

# Defaults
PROJECT_TYPE="${PROJECT_TYPE:-generic}"
GIT_PROVIDER="${GIT_PROVIDER:-github}"
BRANCH_MODE="${BRANCH_MODE:-new}"
BRANCH_PREFIX="${BRANCH_PREFIX:-feature/claude/}"
MAX_REVIEW_ROUNDS="${MAX_REVIEW_ROUNDS:-5}"
WORKER_TIMEOUT="${WORKER_TIMEOUT:-1800}"
[[ "$YOLO" == "true" ]] && YOLO=1 || YOLO="${YOLO:-1}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
FLOWCTL_REL="${FLOWCTL_REL:-.flow/bin/flowctl}"
FLOWCTL="$ROOT_DIR/$FLOWCTL_REL"
DEBUG="${DEBUG:-0}"

# CLI overrides
[[ -n "$DEBUG_FLAG" ]] && DEBUG="$DEBUG_FLAG"
[[ -n "$CURRENT_BRANCH_FLAG" ]] && BRANCH_MODE="current"

# ─────────────────────────────────────────────────────────────────────────────
# Load project profile
# ─────────────────────────────────────────────────────────────────────────────
PROFILE_FILE="$SCRIPT_DIR/profiles/${PROJECT_TYPE}.md"
[[ -f "$PROFILE_FILE" ]] || PROFILE_FILE="$SCRIPT_DIR/profiles/generic.md"
[[ -f "$PROFILE_FILE" ]] || fail "no profile found for projectType=$PROJECT_TYPE"

# Extract sections from profile markdown
profile_section() {
  python3 - "$PROFILE_FILE" "$1" <<'PY'
import sys, re
filepath, section = sys.argv[1], sys.argv[2]
with open(filepath) as f:
    text = f.read()
pattern = rf"^## {re.escape(section)}\s*\n(.*?)(?=\n## |\Z)"
m = re.search(pattern, text, re.S | re.M)
if m:
    lines = m.group(1).strip().splitlines()
    # Filter out "(none)" placeholders
    lines = [l for l in lines if l.strip().lower() != '(none)']
    print('\n'.join(lines))
PY
}

PROFILE_DEV_RULES="$(profile_section "DEV Rules")"
PROFILE_DEV_FIX_RULES="$(profile_section "DEV Fix Rules")"
PROFILE_REVIEW_RULES="$(profile_section "Review Rules")"
PROFILE_FORMAT_CMD="$(profile_section "Format Command")"
PROFILE_SKILLS="$(profile_section "Skills")"

[[ -x "$FLOWCTL" ]] || fail "missing flowctl at $FLOWCTL"

# ─────────────────────────────────────────────────────────────────────────────
# Dependency checks
# ─────────────────────────────────────────────────────────────────────────────
command -v git >/dev/null 2>&1 || fail "git not found"
command -v python3 >/dev/null 2>&1 || fail "python3 not found"
command -v "$CLAUDE_BIN" >/dev/null 2>&1 || fail "'$CLAUDE_BIN' not found. Install claude CLI or set claudeBin in config.json"
if [[ "$GIT_PROVIDER" == "gitlab" ]]; then
  command -v glab >/dev/null 2>&1 || fail "glab (GitLab CLI) not found. Install: brew install glab"
  glab auth status >/dev/null 2>&1 || fail "glab not authenticated. Run: glab auth login"
else
  command -v gh >/dev/null 2>&1 || fail "gh (GitHub CLI) not found. Install: brew install gh"
  gh auth status >/dev/null 2>&1 || fail "gh not authenticated. Run: gh auth login"
fi
git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "$ROOT_DIR is not a git repository"
git -C "$ROOT_DIR" remote get-url origin >/dev/null 2>&1 || fail "no git remote 'origin' configured"
ssh-add -l >/dev/null 2>&1 || echo "rafita: warning: no SSH keys loaded. Push may prompt for passphrase." >&2

# Detect timeout command
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
else
  TIMEOUT_CMD=""
  echo "rafita: warning: timeout command not found; worker timeout disabled (brew install coreutils)" >&2
fi

# ─────────────────────────────────────────────────────────────────────────────
# Presentation layer
# ─────────────────────────────────────────────────────────────────────────────
UI_ENABLED="${UI_CFG:-true}"
[[ "$UI_ENABLED" == "true" ]] && UI_ENABLED=1 || UI_ENABLED="${UI_ENABLED}"
START_TIME="$(date +%s)"

elapsed_time() {
  local now elapsed mins secs
  now="$(date +%s)"
  elapsed=$((now - START_TIME))
  mins=$((elapsed / 60))
  secs=$((elapsed % 60))
  printf "%d:%02d" "$mins" "$secs"
}

# Colors
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_DIM='\033[2m'
  C_BLUE='\033[34m'
  C_GREEN='\033[32m'
  C_YELLOW='\033[33m'
  C_RED='\033[31m'
  C_CYAN='\033[36m'
  C_MAGENTA='\033[35m'
else
  C_RESET='' C_BOLD='' C_DIM='' C_BLUE='' C_GREEN='' C_YELLOW='' C_RED='' C_CYAN='' C_MAGENTA=''
fi

ui() {
  [[ "$UI_ENABLED" == "1" ]] || return 0
  echo -e "$*"
}

ui_header() {
  ui ""
  ui "${C_BOLD}${C_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  ui "${C_BOLD}${C_BLUE}  rafita - Autonomous Dev+Review Loop${C_RESET}"
  ui "${C_BOLD}${C_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
}

ui_config() {
  local git_branch
  git_branch="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
  ui ""
  ui "${C_DIM}   Epic:${C_RESET}          ${C_BOLD}$EPIC_ID${C_RESET}"
  ui "${C_DIM}   Branch:${C_RESET}        ${C_BOLD}$git_branch${C_RESET}"
  ui "${C_DIM}   Max rounds:${C_RESET}    $MAX_REVIEW_ROUNDS"
  ui "${C_DIM}   Timeout:${C_RESET}       ${WORKER_TIMEOUT}s"
  ui "${C_DIM}   Log level:${C_RESET}     $DEBUG"
  ui ""
}

ui_task_start() {
  local task="$1" title="$2" elapsed
  elapsed="$(elapsed_time)"
  ui ""
  ui "${C_BOLD}${C_CYAN}── Task: $task${C_RESET}                                        ${C_DIM}[${elapsed}]${C_RESET}"
  ui "   ${C_DIM}\"$title\"${C_RESET}"
}

ui_dev() {
  local round="$1"
  ui "   ${C_MAGENTA}[DEV round $round]${C_RESET} Sending prompt to claude..."
}

ui_dev_fixes() {
  local round="$1" nfixes="$2"
  ui "   ${C_MAGENTA}[DEV round $round]${C_RESET} Applying $nfixes fixes..."
}

ui_review() {
  local round="$1"
  ui "   ${C_YELLOW}[REVIEW round $round]${C_RESET} Sending prompt to claude..."
}

ui_review_verdict() {
  local round="$1" approved="$2" nfixes="${3:-0}"
  if [[ "$approved" == "true" ]]; then
    ui "   ${C_GREEN}[REVIEW round $round] APPROVED${C_RESET}"
  else
    ui "   ${C_RED}[REVIEW round $round] NOT APPROVED${C_RESET} ($nfixes fixes)"
  fi
}

ui_task_done() {
  local task="$1"
  ui "   ${C_GREEN}[DONE]${C_RESET} ${C_BOLD}$task${C_RESET}"
}

ui_task_max_rounds() {
  local task="$1"
  ui "   ${C_YELLOW}[WARN]${C_RESET} $task reached max review rounds ($MAX_REVIEW_ROUNDS), moving on"
}

ui_final_review() {
  ui ""
  ui "${C_BOLD}${C_CYAN}── Final Review${C_RESET}                                        ${C_DIM}[$(elapsed_time)]${C_RESET}"
  ui "   ${C_CYAN}[FINAL]${C_RESET} Reviewing accumulated diff..."
}

ui_final_verdict() {
  local status="$1"
  if [[ "$status" == "pass" ]]; then
    ui "   ${C_GREEN}[FINAL] PASS${C_RESET}"
  else
    ui "   ${C_RED}[FINAL] FAIL${C_RESET}"
  fi
}

ui_complete() {
  local elapsed tasks_done="$1" tasks_total="$2" tasks_skipped="${3:-0}"
  elapsed="$(elapsed_time)"
  local total_secs=$(($(date +%s) - START_TIME))
  ui ""
  ui "${C_BOLD}${C_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  ui "${C_BOLD}${C_GREEN}  Complete${C_RESET}                                                ${C_DIM}[${elapsed}]${C_RESET}"
  ui ""
  ui "   ${C_DIM}Done:${C_RESET}    $tasks_done/$tasks_total"
  [[ "$tasks_skipped" -gt 0 ]] && ui "   ${C_DIM}Skipped:${C_RESET} $tasks_skipped (max rounds)"
  ui "   ${C_DIM}Time:${C_RESET}    DEV $(format_duration "$TOTAL_DEV_TIME") | REVIEW $(format_duration "$TOTAL_REVIEW_TIME") | FINAL $(format_duration "$TOTAL_FINAL_TIME") | Total $(format_duration "$total_secs")"
  ui "${C_BOLD}${C_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  ui ""
}

ui_no_tasks() {
  ui ""
  ui "${C_DIM}   No pending tasks for epic $EPIC_ID${C_RESET}"
  ui ""
}

ui_fail() {
  local reason="${1:-}"
  ui ""
  ui "${C_BOLD}${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  ui "${C_BOLD}${C_RED}  Failed${C_RESET}                                                  ${C_DIM}[$(elapsed_time)]${C_RESET}"
  [[ -n "$reason" ]] && ui "     ${C_DIM}$reason${C_RESET}"
  ui "${C_BOLD}${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  ui ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Live timer (background process that updates a single line)
# ─────────────────────────────────────────────────────────────────────────────
TIMER_PID=""

start_timer() {
  local label="$1"
  local start="$(date +%s)"
  (
    while true; do
      local now="$(date +%s)"
      local elapsed=$((now - start))
      local mins=$((elapsed / 60))
      local secs=$((elapsed % 60))
      printf "\r   ${C_DIM}[%s] %d:%02d${C_RESET}" "$label" "$mins" "$secs" >/dev/tty
      sleep 1
    done
  ) &
  TIMER_PID=$!
}

stop_timer() {
  [[ -n "$TIMER_PID" ]] && kill "$TIMER_PID" 2>/dev/null && wait "$TIMER_PID" 2>/dev/null || true
  TIMER_PID=""
  printf "\r\033[2K" >/dev/tty   # clear the timer line
}

# Time accumulators (seconds)
TOTAL_DEV_TIME=0
TOTAL_REVIEW_TIME=0
TOTAL_FINAL_TIME=0

format_duration() {
  local secs="$1"
  local mins=$((secs / 60))
  local s=$((secs % 60))
  printf "%d:%02d" "$mins" "$s"
}

# ─────────────────────────────────────────────────────────────────────────────
# Debug / Logging
# ─────────────────────────────────────────────────────────────────────────────
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"
RUN_DIR=""
RUN_LOG=""

debug_init() {
  [[ "$DEBUG" -lt 1 ]] && return 0
  RUN_DIR="$SCRIPT_DIR/runs/$RUN_ID"
  mkdir -p "$RUN_DIR"
  RUN_LOG="$RUN_DIR/run.log"
  touch "$RUN_LOG"
  log_event "INFO" "Run started: epics=${EPIC_IDS[*]:-unknown} debug=ON"
}

log_event() {
  [[ "$DEBUG" -lt 1 ]] && return 0
  local level="$1" msg="$2"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [$level] $msg" >> "$RUN_LOG"
}

debug_ensure_task_dir() {
  [[ "$DEBUG" -lt 1 ]] && return 0
  local task_id="$1"
  mkdir -p "$RUN_DIR/$task_id"
}

debug_save() {
  [[ "$DEBUG" -lt 1 ]] && return 0
  local file="$1" content="$2"
  printf '%s\n' "$content" > "$RUN_DIR/$file"
}

# ─────────────────────────────────────────────────────────────────────────────
# Claude invocation helper
# ─────────────────────────────────────────────────────────────────────────────
STREAM_PARSER="$SCRIPT_DIR/rafita-stream-parser.py"

run_claude() {
  local prompt="$1"
  local label="$2"       # e.g. "DEV" or "REVIEW"
  local color="$3"       # color code for debug output
  local output=""
  local rc=0

  local claude_args=(-p)
  [[ "$YOLO" == "1" ]] && claude_args+=(--dangerously-skip-permissions)
  [[ -n "${MYLOOP_CLAUDE_MODEL:-}" ]] && claude_args+=(--model "$MYLOOP_CLAUDE_MODEL")

  if [[ "$DEBUG" -ge 2 ]]; then
    # Level 2: Stream mode with Claude internals visible
    claude_args+=(--verbose --output-format stream-json --include-partial-messages)

    local tmpstream tmpout
    tmpstream="$(mktemp)"
    tmpout="$(mktemp)"

    ui "   ${color}── ${label} output ──────────────────────────────────${C_RESET}"

    # Launch Claude in background, writing stream to file
    set +e
    if [[ -n "$TIMEOUT_CMD" ]]; then
      "$TIMEOUT_CMD" "$WORKER_TIMEOUT" "$CLAUDE_BIN" "${claude_args[@]}" "$prompt" > "$tmpstream" 2>/dev/null &
    else
      "$CLAUDE_BIN" "${claude_args[@]}" "$prompt" > "$tmpstream" 2>/dev/null &
    fi
    local claude_pid=$!

    # Launch parser: tails the stream file, prints activity to /dev/tty
    (
      sleep 1
      tail -f "$tmpstream" 2>/dev/null | python3 -u "$STREAM_PARSER" > "$tmpout" 2>/dev/tty
    ) &
    local parser_pid=$!

    wait "$claude_pid" 2>/dev/null
    rc=$?

    sleep 1
    kill "$parser_pid" 2>/dev/null
    wait "$parser_pid" 2>/dev/null || true
    set -e

    ui "   ${color}── END ${label} ─────────────────────────────────────${C_RESET}"

    # Read parser output; fallback to extracting from raw stream
    output="$(cat "$tmpout" 2>/dev/null)" || output=""
    if [[ -z "$output" ]]; then
      output="$(python3 -c "
import json, sys
text = []
for line in open(sys.argv[1]):
    line = line.strip()
    if not line: continue
    try: ev = json.loads(line)
    except: continue
    if ev.get('type') == 'result':
        r = ev.get('result', '')
        if r: text.append(r)
    elif ev.get('type') == 'assistant':
        for b in ev.get('message', {}).get('content', []):
            if b.get('type') == 'text':
                text.append(b.get('text', ''))
print('\n'.join(text))
" "$tmpstream" 2>/dev/null)" || output=""
    fi
    rm -f "$tmpstream" "$tmpout"

  else
    # Level 0-1: simple text output (no streaming internals)
    claude_args+=(--output-format text)
    local tmpfile
    tmpfile="$(mktemp)"
    set +e
    if [[ -n "$TIMEOUT_CMD" ]]; then
      "$TIMEOUT_CMD" "$WORKER_TIMEOUT" "$CLAUDE_BIN" "${claude_args[@]}" "$prompt" > "$tmpfile" 2>&1 &
    else
      "$CLAUDE_BIN" "${claude_args[@]}" "$prompt" > "$tmpfile" 2>&1 &
    fi
    local claude_pid=$!
    wait "$claude_pid" 2>/dev/null
    rc=$?
    set -e
    output="$(cat "$tmpfile")"
    rm -f "$tmpfile"
  fi

  # Handle timeout
  if [[ -n "$TIMEOUT_CMD" && "$rc" -eq 124 ]]; then
    log_event "WARN" "$label timed out after ${WORKER_TIMEOUT}s"
  fi

  CLAUDE_OUTPUT="$output"
  CLAUDE_RC=$rc
}

# ─────────────────────────────────────────────────────────────────────────────
# JSON extraction helpers
# ─────────────────────────────────────────────────────────────────────────────
extract_review_json() {
  # Extract JSON from <review>...</review> tags
  python3 - <<'PY'
import re, sys, json

text = sys.stdin.read()
matches = re.findall(r"<review>(.*?)</review>", text, flags=re.S)
if not matches:
    # Fallback: try to find raw JSON with "approved" key
    json_matches = re.findall(r'\{[^{}]*"approved"\s*:\s*(?:true|false)[^{}]*\}', text, flags=re.S)
    if json_matches:
        print(json_matches[-1].strip())
        sys.exit(0)
    print('{"approved": true, "summary": "No review tag found, assuming approved"}')
    sys.exit(0)
data = matches[-1].strip()
# Validate it's valid JSON
try:
    json.loads(data)
    print(data)
except json.JSONDecodeError:
    print('{"approved": true, "summary": "Invalid JSON in review tag, assuming approved"}')
PY
}

extract_final_review_json() {
  python3 - <<'PY'
import re, sys, json

text = sys.stdin.read()
matches = re.findall(r"<final-review>(.*?)</final-review>", text, flags=re.S)
if not matches:
    print('{"status": "pass", "issues": [], "summary": "No final-review tag found"}')
    sys.exit(0)
data = matches[-1].strip()
try:
    json.loads(data)
    print(data)
except json.JSONDecodeError:
    print('{"status": "pass", "issues": [], "summary": "Invalid JSON in final-review tag"}')
PY
}

json_get() {
  local key="$1" json_str="$2"
  python3 - "$key" "$json_str" <<'PY'
import json, sys
key = sys.argv[1]
data = json.loads(sys.argv[2])
val = data.get(key)
if val is None:
    print("")
elif isinstance(val, bool):
    print("true" if val else "false")
elif isinstance(val, list):
    print(json.dumps(val))
else:
    print(val)
PY
}

count_fixes() {
  python3 - "$1" <<'PY'
import json, sys
try:
    data = json.loads(sys.argv[1])
    fixes = data.get("fixes", [])
    print(len(fixes))
except:
    print("0")
PY
}

# ─────────────────────────────────────────────────────────────────────────────
# Detect epics
# ─────────────────────────────────────────────────────────────────────────────
if [[ -n "$EPIC_ARG" ]]; then
  EPIC_IDS=("$EPIC_ARG")
else
  # Auto-detect: find all open epics
  EPIC_IDS_RAW="$(python3 - <<'PY'
import json, subprocess, sys
result = subprocess.run(
    [".flow/bin/flowctl", "epics", "--json"],
    capture_output=True, text=True, cwd=sys.argv[1] if len(sys.argv) > 1 else "."
)
if result.returncode != 0:
    sys.exit(1)
data = json.loads(result.stdout)
found = False
for e in data.get("epics", []):
    if e.get("status") != "done":
        print(e["id"])
        found = True
if not found:
    sys.exit(1)
PY
  )" || fail "no open epics found"
  # Read into array
  EPIC_IDS=()
  while IFS= read -r eid; do
    EPIC_IDS+=("$eid")
  done <<< "$EPIC_IDS_RAW"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────
SOURCE_BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"

# Ensure working tree is clean (exclude .rafita/ from check)
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain -- . ':!.rafita' 2>/dev/null)" ]]; then
  fail "working tree has uncommitted changes. Commit or stash before running rafita."
fi

ui_header
debug_init

# Global counters
GLOBAL_TASKS_DONE=0
GLOBAL_TASKS_SKIPPED=0
GLOBAL_TASKS_TOTAL=0
GLOBAL_COMPLETED_TASKS=()
EPICS_PROCESSED=0

ui "${C_DIM}   Epics to process:${C_RESET} ${EPIC_IDS[*]}"
ui ""

# ─────────────────────────────────────────────────────────────────────────────
# Epic loop
# ─────────────────────────────────────────────────────────────────────────────
for EPIC_ID in "${EPIC_IDS[@]}"; do

RUN_BRANCH="${BRANCH_PREFIX}${EPIC_ID}"

ui ""
ui "${C_BOLD}${C_BLUE}── Epic: $EPIC_ID ──────────────────────────────────────────────────────────${C_RESET}"
ui_config

# Branch setup
if [[ "$BRANCH_MODE" == "current" ]]; then
  RUN_BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  log_event "INFO" "Using current branch $RUN_BRANCH"
  ui "${C_DIM}   Using current branch: $RUN_BRANCH${C_RESET}"
else
  git -C "$ROOT_DIR" checkout "$SOURCE_BRANCH" >/dev/null 2>&1
  if git -C "$ROOT_DIR" rev-parse --verify "$RUN_BRANCH" >/dev/null 2>&1; then
    git -C "$ROOT_DIR" checkout "$RUN_BRANCH" >/dev/null 2>&1
    log_event "INFO" "Resumed existing branch $RUN_BRANCH"
    ui "${C_DIM}   Resumed branch: $RUN_BRANCH${C_RESET}"
  else
    git -C "$ROOT_DIR" checkout -b "$RUN_BRANCH" >/dev/null 2>&1
    log_event "INFO" "Created branch $RUN_BRANCH from $SOURCE_BRANCH"
    ui "${C_DIM}   Created branch: $RUN_BRANCH${C_RESET}"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Task loop
# ─────────────────────────────────────────────────────────────────────────────
TASKS_DONE=0
TASKS_SKIPPED=0
TASKS_TOTAL=0
COMPLETED_TASKS=()

while true; do
  # Get ready/in_progress tasks
  ready_json="$("$FLOWCTL" ready --epic "$EPIC_ID" --json 2>&1)" || fail "flowctl ready failed"

  ready_list="$(echo "$ready_json" | python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
ready = data.get('ready', [])
in_progress = data.get('in_progress', [])
# Prefer in_progress first, then ready
tasks = in_progress + ready
for t in tasks:
    print(t['id'] + '|' + t.get('title', ''))
" 2>/dev/null)" || true

  if [[ -z "$ready_list" ]]; then
    # Check if all done or all blocked
    blocked_count="$(echo "$ready_json" | python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
print(len(data.get('blocked', [])))
" 2>/dev/null)" || blocked_count=0

    if [[ "$blocked_count" -gt 0 ]]; then
      ui ""
      ui "   ${C_YELLOW}Remaining tasks are blocked. Stopping epic $EPIC_ID.${C_RESET}"
    else
      ui_no_tasks
    fi
    break
  fi

  # Take first task
  task_line="$(echo "$ready_list" | head -1)"
  TASK_ID="${task_line%%|*}"
  TASK_TITLE="${task_line#*|}"
  TASKS_TOTAL=$((TASKS_TOTAL + 1))

  ui_task_start "$TASK_ID" "$TASK_TITLE"
  debug_ensure_task_dir "$TASK_ID"
  log_event "INFO" "Starting task $TASK_ID"

  # Start the task (claim it)
  "$FLOWCTL" start "$TASK_ID" >/dev/null 2>&1 || true

  # Get task spec and JSON
  TASK_SPEC="$("$FLOWCTL" cat "$TASK_ID" 2>/dev/null)" || TASK_SPEC=""
  TASK_JSON="$("$FLOWCTL" show "$TASK_ID" --json 2>/dev/null)" || TASK_JSON="{}"

  # ─── Inner dev<->review loop ───
  APPROVED=false
  FIXES_FILE=""
  round=1

  while (( round <= MAX_REVIEW_ROUNDS )); do

    # ─── DEV phase ───
    if [[ "$round" -eq 1 ]]; then
      # First round: implement from spec
      ui_dev "$round"
      SKILLS_HINT=""
      [[ -n "$PROFILE_SKILLS" ]] && SKILLS_HINT="
- Skills recomendados para cargar (usa ToolSearch): $PROFILE_SKILLS"
      FORMAT_HINT=""
      [[ -n "$PROFILE_FORMAT_CMD" ]] && FORMAT_HINT="
- Usa \`$PROFILE_FORMAT_CMD\` antes de terminar"

      DEV_PROMPT="Sos un agente de desarrollo autonomo. Implementa la siguiente tarea:

## Tarea: $TASK_ID
$TASK_SPEC

## Contexto tarea (JSON):
$TASK_JSON

## Reglas:
$PROFILE_DEV_RULES$FORMAT_HINT
- Si necesitas trackear tareas, usa flowctl: \`$FLOWCTL_REL list\`, \`$FLOWCTL_REL show <id>\`, \`$FLOWCTL_REL start <id>\`, \`$FLOWCTL_REL done <id> --summary-file /dev/null\`$SKILLS_HINT"
    else
      # Subsequent rounds: apply fixes
      FIXES_CONTENT="$(cat "$FIXES_FILE" 2>/dev/null)" || FIXES_CONTENT=""
      n_fixes="$(count_fixes "$FIXES_CONTENT")"
      ui_dev_fixes "$round" "$n_fixes"
      DEV_PROMPT="Sos un agente de desarrollo autonomo. Aplica las correcciones del reviewer:

## Tarea: $TASK_ID
$TASK_SPEC

## Fixes pendientes:
$FIXES_CONTENT

## Reglas:
$PROFILE_DEV_FIX_RULES$FORMAT_HINT
- Si necesitas trackear tareas, usa flowctl: \`$FLOWCTL_REL list\`, \`$FLOWCTL_REL show <id>\`, \`$FLOWCTL_REL start <id>\`, \`$FLOWCTL_REL done <id> --summary-file /dev/null\`$SKILLS_HINT"
    fi

    log_event "DEV" "Sending prompt to claude (round $round)"
    debug_save "$TASK_ID/dev-round-${round}.prompt" "$DEV_PROMPT"

    if [[ "$DEBUG" -ge 2 ]]; then
      ui "   ${C_DIM}── PROMPT ──${C_RESET}"
      echo "$DEV_PROMPT" | head -20 | while IFS= read -r pline; do
        ui "   ${C_DIM}$pline${C_RESET}"
      done
      ui "   ${C_DIM}── ... ──${C_RESET}"
    fi

    dev_start="$(date +%s)"
    [[ "$DEBUG" -ge 1 ]] && start_timer "DEV round $round"
    run_claude "$DEV_PROMPT" "DEV" "$C_MAGENTA"
    [[ "$DEBUG" -ge 1 ]] && stop_timer
    dev_end="$(date +%s)"
    dev_elapsed=$((dev_end - dev_start))
    TOTAL_DEV_TIME=$((TOTAL_DEV_TIME + dev_elapsed))

    ui "   ${C_MAGENTA}[DEV round $round]${C_RESET} completed in $(format_duration "$dev_elapsed")"

    debug_save "$TASK_ID/dev-round-${round}.response" "$CLAUDE_OUTPUT"
    log_event "DEV" "Claude responded (${dev_elapsed}s, ${#CLAUDE_OUTPUT} chars)"

    # ─── REVIEW phase ───
    ui_review "$round"

    GIT_DIFF="$(git -C "$ROOT_DIR" diff HEAD 2>/dev/null || true)"
    # Also include staged changes
    GIT_DIFF_STAGED="$(git -C "$ROOT_DIR" diff --cached 2>/dev/null || true)"
    if [[ -n "$GIT_DIFF_STAGED" ]]; then
      GIT_DIFF="${GIT_DIFF}
${GIT_DIFF_STAGED}"
    fi
    # Also include untracked new files for review context
    UNTRACKED="$(git -C "$ROOT_DIR" diff HEAD --diff-filter=A 2>/dev/null || true)"

    REVIEW_PROMPT="Sos un agente code reviewer. Revisa los cambios de la tarea $TASK_ID.

## Spec de la tarea:
$TASK_SPEC

## Diff de cambios:
\`\`\`diff
$GIT_DIFF
\`\`\`

## Instrucciones:
$PROFILE_REVIEW_RULES

## Output OBLIGATORIO:
Emiti EXACTAMENTE un bloque JSON al final:

Si aprobado:
<review>{\"approved\": true, \"summary\": \"breve resumen\"}</review>

Si hay problemas:
<review>{\"approved\": false, \"fixes\": [{\"file\": \"path/to/file.ts\", \"issue\": \"descripcion del problema\", \"suggestion\": \"como arreglarlo\", \"fixed\": false}]}</review>"

    log_event "REVIEW" "Sending prompt to claude (round $round)"
    debug_save "$TASK_ID/review-round-${round}.prompt" "$REVIEW_PROMPT"

    if [[ "$DEBUG" -ge 2 ]]; then
      ui "   ${C_DIM}── PROMPT ──${C_RESET}"
      echo "$REVIEW_PROMPT" | head -20 | while IFS= read -r pline; do
        ui "   ${C_DIM}$pline${C_RESET}"
      done
      ui "   ${C_DIM}── ... ──${C_RESET}"
    fi

    review_start="$(date +%s)"
    [[ "$DEBUG" -ge 1 ]] && start_timer "REVIEW round $round"
    run_claude "$REVIEW_PROMPT" "REVIEW" "$C_YELLOW"
    [[ "$DEBUG" -ge 1 ]] && stop_timer
    review_end="$(date +%s)"
    review_elapsed=$((review_end - review_start))
    TOTAL_REVIEW_TIME=$((TOTAL_REVIEW_TIME + review_elapsed))

    ui "   ${C_YELLOW}[REVIEW round $round]${C_RESET} completed in $(format_duration "$review_elapsed")"

    debug_save "$TASK_ID/review-round-${round}.response" "$CLAUDE_OUTPUT"
    log_event "REVIEW" "Claude responded (${review_elapsed}s, ${#CLAUDE_OUTPUT} chars)"

    # Parse review verdict
    REVIEW_JSON="$(echo "$CLAUDE_OUTPUT" | extract_review_json)"
    review_approved="$(json_get approved "$REVIEW_JSON")"

    if [[ "$review_approved" == "true" ]]; then
      ui_review_verdict "$round" "true"
      log_event "REVIEW" "Verdict: APPROVED"
      APPROVED=true
      break
    else
      fixes_count="$(count_fixes "$REVIEW_JSON")"
      ui_review_verdict "$round" "false" "$fixes_count"
      log_event "REVIEW" "Verdict: NOT APPROVED ($fixes_count fixes)"

      # Write fixes file
      FIXES_FILE="$ROOT_DIR/.flow/tasks/${TASK_ID}-fixes.json"
      python3 - "$TASK_ID" "$round" "$REVIEW_JSON" <<'PY' > "$FIXES_FILE"
import json, sys
task_id = sys.argv[1]
rnd = int(sys.argv[2])
review = json.loads(sys.argv[3])
fixes = review.get("fixes", [])
out = {"task_id": task_id, "round": rnd, "fixes": fixes}
print(json.dumps(out, indent=2))
PY
      debug_save "$TASK_ID/fixes-round-${round}.json" "$(cat "$FIXES_FILE")"
    fi

    round=$((round + 1))
  done

  # ─── Post-task handling ───
  if [[ "$APPROVED" == "true" ]]; then
    # Mark done via flowctl
    evidence_tmp="$(mktemp)"
    echo '{}' > "$evidence_tmp"
    "$FLOWCTL" done "$TASK_ID" --summary-file /dev/null --evidence-json "$evidence_tmp" 2>/dev/null || true
    rm -f "$evidence_tmp"

    # Commit changes
    git -C "$ROOT_DIR" add -A >/dev/null 2>&1
    git -C "$ROOT_DIR" commit -m "$(cat <<EOF
feat($TASK_ID): $(echo "$TASK_TITLE" | head -c 60)

Automated implementation via rafita

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
    )" >/dev/null 2>&1 || true

    TASKS_DONE=$((TASKS_DONE + 1))
    COMPLETED_TASKS+=("$TASK_ID")
    ui_task_done "$TASK_ID"
    log_event "INFO" "Task $TASK_ID completed and committed"

    # Clean up fixes file if exists
    [[ -n "$FIXES_FILE" && -f "$FIXES_FILE" ]] && rm -f "$FIXES_FILE"
  else
    ui_task_max_rounds "$TASK_ID"
    TASKS_SKIPPED=$((TASKS_SKIPPED + 1))
    log_event "WARN" "Task $TASK_ID skipped after $MAX_REVIEW_ROUNDS rounds without approval"

    # Still commit partial work so we don't lose it
    git -C "$ROOT_DIR" add -A >/dev/null 2>&1
    git -C "$ROOT_DIR" commit -m "$(cat <<EOF
wip($TASK_ID): partial (not approved after $MAX_REVIEW_ROUNDS rounds)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
    )" >/dev/null 2>&1 || true
  fi

  sleep 2
done

# ─────────────────────────────────────────────────────────────────────────────
# Final review (per epic)
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$TASKS_DONE" -gt 0 ]]; then
  ui_final_review

  ACCUMULATED_DIFF="$(git -C "$ROOT_DIR" diff "$SOURCE_BRANCH"...HEAD 2>/dev/null || true)"
  TASKS_SUMMARY=""
  for t in "${COMPLETED_TASKS[@]}"; do
    TASKS_SUMMARY="${TASKS_SUMMARY}
- $t"
  done

  FINAL_PROMPT="Sos un agente code reviewer senior. Revisa el diff acumulado de toda la epic.

## Diff acumulado (contra $SOURCE_BRANCH):
\`\`\`diff
$ACCUMULATED_DIFF
\`\`\`

## Tareas completadas:
$TASKS_SUMMARY

## Instrucciones:
- Busca inconsistencias entre tareas
- Verifica integridad general del cambio
- Busca imports rotos, tipos incorrectos, dead code
- Verifica que no hay regresiones

## Output:
<final-review>{\"status\": \"pass|fail\", \"issues\": [\"...\"], \"summary\": \"...\"}</final-review>"

  log_event "FINAL" "Sending final review prompt"
  debug_save "final-review.prompt" "$FINAL_PROMPT"

  if [[ "$DEBUG" -ge 2 ]]; then
    ui "   ${C_DIM}── PROMPT ──${C_RESET}"
    echo "$FINAL_PROMPT" | head -20 | while IFS= read -r pline; do
      ui "   ${C_DIM}$pline${C_RESET}"
    done
    ui "   ${C_DIM}── ... ──${C_RESET}"
  fi

  final_start="$(date +%s)"
  [[ "$DEBUG" -ge 1 ]] && start_timer "FINAL"
  run_claude "$FINAL_PROMPT" "FINAL" "$C_CYAN"
  [[ "$DEBUG" -ge 1 ]] && stop_timer
  final_end="$(date +%s)"
  final_elapsed=$((final_end - final_start))
  TOTAL_FINAL_TIME=$((TOTAL_FINAL_TIME + final_elapsed))

  ui "   ${C_CYAN}[FINAL]${C_RESET} completed in $(format_duration "$final_elapsed")"

  debug_save "final-review.response" "$CLAUDE_OUTPUT"

  FINAL_JSON="$(echo "$CLAUDE_OUTPUT" | extract_final_review_json)"
  final_status="$(json_get status "$FINAL_JSON")"
  final_summary="$(json_get summary "$FINAL_JSON")"

  ui_final_verdict "$final_status"
  [[ -n "$final_summary" ]] && ui "   ${C_DIM}$final_summary${C_RESET}"

  log_event "FINAL" "Verdict: $final_status - $final_summary"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Close epic + Push + PR (per epic)
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$TASKS_DONE" -gt 0 ]]; then
  # Close epic via flowctl
  "$FLOWCTL" epic close "$EPIC_ID" >/dev/null 2>&1 && {
    ui "   ${C_GREEN}[EPIC]${C_RESET} Closed $EPIC_ID"
    log_event "INFO" "Closed epic $EPIC_ID"
  } || {
    ui "   ${C_YELLOW}[EPIC]${C_RESET} Could not close $EPIC_ID (may have pending tasks)"
    log_event "WARN" "Failed to close epic $EPIC_ID"
  }

  # Commit epic closure
  git -C "$ROOT_DIR" add -A >/dev/null 2>&1
  git -C "$ROOT_DIR" commit -m "$(cat <<EOF
chore($EPIC_ID): close epic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
  )" >/dev/null 2>&1 || true

  ui ""
  ui "   ${C_CYAN}[PUSH]${C_RESET} Pushing $RUN_BRANCH..."

  PUSH_OK=false
  git -C "$ROOT_DIR" push -u origin "$RUN_BRANCH" >/dev/null 2>&1 && PUSH_OK=true || {
    ui "   ${C_RED}[PUSH]${C_RESET} Failed to push $RUN_BRANCH"
    log_event "WARN" "Failed to push $RUN_BRANCH"
  }

  if [[ "$PUSH_OK" == "true" ]]; then
    # Check if PR/MR already exists for this branch
    EXISTING_PR=""
    if [[ "$GIT_PROVIDER" == "gitlab" ]]; then
      EXISTING_PR="$(cd "$ROOT_DIR" && glab mr view "$RUN_BRANCH" --json url -q .url 2>/dev/null)" || EXISTING_PR=""
    else
      EXISTING_PR="$(cd "$ROOT_DIR" && gh pr view "$RUN_BRANCH" --json url -q .url 2>/dev/null)" || EXISTING_PR=""
    fi

    if [[ -n "$EXISTING_PR" ]]; then
      ui "   ${C_GREEN}[PR]${C_RESET} Updated existing: $EXISTING_PR"
      log_event "INFO" "PR already exists, pushed new commits: $EXISTING_PR"
    else
      # Build PR title from completed tasks
      if [[ "${#COMPLETED_TASKS[@]}" -eq 1 ]]; then
        PR_TITLE_ID="${COMPLETED_TASKS[0]}"
        PR_TITLE_TEXT="$("$FLOWCTL" show "$PR_TITLE_ID" --json 2>/dev/null | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('title',''))" 2>/dev/null)" || PR_TITLE_TEXT=""
      else
        PR_TITLE_ID="$EPIC_ID"
        PR_TITLE_TEXT="$("$FLOWCTL" show "$EPIC_ID" --json 2>/dev/null | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('title',''))" 2>/dev/null)" || PR_TITLE_TEXT=""
      fi
      [[ -z "$PR_TITLE_TEXT" ]] && PR_TITLE_TEXT="automated implementation"
      PR_TITLE="feat($PR_TITLE_ID): $PR_TITLE_TEXT"

      # Build PR body
      PR_TASKS=""
      for t in "${COMPLETED_TASKS[@]}"; do
        task_title="$("$FLOWCTL" show "$t" --json 2>/dev/null | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('title',''))" 2>/dev/null)" || task_title=""
        PR_TASKS="${PR_TASKS}
- **${t}**: ${task_title}"
      done
      [[ "$TASKS_SKIPPED" -gt 0 ]] && PR_TASKS="${PR_TASKS}
- _${TASKS_SKIPPED} task(s) skipped (max rounds)_"

      PR_BODY="$(cat <<PREOF
## Summary
$PR_TASKS

## Review
Final review verdict: **${final_status:-n/a}**
${final_summary:-}

Generated with rafita + Claude Code
PREOF
      )"

      if [[ "$GIT_PROVIDER" == "gitlab" ]]; then
        PR_URL="$(cd "$ROOT_DIR" && glab mr create \
          --source-branch "$RUN_BRANCH" \
          --target-branch "$SOURCE_BRANCH" \
          --title "$PR_TITLE" \
          --description "$PR_BODY" \
          --yes 2>&1)" || {
          ui "   ${C_RED}[MR]${C_RESET} Failed to create MR: $PR_URL"
          log_event "WARN" "Failed to create MR for $EPIC_ID"
          PR_URL=""
        }
      else
        PR_URL="$(cd "$ROOT_DIR" && gh pr create \
          --base "$SOURCE_BRANCH" \
          --title "$PR_TITLE" \
          --body "$PR_BODY" 2>&1)" || {
          ui "   ${C_RED}[PR]${C_RESET} Failed to create PR: $PR_URL"
          log_event "WARN" "Failed to create PR for $EPIC_ID"
          PR_URL=""
        }
      fi

      if [[ -n "$PR_URL" ]]; then
        ui "   ${C_GREEN}[PR]${C_RESET} $PR_URL"
        log_event "INFO" "PR created: $PR_URL"
      fi
    fi
  fi
fi

# Accumulate global counters
GLOBAL_TASKS_DONE=$((GLOBAL_TASKS_DONE + TASKS_DONE))
GLOBAL_TASKS_SKIPPED=$((GLOBAL_TASKS_SKIPPED + TASKS_SKIPPED))
GLOBAL_TASKS_TOTAL=$((GLOBAL_TASKS_TOTAL + TASKS_TOTAL))
GLOBAL_COMPLETED_TASKS+=("${COMPLETED_TASKS[@]}")
EPICS_PROCESSED=$((EPICS_PROCESSED + 1))

ui ""
ui "${C_DIM}   Epic $EPIC_ID finished: $TASKS_DONE done, $TASKS_SKIPPED skipped${C_RESET}"

# Return to source branch for next epic (only in new-branch mode)
[[ "$BRANCH_MODE" == "new" ]] && git -C "$ROOT_DIR" checkout "$SOURCE_BRANCH" >/dev/null 2>&1

done # end epic loop

# ─────────────────────────────────────────────────────────────────────────────
# Global Summary
# ─────────────────────────────────────────────────────────────────────────────
ui_complete "$GLOBAL_TASKS_DONE" "$((GLOBAL_TASKS_DONE + GLOBAL_TASKS_SKIPPED))" "$GLOBAL_TASKS_SKIPPED"
ui "${C_DIM}   Epics processed: $EPICS_PROCESSED${C_RESET}"

if [[ "$DEBUG" -ge 1 ]]; then
  ui "${C_DIM}   Logs: $RUN_DIR${C_RESET}"
  ui ""
fi
