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

flowctl::in_progress_task_id() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" tasks --epic "$epic" --status in_progress --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
tasks = d.get("tasks") or []
if tasks:
    print(tasks[0].get("id",""))
'
}

flowctl::in_progress_task_title() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" tasks --epic "$epic" --status in_progress --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
tasks = d.get("tasks") or []
if tasks:
    print(tasks[0].get("title",""))
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
        content = f.read()
    # Strip YAML frontmatter (--- ... ---) — metadata like `satisfies` is
    # traceability for humans, not actionable context for the agent.
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            content = content[end + 3:].lstrip("\n")
    sys.stdout.write(content)
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

# CSV of epic ids this epic depends on. Empty if none. Used by
# git::setup_epic_branch to base the new branch on its dependency branches
# instead of plain prBase, so dependent epics see each other's code without
# waiting for the previous PR to merge.
flowctl::epic_depends_on() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" show "$epic" --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
deps = d.get("depends_on_epics") or []
print(",".join(deps))
'
}

flowctl::epic_branch_name() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" show "$epic" --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
print(d.get("branch_name") or "")
'
}

flowctl::set_epic_branch() {
  local epic="$1" branch="$2"
  local bin; bin=$(flowctl::_bin)
  local out rc=0
  out=$("$bin" epic set-branch "$epic" --branch "$branch" --json 2>&1) || rc=$?
  if [[ $rc -ne 0 ]]; then
    common::log WARN "flowctl epic set-branch ${epic} failed (rc=${rc}): ${out}"
  fi
}

# CSV of task ids in an epic with status=done. Used by --closer-only to
# reconstruct the task list rafita would have built incrementally.
flowctl::done_tasks_csv() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  "$bin" tasks --epic "$epic" --status done --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
ids = [t.get("id","") for t in (d.get("tasks") or []) if t.get("id")]
print(",".join(ids))
'
}

flowctl::start_task() {
  local task="$1"
  local bin; bin=$(flowctl::_bin)
  local out rc=0
  out=$("$bin" start "$task" 2>&1) || rc=$?
  if [[ $rc -ne 0 ]]; then
    common::log WARN "flowctl start ${task} failed (rc=${rc}): ${out}"
  fi
}

flowctl::done_task() {
  local task="$1" summary="${2:-}" evidence="${3:-}"
  local bin; bin=$(flowctl::_bin)
  local args=(done "$task")
  if [[ -n "$summary" ]]; then args+=(--summary-file "$summary"); fi
  if [[ -n "$evidence" ]]; then args+=(--evidence-json "$evidence"); fi
  local out rc=0
  out=$("${bin}" "${args[@]}" 2>&1) || rc=$?
  if [[ $rc -ne 0 ]]; then
    common::log WARN "flowctl done ${task} failed (rc=${rc}): ${out}"
  fi
}

flowctl::close_epic() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  local out rc=0
  out=$("$bin" epic close "$epic" 2>&1) || rc=$?
  if [[ $rc -ne 0 ]]; then
    common::log WARN "flowctl close ${epic} failed (rc=${rc}): ${out}"
  fi
}

# Path of the runtime state directory (where claims/locks live). Empty if
# state-path is not supported by this flowctl version.
flowctl::state_dir() {
  local bin; bin=$(flowctl::_bin)
  "$bin" state-path 2>/dev/null || true
}

