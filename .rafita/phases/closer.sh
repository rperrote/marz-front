#!/usr/bin/env bash
# phases/closer.sh — CLOSER phase. Runs at the end of an epic, in a loop with
# the FINAL review, to close loose ends against the specs and address reviewer
# feedback. Writes code. Opt-in via RAFITA_CLOSER_ENABLED.

# phase::_closer_build_specs <tasks_csv>
# Concatenates each task's spec with a separator. Best-effort; missing specs
# are skipped.
phase::_closer_build_specs() {
  local tasks_csv="$1"
  [[ -z "$tasks_csv" ]] && return 0
  local IFS=','
  local -a tasks
  # shellcheck disable=SC2206
  tasks=( $tasks_csv )
  local t spec
  for t in "${tasks[@]}"; do
    [[ -z "$t" ]] && continue
    spec=$(flowctl::task_spec "$t" 2>/dev/null || true)
    [[ -z "$spec" ]] && continue
    printf '### %s\n%s\n\n' "$t" "$spec"
  done
}

# phase::_closer_common_hints
# Emits formatter and forbidden-paths hints (same shape as dev).
phase::_closer_format_hint() {
  [[ -z "${RAFITA_PROFILE_FORMAT_CMD:-}" ]] && return 0
  printf '## Formato\nDespués de editar archivos, corré: `%s`\n' "$RAFITA_PROFILE_FORMAT_CMD"
}

phase::_closer_forbidden_hint() {
  local forbidden; forbidden=$(config::forbidden_paths_list)
  [[ -z "$forbidden" ]] && return 0
  printf '## Paths prohibidos\n%s\n' "$(printf '%s\n' "$forbidden" | sed 's/^/- /')"
}

# phase::closer_initial <epic> <source_branch> <tasks_csv>
# Runs the first closer pass. Writes code in-place. No stdout payload needed.
# Returns: 0 ok, 2 hard fail, 3 rate-limit.
phase::closer_initial() {
  local epic="$1" source_branch="${2:-main}" tasks_csv="${3:-}"
  ui::phase "CLOSER" "closing epic ${epic} (round 1)..."

  local diff
  diff=$(git::diff_since_base "$source_branch")
  if [[ ${#diff} -gt 120000 ]]; then
    diff="${diff:0:120000}
...[diff truncated at 120000 chars]"
  fi

  local specs; specs=$(phase::_closer_build_specs "$tasks_csv")
  [[ -z "$specs" ]] && specs="(no specs available)"

  local tasks_md
  if [[ -n "$tasks_csv" ]]; then
    tasks_md=$(printf '%s\n' "$tasks_csv" | tr ',' '\n' | sed 's/^/- /')
  else
    tasks_md="- (no task list provided)"
  fi

  local prompt
  prompt=$(common::render_template "$RAFITA_SCRIPTS_DIR/prompts/closer.tmpl" \
    SOURCE="$source_branch" \
    TASKS="$tasks_md" \
    SPECS="$specs" \
    DIFF="$diff" \
    CLOSER_RULES="${RAFITA_PROFILE_CLOSER_RULES:-(sin reglas específicas del profile; aplicá criterio general)}" \
    FORBIDDEN_HINT="$(phase::_closer_forbidden_hint)" \
    FORMAT_HINT="$(phase::_closer_format_hint)")

  local out rc=0
  out=$(worker::run "$prompt" "closer-round-1" "closer") || rc=$?
  if [[ $rc -eq 42 ]]; then ui::phase_fail "CLOSER" "rate-limited"; return 3; fi
  if [[ $rc -ne 0 ]]; then ui::phase_fail "CLOSER" "worker rc=$rc"; return 2; fi

  phase::_run_formatter
  ui::phase_pass "CLOSER" "round 1 applied"
  return 0
}

# phase::closer_fix <epic> <source_branch> <tasks_csv> <round> <final_verdict_json>
# Subsequent closer rounds. Receives final-review issues as feedback.
phase::closer_fix() {
  local epic="$1" source_branch="${2:-main}" tasks_csv="${3:-}" round="$4" verdict="$5"
  ui::phase "CLOSER" "applying final-review feedback (round ${round})..."

  local diff
  diff=$(git::diff_since_base "$source_branch")
  if [[ ${#diff} -gt 120000 ]]; then
    diff="${diff:0:120000}
...[diff truncated at 120000 chars]"
  fi

  local specs; specs=$(phase::_closer_build_specs "$tasks_csv")
  [[ -z "$specs" ]] && specs="(no specs available)"

  local tasks_md
  if [[ -n "$tasks_csv" ]]; then
    tasks_md=$(printf '%s\n' "$tasks_csv" | tr ',' '\n' | sed 's/^/- /')
  else
    tasks_md="- (no task list provided)"
  fi

  local review_issues
  review_issues=$(python3 -c '
import json, sys
try: d=json.loads(sys.argv[1])
except Exception: d={}
issues=d.get("issues") or []
if not issues:
    print("- (review returned no structured issues)")
else:
    for i,it in enumerate(issues,1):
        if isinstance(it, dict):
            f=it.get("file","(global)")
            msg=it.get("issue","")
            print(f"{i}. **{f}** — {msg}")
        else:
            print(f"{i}. {it}")
summary=d.get("summary","")
if summary:
    print(f"\n_summary:_ {summary}")
' "$verdict")

  local prompt
  prompt=$(common::render_template "$RAFITA_SCRIPTS_DIR/prompts/closer-fix.tmpl" \
    SOURCE="$source_branch" \
    TASKS="$tasks_md" \
    SPECS="$specs" \
    DIFF="$diff" \
    REVIEW_ISSUES="$review_issues" \
    CLOSER_RULES="${RAFITA_PROFILE_CLOSER_RULES:-(sin reglas específicas del profile; aplicá criterio general)}" \
    FORBIDDEN_HINT="$(phase::_closer_forbidden_hint)" \
    FORMAT_HINT="$(phase::_closer_format_hint)")

  local out rc=0
  out=$(worker::run "$prompt" "closer-round-${round}" "closer") || rc=$?
  if [[ $rc -eq 42 ]]; then ui::phase_fail "CLOSER" "rate-limited"; return 3; fi
  if [[ $rc -ne 0 ]]; then ui::phase_fail "CLOSER" "worker rc=$rc"; return 2; fi

  phase::_run_formatter
  ui::phase_pass "CLOSER" "round ${round} applied"
  return 0
}
