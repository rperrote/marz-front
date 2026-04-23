#!/usr/bin/env bash
# quality.sh — objective gates (lint, typecheck, tests) from the profile.
# On first failure, emits a verdict-shaped JSON compatible with review::.

# quality::run_gates <task_id> <round>
# stdout: JSON verdict (only on failure) matching review shape.
# rc 0 if all pass (or no gates configured); rc 1 if any gate failed.
quality::run_gates() {
  local task_id="$1" round="$2"
  local dir; dir=$(common::task_artifact_dir "$task_id")
  local any_ran=0
  while IFS=$'\t' read -r name cmd; do
    [[ -z "$name" || -z "$cmd" ]] && continue
    any_ran=1
    local log="$dir/gate-${name}-round-${round}.log"
    common::log INFO "quality: running ${name}: ${cmd}"
    # Capture output; use eval to honor profile-defined commands which are
    # part of the user's explicit contract (see §3).
    local rc
    ( eval "$cmd" ) >"$log" 2>&1
    rc=$?
    if [[ $rc -ne 0 ]]; then
      common::log WARN "quality gate '${name}' failed (rc=$rc)"
      # Tail the log so the fix block stays small but informative.
      local tail
      tail=$(tail -n 80 "$log" 2>/dev/null)
      quality::_verdict_from_failure "$name" "$cmd" "$tail"
      return 1
    fi
    common::log INFO "quality gate '${name}' passed"
  done < <(config::gate_commands)
  if [[ $any_ran -eq 0 ]]; then
    common::log INFO "quality: no gates configured"
  fi
  return 0
}

quality::_verdict_from_failure() {
  local gate="$1" cmd="$2" output="$3"
  python3 - "$gate" "$cmd" "$output" << 'PYEOF'
import json, sys
gate, cmd, output = sys.argv[1], sys.argv[2], sys.argv[3]
verdict = {
  "approved": False,
  "fixes": [{
    "file": "(quality gate)",
    "issue": f"{gate} failed running: {cmd}",
    "suggestion": output[:3000],
    "fixed": False,
  }],
  "summary": f"quality gate '{gate}' failed",
  "source": "quality_gate",
}
print(json.dumps(verdict))
PYEOF
}
