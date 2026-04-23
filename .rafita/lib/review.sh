#!/usr/bin/env bash
# review.sh — parse review verdicts, normalize, format fix blocks.
# Fail-closed: any parse error becomes approved:false with an explanatory fix.
# Implementation lives in bin/review-parse.py; this lib only shells to it.

review::_parser() {
  printf '%s' "${RAFITA_SCRIPTS_DIR:-.rafita}/bin/review-parse.py"
}

# stdin: raw claude response. stdout: normalized JSON verdict.
review::extract_verdict() {
  python3 "$(review::_parser)"
}

# stdin: raw claude response. stdout: normalized final verdict JSON.
review::extract_final_verdict() {
  python3 "$(review::_parser)" --final
}

# review::json_field <field> <json>  → print value to stdout.
review::json_field() {
  common::json_get "$2" "$1"
}

# review::format_fixes_block <json_verdict>  → markdown block for prompts.
review::format_fixes_block() {
  local verdict="$1"
  python3 "$(review::_parser)" --fixes "$verdict"
}
