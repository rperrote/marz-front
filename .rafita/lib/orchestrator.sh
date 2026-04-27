#!/usr/bin/env bash
# orchestrator.sh — run_epic, run_task, publish_epic. Coordinates phases,
# gates, snapshot/revert, budget, state checkpoint.

# --- verdict persistence (for --resume) --------------------------------------

orchestrator::_verdict_file() {
  local task_id="$1"
  printf '%s/%s/verdict.json' "${RAFITA_RUN_DIR:-.rafita}" "$task_id"
}

orchestrator::_save_verdict() {
  local task_id="$1" verdict="$2"
  local f; f=$(orchestrator::_verdict_file "$task_id")
  local dir; dir=$(dirname "$f")
  mkdir -p "$dir"
  printf '%s' "$verdict" > "$f"
}

orchestrator::_load_verdict() {
  local task_id="$1"
  # 1. Try persisted verdict.json
  local f; f=$(orchestrator::_verdict_file "$task_id")
  if [[ -f "$f" ]]; then
    cat "$f"
    return 0
  fi

  # 2. Fallback: search for review artifacts in any run directory.
  local base="${RAFITA_DIR:-.rafita}/runs"
  local latest_review=""
  if [[ -d "$base" ]]; then
    latest_review=$(find "$base" -path "*/$task_id/review-round-*" -name '*.response' -type f 2>/dev/null | sort -V | tail -n 1)
  fi
  if [[ -n "$latest_review" && -f "$latest_review" ]]; then
    common::log INFO "verdict fallback: loading from artifact $latest_review"
    cat "$latest_review"
    return 0
  fi

  return 0
}

