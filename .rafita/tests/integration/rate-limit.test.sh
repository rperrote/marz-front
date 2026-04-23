#!/usr/bin/env bash
setup() { integration_setup; }
teardown() { integration_teardown; }

test_rate_limit_retry_then_success() {
  flow_add_epic "fn-800" "rate"
  flow_add_task "fn-800" "fn-800.1" "task with RL" "do it"

  # Scripted claude: first DEV call returns rate limit; subsequent calls succeed.
  local state_file="${ROOT_DIR_TEST}/_rl_counter"
  echo "0" > "$state_file"

  install_scripted_claude '
cnt_file="${REPO_ROOT}/_rl_counter"
n=$(<"$cnt_file")
if [[ "$prompt" == *"implementer"* && $n -eq 0 ]]; then
  echo $((n+1)) > "$cnt_file"
  # Rate-limit message aimed at a very near-future reset (2s ahead).
  ts=$(( $(date +%s) + 2 ))
  hm=$(python3 -c "import time,sys; print(time.strftime(\"%I:%M%p\", time.localtime(int(sys.argv[1]))).lower())" "$ts")
  echo "You'\''ve hit your usage limit. It resets at $hm." >&2
  exit 1
elif [[ "$prompt" == *"implementer"* ]]; then
  echo "final" > "${REPO_ROOT}/res.txt"
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

  # Shorten the rate-limit sleep window by lowering the cap. (claude::run
  # enforces >= 60s; we accept that one sleep happens.)
  # To keep the test fast, we stub `sleep` inside the subshell rafita spawns.
  # Easiest: use a wrapper script that ignores sleep args > 1.
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  cat > "$bindir/sleep" << 'SH'
#!/usr/bin/env bash
# Cap any sleep to 1s in tests.
sec="${1:-0}"
int=${sec%.*}
if [[ "$int" =~ ^[0-9]+$ ]] && (( int > 1 )); then
  exec /bin/sleep 1
fi
exec /bin/sleep "$sec"
SH
  chmod +x "$bindir/sleep"

  run_rafita fn-800
  assert_eq "0" "$INT_RC" "rafita must succeed (stderr: ${INT_STDERR:0:400})"
  # Res.txt should exist.
  assert_file_exists "$ROOT_DIR_TEST/res.txt"
  # Task committed.
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-800.1)" || true)
  assert_eq "1" "$commits"
}

test_rate_limit_exhausted_aborts_task() {
  flow_add_epic "fn-801" "rate-exhaust"
  flow_add_task "fn-801" "fn-801.1" "always RL" "impossible"

  python3 - << 'PY'
import json, os
p = os.environ["RAFITA_DIR"] + "/config.json"
d = json.load(open(p))
d["rateLimitTaskRetry"] = False
d["skipOnFailedTask"] = True
json.dump(d, open(p, "w"))
PY

  install_scripted_claude '
if [[ "$prompt" == *"implementer"* ]]; then
  ts=$(( $(date +%s) + 2 ))
  hm=$(python3 -c "import time,sys; print(time.strftime(\"%I:%M%p\", time.localtime(int(sys.argv[1]))).lower())" "$ts")
  echo "You'\''ve hit your usage limit. It resets at $hm." >&2
  exit 1
fi
echo "<done/>"
exit 0
'

  local bindir="${ROOT_DIR_TEST}/_mockbin"
  cat > "$bindir/sleep" << 'SH'
#!/usr/bin/env bash
exec /bin/sleep 1
SH
  chmod +x "$bindir/sleep"

  run_rafita fn-801
  # rafita itself completes (exit 0) but no commit was made.
  assert_eq "0" "$INT_RC" "rafita must exit 0 cleanly even when RL exhausted"
  local commits; commits=$(git log --format=%s | grep -c "feat(fn-801.1)" || true)
  assert_eq "0" "$commits"
}
