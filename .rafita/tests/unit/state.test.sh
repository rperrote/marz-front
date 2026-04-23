#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/state.sh"

setup() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_RUN_ID="test-run-1"
  mkdir -p "$RAFITA_DIR"
}

teardown() { teardown_tmp_repo; }

test_state_save_load_roundtrip() {
  state::save_checkpoint fn-1 fn-1.2 2 review feat/fn-1 abc123 "fn-1.1"
  local json
  json=$(state::load_checkpoint)
  [[ -n "$json" ]] || { echo "no state loaded" >&2; return 1; }
  assert_json_field "$json" run_id "test-run-1"
  assert_json_field "$json" epic_id "fn-1"
  assert_json_field "$json" task_id "fn-1.2"
  assert_json_field "$json" round "2"
  assert_json_field "$json" phase "review"
  assert_json_field "$json" branch "feat/fn-1"
  assert_json_field "$json" snapshot_sha "abc123"
  assert_json_field "$json" completed_tasks.0 "fn-1.1"
}

test_state_clear_removes_file() {
  state::save_checkpoint fn-1 fn-1.1 1 dev main aaa ""
  assert_rc 0 state::has_checkpoint
  state::clear
  assert_rc 1 state::has_checkpoint
}

test_state_load_on_corrupt_file_returns_empty() {
  local path; path="$RAFITA_DIR/state.json"
  echo 'this is not json {{{' > "$path"
  local json
  json=$(state::load_checkpoint)
  assert_eq "" "$json"
}

test_state_load_when_absent_returns_empty() {
  local json
  json=$(state::load_checkpoint)
  assert_eq "" "$json"
}

test_state_field_reads_single_field() {
  state::save_checkpoint fn-9 fn-9.3 1 plan main deadbeef "fn-9.1,fn-9.2"
  local v
  v=$(state::field epic_id); assert_eq "fn-9" "$v"
  v=$(state::field phase); assert_eq "plan" "$v"
  v=$(state::field completed_tasks.1); assert_eq "fn-9.2" "$v"
}