# Current actor as flowctl sees it (used to filter "my" claims). Falls back
# to git user.email — that's what flowctl itself uses when the JSON status
# does not surface an explicit actor field.
flowctl::actor() {
  local bin; bin=$(flowctl::_bin)
  local a
  a=$("$bin" status --json 2>/dev/null | python3 -c '
import json, sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
print(d.get("actor","") or "")
' 2>/dev/null)
  if [[ -z "$a" ]]; then
    a=$(git config user.email 2>/dev/null || true)
  fi
  printf '%s' "$a"
}

# Per-epic state summary as TSV: ready<TAB>in_progress<TAB>blocked<TAB>todo<TAB>done<TAB>total
# Counts come from `tasks --epic` (definition) and `ready --epic` (runtime view).
flowctl::epic_state_summary() {
  local epic="$1"
  local bin; bin=$(flowctl::_bin)
  local tasks_json ready_json
  tasks_json=$("$bin" tasks --epic "$epic" --json 2>/dev/null || echo '{}')
  ready_json=$("$bin" ready --epic "$epic" --json 2>/dev/null || echo '{}')
  python3 - "$tasks_json" "$ready_json" << 'PYEOF'
import json, sys
try: tj = json.loads(sys.argv[1])
except Exception: tj = {}
try: rj = json.loads(sys.argv[2])
except Exception: rj = {}
tasks = tj.get("tasks") or []
total = len(tasks)
done = sum(1 for t in tasks if t.get("status") == "done")
todo = sum(1 for t in tasks if t.get("status") == "todo")
ip = sum(1 for t in tasks if t.get("status") == "in_progress")
ready = len(rj.get("ready") or [])
blocked = len(rj.get("blocked") or [])
print(f"{ready}\t{ip}\t{blocked}\t{todo}\t{done}\t{total}")
PYEOF
}

# Emit one TSV line per stale in-progress task claimed by the current actor:
# task_id<TAB>epic_id<TAB>title<TAB>claimed_at<TAB>age_minutes
# Threshold: claims older than $1 minutes (default 30).
flowctl::stale_in_progress() {
  local threshold_min="${1:-30}"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" || ! -d "$state_dir/tasks" ]] && return 0
  local actor; actor=$(flowctl::actor)
  python3 - "$state_dir" "$actor" "$threshold_min" << 'PYEOF'
import json, os, sys
from datetime import datetime, timezone
state_dir, actor, thr = sys.argv[1], sys.argv[2], int(sys.argv[3])
now = datetime.now(timezone.utc)
tasks_dir = os.path.join(state_dir, "tasks")
locks_dir = os.path.join(state_dir, "locks")
if not os.path.isdir(tasks_dir): sys.exit(0)

# Build the set of epics with a live rafita-lock (PID alive). Claims for
# tasks of those epics are considered active, not stale.
live_epics = set()
if os.path.isdir(locks_dir):
    for ln in os.listdir(locks_dir):
        if not ln.endswith(".rafita.lock"): continue
        try:
            payload = json.load(open(os.path.join(locks_dir, ln)))
        except Exception:
            continue
        pid = payload.get("pid")
        epic = payload.get("epic")
        if not (pid and epic): continue
        # PID alive? signal 0 raises OSError if not.
        try:
            os.kill(int(pid), 0)
            live_epics.add(epic)
        except (OSError, ValueError):
            pass

for fn in sorted(os.listdir(tasks_dir)):
    if not fn.endswith(".state.json"): continue
    tid = fn[:-len(".state.json")]
    try:
        d = json.load(open(os.path.join(tasks_dir, fn)))
    except Exception:
        continue
    if d.get("status") != "in_progress": continue
    if actor and d.get("assignee") and d.get("assignee") != actor: continue
    epic = tid.rsplit(".", 1)[0] if "." in tid else tid
    if epic in live_epics: continue  # active run owns this claim
    ca = d.get("claimed_at") or ""
    age = -1
    if ca:
        try:
            t = datetime.fromisoformat(ca.replace("Z","+00:00"))
            age = int((now - t).total_seconds() // 60)
        except Exception: pass
    if age < thr and age >= 0: continue
    title = d.get("title","") or ""
    print(f"{tid}\t{epic}\t{title}\t{ca}\t{age}")
PYEOF
}

# Acquire a rafita-lock for an epic. Writes pid/epic/worktree/started_at as
# JSON to <state>/locks/<epic>.rafita.lock. Returns 0 on success, 1 if a live
# lock from another worktree already holds the epic.
flowctl::acquire_epic_lock() {
  local epic="$1"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" ]] && return 0  # no state-dir, no locking possible
  mkdir -p "$state_dir/locks"
  local f="$state_dir/locks/${epic}.rafita.lock"
  if [[ -f "$f" ]]; then
    local existing_pid existing_wt
    existing_pid=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("pid",""))' "$f" 2>/dev/null || true)
    existing_wt=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("worktree",""))' "$f" 2>/dev/null || true)
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      common::log WARN "epic ${epic} is already locked by rafita pid=${existing_pid} (worktree: ${existing_wt})"
      return 1
    fi
    common::log INFO "removing stale rafita-lock for ${epic} (pid=${existing_pid:-?} not alive)"
    rm -f "$f"
  fi
  local wt; wt=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  local started; started=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  python3 -c 'import json,sys;json.dump({"pid":int(sys.argv[1]),"epic":sys.argv[2],"worktree":sys.argv[3],"started_at":sys.argv[4],"run_id":sys.argv[5]}, open(sys.argv[6],"w"))' \
    "$$" "$epic" "$wt" "$started" "${RAFITA_RUN_ID:-}" "$f"
  return 0
}

