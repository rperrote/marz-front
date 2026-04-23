#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_resume_picks_up_pending_task() {
  flow_add_epic "fn-900" "resume"
  flow_add_task "fn-900" "fn-900.1" "task" "the task"

  # Simulate a prior run that crashed mid-task: manually write state.json.
  local snap; snap=$(git rev-parse HEAD)
  cat > "$RAFITA_DIR/state.json" << JSON
{
  "run_id": "prior-run",
  "epic_id": "fn-900",
  "task_id": "fn-900.1",
  "round": 0,
  "phase": "dev",
  "branch": "main",
  "snapshot_sha": "$snap",
  "completed_tasks": [],
  "saved_at": "2026-01-01T00:00:00Z"
}
JSON

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "resumed" > "${REPO_ROOT}/resumed.txt"
  echo "<done/>"
elif [[ "$prompt" == *"reviewer senior"* && "$prompt" != *"diff acumulado"* ]]; then
  echo "<review>{\"approved\":true,\"summary\":\"ok\"}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita --resume
  assert_eq "0" "$INT_RC" "rafita --resume must succeed (stderr: ${INT_STDERR:0:400})"
  # After successful completion, state.json is cleared.
  assert_file_not_exists "$RAFITA_DIR/state.json"
  # The resumed task produced its commit.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-900.1)" || true)
  assert_eq "1" "$commits"
  assert_file_exists "$ROOT_DIR_TEST/resumed.txt"
}

test_resume_without_state_fails_gracefully() {
  run_rafita --resume
  # No state → script should fail with a clear error.
  assert_ne "0" "$INT_RC" "expected failure without state"
  assert_contains "$INT_STDERR" "no state.json" "$INT_STDERR"
}

test_reset_clears_state() {
  local snap; snap=$(git rev-parse HEAD)
  cat > "$RAFITA_DIR/state.json" << JSON
{"run_id":"x","epic_id":"fn-999","task_id":"fn-999.1","round":0,"phase":"dev","branch":"main","snapshot_sha":"$snap","completed_tasks":[],"saved_at":"2026-01-01T00:00:00Z"}
JSON
  # flowctl has no matching task, so rafita will report nothing to do but
  # --reset must clear state before even looking for work.
  run_rafita --reset
  assert_file_not_exists "$RAFITA_DIR/state.json"
}
