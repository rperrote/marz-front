#!/usr/bin/env bash
# Fixtures: create/teardown temp repos, mock external binaries (claude, flowctl).
# Helpers mutate the environment (PATH, cwd) — call teardown_tmp_repo at end.

# shellcheck disable=SC2155

setup_tmp_repo() {
  ROOT_DIR_TEST="$(mktemp -d -t rafita-test.XXXXXX)"
  export ROOT_DIR_TEST
  (
    cd "$ROOT_DIR_TEST" || exit 1
    git init -q
    git config user.email "test@rafita.local"
    git config user.name "rafita-test"
    git config commit.gpgsign false
    echo "# test repo" > README.md
    git add README.md
    git commit -q -m "init"
  )
  export OLD_CWD="$PWD"
  cd "$ROOT_DIR_TEST" || return 1
  mkdir -p .rafita/runs .rafita/plans .rafita/profiles
}

teardown_tmp_repo() {
  if [[ -n "${OLD_CWD:-}" ]]; then cd "$OLD_CWD" || true; fi
  if [[ -n "${ROOT_DIR_TEST:-}" && -d "$ROOT_DIR_TEST" ]]; then
    rm -rf "$ROOT_DIR_TEST"
  fi
  unset ROOT_DIR_TEST OLD_CWD
}

# Installs a fake `claude` binary in a dedicated bin dir, prepends to PATH.
# Configuration via env vars read by the mock script:
#   FAKE_CLAUDE_RESPONSES (path to a file with "MATCH|RESPONSE" per line; MATCH can be 'default')
#   FAKE_CLAUDE_RC (exit code)
#   FAKE_CLAUDE_STDERR (stderr content)
#   FAKE_CLAUDE_LOG (path to file where each invocation is appended as JSON)
mock_claude_cli() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  cp "${RAFITA_TEST_HELPERS_DIR}/mock-claude.sh" "$bindir/claude"
  chmod +x "$bindir/claude"
  export PATH="$bindir:$PATH"
  export FAKE_CLAUDE_LOG="${ROOT_DIR_TEST}/_claude-invocations.log"
  : > "$FAKE_CLAUDE_LOG"
}

# Records a response. Usage: mock_claude_response <match_substring> <response_text>
# If match_substring is 'default', used when nothing else matches.
mock_claude_response() {
  local match="$1" resp="$2"
  local file="${FAKE_CLAUDE_RESPONSES:-${ROOT_DIR_TEST}/_claude-responses.txt}"
  export FAKE_CLAUDE_RESPONSES="$file"
  # Encode newlines as \n to keep one-line-per-entry.
  local encoded
  encoded=$(printf '%s' "$resp" | python3 -c "import sys; print(sys.stdin.read().replace('\\n','\\\\n'))")
  printf '%s|%s\n' "$match" "$encoded" >> "$file"
}

mock_claude_rate_limit_then_ok() {
  # First call returns rate limit, subsequent calls return the given response.
  local resp="$1"
  local file="${ROOT_DIR_TEST}/_claude-ratelimit.state"
  export FAKE_CLAUDE_RATELIMIT_STATE="$file"
  echo "0" > "$file"
  export FAKE_CLAUDE_RATELIMIT_UNTIL="$(date +%s)"
  mock_claude_response default "$resp"
}

# Installs a fake flowctl in the mock bindir.
mock_flowctl() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  cat > "$bindir/flowctl" << 'FCEOF'
#!/usr/bin/env bash
# Minimal flowctl mock driven by $FAKE_FLOWCTL_STATE (json file).
state="${FAKE_FLOWCTL_STATE:-/tmp/fake-flow-state.json}"
log="${FAKE_FLOWCTL_LOG:-/dev/null}"
echo "$(date -u +%s) $*" >> "$log"
if [[ ! -f "$state" ]]; then
  echo '{"epics":{},"tasks":{}}' > "$state"
fi
python3 - "$state" "$@" << 'PYEOF'
import json, sys, os, tempfile
state_path=sys.argv[1]
args=sys.argv[2:]
with open(state_path) as f: st=json.load(f)
cmd=args[0] if args else ""
json_out = "--json" in args
def save():
    with open(state_path,'w') as f: json.dump(st,f)

