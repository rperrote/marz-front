#!/usr/bin/env bash
# phases/plan.sh — opt-in plan phase. Runs only when the active profile has a
# non-empty "## Plan Rules" section. Output: markdown plan saved to
# .rafita/plans/<task_id>.md AND echoed to stdout.

# phase::plan <task_id> <spec> <task_json>
# stdout: plan markdown (or empty string if phase skipped).
# rc 0 on success/skip, 2 on hard claude failure, 3 on rate-limit-exhausted.
phase::plan() {
  local task_id="$1" spec="$2" task_json="$3"
  if ! config::has_plan_phase; then
    printf ''
    return 0
  fi
  ui::phase "PLAN" "sketching approach..."
  local prompt
  prompt=$(common::render_template "$RAFITA_SCRIPTS_DIR/prompts/plan.tmpl" \
    TASK_ID="$task_id" \
    TASK_SPEC="$spec" \
    TASK_JSON="$task_json" \
    PLAN_RULES="${RAFITA_PROFILE_PLAN_RULES:-(none)}")
  local out rc
  out=$(worker::run "$prompt" "plan" "planner")
  rc=$?
  if [[ $rc -eq 42 ]]; then return 3; fi
  if [[ $rc -ne 0 ]]; then
    ui::phase_fail "PLAN" "claude rc=$rc"
    return 2
  fi
  local plan_dir="${RAFITA_DIR:-.rafita}/plans"
  mkdir -p "$plan_dir"
  local plan_path="$plan_dir/${task_id}.md"
  printf '%s\n' "$out" > "$plan_path"
  ui::phase_pass "PLAN" "plan saved to ${plan_path}"
  printf '%s' "$out"
  return 0
}
