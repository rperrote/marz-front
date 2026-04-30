#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_continue_finishes_in_progress_task_then_runs_ready_queue() {
  flow_add_epic "fn-900" "continue"
  flow_add_task "fn-900" "fn-900.1" "partial task" "finish partial work"
  flow_add_task "fn-900" "fn-900.2" "next task" "normal next work"
  flow_set_task_status "fn-900.1" "in_progress"

  echo "partial" > "${ROOT_DIR_TEST}/continued.txt"

  install_scripted_claude '
if [[ "$prompt" == *"retomando una task"* ]]; then
  echo "continued" >> "${REPO_ROOT}/continued.txt"
  echo "<done/>"
elif [[ "$prompt" == *"implementer senior"* ]]; then
  echo "normal" > "${REPO_ROOT}/normal.txt"
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

  run_rafita fn-900 --continue
  assert_eq "0" "$INT_RC" "rafita --continue must succeed (stderr: ${INT_STDERR:0:400})"
  assert_file_exists "$ROOT_DIR_TEST/continued.txt"
  assert_file_exists "$ROOT_DIR_TEST/normal.txt"
  assert_contains "$(cat "$ROOT_DIR_TEST/continued.txt")" "continued"

  local cont_prompts normal_prompts
  cont_prompts=$(claude_invocations_matching "retomando una task")
  normal_prompts=$(claude_invocations_matching "Sos un implementer senior. Tu trabajo es implementar")
  assert_eq "1" "$cont_prompts" "continue prompt should be used once"
  assert_eq "1" "$normal_prompts" "normal prompt should be used for the ready task"
}

test_continue_without_in_progress_task_fails() {
  flow_add_epic "fn-901" "continue"
  flow_add_task "fn-901" "fn-901.1" "ready task" "ready work"

  run_rafita fn-901 --continue
  assert_ne "0" "$INT_RC" "expected failure without in-progress task"
  assert_contains "$INT_STDERR" "no in-progress task"
}