if cmd=="epics":
    epics=[{"id":eid,"title":e.get("title",""),"status":e.get("status","open"),"tasks":0,"done":0}
           for eid,e in st.get("epics",{}).items()]
    if json_out:
        print(json.dumps({"success":True,"epics":epics,"count":len(epics)}))
    else:
        for e in epics:
            if e["status"]=="open":
                print(f"[open] {e['id']}: {e['title']}")
elif cmd=="ready":
    epic=None
    if "--epic" in args:
        epic=args[args.index("--epic")+1]
    ready=[]
    for tid,t in st.get("tasks",{}).items():
        if epic and t.get("epic")!=epic: continue
        if t.get("status","ready")=="ready":
            ready.append({"id":tid,"title":t.get("title",""),"depends_on":[]})
    if json_out:
        print(json.dumps({"success":True,"epic":epic,"ready":ready,"in_progress":[],"blocked":[]}))
    else:
        if ready:
            print(f"{ready[0]['id']}\t{ready[0]['title']}")
elif cmd=="tasks":
    epic=None
    status=None
    if "--epic" in args:
        epic=args[args.index("--epic")+1]
    if "--status" in args:
        status=args[args.index("--status")+1]
    tasks=[]
    for tid,t in st.get("tasks",{}).items():
        if epic and t.get("epic")!=epic: continue
        if status and t.get("status","todo")!=status: continue
        tasks.append({"id":tid,"title":t.get("title",""),"status":t.get("status","todo"),"epic":t.get("epic","")})
    if json_out:
        print(json.dumps({"success":True,"tasks":tasks,"count":len(tasks)}))
    else:
        for t in tasks:
            print(f"[{t['status']}] {t['id']}: {t['title']}")
elif cmd=="show":
    # Drop the --json flag when picking the positional id.
    pos=[a for a in args[1:] if not a.startswith("--")]
    tid=pos[0] if pos else ""
    if tid in st.get("epics",{}):
        e=st.get("epics",{}).get(tid,{})
        if json_out:
            print(json.dumps({"success":True,"id":tid,"title":e.get("title",""),"status":e.get("status","open"),"branch_name":e.get("branch_name"),"depends_on_epics":e.get("depends_on_epics",[]),"tasks":[]}))
        else:
            print(e.get("title",""))
        sys.exit(0)
    t=st.get("tasks",{}).get(tid,{})
    if json_out:
        # Emit a flowctl-shaped object including spec_path pointing at a temp
        # markdown file so flowctl::task_spec can read it.
        spec=t.get("spec","")
        tmp_md=os.path.join(os.path.dirname(state_path), f"_spec_{tid}.md")
        with open(tmp_md,"w") as f: f.write(spec)
        out={"success":True,"id":tid,"title":t.get("title",""),
             "status":t.get("status","todo"),"epic":t.get("epic",""),
             "depends_on":[],"spec_path":tmp_md,"evidence":{}}
        print(json.dumps(out))
    else:
        print(t.get("spec",""))
elif cmd=="task-json":
    tid=args[1]
    t=st.get("tasks",{}).get(tid,{})
    print(json.dumps(t))
elif cmd=="start":
    pos=[a for a in args[1:] if not a.startswith("--")]
    tid=pos[0] if pos else ""
    if tid in st.get("tasks",{}):
        st["tasks"][tid]["status"]="in_progress"
        save()
elif cmd=="done":
    pos=[a for a in args[1:] if not a.startswith("--") and a not in ("--summary-file","--evidence-json")]
    # Skip values that follow known flag args.
    skip=False
    clean=[]
    for a in args[1:]:
        if skip:
            skip=False; continue
        if a in ("--summary-file","--evidence-json"):
            skip=True; continue
        if a.startswith("--"):
            continue
        clean.append(a)
    tid=clean[0] if clean else ""
    if tid in st.get("tasks",{}):
        st["tasks"][tid]["status"]="done"
        save()
elif cmd=="epic":
    sub=args[1] if len(args)>1 else ""
    if sub=="set-branch":
        clean=[]
        skip=False
        for a in args[2:]:
            if skip:
                skip=False; continue
            if a=="--branch":
                skip=True; continue
            if a.startswith("--"):
                continue
            clean.append(a)
        eid=clean[0] if clean else ""
        branch=args[args.index("--branch")+1] if "--branch" in args else ""
        if eid in st.get("epics",{}):
            st["epics"][eid]["branch_name"]=branch
            save()
        if json_out:
            print(json.dumps({"success":True,"id":eid,"branch_name":branch}))
    elif sub=="close":
        eid=args[2] if len(args)>2 else ""
        if eid in st.get("epics",{}):
            st["epics"][eid]["status"]="closed"
            save()
