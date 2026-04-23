#!/usr/bin/env bash
# phases/review.sh — subjective LLM review. Only runs after gates passed.

# phase::review <task_id> <spec> <round> <snapshot_sha>
# stdout: normalized verdict JSON.
# rc 0 on success; rc 2 on hard claude failure; rc 3 on rate-limit-exhausted.
phase::review() {
  local task_id="$1" spec="$2" round="$3" snapshot="$4"
  ui::phase "REVIEW" "reviewing diff (round ${round})..."

  # Build diff: snapshot..HEAD plus currently unstaged (in case DEV didn't commit,
  # which it shouldn't — so the diff is against the snapshot).
  local diff
  diff=$(git diff "$snapshot" 2>/dev/null)
  # Truncate to avoid prompt bloat.
  if [[ ${#diff} -gt 80000 ]]; then
    diff="${diff:0:80000}
...[diff truncated at 80000 chars]"
  fi

  # Load dev summary from the corresponding dev round if available.
  local dev_summary=""
  local summary_file="${RAFITA_RUN_DIR:-}/${task_id}/dev-round-${round}.summary"
  [[ -f "$summary_file" ]] && dev_summary=$(cat "$summary_file")

  # Choose template: full spec on first review, short prompt on resumed sessions.
  local reviewer_used; reviewer_used=$(session::get "$task_id" "reviewer" "used" 2>/dev/null || echo 0)
  local tmpl="$RAFITA_SCRIPTS_DIR/prompts/review.tmpl"
  if [[ "$reviewer_used" != "0" && -n "$reviewer_used" ]]; then
    tmpl="$RAFITA_SCRIPTS_DIR/prompts/review-resume.tmpl"
  fi

  local prompt
  if [[ "$tmpl" == "$RAFITA_SCRIPTS_DIR/prompts/review-resume.tmpl" ]]; then
    prompt=$(common::render_template "$tmpl" \
      DIFF="$diff" \
      DEV_SUMMARY="$dev_summary")
  else
    prompt=$(common::render_template "$tmpl" \
      TASK_ID="$task_id" \
      TASK_SPEC="$spec" \
      DIFF="$diff" \
      DEV_SUMMARY="$dev_summary" \
      REVIEW_RULES="${RAFITA_PROFILE_REVIEW_RULES:-(none)}")
  fi

  local out rc
  out=$(worker::run "$prompt" "review-round-${round}" "reviewer")
  rc=$?
  if [[ $rc -eq 42 ]]; then return 3; fi
  if [[ $rc -ne 0 ]]; then ui::phase_fail "REVIEW" "worker rc=$rc"; return 2; fi

  # Normalize verdict; print to stdout.
  local verdict
  verdict=$(printf '%s' "$out" | review::extract_verdict)
  printf '%s' "$verdict"
  return 0
}