# run_task <task_id> <title>
# Return codes:
#   0 approved & committed
#   1 skipped (max rounds)
#   2 hard failure (caller should abort epic)
#   3 rate-limit exhausted at task level
orchestrator::run_task() {
  local task_id="$1" title="$2"
  export RAFITA_CURRENT_TASK="$task_id"
  ui::task_start "$task_id" "$title"

  session::task_init "$task_id"

  local snapshot; snapshot=$(git::snapshot_head)
  common::log INFO "task=${task_id} snapshot=${snapshot}"
  state::save_checkpoint "${RAFITA_CURRENT_EPIC:-}" "$task_id" 0 "start" \
    "$(git::current_branch)" "$snapshot" "${RAFITA_COMPLETED_CSV:-}"

  local spec; spec=$(flowctl::task_spec "$task_id")
  local task_json; task_json=$(flowctl::task_json "$task_id")
  flowctl::start_task "$task_id"

  local max="${RAFITA_MAX_REVIEW_ROUNDS:-5}"
  local approved=0
  local verdict=""

  # Load resume state (round + phase) if present.
  local start_round=1
  local resume_phase=""
  local state_json; state_json=$(state::load_checkpoint)
  if [[ -n "$state_json" ]]; then
    start_round=$(common::json_get "$state_json" "round" 2>/dev/null || echo 1)
    resume_phase=$(common::json_get "$state_json" "phase" 2>/dev/null || echo "")
    if [[ "$start_round" =~ ^[0-9]+$ && "$start_round" -gt 1 ]]; then
      verdict=$(orchestrator::_load_verdict "$task_id")
      common::log INFO "resuming task=${task_id} from round=${start_round} phase=${resume_phase:-?} verdict_present=$([[ -n "$verdict" ]] && echo 1 || echo 0)"
    fi
  fi

  # No-progress detector: if the dev replies N rounds in a row with summaries
  # that are pure "ya está / nothing to fix / falsos positivos", the task is
  # in a stalled loop where the dev disputes the reviewer instead of
  # implementing. Stop early to avoid burning all max_rounds.
  local noop_streak=0
  local noop_threshold=3

  local round
  for (( round=start_round; round<=max; round++ )); do
    export RAFITA_CURRENT_ROUND="$round"
    export RAFITA_CURRENT_PHASE="dev"
    state::save_checkpoint "${RAFITA_CURRENT_EPIC:-}" "$task_id" "$round" "dev" \
      "$(git::current_branch)" "$snapshot" "${RAFITA_COMPLETED_CSV:-}"
    local dev_rc=0
    if [[ -n "$verdict" || $round -gt 1 ]]; then
      phase::dev_fix "$task_id" "$spec" "$round" "$verdict" || dev_rc=$?
    else
      phase::dev_initial "$task_id" "$spec" "$task_json" "" || dev_rc=$?
    fi
    if [[ $dev_rc -eq 3 ]]; then common::log WARN "task ${task_id} rate-limited; changes preserved"; return 3; fi
    if [[ $dev_rc -ne 0 ]]; then common::log WARN "task ${task_id} dev failed; changes preserved"; return 2; fi

    # Gates first (objective).
    export RAFITA_CURRENT_PHASE="gates"
    state::save_checkpoint "${RAFITA_CURRENT_EPIC:-}" "$task_id" "$round" "gates" \
      "$(git::current_branch)" "$snapshot" "${RAFITA_COMPLETED_CSV:-}"
    ui::phase "GATES" "running quality gates..."
    local gates_out gates_rc=0
    gates_out=$(quality::run_gates "$task_id" "$round") || gates_rc=$?

    if [[ $gates_rc -ne 0 ]]; then
      ui::phase_fail "GATES" "quality gate failed — skipping LLM review this round"
      verdict="$gates_out"
      if (( round == max )); then break; fi
      continue
    fi
    ui::phase_pass "GATES" "all gates green"

    # Subjective review.
    export RAFITA_CURRENT_PHASE="review"
    state::save_checkpoint "${RAFITA_CURRENT_EPIC:-}" "$task_id" "$round" "review" \
      "$(git::current_branch)" "$snapshot" "${RAFITA_COMPLETED_CSV:-}"
    local review_start review_end rev_rc=0
    review_start=$(date +%s)
    verdict=$(phase::review "$task_id" "$spec" "$round" "$snapshot") || rev_rc=$?
    review_end=$(date +%s)
    if [[ $rev_rc -eq 3 ]]; then common::log WARN "task ${task_id} rate-limited; changes preserved"; return 3; fi
    if [[ $rev_rc -ne 0 ]]; then common::log WARN "task ${task_id} review failed; changes preserved"; return 2; fi

    # Persist verdict so --resume can pick up from the next round.
    orchestrator::_save_verdict "$task_id" "$verdict"

    local is_approved summary nfixes
    is_approved=$(common::json_get "$verdict" approved)
    summary=$(common::json_get "$verdict" summary)
    if [[ "$is_approved" == "True" || "$is_approved" == "true" ]]; then
      ui::review_approved "$((review_end - review_start))"
      [[ -n "$summary" ]] && ui::info "    reviewer says: \"${summary}\""
      approved=1
      break
    fi
    local py_tmp; py_tmp=$(mktemp)
    cat > "$py_tmp" << 'PYEOF'
import json, sys
try: d=json.loads(sys.argv[1])
except: d={}
print(len(d.get("fixes") or []))
PYEOF
    nfixes=$(python3 "$py_tmp" "$verdict")
    rm -f "$py_tmp"
    ui::review_rejected "$nfixes" "$((review_end - review_start))"
    # Show a short preview of the first fix to give the user narrative context.
    local first_issue
    py_tmp=$(mktemp)
    cat > "$py_tmp" << 'PYEOF'
import json, sys
try: d=json.loads(sys.argv[1])
except: sys.exit(0)
fx=(d.get("fixes") or [])
if fx and isinstance(fx[0],dict):
    f=fx[0]
    print(f"{f.get('file','?')}: {f.get('issue','')[:100]}")
PYEOF
    first_issue=$(python3 "$py_tmp" "$verdict")
    rm -f "$py_tmp"
    [[ -n "$first_issue" ]] && ui::info "    first fix: ${first_issue}"

    # No-progress check: read the dev summary of THIS round and look for
    # patterns that indicate the dev did not actually change code (just
    # disputed the review).
    local dev_summary_file="${RAFITA_RUN_DIR:-}/${task_id}/dev-round-${round}.summary"
    if [[ -f "$dev_summary_file" ]]; then
      local dev_summary_text; dev_summary_text=$(cat "$dev_summary_file")
      # Case-insensitive grep for known "no-op" phrases. Add more if you spot
      # new patterns in stalled runs.
      if printf '%s' "$dev_summary_text" | grep -qiE \
          'no requiere|ya implementado|ya est[áa] (resuelto|hecho|cubierto)|falsos positivos|auditor[íi]a limpia|sin cambios necesarios|no se requieren cambios|nothing to fix|already (fixed|implemented|done)'; then
        noop_streak=$((noop_streak + 1))
        common::log WARN "task ${task_id} round ${round}: dev reported no-op (streak=${noop_streak}/${noop_threshold})"
        if (( noop_streak >= noop_threshold )); then
          common::log WARN "task ${task_id}: ${noop_threshold} no-op rounds in a row; aborting as stalled"
          ui::error "task ${task_id} stalled — dev keeps disputing review without editing"
          break
        fi
      else
        # Real progress (or at least an attempt): reset the streak.
        noop_streak=0
      fi
    fi
  done

  if [[ $approved -eq 1 ]]; then
    local summary_tmp evidence_tmp
    summary_tmp=$(mktemp); evidence_tmp=$(mktemp)
    python3 -c '
import json, sys
d=json.loads(sys.argv[1])
print(d.get("summary","task completed"))' "$verdict" > "$summary_tmp"
    printf '%s' "$verdict" > "$evidence_tmp"
    flowctl::done_task "$task_id" "$summary_tmp" "$evidence_tmp"
    rm -f "$summary_tmp" "$evidence_tmp"
    if git::commit_scoped "$task_id" "$title"; then
      ui::task_done "$task_id" "$round"
      # Push immediately so an interrupted run never strands committed work
      # in a worktree that may get cleaned up. Best-effort: a push failure
      # does not block the next task, but it is logged loudly.
      local _br; _br=$(git::current_branch)
      if [[ -n "$_br" ]]; then
        if git push -u origin "$_br" >/dev/null 2>&1; then
          common::log INFO "pushed ${_br} after task ${task_id}"
        else
          common::log WARN "push failed for ${_br} after task ${task_id} (continuing)"
        fi
      fi
    else
      # Nothing changed — still mark as done in flowctl but log it.
      common::log WARN "task ${task_id} approved but no diff to commit"
    fi
    return 0
  fi

  # Not approved. Could be exhausted max_rounds or stalled (no-progress
  # detector triggered an early break). The noop_streak variable tells us.
  if (( noop_streak >= noop_threshold )); then
    common::log WARN "task ${task_id} stalled at round ${round}; changes preserved"
    ui::task_skipped "$task_id" "stalled-${noop_threshold}-noops"
  else
    common::log WARN "task ${task_id} exhausted max rounds; changes preserved"
    ui::task_skipped "$task_id" "max-rounds"
  fi
  return 1
}

