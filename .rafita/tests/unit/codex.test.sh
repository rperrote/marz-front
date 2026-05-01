#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/ui.sh"
source "$RAFITA_SCRIPTS_DIR/lib/claude.sh"
source "$RAFITA_SCRIPTS_DIR/lib/codex.sh"

setup() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_RUN_ID="test-codex-$$"
  export RAFITA_WORKER_TIMEOUT="10"
  export RAFITA_UI=0
  export RAFITA_YOLO=1
  common::init_run_dir
}
teardown() { teardown_tmp_repo; }

mock_codex_cli() {
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  mkdir -p "$bindir"
  cat > "$bindir/codex" << 'SHELL'
#!/usr/bin/env bash
model=""; output_last=""; json=0; prompt=""; session_arg=""; resume=0
if [[ "${1:-}" == "exec" ]]; then shift; fi
if [[ "${1:-}" == "resume" ]]; then resume=1; shift; fi
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) shift; model="${1:-}" ;;
    --output-last-message) shift; output_last="${1:-}" ;;
    --json) json=1 ;;
    --sandbox|-s|--cd|-C|--add-dir) shift ;;
    --full-auto|--skip-git-repo-check|--dangerously-bypass-approvals-and-sandbox) ;;
    -) prompt="$(cat)" ;;
    --*) ;;
    *)
      if [[ "$resume" == "1" && -z "$session_arg" ]]; then
        session_arg="$1"
      else
        prompt="$1"
      fi
      ;;
  esac
  shift || true
done
thread="${session_arg:-019dd547-0000-7000-8000-000000000001}"
response="CODEX_OK"
if [[ "$prompt" == *"stream"* ]]; then response="CODEX_STREAM_OK"; fi
if [[ -n "$output_last" ]]; then printf '%s' "$response" > "$output_last"; fi
python3 -c "import json,sys; print(json.dumps({'model':sys.argv[1],'json':sys.argv[2]=='1','resume':sys.argv[3]=='1','session':sys.argv[4],'prompt':sys.argv[5]}))" \
  "$model" "$json" "$resume" "$session_arg" "$prompt" >> "$FAKE_CODEX_LOG"
if [[ "$json" == "1" ]]; then
  printf '{"type":"thread.started","thread_id":"%s"}\n' "$thread"
  printf '{"type":"turn.started"}\n'
  printf '{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"%s"}}\n' "$response"
  printf '{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":2,"reasoning_output_tokens":0}}\n'
else
  printf '%s\n' "$response"
  printf 'session id: %s\n' "$thread" >&2
fi
SHELL
  chmod +x "$bindir/codex"
  export PATH="$bindir:$PATH"
  export FAKE_CODEX_LOG="${ROOT_DIR_TEST}/_codex-invocations.log"
  : > "$FAKE_CODEX_LOG"
}

test_codex_parse_thread_id_from_plain_stderr() {
  local sid
  sid=$(codex::_parse_thread_id "session id: 019dd547-aaaa-7000-8000-abcdefabcdef")
  assert_eq "019dd547-aaaa-7000-8000-abcdefabcdef" "$sid"
}

test_codex_run_plain_captures_thread_id() {
  mock_codex_cli
  local out out_tmp
  out_tmp=$(mktemp)
  codex::run "hello" "dev-round-1" "gpt-5.5" > "$out_tmp"
  local rc=$?
  out=$(cat "$out_tmp")
  assert_eq "0" "$rc"
  assert_eq "CODEX_OK" "$out"
  assert_eq "019dd547-0000-7000-8000-000000000001" "$RAFITA_CODEX_THREAD_ID"
  local contents; contents=$(cat "$FAKE_CODEX_LOG")
  assert_contains "$contents" "gpt-5.5"
  rm -f "$out_tmp"
}

test_codex_run_stream_json_captures_thread_id() {
  mock_codex_cli
  export RAFITA_DEBUG=2
  local out out_tmp
  out_tmp=$(mktemp)
  codex::run "stream please" "dev-round-1" "gpt-5.5" > "$out_tmp"
  local rc=$?
  out=$(cat "$out_tmp")
  assert_eq "0" "$rc"
  assert_eq "CODEX_STREAM_OK" "$out"
  assert_eq "019dd547-0000-7000-8000-000000000001" "$RAFITA_CODEX_THREAD_ID"
  local contents; contents=$(cat "$FAKE_CODEX_LOG")
  assert_contains "$contents" "\"json\": true"
  rm -f "$out_tmp"
}

test_codex_run_resume_passes_thread_id() {
  mock_codex_cli
  local out
  out=$(codex::run "resume prompt" "dev-round-2" "gpt-5.5" "019dd547-bbbb-7000-8000-abcdefabcdef" "resume")
  local rc=$?
  assert_eq "0" "$rc"
  assert_eq "CODEX_OK" "$out"
  local contents; contents=$(cat "$FAKE_CODEX_LOG")
  assert_contains "$contents" "019dd547-bbbb-7000-8000-abcdefabcdef"
  assert_contains "$contents" "\"resume\": true"
}
