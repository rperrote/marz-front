#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/claude.sh"

setup() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_RUN_ID="test-claude-$$"
  export RAFITA_DEV_MODEL="claude-opus-4-6"
  export RAFITA_REVIEWER_MODEL="claude-sonnet-4-6"
  export RAFITA_WORKER_TIMEOUT="10"
  common::init_run_dir
}
teardown() { teardown_tmp_repo; }

test_resolve_model_dev_alias() {
  local m; m=$(claude::_resolve_model dev)
  assert_eq "claude-opus-4-6" "$m"
}

test_resolve_model_reviewer_alias() {
  local m; m=$(claude::_resolve_model reviewer)
  assert_eq "claude-sonnet-4-6" "$m"
}

test_resolve_model_passthrough() {
  local m; m=$(claude::_resolve_model claude-haiku-4-5)
  assert_eq "claude-haiku-4-5" "$m"
}

test_parse_rate_limit_with_am_pm() {
  local out
  out=$(claude::_parse_rate_limit "You've hit your usage limit. It resets at 3:30pm.")
  [[ -n "$out" ]] || { echo "expected non-empty" >&2; return 1; }
  [[ "$out" =~ ^[0-9]+$ ]] || { echo "not epoch: $out" >&2; return 1; }
}

test_parse_rate_limit_with_24h() {
  local out
  out=$(claude::_parse_rate_limit "rate limit hit, resets at 22:30")
  [[ -n "$out" && "$out" =~ ^[0-9]+$ ]] || return 1
}

test_parse_rate_limit_returns_empty_on_unrelated() {
  local out
  out=$(claude::_parse_rate_limit "random error, not a rate limit")
  assert_eq "" "$out"
}

test_parse_rate_limit_clamped_cap() {
  # "resets at 3am" from late night could compute big value; must clamp <= 21600.
  local out
  out=$(claude::_parse_rate_limit "usage limit reset at 3am")
  [[ -n "$out" ]] || return 1
  local now; now=$(date +%s)
  local delta=$((out - now))
  (( delta <= 21600 )) || { echo "delta=$delta exceeds cap" >&2; return 1; }
  (( delta >= 60 )) || { echo "delta=$delta below floor" >&2; return 1; }
}

test_claude_run_dry_run_shortcircuits() {
  export RAFITA_DRY_RUN=1
  local out
  out=$(claude::run "some prompt" "dev-round-1" "dev")
  assert_contains "$out" "<dry-run>"
  unset RAFITA_DRY_RUN
}

test_claude_run_success_with_mock() {
  mock_claude_cli
  mock_claude_response default "all good <done/>"
  local out
  out=$(claude::run "please do thing" "dev-round-1" "dev")
  local rc=$?
  assert_eq "0" "$rc"
  assert_contains "$out" "all good"
}

test_claude_run_records_artifacts() {
  mock_claude_cli
  mock_claude_response default "response body"
  export RAFITA_CURRENT_TASK="fn-42.1"
  claude::run "prompt text" "dev-round-1" "dev" >/dev/null
  assert_file_exists "$RAFITA_RUN_DIR/fn-42.1/dev-round-1.prompt"
  assert_file_exists "$RAFITA_RUN_DIR/fn-42.1/dev-round-1.response"
}

test_claude_run_rate_limit_exhausted_returns_42() {
  mock_claude_cli
  # Always rate limit: set reset to a few seconds in the future and max=100.
  export FAKE_CLAUDE_RATELIMIT_STATE="$ROOT_DIR_TEST/_rl.state"
  echo "0" > "$FAKE_CLAUDE_RATELIMIT_STATE"
  export FAKE_CLAUDE_RATELIMIT_MAX=100
  local future; future=$(( $(date +%s) + 2 ))
  export FAKE_CLAUDE_RATELIMIT_UNTIL="$future"
  # Force minimum sleep via low RATELIMIT cap so the test is fast. Our code
  # enforces sleep_for >= 60 though — override via env shortcut not possible;
  # instead, shorten by monkey-patching the sleep function.
  sleep() { builtin :; }
  export -f sleep 2>/dev/null || true
  local out
  out=$(claude::run "prompt" "dev-round-1" "dev")
  local rc=$?
  assert_eq "42" "$rc"
}

test_claude_run_hard_failure_returns_1() {
  mock_claude_cli
  export FAKE_CLAUDE_RC=2
  export FAKE_CLAUDE_STDERR="boom: something broke"
  sleep() { builtin :; }
  export -f sleep 2>/dev/null || true
  local out
  out=$(claude::run "prompt" "dev-round-1" "dev")
  local rc=$?
  assert_eq "1" "$rc"
}

test_claude_run_passes_model_flag_to_cli() {
  mock_claude_cli
  mock_claude_response default "ok"
  claude::run "hello" "dev-round-1" "dev" >/dev/null
  local log="$FAKE_CLAUDE_LOG"
  local contents; contents=$(cat "$log")
  assert_contains "$contents" "claude-opus-4-6"
  claude::run "hi" "review-round-1" "reviewer" >/dev/null
  contents=$(cat "$log")
  assert_contains "$contents" "claude-sonnet-4-6"
}
