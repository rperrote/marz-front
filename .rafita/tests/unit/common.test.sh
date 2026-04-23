#!/usr/bin/env bash
# Unit tests for lib/common.sh

# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"

test_scrub_secrets_redacts_github_pat() {
  local input="token=ghp_abcdefghij1234567890xxxxxxxx"
  local out
  out=$(common::scrub_secrets <<< "$input")
  assert_contains "$out" "[REDACTED:github-pat]" "github pat should be redacted"
  assert_not_contains "$out" "ghp_abcdefghij1234567890xxxxxxxx"
}

test_scrub_secrets_redacts_openai_key() {
  local input="KEY sk-abcdefghij1234567890xxxxxxxx"
  local out
  out=$(common::scrub_secrets <<< "$input")
  assert_contains "$out" "[REDACTED:openai-key]"
}

test_scrub_secrets_redacts_api_key_equals() {
  local input='api_key="abcdef1234567890abcdef"'
  local out
  out=$(common::scrub_secrets <<< "$input")
  assert_contains "$out" "[REDACTED]"
  assert_not_contains "$out" "abcdef1234567890abcdef"
}

test_scrub_secrets_passes_normal_strings() {
  local input="Hello world, no secrets here!"
  local out
  out=$(common::scrub_secrets <<< "$input")
  assert_eq "$input" "$out"
}

test_render_template_basic() {
  local tmp; tmp=$(mktemp)
  printf 'hello {{NAME}}, task {{TASK}}' > "$tmp"
  local out
  out=$(common::render_template "$tmp" NAME=world TASK=fn-1)
  assert_eq "hello world, task fn-1" "$out"
  rm -f "$tmp"
}

test_render_template_missing_key_stays_literal() {
  local tmp; tmp=$(mktemp)
  printf 'hi {{NAME}} {{MISSING}}' > "$tmp"
  local out
  out=$(common::render_template "$tmp" NAME=bob)
  assert_eq "hi bob {{MISSING}}" "$out"
  rm -f "$tmp"
}

test_render_template_multiline_values() {
  local tmp; tmp=$(mktemp)
  printf 'start\n{{BODY}}\nend' > "$tmp"
  local body=$'line1\nline2\nline3'
  local out
  out=$(common::render_template "$tmp" BODY="$body")
  assert_contains "$out" "line1"
  assert_contains "$out" "line2"
  assert_contains "$out" "line3"
  rm -f "$tmp"
}

test_render_template_special_chars() {
  local tmp; tmp=$(mktemp)
  printf 'val={{X}}' > "$tmp"
  local out
  out=$(common::render_template "$tmp" X='back`ticks and $dollars and "quotes"')
  assert_contains "$out" 'back`ticks'
  assert_contains "$out" '$dollars'
  assert_contains "$out" '"quotes"'
  rm -f "$tmp"
}

test_json_get_basic() {
  local out
  out=$(common::json_get '{"a":"x","b":{"c":"y"}}' a)
  assert_eq "x" "$out"
  out=$(common::json_get '{"a":"x","b":{"c":"y"}}' b.c)
  assert_eq "y" "$out"
}

test_json_get_missing_key_empty() {
  local out
  out=$(common::json_get '{"a":"x"}' z)
  assert_eq "" "$out"
}

test_init_run_dir_creates_structure() {
  setup_tmp_repo
  common::init_run_dir
  assert_file_exists "$RAFITA_RUN_DIR"
  assert_file_exists "$RAFITA_RUN_LOG"
  assert_match "$RAFITA_RUN_ID" '^[0-9]{8}T[0-9]{6}Z-[0-9]+$'
  teardown_tmp_repo
}

test_log_writes_to_run_log() {
  setup_tmp_repo
  common::init_run_dir
  common::log INFO "hello test"
  local contents
  contents=$(cat "$RAFITA_RUN_LOG")
  assert_contains "$contents" "hello test"
  assert_contains "$contents" "[INFO]"
  teardown_tmp_repo
}

test_human_duration() {
  assert_eq "00:05" "$(common::human_duration 5)"
  assert_eq "01:05" "$(common::human_duration 65)"
  assert_eq "10:00" "$(common::human_duration 600)"
}
