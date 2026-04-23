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
    else
      # Nothing changed — still mark as done in flowctl but log it.
      common::log WARN "task ${task_id} approved but no diff to commit"
    fi
    return 0
  fi

  # Not approved in max rounds.
  common::log WARN "task ${task_id} exhausted max rounds; changes preserved"
  ui::task_skipped "$task_id" "max-rounds"
  return 1
}

# orchestrator::run_epic <epic_id>
orchestrator::run_epic() {
  local epic="$1"
  export RAFITA_CURRENT_EPIC="$epic"
  ui::epic_start "$epic"
  git::setup_epic_branch "$epic"

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
        common::mark_done
        ;;
      1) common::mark_skipped ;;
      2) common::mark_failed ;;
      3) common::mark_failed ;;
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
        common::mark_done
        ;;
      1)
        common::mark_skipped
        if [[ "${RAFITA_SKIP_ON_FAILED_TASK:-1}" == "1" ]]; then
          common::log WARN "skipOnFailedTask=true; aborting epic"
          break
        fi
        ;;
      2)
        common::mark_failed
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
            common::mark_done
          else
            common::mark_failed
            ui::error "rate-limit retry also failed; aborting epic"
            break
          fi
        else
          common::mark_failed
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

  # Final review (non-blocking).
  local final_verdict
  final_verdict=$(phase::final_review "$epic" "${RAFITA_SOURCE_BRANCH:-main}" "${RAFITA_COMPLETED_CSV}")

  orchestrator::publish_epic "$epic" "$final_verdict" "${completed[@]}"
  flowctl::close_epic "$epic"

  # Return to source branch if branchMode=new.
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
    notify::send_pr "$url"
  fi
}