elif cmd=="close-epic":
    eid=args[1]
    if eid in st.get("epics",{}):
        st["epics"][eid]["status"]="closed"
        save()
elif cmd=="--help":
    print("fake flowctl")
else:
    pass
PYEOF
FCEOF
  chmod +x "$bindir/flowctl"
  export PATH="$bindir:$PATH"
  export FAKE_FLOWCTL_STATE="${ROOT_DIR_TEST}/_flow-state.json"
  export FAKE_FLOWCTL_LOG="${ROOT_DIR_TEST}/_flow.log"
  echo '{"epics":{},"tasks":{}}' > "$FAKE_FLOWCTL_STATE"
}

# Create epic/task in mock flow state. Usage: flow_add_task <epic> <task_id> <title> <spec>
flow_add_epic() {
  local eid="$1" title="$2"
  python3 - "$FAKE_FLOWCTL_STATE" "$eid" "$title" << 'PYEOF'
import json, sys
p=sys.argv[1]
with open(p) as f: st=json.load(f)
st.setdefault("epics",{})[sys.argv[2]]={"title":sys.argv[3],"status":"open","branch_name":None,"depends_on_epics":[]}
with open(p,'w') as f: json.dump(st,f)
PYEOF
}

flow_add_epic_dep() {
  local eid="$1" dep="$2"
  python3 - "$FAKE_FLOWCTL_STATE" "$eid" "$dep" << 'PYEOF'
import json, sys
p=sys.argv[1]
with open(p) as f: st=json.load(f)
e=st.setdefault("epics",{}).setdefault(sys.argv[2],{"title":"","status":"open","branch_name":None,"depends_on_epics":[]})
deps=e.setdefault("depends_on_epics",[])
if sys.argv[3] not in deps:
    deps.append(sys.argv[3])
with open(p,'w') as f: json.dump(st,f)
PYEOF
}

flow_set_task_status() {
  local tid="$1" status="$2"
  python3 - "$FAKE_FLOWCTL_STATE" "$tid" "$status" << 'PYEOF'
import json, sys
p=sys.argv[1]
with open(p) as f: st=json.load(f)
if sys.argv[2] in st.get("tasks",{}):
    st["tasks"][sys.argv[2]]["status"]=sys.argv[3]
with open(p,'w') as f: json.dump(st,f)
PYEOF
}

flow_add_task() {
  local eid="$1" tid="$2" title="$3" spec="$4"
  python3 - "$FAKE_FLOWCTL_STATE" "$eid" "$tid" "$title" "$spec" << 'PYEOF'
import json, sys
p=sys.argv[1]
with open(p) as f: st=json.load(f)
st.setdefault("tasks",{})[sys.argv[3]]={"epic":sys.argv[2],"title":sys.argv[4],"spec":sys.argv[5],"status":"ready"}
with open(p,'w') as f: json.dump(st,f)
PYEOF
}

# Mock gh / glab binaries that just log their calls.
mock_vcs_cli() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  for bin in gh glab; do
    cat > "$bindir/$bin" << EOF
#!/usr/bin/env bash
echo "\$(date -u +%s) $bin \$*" >> "${ROOT_DIR_TEST}/_vcs.log"
# 'pr view' returns empty + rc 1 (meaning "no PR exists yet") unless a
# previous 'pr create' was invoked, tracked via a sentinel file.
sentinel="${ROOT_DIR_TEST}/_vcs.pr_created"
if [[ "\$1" == "pr" && "\$2" == "view" ]]; then
  if [[ -f "\$sentinel" ]]; then
    echo "https://example.test/pr/1"
    exit 0
  fi
  exit 1
fi
if [[ "\$1" == "pr" && "\$2" == "create" ]]; then
  echo "https://example.test/pr/1"
  : > "\$sentinel"
  exit 0
fi
if [[ "\$1" == "mr" && "\$2" == "create" ]]; then
  echo "https://example.test/mr/1"
  : > "\$sentinel"
  exit 0
fi
exit 0
EOF
    chmod +x "$bindir/$bin"
  done
  export PATH="$bindir:$PATH"
  export VCS_LOG="${ROOT_DIR_TEST}/_vcs.log"
  : > "$VCS_LOG"
}
