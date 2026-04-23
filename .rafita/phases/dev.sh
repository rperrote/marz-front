#!/usr/bin/env bash
# phases/dev.sh — DEV phase (initial and fix-based).

# phase::_build_hint <title> <body>  → markdown block or empty.
phase::_build_hint() {
  local title="$1" body="$2"
  [[ -z "$body" ]] && { printf ''; return; }
  printf '## %s\n%s\n' "$title" "$body"
}

# phase::dev_initial <task_id> <spec> <task_json> <plan>
phase::dev_initial() {
  local task_id="$1" spec="$2" task_json="$3" plan="$4"
  ui::phase "DEV" "implementing task..."

  local plan_hint=""
  if [[ -n "$plan" ]]; then
    plan_hint=$(phase::_build_hint "Plan" "$plan")
  fi
  local skills_hint=""
  if [[ -n "${RAFITA_PROFILE_SKILLS:-}" ]]; then
    skills_hint=$(phase::_build_hint "Skills recomendados" "$RAFITA_PROFILE_SKILLS")
  fi
  local format_hint=""
  if [[ -n "${RAFITA_PROFILE_FORMAT_CMD:-}" ]]; then
    format_hint=$(phase::_build_hint "Formato" "Después de editar archivos, corré: \`${RAFITA_PROFILE_FORMAT_CMD}\`")
  fi
  local forbidden_hint=""
  local forbidden; forbidden=$(config::forbidden_paths_list)
  if [[ -n "$forbidden" ]]; then
    forbidden_hint=$(phase::_build_hint "Paths prohibidos" "$(printf '%s\n' "$forbidden" | sed 's/^/- /')")
  fi

  local prompt
  prompt=$(common::render_template "$RAFITA_SCRIPTS_DIR/prompts/dev.tmpl" \
    TASK_ID="$task_id" \
    TASK_SPEC="$spec" \
    TASK_JSON="$task_json" \
    DEV_RULES="${RAFITA_PROFILE_DEV_RULES:-(none)}" \
    PLAN_HINT="$plan_hint" \
    SKILLS_HINT="$skills_hint" \
    FORMAT_HINT="$format_hint" \
    FORBIDDEN_HINT="$forbidden_hint" \
    FLOWCTL="${RAFITA_FLOWCTL:-.flow/bin/flowctl}")

  local out rc
  out=$(worker::run "$prompt" "dev-round-1" "dev")
  rc=$?
  if [[ $rc -eq 42 ]]; then return 3; fi
  if [[ $rc -ne 0 ]]; then ui::phase_fail "DEV" "worker rc=$rc"; return 2; fi

  # Run formatter if configured (best-effort).
  phase::_run_formatter

  ui::phase_pass "DEV" "implementation applied"
  return 0
}

# phase::dev_fix <task_id> <spec> <round> <verdict_json>
phase::dev_fix() {
  local task_id="$1" spec="$2" round="$3" verdict="$4"
  ui::phase "DEV" "applying fixes (round ${round})..."
  local fixes_md
  fixes_md=$(review::format_fixes_block "$verdict")

  # Choose prompt: short resume version when the dev session already has context.
  local dev_used; dev_used=$(session::get "$task_id" "dev" "used" 2>/dev/null || echo 0)
  local tmpl="$RAFITA_SCRIPTS_DIR/prompts/dev-fix.tmpl"
  if [[ "$dev_used" != "0" && -n "$dev_used" ]]; then
    tmpl="$RAFITA_SCRIPTS_DIR/prompts/dev-fix-resume.tmpl"
  fi

  local prompt
  prompt=$(common::render_template "$tmpl" \
    TASK_ID="$task_id" \
    TASK_SPEC="$spec" \
    FIXES="$fixes_md" \
    DEV_FIX_RULES="${RAFITA_PROFILE_DEV_FIX_RULES:-(none)}")
  local out rc
  out=$(worker::run "$prompt" "dev-round-${round}" "dev")
  rc=$?

  # Extract summary of changes for the next review round.
  local summary
  summary=$(python3 -c '
import sys, re
out = sys.stdin.read()
m = re.search(r"<summary>(.*?)</summary>", out, re.DOTALL)
if m:
    print(m.group(1).strip())
' <<< "$out")
  if [[ -n "$summary" && -n "${RAFITA_RUN_DIR:-}" ]]; then
    local summary_file="${RAFITA_RUN_DIR}/${task_id}/dev-round-${round}.summary"
    mkdir -p "$(dirname "$summary_file")"
    printf '%s\n' "$summary" > "$summary_file"
  fi

  if [[ $rc -eq 42 ]]; then return 3; fi
  if [[ $rc -ne 0 ]]; then ui::phase_fail "DEV" "worker rc=$rc"; return 2; fi
  phase::_run_formatter
  ui::phase_pass "DEV" "fixes applied"
  return 0
}

phase::_run_formatter() {
  [[ -z "${RAFITA_PROFILE_FORMAT_CMD:-}" ]] && return 0
  local log="${RAFITA_RUN_DIR:-.}/format.log"
  ( eval "$RAFITA_PROFILE_FORMAT_CMD" ) >>"$log" 2>&1 || common::log WARN "formatter rc=$?"
}
