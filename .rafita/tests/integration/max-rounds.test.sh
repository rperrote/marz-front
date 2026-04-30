#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_max_rounds_preserves_changes_and_skips() {
  # Lower maxReviewRounds to 2 for speed.
  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["maxReviewRounds"] = 2
json.dump(d, open(p, "w"))
PY

  flow_add_epic "fn-700" "never-approve"
  flow_add_task "fn-700" "fn-700.1" "won't pass" "impossible"

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "draft" > "${REPO_ROOT}/wip.txt"
  echo "<done/>"
elif [[ "$prompt" == *"reviewer senior"* && "$prompt" != *"diff acumulado"* ]]; then
  echo "<review>{\"approved\":false,\"fixes\":[{\"file\":\"wip.txt\",\"issue\":\"bad\",\"suggestion\":\"redo\"}]}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita fn-700
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"
  # No commits for this task.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-700.1)" || true)
  assert_eq "0" "$commits"
  # Changes are preserved so the user can inspect or continue manually.
  assert_file_exists "$ROOT_DIR_TEST/wip.txt"
}
