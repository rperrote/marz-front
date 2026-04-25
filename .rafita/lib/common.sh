#!/usr/bin/env bash
# common.sh — logging, run dir, template rendering, secret scrubbing, deps,
# cleanup. Pure functions (no side-effects on source), namespace: common::.

# shellcheck disable=SC2155

# --- fatal / warn ------------------------------------------------------------

common::fail() {
  local msg="${1:-unspecified error}"
  local rc="${2:-1}"
  printf 'rafita: FATAL: %s\n' "$msg" >&2
  exit "$rc"
}

common::warn() {
  local msg="${1:-}"
  printf 'rafita: WARN: %s\n' "$msg" >&2
}

# --- logging -----------------------------------------------------------------
# Writes LEVEL-tagged messages to $RAFITA_RUN_LOG. If the log is not yet set,
# falls back to stderr.

common::log() {
  local level="${1:-INFO}"; shift
  local msg="$*"
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local line="[$ts] [$level] $msg"
  if [[ -n "${RAFITA_RUN_LOG:-}" && -w "$(dirname "$RAFITA_RUN_LOG" 2>/dev/null)" ]]; then
    printf '%s\n' "$line" >> "$RAFITA_RUN_LOG"
  fi
  # Mirror to stderr when:
  #   - debug >= 1 (default), so users see logs live, OR
  #   - RAFITA_LOG_STDERR=1 is explicitly set (CI / non-UI mode)
  # Set RAFITA_LOG_STDERR=0 to suppress.
  local to_stderr="${RAFITA_LOG_STDERR:-}"
  if [[ -z "$to_stderr" ]]; then
    if [[ "${RAFITA_DEBUG:-1}" -ge 1 ]]; then to_stderr=1; else to_stderr=0; fi
  fi
  if [[ "$to_stderr" == "1" ]]; then
    printf '%s\n' "$line" >&2
  fi
}

# --- run dir -----------------------------------------------------------------
# Initializes a per-run directory for artifacts: runs/<id>/.
# Sets RAFITA_RUN_ID, RAFITA_RUN_DIR, RAFITA_RUN_LOG.

common::init_run_dir() {
  local base="${RAFITA_DIR:-.rafita}/runs"
  mkdir -p "$base"
  local id="${1:-${RAFITA_RUN_ID:-}}"
  if [[ -z "$id" ]]; then
    id="$(date -u +"%Y%m%dT%H%M%SZ")-$$"
  fi
  export RAFITA_RUN_ID="$id"
  export RAFITA_RUN_DIR="$base/$id"
  mkdir -p "$RAFITA_RUN_DIR"
  export RAFITA_RUN_LOG="$RAFITA_RUN_DIR/run.log"
  if [[ -f "$RAFITA_RUN_LOG" ]]; then
    printf '\n[%s] [INFO] resumed run_id=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$id" >> "$RAFITA_RUN_LOG"
  else
    : > "$RAFITA_RUN_LOG"
  fi
  common::log INFO "run_id=$id"
}

common::task_artifact_dir() {
  local task_id="$1"
  local dir="$RAFITA_RUN_DIR/$task_id"
  mkdir -p "$dir"
  printf '%s' "$dir"
}

# --- debug save (prompt+response) -------------------------------------------

common::debug_save() {
  # Args: task_id label content
  # Never overwrites: if path exists, appends -fix-K (K = next free integer)
  # before the extension. So a second invocation of `dev-round-1.prompt`
  # writes `dev-round-1-fix-1.prompt`, then `-fix-2`, etc. This preserves
  # every prompt/response across gate retries, transient retries, etc.
  local task_id="$1" label="$2" content="$3"
  [[ "${RAFITA_DEBUG:-1}" -ge 1 ]] || return 0
  local dir
  dir=$(common::task_artifact_dir "$task_id")
  local path="$dir/$label"
  if [[ -e "$path" ]]; then
    local base ext k
    if [[ "$label" == *.* ]]; then
      base="${label%.*}"
      ext=".${label##*.}"
    else
      base="$label"
      ext=""
    fi
    k=1
    while [[ -e "$dir/${base}-fix-${k}${ext}" ]]; do
      k=$((k + 1))
    done
    path="$dir/${base}-fix-${k}${ext}"
  fi
  common::scrub_secrets <<< "$content" > "$path"
}

