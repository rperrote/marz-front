#!/usr/bin/env bash
# state.sh — durable checkpoint for --resume after crash. Persists a tiny
# JSON to .rafita/state.json using atomic write (tmp+rename).

state::_path() {
  printf '%s/state.json' "${RAFITA_DIR:-.rafita}"
}

# state::save_checkpoint epic_id task_id round phase branch snapshot_sha completed_csv
state::save_checkpoint() {
  local epic="${1:-}" task="${2:-}" round="${3:-0}" phase="${4:-}" \
        branch="${5:-}" snap="${6:-}" completed="${7:-}"
  local path; path=$(state::_path)
  local tmp="${path}.tmp.$$"
  mkdir -p "$(dirname "$path")"
  python3 - "$tmp" "$RAFITA_RUN_ID" "$epic" "$task" "$round" "$phase" "$branch" "$snap" "$completed" << 'PYEOF'
import json, sys, os, time
(tmp, run_id, epic, task, rnd, phase, branch, snap, comp) = sys.argv[1:]
rnd = int(rnd) if rnd.isdigit() else 0
completed = [c for c in comp.split(",") if c]
data = {
  "run_id": run_id,
  "epic_id": epic,
  "task_id": task,
  "round": rnd,
  "phase": phase,
  "branch": branch,
  "snapshot_sha": snap,
  "completed_tasks": completed,
  "saved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
with open(tmp, "w") as f:
    json.dump(data, f)
PYEOF
  mv -f "$tmp" "$path"
}

# state::load_checkpoint → prints JSON or empty. rc 0 either way.
state::load_checkpoint() {
  local path; path=$(state::_path)
  [[ -f "$path" ]] || { printf ''; return 0; }
  # Validate JSON; on corruption, print empty.
  python3 - "$path" << 'PYEOF' 2>/dev/null || true
import json, sys
try:
    with open(sys.argv[1]) as f:
        d = json.load(f)
    print(json.dumps(d))
except Exception:
    print("")
PYEOF
}

state::has_checkpoint() {
  local json; json=$(state::load_checkpoint)
  [[ -n "$json" ]]
}

state::clear() {
  local path; path=$(state::_path)
  rm -f "$path"
}

# Extract a field from the persisted state. rc 0 if present.
state::field() {
  local field="$1"
  local json; json=$(state::load_checkpoint)
  [[ -z "$json" ]] && return 1
  common::json_get "$json" "$field"
}
