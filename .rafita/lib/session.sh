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

# Run a python snippet, printing stdout. Callers capture via $().
# Usage: session::_py <script_text> [arg...]
session::_py() {
  local script="$1"; shift
  local tmp; tmp=$(mktemp)
  printf '%s\n' "$script" > "$tmp"
  python3 "$tmp" "$@" 2>/dev/null
  rm -f "$tmp"
}

session::ensure_role() {
  local task_id="$1" role="$2" provider="$3"
  local f; f=$(session::_file "$task_id")
  mkdir -p "$(dirname "$f")"

  if [[ ! -f "$f" ]]; then
    session::_py '
import json,sys
f,run_id=sys.argv[1],sys.argv[2]
with open(f,"w") as fp:
    json.dump({"_run_id":run_id},fp)
' "$f" "${RAFITA_RUN_ID:-}"
  fi

  session::_py '
import json,sys
try:
    import uuid
    f,run_id,role,provider=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4]
    with open(f) as fp: d=json.load(fp)
    same_run = (d.get("_run_id","") == run_id and bool(run_id))
    d["_run_id"] = run_id
    v = d.get(role,{})
    same_role = isinstance(v,dict) and v.get("provider","") == provider
    if same_run and same_role:
        pass
    else:
        if provider == "claude":
            d[role] = {"provider":"claude","id":str(uuid.uuid4()),"used":0}
        else:
            d[role] = {"provider":provider,"id":"","used":0}
    with open(f,"w") as fp: json.dump(d,fp)
except Exception:
    pass
' "$f" "${RAFITA_RUN_ID:-}" "$role" "$provider"
}

session::task_init() {
  local task_id="$1"
  session::ensure_role "$task_id" dev "$(worker::_provider_for_role dev)"
  session::ensure_role "$task_id" reviewer "$(worker::_provider_for_role reviewer)"
}

# Get a field from the session file for a role. Prints empty on missing.
session::get() {
  local task_id="$1" role="$2" key="${3:-id}"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  session::_py '
import json,sys
try:
    with open(sys.argv[1]) as fp: d=json.load(fp)
    v=d.get(sys.argv[2],{})
    print(v.get(sys.argv[3],"") if isinstance(v,dict) else "")
except Exception:
    print("")
' "$f" "$role" "$key"
}

# Replace the UUID for a role with a fresh one (e.g. after "already in use").
session::regenerate_id() {
  local task_id="$1" role="$2"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  session::_py '
import json,sys,uuid
try:
    with open(sys.argv[1]) as fp: d=json.load(fp)
    v=d.get(sys.argv[2],{})
    if isinstance(v,dict):
        v["id"]=str(uuid.uuid4())
        v["used"]=0
        d[sys.argv[2]]=v
        with open(sys.argv[1],"w") as fp: json.dump(d,fp)
except Exception:
    pass
' "$f" "$role"
}

# Increment the usage counter for a role.
session::mark_used() {
  local task_id="$1" role="$2"
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  session::_py '
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
  sid=$(session::_py '
import json,sys
try:
    data=json.loads(sys.argv[1])
    cwd=sys.argv[2]
    for s in data:
        if s.get("cwd")==cwd or s.get("path")==cwd:
            print(s.get("id",""))
            sys.exit(0)
    if data and isinstance(data,list):
        print(data[0].get("id",""))
except Exception:
    print("")
' "$sessions_json" "$cwd")
  [[ -z "$sid" ]] && return 0

  session::_py '
import json,sys
f,role,sid=sys.argv[1],sys.argv[2],sys.argv[3]
with open(f) as fp: d=json.load(fp)
d[role] = {"provider":"opencode","id":sid,"used":0}
with open(f,"w") as fp: json.dump(d,fp)
' "$f" "$role" "$sid"
}

# Persist the Codex thread id captured from `codex exec --json` or the plain
# stderr header. Later rounds resume with `codex exec resume <thread_id> -`.
session::capture_codex() {
  local task_id="$1" role="$2" sid="$3"
  [[ -z "$sid" ]] && return 0
  local f; f=$(session::_file "$task_id")
  [[ -f "$f" ]] || return 0
  session::_py '
import json,sys
try:
    f,role,sid=sys.argv[1],sys.argv[2],sys.argv[3]
    with open(f) as fp: d=json.load(fp)
    old=d.get(role,{})
    used=old.get("used",0) if isinstance(old,dict) and old.get("id")==sid else 0
    d[role] = {"provider":"codex","id":sid,"used":used}
    with open(f,"w") as fp: json.dump(d,fp)
except Exception:
    pass
' "$f" "$role" "$sid"
}
