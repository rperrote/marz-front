#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_models_dev_and_reviewer_distinct() {
  flow_add_epic "fn-a00" "models"
  flow_add_task "fn-a00" "fn-a00.1" "task" "spec"

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "x" > "${REPO_ROOT}/y.txt"
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
  run_rafita fn-a00
  assert_eq "0" "$INT_RC" "rafita must succeed"

  # Inspect the claude invocation log. The DEV call must use devModel, the
  # REVIEW call must use reviewerModel.
  local dev_model_ok rev_model_ok
  dev_model_ok=$(python3 - << 'PY'
import json, os
log = os.environ["FAKE_CLAUDE_LOG"]
ok = 0
with open(log) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        if "implementer" in d.get("prompt","") and d.get("model") == "claude-opus-4-6":
            ok += 1
print(ok)
PY
  )
  rev_model_ok=$(python3 - << 'PY'
import json, os
log = os.environ["FAKE_CLAUDE_LOG"]
ok = 0
with open(log) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        p = d.get("prompt","")
        if ("reviewer senior" in p) and "diff acumulado" not in p and d.get("model") == "claude-sonnet-4-6":
            ok += 1
print(ok)
PY
  )
  [[ "$dev_model_ok" -ge 1 ]] || { echo "expected DEV call with claude-opus-4-6" >&2; return 1; }
  [[ "$rev_model_ok" -ge 1 ]] || { echo "expected REVIEW call with claude-sonnet-4-6" >&2; return 1; }
}

test_models_passthrough_ids() {
  # Override both models to raw IDs.
  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["devModel"] = "claude-opus-4-7"
d["reviewerModel"] = "claude-haiku-4-5"
json.dump(d, open(p, "w"))
PY

  flow_add_epic "fn-a01" "models-raw"
  flow_add_task "fn-a01" "fn-a01.1" "task" "spec"

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "z" > "${REPO_ROOT}/z.txt"
  echo "<done/>"
elif [[ "$prompt" == *"reviewer senior"* && "$prompt" != *"diff acumulado"* ]]; then
  echo "<review>{\"approved\":true,\"summary\":\"ok\"}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
fi
exit 0
'
  run_rafita fn-a01
  assert_eq "0" "$INT_RC"
  local used_opus7 used_haiku
  used_opus7=$(python3 -c "
import json, os
log = os.environ['FAKE_CLAUDE_LOG']
print(sum(1 for line in open(log) if 'claude-opus-4-7' in line))")
  used_haiku=$(python3 -c "
import json, os
log = os.environ['FAKE_CLAUDE_LOG']
print(sum(1 for line in open(log) if 'claude-haiku-4-5' in line))")
  [[ "$used_opus7" -ge 1 ]] || { echo "opus-4-7 not used" >&2; return 1; }
  [[ "$used_haiku" -ge 1 ]] || { echo "haiku-4-5 not used" >&2; return 1; }
}