# orchestrator::run_epic <epic_id>
orchestrator::run_epic() {
  local epic="$1"
  export RAFITA_CURRENT_EPIC="$epic"
  common::record_epic "$epic"
  ui::epic_start "$epic"
  if ! git::setup_epic_branch "$epic"; then
    ui::error "no pude armar la rama base de ${epic} (ver warns arriba); saltando"
    return 1
  fi

  local completed=()
  export RAFITA_COMPLETED_CSV=""

  # If resuming a specific in-progress task, handle it first.
  if [[ -n "${RAFITA_RESUME_TASK_ID:-}" ]]; then
    local resume_task="${RAFITA_RESUME_TASK_ID}"
    local resume_title; resume_title=$(flowctl::task_title_by_id "$resume_task")
    common::log INFO "resuming specific task ${resume_task}"
    local rc=0
    orchestrator::run_task "$resume_task" "$resume_title" || rc=$?
    case "$rc" in
      0)
        completed+=("$resume_task")
        RAFITA_COMPLETED_CSV=$(IFS=,; echo "${completed[*]}")
        export RAFITA_COMPLETED_CSV
        common::mark_done "$resume_task"
        ;;
      1) common::mark_skipped "$resume_task" ;;
      2) common::mark_failed "$resume_task" ;;
      3) common::mark_failed "$resume_task" ;;
    esac
    unset RAFITA_RESUME_TASK_ID
  fi

  while true; do
    local task_id; task_id=$(flowctl::next_task_id "$epic")
    if [[ -z "$task_id" ]]; then
      common::log INFO "no more ready tasks for epic=${epic}"
      break
    fi
    local title; title=$(flowctl::task_title "$epic")

    local rc=0
    orchestrator::run_task "$task_id" "$title" || rc=$?

    case "$rc" in
      0)
        completed+=("$task_id")
        RAFITA_COMPLETED_CSV=$(IFS=,; echo "${completed[*]}")
        export RAFITA_COMPLETED_CSV
        common::mark_done "$task_id"
        ;;
      1)
        common::mark_skipped "$task_id"
        if [[ "${RAFITA_SKIP_ON_FAILED_TASK:-1}" == "1" ]]; then
          common::log WARN "skipOnFailedTask=true; aborting epic"
          break
        fi
        ;;
      2)
        common::mark_failed "$task_id"
        ui::error "hard failure on task ${task_id}; aborting epic"
        break
        ;;
      3)
        # Task-level rate limit. Conditional long-sleep retry.
        if [[ "${RAFITA_RATE_LIMIT_TASK_RETRY:-1}" == "1" ]]; then
          orchestrator::_rate_limit_long_sleep "$task_id" "$title"
          local retry_rc=$?
          if [[ $retry_rc -eq 0 ]]; then
            completed+=("$task_id")
            RAFITA_COMPLETED_CSV=$(IFS=,; echo "${completed[*]}")
            export RAFITA_COMPLETED_CSV
            common::mark_done "$task_id"
          else
            common::mark_failed "$task_id"
            ui::error "rate-limit retry also failed; aborting epic"
            break
          fi
        else
          common::mark_failed "$task_id"
          ui::error "rate-limit at task level (retry disabled); aborting epic"
          break
        fi
        ;;
    esac
  done

  if (( ${#completed[@]} == 0 )); then
    common::log INFO "no tasks completed for epic=${epic}; skipping publish"
    return 0
  fi

  # Closer + Final review loop (non-blocking overall).
  # If closer is enabled, it runs before each final review and addresses any
  # issues the reviewer flags. On approval, or after maxFinalRounds, publish.
  local final_verdict
  final_verdict=$(orchestrator::close_epic_loop "$epic" "${RAFITA_PR_BASE:-}" "${RAFITA_COMPLETED_CSV}")
  export RAFITA_LAST_FINAL_VERDICT="$final_verdict"

  orchestrator::publish_epic "$epic" "$final_verdict" "${completed[@]}"
  flowctl::close_epic "$epic"

  # Return to source branch if branchMode=new.
  if [[ "${RAFITA_BRANCH_MODE:-new}" == "new" && -n "${RAFITA_SOURCE_BRANCH:-}" ]]; then
    git checkout -q "$RAFITA_SOURCE_BRANCH" 2>/dev/null || true
  fi
}

# orchestrator::run_closer_only <epic_id>
# Skip the per-task DEV/REVIEW loop. Reconstruct the task list from
# flowctl (status=done) and run only CLOSER+FINAL, then publish.
# Useful when:
#   - the epic was implemented in a previous run that crashed before publish
#   - you tweaked the closer logic and want to re-run just the closing phase
#   - you want to (re)open/update a PR from already-committed work
# Returns 0 on success; non-zero if there's nothing to close or publish fails.
orchestrator::run_closer_only() {
  local epic="$1"
  export RAFITA_CURRENT_EPIC="$epic"
  common::record_epic "$epic"
  ui::epic_start "$epic"
  ui::info "closer-only mode: skipping DEV/REVIEW; running CLOSER+FINAL only"
  if ! git::setup_epic_branch "$epic"; then
    ui::error "no pude armar la rama base de ${epic} (ver warns arriba); abort closer-only"
    return 1
  fi

  # Build the completed list from flowctl (everything already done in this
  # epic). Without this we have no task ids to feed into close_epic_loop /
  # publish_epic, which use the list to render the PR body.
  local tasks_csv; tasks_csv=$(flowctl::done_tasks_csv "$epic")
  if [[ -z "$tasks_csv" ]]; then
    ui::error "epic ${epic} has no done tasks; nothing to close or publish"
    return 1
  fi
  export RAFITA_COMPLETED_CSV="$tasks_csv"
  common::log INFO "closer-only: epic=${epic} tasks=${tasks_csv}"

  # Run the closer↔final loop and publish (same path as run_epic uses at
  # the end). publish_epic expects task ids as positional args.
  local final_verdict
  final_verdict=$(orchestrator::close_epic_loop "$epic" "${RAFITA_PR_BASE:-}" "$tasks_csv")
  export RAFITA_LAST_FINAL_VERDICT="$final_verdict"

  local -a tasks_array
  IFS=',' read -ra tasks_array <<< "$tasks_csv"
  orchestrator::publish_epic "$epic" "$final_verdict" "${tasks_array[@]}"
  flowctl::close_epic "$epic"

  if [[ "${RAFITA_BRANCH_MODE:-new}" == "new" && -n "${RAFITA_SOURCE_BRANCH:-}" ]]; then
    git checkout -q "$RAFITA_SOURCE_BRANCH" 2>/dev/null || true
  fi
}

orchestrator::_rate_limit_long_sleep() {
  local task_id="$1" title="$2"
  local reset="${RAFITA_LAST_RESET_AT:-}"
  local now; now=$(date +%s)
  local sleep_for=3600
  if [[ -n "$reset" && "$reset" =~ ^[0-9]+$ ]]; then
    sleep_for=$(( reset - now + 300 ))
    (( sleep_for < 300 )) && sleep_for=300
  fi
  local cap="${RAFITA_RATE_LIMIT_MAX_SLEEP:-21600}"
  (( sleep_for > cap )) && sleep_for=$cap
  common::log INFO "rate-limit long-sleep ${sleep_for}s for task=${task_id}"
  ui::info "rate-limited; sleeping ${sleep_for}s until retry"
  state::save_checkpoint "${RAFITA_CURRENT_EPIC:-}" "$task_id" 0 "rate_limit_sleep" \
    "$(git::current_branch)" "$(git::snapshot_head)" "${RAFITA_COMPLETED_CSV:-}"
  sleep "$sleep_for"
  orchestrator::run_task "$task_id" "$title"
  local rc=$?
  if [[ $rc -eq 3 ]]; then return 2; fi
  return "$rc"
}

# orchestrator::close_epic_loop <epic> <source_branch> <tasks_csv>
# Runs [CLOSER → FINAL REVIEW] up to maxFinalRounds. If closerEnabled is false,
# this degenerates to a single final review (legacy behavior).
# stdout: final verdict JSON (final-review shape: status/issues/summary).
orchestrator::close_epic_loop() {
  local epic="$1" source_branch="$2" tasks_csv="$3"
  local max="${RAFITA_MAX_FINAL_ROUNDS:-3}"
  local closer_on="${RAFITA_CLOSER_ENABLED:-0}"
  local verdict=""
  local round=1

  # Pin all closer/final artifacts (prompts, responses, gate logs) to a
  # single per-epic dir instead of leaking into _global/ + closer-epic-*/.
  # claude::run reads RAFITA_CURRENT_TASK to pick the artifact subdir.
  local _saved_task="${RAFITA_CURRENT_TASK:-}"
  export RAFITA_CURRENT_TASK="closer-epic-${epic}"

  if [[ "$closer_on" != "1" ]]; then
    verdict=$(phase::final_review "$epic" "$source_branch" "$tasks_csv")
    printf '%s' "$verdict"
    if [[ -n "$_saved_task" ]]; then export RAFITA_CURRENT_TASK="$_saved_task"; else unset RAFITA_CURRENT_TASK; fi
    return 0
  fi

  while (( round <= max )); do
    export RAFITA_CURRENT_PHASE="closer"
    local c_rc=0
    if (( round == 1 )); then
      phase::closer_initial "$epic" "$source_branch" "$tasks_csv" || c_rc=$?
    else
      phase::closer_fix "$epic" "$source_branch" "$tasks_csv" "$round" "$verdict" || c_rc=$?
    fi
    if [[ $c_rc -ne 0 ]]; then
      common::log WARN "closer round=${round} rc=${c_rc}; breaking loop and using last verdict"
      if [[ -z "$verdict" ]]; then
        verdict='{"status":"fail","issues":[{"issue":"closer round '"${round}"' failed rc='"${c_rc}"'"}],"summary":"closer worker failed"}'
      fi
      break
    fi

    # Gates after closer edits. If they fail, feed gates-derived issues into
    # the next round via a synthesized verdict. Non-blocking to publish.
    local gates_out gates_rc=0
    gates_out=$(quality::run_gates "closer-epic-${epic}" "$round") || gates_rc=$?
    if [[ $gates_rc -ne 0 ]]; then
      common::log WARN "closer gates failed on round=${round}; feeding to next closer round"
      verdict=$(python3 -c '
import json, sys
body=sys.argv[1]
print(json.dumps({"status":"fail","issues":[{"file":"(gates)","issue":body[:2000]}],"summary":"quality gates failed after closer"}))
' "${gates_out:-unknown gates output}")
      (( round == max )) && break
      round=$(( round + 1 ))
      continue
    fi

    # Commit any edits the closer introduced so the final-review diff reflects
    # the committed state and publish_epic can push them. Empty diff → no-op.
    git::commit_closer "$epic" "$round" || true

    # Skip final review when configured (closer-only mode without reviewer).
    if [[ "${RAFITA_CLOSER_SKIP_FINAL_REVIEW:-0}" == "1" ]]; then
      verdict='{"status":"pass","issues":[],"summary":"closer approved (final review skipped by config)"}'
      common::log INFO "closer loop: skipping final review (closerSkipFinalReview=true)"
      break
    fi

    export RAFITA_CURRENT_PHASE="final"
    verdict=$(phase::final_review "$epic" "$source_branch" "$tasks_csv")
    local status; status=$(common::json_get "$verdict" status)
    if [[ "$status" == "pass" ]]; then
      common::log INFO "closer loop approved on round=${round}"
      break
    fi
    round=$(( round + 1 ))
  done

  if (( round > max )); then
    common::log WARN "closer loop exhausted ${max} rounds without approval; publishing with last verdict"
  fi

  printf '%s' "$verdict"
  if [[ -n "$_saved_task" ]]; then export RAFITA_CURRENT_TASK="$_saved_task"; else unset RAFITA_CURRENT_TASK; fi
}

orchestrator::publish_epic() {
  local epic="$1" final_verdict="$2"; shift 2
  local tasks=("$@")
  if ! git::has_remote; then
    common::log INFO "no remote; skipping push/PR"
    return 0
  fi
  vcs::push || { common::warn "push failed; PR not opened"; return 1; }
  local body_tmp json_tmp
  body_tmp=$(mktemp)
  json_tmp=$(mktemp)
  printf '%s' "$final_verdict" > "$json_tmp"
  {
    echo "## Summary"
    echo ""
    echo "Automated via rafita. Run: \`${RAFITA_RUN_ID}\`"
    echo ""
    echo "## Tasks"
    for t in "${tasks[@]}"; do echo "- $t"; done
    echo ""
    echo "## Final review"
    python3 "$json_tmp" << 'PYEOF'
import json, sys, pathlib
p = pathlib.Path(sys.argv[1])
try: d = json.loads(p.read_text())
except Exception: d = {}
print("- status:", d.get("status", "?"))
print("- summary:", d.get("summary", ""))
issues = d.get("issues") or []
if issues:
    print("- issues:")
    for i in issues:
        if isinstance(i, dict):
            print("  -", i.get("file", ""), ":", i.get("issue", ""))
        else:
            print("  -", i)
PYEOF
    echo ""
    echo "🤖 rafita v2"
  } > "$body_tmp"
  rm -f "$json_tmp"
  local title="rafita: ${epic} (${#tasks[@]} task(s))"
  local url
  url=$(vcs::open_or_update_pr "$epic" "$title" "$body_tmp")
  rm -f "$body_tmp"
  if [[ -n "$url" ]]; then
    ui::info "PR: $url"
    export RAFITA_LAST_PR_URL="$url"
  fi
}