# --- secret scrubbing --------------------------------------------------------
# Replaces common secret patterns with a redacted marker. Defense in depth,
# not DLP. Stream-friendly: reads stdin, writes stdout.

common::scrub_secrets() {
  python3 -c '
import re, sys
data = sys.stdin.read()
patterns = [
    (r"sk-[A-Za-z0-9_\-]{20,}", "[REDACTED:openai-key]"),
    (r"ghp_[A-Za-z0-9_]{20,}", "[REDACTED:github-pat]"),
    (r"github_pat_[A-Za-z0-9_]{20,}", "[REDACTED:github-pat]"),
    (r"glpat-[A-Za-z0-9_\-]{20,}", "[REDACTED:gitlab-pat]"),
    (r"AKIA[0-9A-Z]{16}", "[REDACTED:aws-key]"),
    (r"(?i)(api[_-]?key\s*[:=]\s*[\x22\x27]?)([A-Za-z0-9_\-]{16,})", r"\1[REDACTED]"),
    (r"(?i)(authorization\s*:\s*bearer\s+)([A-Za-z0-9._\-]{16,})", r"\1[REDACTED]"),
    (r"xox[baprs]-[A-Za-z0-9\-]{10,}", "[REDACTED:slack]"),
]
for pat, repl in patterns:
    data = re.sub(pat, repl, data)
sys.stdout.write(data)
'
}

# --- template rendering ------------------------------------------------------
# Usage: common::render_template <path> KEY=value [KEY=value...]
# Missing keys are left as {{KEY}} for debuggability.

common::render_template() {
  local path="$1"; shift
  [[ -f "$path" ]] || { common::warn "template not found: $path"; return 1; }
  python3 - "$path" "$@" << 'PYEOF'
import sys, re, pathlib
path = pathlib.Path(sys.argv[1])
kv = {}
for arg in sys.argv[2:]:
    if "=" in arg:
        k, v = arg.split("=", 1)
        kv[k] = v
content = path.read_text()
def repl(m):
    key = m.group(1)
    return kv[key] if key in kv else m.group(0)
content = re.sub(r"\{\{([A-Z_][A-Z0-9_]*)\}\}", repl, content)
sys.stdout.write(content)
PYEOF
}

# --- dependency check --------------------------------------------------------

