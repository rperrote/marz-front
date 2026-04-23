#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/review.sh"

test_extract_verdict_approved() {
  local raw='Some preamble <review>{"approved":true,"summary":"looks good"}</review> tail'
  local v; v=$(review::extract_verdict <<< "$raw")
  assert_json_field "$v" approved "True"
  assert_json_field "$v" summary "looks good"
}

test_extract_verdict_rejected_with_fixes() {
  local raw='<review>{"approved":false,"fixes":[{"file":"a.ts","issue":"bad","suggestion":"fix it"}]}</review>'
  local v; v=$(review::extract_verdict <<< "$raw")
  assert_json_field "$v" approved "False"
  assert_json_field "$v" fixes.0.file "a.ts"
  assert_json_field "$v" fixes.0.issue "bad"
}

test_extract_verdict_no_tag_fails_closed() {
  local raw='Model said yes, approved!'
  local v; v=$(review::extract_verdict <<< "$raw")
  assert_json_field "$v" approved "False"
  assert_json_field "$v" source "parse_error"
}

test_extract_verdict_malformed_json_fails_closed() {
  local raw='<review>{not valid json}</review>'
  local v; v=$(review::extract_verdict <<< "$raw")
  assert_json_field "$v" approved "False"
  assert_json_field "$v" source "parse_error"
}

test_extract_verdict_finds_bare_json_as_fallback() {
  local raw='prose... {"approved":true,"summary":"ok"} more prose'
  local v; v=$(review::extract_verdict <<< "$raw")
  assert_json_field "$v" approved "True"
}

test_extract_final_verdict_pass() {
  local raw='<final-review>{"status":"pass","summary":"all good","issues":[]}</final-review>'
  local v; v=$(review::extract_final_verdict <<< "$raw")
  assert_json_field "$v" status "pass"
}

test_extract_final_verdict_missing_tag_is_fail() {
  local v; v=$(review::extract_final_verdict <<< "nothing here")
  assert_json_field "$v" status "fail"
}

test_format_fixes_block_no_fixes() {
  local v='{"approved":false,"fixes":[]}'
  local block; block=$(review::format_fixes_block "$v")
  assert_contains "$block" "no specific fixes"
}

test_format_fixes_block_renders_items() {
  local v='{"approved":false,"fixes":[{"file":"src/a.ts","issue":"unused import","suggestion":"remove line 3"}]}'
  local block; block=$(review::format_fixes_block "$v")
  assert_contains "$block" "src/a.ts"
  assert_contains "$block" "unused import"
  assert_contains "$block" "remove line 3"
}

test_json_field_reads_nested() {
  local v; v=$(review::extract_verdict <<< '<review>{"approved":false,"fixes":[{"file":"x","issue":"y"}]}</review>')
  local f; f=$(review::json_field fixes.0.file "$v")
  assert_eq "x" "$f"
}
