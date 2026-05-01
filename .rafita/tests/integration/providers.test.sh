#!/usr/bin/env bash
# Integration: dev and reviewer can use distinct providers. Uses a mock
# `opencode` binary that tags its invocations so we can verify routing.

setup() { integration_setup; }
teardown() { integration_teardown; }

_install_opencode_mock() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  cat > "$bindir/opencode" << SHELL
#!/usr/bin/env bash
# opencode mock: records args, writes a file when asked to implement, emits
# an approved review verdict when prompted as reviewer.
prompt=""; model=""
shift || true  # consume "run"
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    --model) shift; model="\${1:-}" ;;
    --dangerously-skip-permissions) ;;
    --dir) shift ;;
    --*) shift; continue ;;
    *) prompt="\$prompt \$1" ;;
  esac
  shift || true
done
prompt="\${prompt# }"
python3 -c "import json,sys,time; print(json.dumps({'ts':int(time.time()),'provider':'opencode','model':sys.argv[1],'prompt':sys.argv[2][:4000]}))" "\$model" "\$prompt" >> "${ROOT_DIR_TEST}/_opencode-invocations.log"
if [[ "\$prompt" == *"implementer"* ]]; then
  echo "opencode-written" > "${ROOT_DIR_TEST}/oc_output.txt"
  echo "<done/>"
else
  echo "<done/>"
fi
exit 0
SHELL
  chmod +x "$bindir/opencode"
  : > "${ROOT_DIR_TEST}/_opencode-invocations.log"
  export OPENCODE_LOG="${ROOT_DIR_TEST}/_opencode-invocations.log"
}

_install_codex_mock() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  cat > "$bindir/codex" << SHELL
#!/usr/bin/env bash
model=""; output_last=""; json=0; prompt=""; session_arg=""; resume=0
if [[ "\${1:-}" == "exec" ]]; then shift; fi
if [[ "\${1:-}" == "resume" ]]; then resume=1; shift; fi
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    --model) shift; model="\${1:-}" ;;
    --output-last-message) shift; output_last="\${1:-}" ;;
    --json) json=1 ;;
    --sandbox|-s|--cd|-C|--add-dir) shift ;;
    --full-auto|--skip-git-repo-check|--dangerously-bypass-approvals-and-sandbox) ;;
    -) prompt="\$(cat)" ;;
    --*) ;;
    *)
      if [[ "\$resume" == "1" && -z "\$session_arg" ]]; then
        session_arg="\$1"
      else
        prompt="\$1"
      fi
      ;;
  esac
  shift || true
done
thread="\${session_arg:-019dd549-0000-7000-8000-000000000001}"
python3 -c "import json,sys,time; print(json.dumps({'ts':int(time.time()),'provider':'codex','model':sys.argv[1],'json':sys.argv[2]=='1','resume':sys.argv[3]=='1','session':sys.argv[4],'prompt':sys.argv[5][:4000]}))" "\$model" "\$json" "\$resume" "\$session_arg" "\$prompt" >> "${ROOT_DIR_TEST}/_codex-invocations.log"
if [[ "\$prompt" == *"implementer"* ]]; then
  echo "codex-written" > "${ROOT_DIR_TEST}/codex_provider_output.txt"
fi
response="<done/>"
if [[ -n "\$output_last" ]]; then printf '%s' "\$response" > "\$output_last"; fi
if [[ "\$json" == "1" ]]; then
  printf '{"type":"thread.started","thread_id":"%s"}\n' "\$thread"
  printf '{"type":"turn.started"}\n'
  printf '{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"%s"}}\n' "\$response"
  printf '{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":2,"reasoning_output_tokens":0}}\n'
else
  printf '%s\n' "\$response"
  printf 'session id: %s\n' "\$thread" >&2
fi
exit 0
SHELL
  chmod +x "$bindir/codex"
  : > "${ROOT_DIR_TEST}/_codex-invocations.log"
  export CODEX_LOG="${ROOT_DIR_TEST}/_codex-invocations.log"
}

