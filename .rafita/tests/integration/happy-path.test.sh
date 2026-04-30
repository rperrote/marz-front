#!/usr/bin/env bash
# Integration: task approved on round 1, committed, PR opened.
setup() { integration_setup; }
teardown() { integration_teardown; }

test_happy_path_single_round_approval() {
  flow_add_epic "fn-300" "happy"
  flow_add_task "fn-300" "fn-300.1" "add greeting" "write a hello.txt with 'hi'"

  # DEV round 1: write a file.
  # Since the mock can't actually write files, use a setup trick: intercept
  # via a wrapper that creates a file when the prompt contains our marker.
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  cat > "$bindir/claude" << SHELL
#!/usr/bin/env bash
# Custom claude mock for happy path: on DEV phase, create a file.
# On REVIEW phase, emit an approved verdict.
args="\$*"
prompt=""
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    -p|--print)
      if [[ \$# -gt 1 && "\${2:-}" != --* ]]; then
        shift
        prompt="\${1:-}"
      fi
      ;;
    --model) shift;;
    --dangerously-skip-permissions) ;;
    --output-format|--verbose|--include-partial-messages) ;;
    *) ;;
  esac
  shift || true
done
[[ -z "\$prompt" && ! -t 0 ]] && prompt="\$(cat)"
echo "\$(date -u +%s) model-\${model:-} \$prompt" | head -c 4000 >> "${ROOT_DIR_TEST}/_claude-invocations.log"
echo "" >> "${ROOT_DIR_TEST}/_claude-invocations.log"
if [[ "\$prompt" == *"implementer"* ]]; then
  # Write a greeting file in the cwd of rafita (the tmp repo).
  echo "hi" > "${ROOT_DIR_TEST}/hello.txt"
  echo "<done/>"
elif [[ "\$prompt" == *"code reviewer"* || "\$prompt" == *"reviewer senior"* ]]; then
  echo '<review>{"approved": true, "summary": "looks good"}</review>'
elif [[ "\$prompt" == *"final-review"* || "\$prompt" == *"diff acumulado del epic"* ]]; then
  echo '<final-review>{"status":"pass","issues":[],"summary":"ok"}</final-review>'
else
  echo "<done/>"
fi
exit 0
SHELL
  chmod +x "$bindir/claude"

  run_rafita fn-300
  assert_eq "0" "$INT_RC" "rafita must exit 0 (stderr: ${INT_STDERR:0:400})"
  # The commit must exist with the expected subject.
  local subject
  subject=$(git log -1 --pretty=%s)
  assert_contains "$subject" "feat(fn-300.1)"
  # hello.txt should be in the tree.
  assert_file_exists "$ROOT_DIR_TEST/hello.txt"
  # No state.json should remain.
  assert_file_not_exists "$RAFITA_DIR/state.json"
  # vcs log should show a pr create call.
  assert_contains "$(cat "$VCS_LOG")" "pr create"
}
