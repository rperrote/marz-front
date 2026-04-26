#!/usr/bin/env bash
# phases/final.sh — FINAL review over the accumulated epic diff.

# phase::final_review <epic_id> <source_branch> <task_list_csv>
# stdout: final verdict JSON.
# rc 0 always (final review is best-effort; we log issues but don't abort publish).
phase::final_review() {
  local epic="$1" source_branch="${2:-main}" tasks_csv="${3:-}"
  ui::phase "FINAL" "reviewing epic diff..."

  local diff
  diff=$(git::diff_since_base "$source_branch")
  if [[ ${#diff} -gt 120000 ]]; then
    diff="${diff:0:120000}
...[diff truncated at 120000 chars]"
  fi

  local tasks_md
  if [[ -n "$tasks_csv" ]]; then
    tasks_md=$(printf '%s\n' "$tasks_csv" | tr ',' '\n' | sed 's/^/- /')
  else
    tasks_md="- (no task list provided)"
  fi

  local prompt
  prompt=$(common::render_template "$RAFITA_SCRIPTS_DIR/prompts/final.tmpl" \
    SOURCE="$source_branch" \
    DIFF="$diff" \
    TASKS="$tasks_md")

  local out rc verdict status
  out=$(worker::run "$prompt" "final-review" "reviewer")
  rc=$?
  if [[ $rc -ne 0 ]]; then
    verdict='{"status":"fail","issues":[{"issue":"final review worker rc='"$rc"'"}],"summary":"final review invocation failed"}'
  else
    verdict=$(printf '%s' "$out" | review::extract_final_verdict)
    status=$(common::json_get "$verdict" status 2>/dev/null || echo "")

    # Retry loop for unparseable verdicts (no <final-review> tag). Same
    # rationale as phase::review: reuse session, ask reviewer to reformat
    # without re-analyzing. 2 retries max. Final review is best-effort so
    # exhausted retries → keep the parse_error verdict (not hard fail).
    local retry=0
    local max_retries=2
    while [[ "$status" == "fail" ]] \
        && (printf '%s' "$verdict" | grep -q "no <final-review> tag\|json decode\|json:") \
        && (( retry < max_retries )); do
      retry=$((retry + 1))
      common::log WARN "final verdict unparseable (attempt $retry/$max_retries); asking reviewer to reformat"
      ui::phase "FINAL" "verdict unparseable; reformat (retry ${retry}/${max_retries})..."
      local reformat_prompt
      reformat_prompt=$(common::render_template \
        "$RAFITA_SCRIPTS_DIR/prompts/final-reformat.tmpl" \
        LAST_OUTPUT="$out")

      out=$(worker::run "$reformat_prompt" "final-review-reformat-${retry}" "reviewer")
      rc=$?
      if [[ $rc -ne 0 ]]; then
        verdict='{"status":"fail","issues":[{"issue":"final reformat worker rc='"$rc"'"}],"summary":"final reformat invocation failed"}'
        break
      fi
      verdict=$(printf '%s' "$out" | review::extract_final_verdict)
      status=$(common::json_get "$verdict" status 2>/dev/null || echo "")
    done
  fi
  status=$(common::json_get "$verdict" status)
  if [[ "$status" == "pass" ]]; then
    ui::phase_pass "FINAL" "epic diff looks good"
  else
    ui::phase_fail "FINAL" "issues flagged (non-blocking, logged)"
  fi
  printf '%s' "$verdict"
  return 0
}
