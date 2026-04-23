#!/usr/bin/env bash
# flowctl.sh — thin wrappers around flow-next CLI using its --json output.

flowctl::_bin() {
  printf '%s' "${RAFITA_FLOWCTL:-.flow/bin/flowctl}"
}

flowctl::check_available() {
  local bin; bin=$(flowctl::_bin)
  if [[ -x "$bin" ]]; then return 0; fi
  command -v "$bin" >/dev/null 2>&1
}

# List open epic ids (one per line).
flowctl::open_epics() {
  local bin; bin=$(flowctl::_bin)
  "$bin" epics --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
for e in d.get("epics", []):
    if e.get("status") == "open":
        print(e.get("id",""))
'
}

# Emit next ready task id for an epic, or empty.
flowctl::next_task_id() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" ready --epic "$epic" --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
ready = d.get("ready") or []
if ready:
    print(ready[0].get("id",""))
'
}

flowctl::task_title() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" ready --epic "$epic" --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
ready = d.get("ready") or []
if ready:
    print(ready[0].get("title",""))
'
}

# Spec body: read the file at spec_path (markdown with the task details).
# Falls back to the title if the spec file is missing.
flowctl::task_spec() {
  local task="$1"
  local bin; bin=$(flowctl::_bin)
  local json
  json=$("$bin" show "$task" --json 2>/dev/null || true)
  [[ -z "$json" ]] && return 0
  python3 - "$json" << 'PYEOF'
import json, sys, os
try:
    d = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)
spec_path = d.get("spec_path")
if spec_path and os.path.isfile(spec_path):
    with open(spec_path) as f:
        sys.stdout.write(f.read())
else:
    # Fallback: emit the title so DEV at least knows what to do.
    sys.stdout.write(d.get("title",""))
PYEOF
}

# Task metadata as JSON (the flowctl show output, minus the outer "success").
flowctl::task_json() {
  local task="$1"
  local bin; bin=$(flowctl::_bin)
  local json
  json=$("$bin" show "$task" --json 2>/dev/null || true)
  if [[ -z "$json" ]]; then
    python3 -c 'import json,sys; print(json.dumps({"id":sys.argv[1]}))' "$task"
    return 0
  fi
  printf '%s' "$json"
}

flowctl::task_title_by_id() {
  local task="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" show "$task" --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
print(d.get("title",""))
'
}

flowctl::start_task() {
  local task="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" start "$task" >/dev/null 2>&1 || true
}

flowctl::done_task() {
  local task="$1" summary="${2:-}" evidence="${3:-}"
  local bin; bin=$(flowctl::_bin)
  local args=(done "$task")
  if [[ -n "$summary" ]]; then args+=(--summary-file "$summary"); fi
  if [[ -n "$evidence" ]]; then args+=(--evidence-json "$evidence"); fi
  "$bin" "${args[@]}" >/dev/null 2>&1 || true
}

flowctl::close_epic() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" close-epic "$epic" >/dev/null 2>&1 || true
}
