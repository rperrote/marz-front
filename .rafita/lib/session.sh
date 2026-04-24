#!/usr/bin/env bash
# session.sh — CLI sessions per task/role, scoped to the current run.
# Files live in .rafita/runs/<run_id>/sessions/<task_id>.json.
# Sessions are reused across rounds within the same run; a new run always
# gets fresh sessions (new UUIDs, used=0).

session::_file() {
  local task_id="$1"
  local run_dir="${RAFITA_RUN_DIR:-${RAFITA_DIR:-.rafita}/runs/default}"
  printf '%s/sessions/%s.json' "$run_dir" "$task_id"
}

# Run a python snippet that needs args, capturing stdout to a variable.
# Usage: session::_pyrun <out_var> <script_text> [arg...]
session::_pyrun() {
  local out_var="$1"; shift
  local script="$1"; shift
  local tmp; tmp=$(mktemp)
  printf '%s\n' "$script" > "$tmp"
  local result
  result=$(python3 "$tmp" "$@" 2>/dev/null)
  rm -f "$tmp"
  printf -v "$out_var" '%s' "$result"
}

# Initialize session metadata for a task.
# Preserves existing session IDs across runs (for --resume and --resume-task).
# Only generates new IDs for roles that don't have one yet.
session::task_init() {
  local task_id="$1"
  local f; f=$(session::_file "$task_id")
  mkdir -p "$(dirname "$f")"

  local dev_p; dev_p=$(worker::_provider_for_role dev)
  local rev_p; rev_p=$(worker::_provider_for_role reviewer)

  if [[ -f "$f" ]]; then
    # File exists: if run_id changed, regenerate all IDs (new run = new sessions).
    # If same run_id, preserve existing IDs (resume within the same run).
    session::_pyrun _unused '
import json,sys,uuid
f,run_id,dev_p,rev_p=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4]
with open(f) as fp: d=json.load(fp)
same_run = (d.get("_run_id","") == run_id and bool(run_id))
d["_run_id"]=run_id
for role,provider in [("dev",dev_p),("reviewer",rev_p)]:
    v=d.get(role,{})
    has_id = isinstance(v,dict) and bool(v.get("id"))
    if same_run and has_id:
        pass  # preserve session for resume within same run
    else:
        if provider=="claude":
            d[role]={"provider":"claude","id":str(uuid.uuid4()),"used":0}
        else:
            d[role]={"provider":provider,"id":"","used":0}
with open(f,"w") as fp: json.dump(d,fp)
' "$f" "${RAFITA_RUN_ID:-}" "$dev_p" "$rev_p"
    return 0
  fi

  # Fresh start: create file with empty roles.
  session::_pyrun _unused '
import json,sys
f,run_id=sys.argv[1],sys.argv[2]
with open(f,"w") as fp:
    json.dump({"_run_id":run_id,"dev":{},"reviewer":{},"planner":{}},fp)
' "$f" "${RAFITA_RUN_ID:-}"

  # Pre-generate UUIDs for claude roles.
  if [[ "$dev_p" == "claude" ]]; then
    local sid
    sid=$(python3 -c 'import uuid; print(uuid.uuid4())' 2>/dev/null || uuidgen)
    session::_pyrun _unused '
import json,sys
f,role,sid=sys.argv[1],sys.argv[2],sys.argv[3]
with open(f) as fp: d=json.load(fp)
d[role] = {"provider":"claude","id":sid,"used":0}
with open(f,"w") as fp: json.dump(d,fp)
' "$f" dev "$sid"
  fi

  if [[ "$rev_p" == "claude" ]]; then
    local sid
    sid=$(python3 -c 'import uuid; print(uuid.uuid4())' 2>/dev/null || uuidgen)
    session::_pyrun _unused '
import json,sys
f,role,sid=sys.argv[1],sys.argv[2],sys.argv[3]
with open(f) as fp: d=json.load(fp)
d[role] = {"provider":"claude","id":sid,"used":0}
with open(f,"w") as fp: json.dump(d,fp)
' "$f" reviewer "$sid"
  fi
}

# Get a field from the session file for a role. Prints empty on missing.
session::get() {
  local task_id="$1" role="$2" key="${3:-id}"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  local result
  session::_pyrun result '
import json,sys
try:
    with open(sys.argv[1]) as fp: d=json.load(fp)
    v=d.get(sys.argv[2],{})
    print(v.get(sys.argv[3],"") if isinstance(v,dict) else "")
except Exception:
    print("")
' "$f" "$role" "$key"
  printf '%s' "$result"
}

# Increment the usage counter for a role.
session::mark_used() {
  local task_id="$1" role="$2"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  session::_pyrun _unused '
import json,sys
try:
    with open(sys.argv[1]) as fp: d=json.load(fp)
    v=d.get(sys.argv[2],{})
    if isinstance(v,dict):
        v["used"]=v.get("used",0)+1
        with open(sys.argv[1],"w") as fp: json.dump(d,fp)
except Exception:
    pass
' "$f" "$role"
}

# After the first successful opencode invocation, capture the session id from
# the CLI's session list. We look for the most recent session whose cwd/path
# matches the current directory; if no cwd match, fall back to the newest.
session::capture_opencode() {
  local task_id="$1" role="$2"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0

  local oc_bin; oc_bin="${RAFITA_OPENCODE_BIN:-opencode}"
  local sessions_json
  sessions_json=$("$oc_bin" session list --format json -n 5 2>/dev/null) || return 0

  local cwd; cwd=$(pwd)
  local sid
  session::_pyrun sid '
import json,sys
try:
    data=json.loads(sys.argv[1])
    cwd=sys.argv[2]
    for s in data:
        if s.get("cwd")==cwd or s.get("path")==cwd:
            print(s.get("id",""))
            break
    else:
        if data and isinstance(data,list):
            print(data[0].get("id",""))
except Exception:
    print("")
' "$sessions_json" "$cwd"
  [[ -z "$sid" ]] && return 0

  session::_pyrun _unused '
import json,sys
f,role,sid=sys.argv[1],sys.argv[2],sys.argv[3]
with open(f) as fp: d=json.load(fp)
d[role] = {"provider":"opencode","id":sid,"used":0}
with open(f,"w") as fp: json.dump(d,fp)
' "$f" "$role" "$sid"
}
