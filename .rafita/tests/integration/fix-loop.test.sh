#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_fix_loop_round2_approves() {
  flow_add_epic "fn-400" "fixloop"
  flow_add_task "fn-400" "fn-400.1" "write v1 then fix" "create file and fix it"

  install_scripted_claude '
state="${REPO_ROOT}/_review_state"
[[ -f "$state" ]] || echo 0 > "$state"
n=$(<"$state")
if [[ "$prompt" == *"implementer"* && "$prompt" != *"aplicando fixes"* ]]; then
  # Initial DEV.
  echo "version one" > "${REPO_ROOT}/out.txt"
  echo "<done/>"
elif [[ "$prompt" == *"aplicando fixes"* ]]; then
  # Fix round.
  echo "version two fixed" > "${REPO_ROOT}/out.txt"
  echo "<done/>"
elif [[ "$prompt" == *"reviewer senior"* && "$prompt" != *"final-review"* ]]; then
  if (( n == 0 )); then
    echo 1 > "$state"
    echo "<review>{\"approved\":false,\"fixes\":[{\"file\":\"out.txt\",\"issue\":\"content needs fix\",\"suggestion\":\"rewrite\"}]}</review>"
  else
    echo "<review>{\"approved\":true,\"summary\":\"fixed\"}</review>"
  fi
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita fn-400
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"
  # Verify DEV was called twice (round 1 + round 2 fix).
  local inv
  inv=$(claude_invocations_matching "implementer")
  [[ "$inv" -ge 2 ]] || { echo "expected >=2 DEV invocations, got $inv" >&2; return 1; }
  # Final file content should be the fixed version.
  local content; content=$(cat "$ROOT_DIR_TEST/out.txt")
  assert_contains "$content" "fixed"
  # Exactly one commit for this task.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-400.1)" || true)
  assert_eq "1" "$commits"
}
