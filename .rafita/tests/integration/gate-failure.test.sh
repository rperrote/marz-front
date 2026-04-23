#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

# Helper to install a profile with a failing test gate.
_install_failing_gate_profile() {
  cat > "$RAFITA_DIR/profiles/withgate.md" << PF
## DEV Rules
- be good

## DEV Fix Rules
- apply fixes

## Review Rules
- [ ] fine

## Plan Rules
(none)

## Format Command
(none)

## Test Command
bash -c 'echo "TEST_FAIL_MARKER"; exit 1'

## Lint Command
(none)

## Typecheck Command
(none)

## Skills
(none)

## Forbidden Paths
.env
.rafita/**
PF
  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["projectType"] = "withgate"
d["maxReviewRounds"] = 2
json.dump(d, open(p, "w"))
PY
}

test_gate_failure_skips_llm_review() {
  _install_failing_gate_profile
  flow_add_epic "fn-500" "gatefail"
  flow_add_task "fn-500" "fn-500.1" "try something" "dummy"

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "code" > "${REPO_ROOT}/code.txt"
  echo "<done/>"
elif [[ "$prompt" == *"reviewer senior"* ]]; then
  echo "<review>{\"approved\":true,\"summary\":\"never called!\"}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita fn-500
  # rafita itself must not fail hard even though the task is skipped.
  assert_eq "0" "$INT_RC" "rafita must exit 0 (stderr: ${INT_STDERR:0:400})"
  # The LLM reviewer must NOT have been called at all.
  local reviewer_calls; reviewer_calls=$(claude_invocations_matching "reviewer senior")
  # Allow final-review, but per-task review should be 0.
  local per_task_review
  per_task_review=$(python3 - << 'PY'
import json, os
log = os.environ["FAKE_CLAUDE_LOG"]
n = 0
with open(log) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        p = d.get("prompt","")
        if "reviewer senior" in p and "diff acumulado" not in p and "final-review" not in p:
            n += 1
print(n)
PY
  )
  assert_eq "0" "$per_task_review"
  # Task did NOT get a commit.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-500.1)" || true)
  assert_eq "0" "$commits"
}