flowctl::release_epic_lock() {
  local epic="$1"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" ]] && return 0
  rm -f "$state_dir/locks/${epic}.rafita.lock"
}

# Emit one TSV line per lock file older than $1 minutes (default 60):
# lock_filename<TAB>age_minutes
flowctl::stale_locks() {
  local threshold_min="${1:-60}"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" || ! -d "$state_dir/locks" ]] && return 0
  python3 - "$state_dir" "$threshold_min" << 'PYEOF'
import json, os, sys, time
state_dir, thr = sys.argv[1], int(sys.argv[2])
locks_dir = os.path.join(state_dir, "locks")
if not os.path.isdir(locks_dir): sys.exit(0)
now = time.time()
for fn in sorted(os.listdir(locks_dir)):
    p = os.path.join(locks_dir, fn)
    # Skip live rafita-locks (the wizard reports those separately if needed).
    if fn.endswith(".rafita.lock"):
        try:
            payload = json.load(open(p))
            pid = int(payload.get("pid", 0))
            if pid:
                try:
                    os.kill(pid, 0)
                    continue  # alive — not stale
                except OSError:
                    pass
        except Exception:
            pass
    try: mt = os.path.getmtime(p)
    except Exception: continue
    age = int((now - mt) // 60)
    if age < thr: continue
    print(f"{fn}\t{age}")
PYEOF
}

# Release a stuck claim by deleting its state file. Returns 0 if removed,
# 1 if not found. Safe: only removes the runtime state, not the task itself.
flowctl::release_claim() {
  local task="$1"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" ]] && { common::log WARN "no state-dir; cannot release ${task}"; return 1; }
  local f="$state_dir/tasks/${task}.state.json"
  if [[ -f "$f" ]]; then
    rm -f "$f"
    common::log INFO "released stuck claim: ${task}"
    return 0
  fi
  return 1
}

# Remove a stale lock file by name.
flowctl::remove_lock() {
  local lock="$1"
  local state_dir; state_dir=$(flowctl::state_dir)
  [[ -z "$state_dir" ]] && return 1
  local f="$state_dir/locks/${lock}"
  [[ -f "$f" ]] && rm -f "$f" && common::log INFO "removed stale lock: ${lock}"
}

# True (rc=0) if epic has tasks and all are done. Empty epics return 1.
flowctl::epic_all_done() {
  local epic="$1"
  local s; s=$(flowctl::epic_state_summary "$epic")
  [[ -z "$s" ]] && return 1
  local total done
  total=$(printf '%s' "$s" | cut -f6)
  done=$(printf '%s' "$s" | cut -f5)
  [[ "$total" -gt 0 && "$total" == "$done" ]]
}

# True (rc=0) if epic has zero tasks.
flowctl::epic_empty() {
  local epic="$1"
  local s; s=$(flowctl::epic_state_summary "$epic")
  [[ -z "$s" ]] && return 1
  local total; total=$(printf '%s' "$s" | cut -f6)
  [[ "$total" == "0" ]]
}

# True (rc=0) if epic is "stuck": no ready, no in_progress, but has todo/blocked.
# Indicates a broken dep graph or an orphan claim that flowctl ready ignored.
flowctl::epic_stuck() {
  local epic="$1"
  local s; s=$(flowctl::epic_state_summary "$epic")
  [[ -z "$s" ]] && return 1
  local ready ip blocked todo
  ready=$(printf '%s' "$s" | cut -f1)
  ip=$(printf '%s' "$s" | cut -f2)
  blocked=$(printf '%s' "$s" | cut -f3)
  todo=$(printf '%s' "$s" | cut -f4)
  [[ "$ready" == "0" && "$ip" == "0" && $((blocked + todo)) -gt 0 ]]
}
