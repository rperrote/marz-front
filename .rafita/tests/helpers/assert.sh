#!/usr/bin/env bash
# Assertion helpers for rafita tests. Minimal, no external deps.
# Each assert prints failure details to stderr and returns non-zero on failure.

assert_eq() {
  local expected="$1" actual="$2" msg="${3:-}"
  if [[ "$expected" != "$actual" ]]; then
    echo "    assert_eq failed${msg:+: $msg}" >&2
    echo "      expected: $expected" >&2
    echo "      actual:   $actual" >&2
    return 1
  fi
}

assert_ne() {
  local a="$1" b="$2" msg="${3:-}"
  if [[ "$a" == "$b" ]]; then
    echo "    assert_ne failed${msg:+: $msg}: both values were '$a'" >&2
    return 1
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "    assert_contains failed${msg:+: $msg}" >&2
    echo "      needle: $needle" >&2
    echo "      haystack (first 500 chars): ${haystack:0:500}" >&2
    return 1
  fi
}

assert_not_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "    assert_not_contains failed${msg:+: $msg}: found '$needle'" >&2
    return 1
  fi
}

assert_rc() {
  local expected="$1"; shift
  local actual
  "$@" >/dev/null 2>&1
  actual=$?
  if [[ "$expected" != "$actual" ]]; then
    echo "    assert_rc failed: expected rc=$expected, got rc=$actual for: $*" >&2
    return 1
  fi
}

assert_file_exists() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "    assert_file_exists failed: $path does not exist" >&2
    return 1
  fi
}

assert_file_not_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "    assert_file_not_exists failed: $path exists" >&2
    return 1
  fi
}

assert_json_field() {
  local json="$1" field="$2" expected="$3"
  local actual
  actual=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.argv[1])
    v = d
    for k in sys.argv[2].split('.'):
        if isinstance(v, list):
            v = v[int(k)]
        else:
            v = v[k]
    print(v)
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
    sys.exit(1)
" "$json" "$field" 2>/dev/null) || {
    echo "    assert_json_field failed: could not read '$field' from JSON" >&2
    echo "    json (first 300): ${json:0:300}" >&2
    return 1
  }
  if [[ "$expected" != "$actual" ]]; then
    echo "    assert_json_field failed for '$field'" >&2
    echo "      expected: $expected" >&2
    echo "      actual:   $actual" >&2
    return 1
  fi
}

assert_match() {
  local str="$1" pattern="$2" msg="${3:-}"
  if [[ ! "$str" =~ $pattern ]]; then
    echo "    assert_match failed${msg:+: $msg}" >&2
    echo "      pattern: $pattern" >&2
    echo "      string:  ${str:0:300}" >&2
    return 1
  fi
}
