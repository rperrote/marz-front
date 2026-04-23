#!/usr/bin/env bash
# resume-task.sh — rebuild .rafita/state.json to resume a specific in-progress task.
# Usage: resume-task.sh --task fn-1.3 [--round N] [--phase dev] [--run-id ID]

set -euo pipefail

RAFITA_DIR="${RAFITA_DIR:-.rafita}"
FLOWCTL="${RAFITA_FLOWCTL:-.flow/bin/flowctl}"

task_id=""
round="0"
phase="start"
run_id=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task) task_id="$2"; shift 2 ;;
    --round) round="$2"; shift 2 ;;
    --phase) phase="$2"; shift 2 ;;
    --run-id) run_id="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 --task <task_id> [--round N] [--phase <phase>] [--run-id ID]"
      exit 0
      ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac
done

[[ -z "$task_id" ]] && { echo "Usage: $0 --task <task_id>"; exit 2; }

# Infer epic from task id (fn-1.3 -> fn-1)
epic_id="${task_id%.*}"

# Current branch
branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD)

# Snapshot (current HEAD)
snapshot=$(git rev-parse HEAD)

# Run id: reuse the most recent run dir if available, else generate new.
if [[ -z "$run_id" ]]; then
  # Try previous state.json
  if [[ -f "$RAFITA_DIR/state.json" ]]; then
    run_id=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("run_id",""))' "$RAFITA_DIR/state.json" 2>/dev/null || true)
  fi
  # Fallback: newest run directory
  if [[ -z "$run_id" ]]; then
    latest_run=$(ls -t "$RAFITA_DIR/runs/" 2>/dev/null | head -n 1 || true)
    if [[ -n "$latest_run" && -d "$RAFITA_DIR/runs/$latest_run" ]]; then
      run_id="$latest_run"
    fi
  fi
  # Last resort: generate new
  if [[ -z "$run_id" ]]; then
    run_id="$(date -u +"%Y%m%dT%H%M%SZ")-manual-$$"
  fi
fi

# Gather already-done tasks for this epic
completed=""
if command -v "$FLOWCTL" >/dev/null 2>&1; then
  tasks_json=$("$FLOWCTL" tasks --epic "$epic_id" --json 2>/dev/null || true)
  if [[ -n "$tasks_json" ]]; then
    py_tmp=$(mktemp)
    cat > "$py_tmp" << 'PYEOF'
import json, sys, re
try:
    data = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
tasks = data.get("tasks", data.get("ready", []))
epic = sys.argv[1]
done = []
for t in tasks:
    if t.get("status") == "done":
        tid = t.get("id", "")
        if re.match(rf"^{re.escape(epic)}\.\\d+$", tid):
            done.append(tid)
print(",".join(done))
PYEOF
    completed=$(printf '%s' "$tasks_json" | python3 "$py_tmp" "$epic_id")
    rm -f "$py_tmp"
  fi
fi

# Claim task in flowctl (idempotent if already claimed)
"$FLOWCTL" start "$task_id" >/dev/null 2>&1 || true

# Write state.json
mkdir -p "$RAFITA_DIR"
py_tmp=$(mktemp)
cat > "$py_tmp" << 'PYEOF'
import json, sys, os, time
path, run_id, epic, task, rnd, phase, branch, snap, comp = sys.argv[1:]
data = {
    "run_id": run_id,
    "epic_id": epic,
    "task_id": task,
    "round": int(rnd) if rnd.isdigit() else 0,
    "phase": phase,
    "branch": branch,
    "snapshot_sha": snap,
    "completed_tasks": [c for c in comp.split(",") if c],
    "saved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
with open(path, "w") as f:
    json.dump(data, f, indent=2)
print("state written to", path)
print("  epic=" + epic + " task=" + task + " round=" + rnd + " phase=" + phase)
print("  resume with: rafita.sh --resume")
PYEOF
python3 "$py_tmp" "$RAFITA_DIR/state.json" "$run_id" "$epic_id" "$task_id" "$round" "$phase" "$branch" "$snapshot" "$completed"
rm -f "$py_tmp"
