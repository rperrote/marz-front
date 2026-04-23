#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_forbidden_path_not_committed() {
  flow_add_epic "fn-600" "forbid"
  flow_add_task "fn-600" "fn-600.1" "try to add .env" "bad idea"

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "SECRET=hunter2" > "${REPO_ROOT}/.env"
  echo "ok" > "${REPO_ROOT}/app.txt"
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

  run_rafita fn-600
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"
  # The commit must contain app.txt but NOT .env.
  local files; files=$(git log -1 --name-only --pretty=format: | sort -u | grep -v '^$' | tr '\n' ' ')
  assert_contains "$files" "app.txt"
  assert_not_contains "$files" ".env"
  # .env still exists on disk (we don't delete it; just skip from commit).
  assert_file_exists "$ROOT_DIR_TEST/.env"
}