test_dev_opencode_reviewer_claude() {
  _install_opencode_mock

  # Configure dev to use opencode; reviewer keeps claude.
  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["devProvider"] = "opencode"
d["reviewerProvider"] = "claude"
d["plannerProvider"] = "opencode"
d["devModel"] = "anthropic/claude-opus-4-6"
d["reviewerModel"] = "claude-sonnet-4-6"
json.dump(d, open(p, "w"))
PY

  flow_add_epic "fn-c00" "providers"
  flow_add_task "fn-c00" "fn-c00.1" "split providers" "implement"

  # Claude mock must approve review. Install an inline scripted claude.
  install_scripted_claude '
if [[ "$prompt" == *"code reviewer senior"* && "$prompt" != *"diff acumulado"* ]]; then
  echo "<review>{\"approved\":true,\"summary\":\"ok\"}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita fn-c00
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"

  # opencode was invoked for DEV (prompt contains "implementer")
  local oc_dev
  oc_dev=$(python3 - << 'PY'
import json, os
p = os.environ["OPENCODE_LOG"]
n = 0
with open(p) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        if "implementer" in d.get("prompt",""):
            n += 1
print(n)
PY
  )
  [[ "$oc_dev" -ge 1 ]] || { echo "expected >=1 DEV opencode call, got $oc_dev" >&2; return 1; }

  # claude was invoked for REVIEW
  local cl_rev
  cl_rev=$(python3 - << 'PY'
import json, os
p = os.environ["FAKE_CLAUDE_LOG"]
n = 0
with open(p) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        pr = d.get("prompt","")
        if "code reviewer senior" in pr and "diff acumulado" not in pr:
            n += 1
print(n)
PY
  )
  [[ "$cl_rev" -ge 1 ]] || { echo "expected >=1 REVIEW claude call, got $cl_rev" >&2; return 1; }

  # opencode should NOT have been asked to review
  local oc_rev
  oc_rev=$(python3 - << 'PY'
import json, os
p = os.environ["OPENCODE_LOG"]
n = 0
with open(p) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        if "reviewer senior" in d.get("prompt",""):
            n += 1
print(n)
PY
  )
  assert_eq "0" "$oc_rev"

  # Commit landed.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-c00.1)" || true)
  assert_eq "1" "$commits"
}

test_dev_codex_reviewer_claude() {
  _install_codex_mock

  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["devProvider"] = "codex"
d["reviewerProvider"] = "claude"
d["plannerProvider"] = "codex"
d["devModel"] = "gpt-5.5"
d["reviewerModel"] = "claude-sonnet-4-6"
json.dump(d, open(p, "w"))
PY

  flow_add_epic "fn-c02" "codex provider"
  flow_add_task "fn-c02" "fn-c02.1" "codex dev works" "implement"

  install_scripted_claude '
if [[ "$prompt" == *"code reviewer senior"* && "$prompt" != *"diff acumulado"* ]]; then
  echo "<review>{\"approved\":true,\"summary\":\"ok\"}</review>"
elif [[ "$prompt" == *"final-review"* || "$prompt" == *"diff acumulado"* ]]; then
  echo "<final-review>{\"status\":\"pass\",\"issues\":[],\"summary\":\"ok\"}</final-review>"
else
  echo "<done/>"
fi
exit 0
'

  run_rafita fn-c02
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"

  local cx_dev
  cx_dev=$(python3 - << 'PY'
import json, os
p = os.environ["CODEX_LOG"]
n = 0
with open(p) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        if "implementer" in d.get("prompt",""):
            n += 1
print(n)
PY
  )
  [[ "$cx_dev" -ge 1 ]] || { echo "expected >=1 DEV codex call, got $cx_dev" >&2; return 1; }

  local cl_rev
  cl_rev=$(python3 - << 'PY'
import json, os
p = os.environ["FAKE_CLAUDE_LOG"]
n = 0
with open(p) as f:
    for line in f:
        try: d = json.loads(line)
        except: continue
        pr = d.get("prompt","")
        if "code reviewer senior" in pr and "diff acumulado" not in pr:
            n += 1
print(n)
PY
  )
  [[ "$cl_rev" -ge 1 ]] || { echo "expected >=1 REVIEW claude call, got $cl_rev" >&2; return 1; }

  local commits; commits=$(git log --format=%s | grep -c "feat(fn-c02.1)" || true)
  assert_eq "1" "$commits"
}

test_both_claude_still_works() {
  # Default config: dev and reviewer both claude. Should match pre-existing
  # happy path. Regression check.
  flow_add_epic "fn-c01" "regress"
  flow_add_task "fn-c01" "fn-c01.1" "still works" "do it"
  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  echo "x" > "${REPO_ROOT}/still.txt"
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
  run_rafita fn-c01
  assert_eq "0" "$INT_RC" "stderr: ${INT_STDERR:0:400}"
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-c01.1)" || true)
  assert_eq "1" "$commits"
}