common::check_dependencies() {
  local missing=()
  local required=(git python3)
  for bin in "${required[@]}"; do
    command -v "$bin" >/dev/null 2>&1 || missing+=("$bin")
  done

  # Check each provider that is actually referenced by a role.
  local providers=""
  providers+="${RAFITA_DEV_PROVIDER:-claude} "
  providers+="${RAFITA_REVIEWER_PROVIDER:-claude} "
  providers+="${RAFITA_PLANNER_PROVIDER:-${RAFITA_DEV_PROVIDER:-claude}} "
  # Dedupe (bash 3 friendly).
  local seen=""
  for p in $providers; do
    case " $seen " in *" $p "*) continue ;; esac
    seen="$seen $p"
    case "$p" in
      claude)
        local b="${RAFITA_CLAUDE_BIN:-claude}"
        command -v "$b" >/dev/null 2>&1 || missing+=("$b")
        ;;
      opencode)
        local b="${RAFITA_OPENCODE_BIN:-opencode}"
        command -v "$b" >/dev/null 2>&1 || missing+=("$b")
        ;;
      *)
        missing+=("unknown-provider:$p")
        ;;
    esac
  done

  # At least one of gh / glab must exist.
  if ! command -v gh >/dev/null 2>&1 && ! command -v glab >/dev/null 2>&1; then
    missing+=("gh-or-glab")
  fi
  if (( ${#missing[@]} )); then
    common::fail "missing dependencies: ${missing[*]}"
  fi
}

# --- cleanup / trap ----------------------------------------------------------

common::cleanup() {
  local rc="${1:-0}"
  # Kill any UI timer subprocess.
  if [[ -n "${RAFITA_UI_TIMER_PID:-}" ]] && kill -0 "$RAFITA_UI_TIMER_PID" 2>/dev/null; then
    kill "$RAFITA_UI_TIMER_PID" 2>/dev/null || true
    wait "$RAFITA_UI_TIMER_PID" 2>/dev/null || true
  fi
  return "$rc"
}

# --- JSON helpers ------------------------------------------------------------

common::json_get() {
  # Args: json field (dot.notation). Prints value or empty. rc 0 on success.
  python3 -c '
import json, sys
try:
  d=json.loads(sys.argv[1])
except Exception:
  sys.exit(1)
v=d
for k in sys.argv[2].split("."):
  if isinstance(v,list):
    try: v=v[int(k)]
    except Exception: sys.exit(1)
  elif isinstance(v,dict):
    if k not in v: sys.exit(0)
    v=v[k]
  else:
    sys.exit(1)
if isinstance(v,(dict,list)):
  print(json.dumps(v))
else:
  print("" if v is None else v)
' "$1" "$2"
}

common::now_epoch() { date +%s; }

common::human_duration() {
  local s="$1"
  local m=$(( s / 60 ))
  local r=$(( s % 60 ))
  printf '%02d:%02d' "$m" "$r"
}

# --- simple run counters (done / skipped / failed + start_ts) ----------------
# Replace the old budget lib; we keep counters for the summary but drop the
# hard limits on total tasks / total seconds.

common::counters_init() {
  export RAFITA_START_TS="$(date +%s)"
  export RAFITA_TASKS_DONE=0
  export RAFITA_TASKS_SKIPPED=0
  export RAFITA_TASKS_FAILED=0
  export RAFITA_TASKS_DONE_LIST=""
  export RAFITA_TASKS_SKIPPED_LIST=""
  export RAFITA_TASKS_FAILED_LIST=""
  export RAFITA_EPICS_LIST=""
  export RAFITA_LAST_PR_URL=""
  export RAFITA_LAST_FINAL_VERDICT=""
}

# Internal: append a CSV-style entry to the named variable.
common::_append_csv() {
  local var="$1" val="$2"
  [[ -z "$val" ]] && return 0
  local cur="${!var:-}"
  if [[ -z "$cur" ]]; then
    printf -v "$var" '%s' "$val"
  else
    printf -v "$var" '%s,%s' "$cur" "$val"
  fi
  export "${var?}"
}

# mark_* accept an optional task_id so the completion notification can list
# exactly which tasks fell in each bucket. Callers that pre-date this change
# keep working (they just increment the counter).
common::mark_done()    { RAFITA_TASKS_DONE=$((RAFITA_TASKS_DONE + 1)); export RAFITA_TASKS_DONE; common::_append_csv RAFITA_TASKS_DONE_LIST "${1:-}"; }
common::mark_skipped() { RAFITA_TASKS_SKIPPED=$((RAFITA_TASKS_SKIPPED + 1)); export RAFITA_TASKS_SKIPPED; common::_append_csv RAFITA_TASKS_SKIPPED_LIST "${1:-}"; }
common::mark_failed()  { RAFITA_TASKS_FAILED=$((RAFITA_TASKS_FAILED + 1)); export RAFITA_TASKS_FAILED; common::_append_csv RAFITA_TASKS_FAILED_LIST "${1:-}"; }

common::record_epic() { common::_append_csv RAFITA_EPICS_LIST "${1:-}"; }

# Auto-detects the project name: basename of git toplevel, fallback to basename
# of cwd. Honors RAFITA_PROJECT_NAME override when set via config (projectName).
common::project_name() {
  local override="${RAFITA_PROJECT_NAME:-}"
  if [[ -n "$override" ]]; then printf '%s' "$override"; return 0; fi
  local root
  root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [[ -n "$root" ]]; then basename "$root"; return 0; fi
  basename "$PWD"
}

common::elapsed() {
  local now; now=$(date +%s)
  echo $((now - RAFITA_START_TS))
}
