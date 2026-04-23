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

  local out rc
  out=$(worker::run "$prompt" "final-review" "reviewer")
  rc=$?
  local verdict
  if [[ $rc -eq 0 ]]; then
    verdict=$(printf '%s' "$out" | review::extract_final_verdict)
  else
    verdict='{"status":"fail","issues":[{"issue":"final review worker rc='"$rc"'"}],"summary":"final review invocation failed"}'
  fi
  local status
  status=$(common::json_get "$verdict" status)
  if [[ "$status" == "pass" ]]; then
    ui::phase_pass "FINAL" "epic diff looks good"
  else
    ui::phase_fail "FINAL" "issues flagged (non-blocking, logged)"
  fi
  printf '%s' "$verdict"
  return 0
}
