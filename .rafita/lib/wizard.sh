#!/usr/bin/env bash
# wizard.sh — interactive pre-flight: state-dir hygiene + epic picker.
#
# Flow (only when stdin is a TTY and wizard is enabled):
#   1) diagnose     — scan state-dir + open epics for issues, build buckets
#   2) sanitize     — offer fixes (release stuck claims, close done/empty
#                     epics, remove stale locks)
#   3) pick epic    — menu of remaining open epics, ordered for usefulness
#   4) pick mode    — normal / continue / closer-only (when applicable)
#
# Outputs (via globals consumed by rafita.sh main):
#   WIZARD_EPIC          chosen epic id, or empty for "all"
#   WIZARD_CONTINUE      1 if user chose --continue, else 0
#   WIZARD_CLOSER_ONLY   1 if closer-only mode, else 0
#
# Skip conditions:
#   - $RAFITA_WIZARD_ENABLED == 0
#   - non-TTY stdin (CI / piped input)
#   - explicit epic_arg passed on CLI

# shellcheck disable=SC2155,SC2034

WIZARD_EPIC=""
WIZARD_CONTINUE=0
WIZARD_CLOSER_ONLY=0

wizard::should_run() {
  [[ "${RAFITA_WIZARD_ENABLED:-1}" == "1" ]] || return 1
  [[ -t 0 ]] || return 1
  return 0
}

# Read a single line from /dev/tty so the wizard works even when stdout is
# being captured (rare but happens with some wrappers).
wizard::_read() {
  local prompt="$1" var
  if [[ -r /dev/tty ]]; then
    printf '%s' "$prompt" >&2
    IFS= read -r var < /dev/tty || return 1
  else
    printf '%s' "$prompt" >&2
    IFS= read -r var || return 1
  fi
  printf '%s' "$var"
}

wizard::_section() {
  printf '\n%s%s%s\n' "${UI_BOLD:-}" "$1" "${UI_RESET:-}" >&2
  printf '%s%s%s\n' "${UI_DIM:-}" "$(printf '%.0s─' {1..56})" "${UI_RESET:-}" >&2
}

wizard::_dim() { printf '%s%s%s\n' "${UI_DIM:-}" "$1" "${UI_RESET:-}" >&2; }
wizard::_warn() { printf '%s! %s%s\n' "${UI_YELLOW:-}" "$1" "${UI_RESET:-}" >&2; }
wizard::_ok() { printf '%s✓ %s%s\n' "${UI_GREEN:-}" "$1" "${UI_RESET:-}" >&2; }
wizard::_info() { printf '  %s\n' "$1" >&2; }

# Clear the terminal. Uses tput when available (preferred — also resets the
# scrollback on most terminals); falls back to ANSI ESC[2J + cursor home.
# No-op when stdout isn't a tty or RAFITA_WIZARD_NO_CLEAR=1 (debugging).
wizard::_clear() {
  [[ "${RAFITA_WIZARD_NO_CLEAR:-0}" == "1" ]] && return 0
  [[ -t 2 ]] || return 0
  if command -v clear >/dev/null 2>&1; then
    clear >&2
  else
    printf '\033[2J\033[H' >&2
  fi
}

# -----------------------------------------------------------------------------
# 1) Diagnose
# Populates these arrays in the caller's scope (declared global here):

wizard::diagnose() {
  WIZ_STALE_CLAIMS=()    # task_id<TAB>epic<TAB>title<TAB>claimed_at<TAB>age_min
  WIZ_STALE_LOCKS=()     # lockname<TAB>age_min
  WIZ_DONE_EPICS=()      # epic ids whose tasks are all done
  WIZ_EMPTY_EPICS=()     # epic ids with zero tasks
  WIZ_STUCK_EPICS=()     # epic ids with no ready / no in_progress but tasks remain
  WIZ_OPEN_EPICS=()      # all open epic ids (for the picker)

  local claim_thr="${RAFITA_STALE_CLAIM_MINUTES:-30}"
  local lock_thr="${RAFITA_STALE_LOCK_MINUTES:-60}"

  while IFS= read -r line; do
    [[ -n "$line" ]] && WIZ_STALE_CLAIMS+=("$line")
  done < <(flowctl::stale_in_progress "$claim_thr")

  while IFS= read -r line; do
    [[ -n "$line" ]] && WIZ_STALE_LOCKS+=("$line")
  done < <(flowctl::stale_locks "$lock_thr")

  local epic
  while IFS= read -r epic; do
    [[ -z "$epic" ]] && continue
    WIZ_OPEN_EPICS+=("$epic")
    if flowctl::epic_empty "$epic"; then
      WIZ_EMPTY_EPICS+=("$epic")
    elif flowctl::epic_all_done "$epic"; then
      WIZ_DONE_EPICS+=("$epic")
    elif flowctl::epic_stuck "$epic"; then
      WIZ_STUCK_EPICS+=("$epic")
    fi
  done < <(flowctl::open_epics)
}

wizard::_print_findings() {
  local n_claims="${#WIZ_STALE_CLAIMS[@]}"
  local n_locks="${#WIZ_STALE_LOCKS[@]}"
  local n_done="${#WIZ_DONE_EPICS[@]}"
  local n_empty="${#WIZ_EMPTY_EPICS[@]}"
  local n_stuck="${#WIZ_STUCK_EPICS[@]}"

  wizard::_section "Pre-flight diagnostics"
  wizard::_info "state-dir : $(flowctl::state_dir)"
  wizard::_info "actor     : $(flowctl::actor)"
  wizard::_info "open epics: ${#WIZ_OPEN_EPICS[@]}"
  printf '\n' >&2

  if (( n_claims == 0 && n_locks == 0 && n_done == 0 && n_empty == 0 && n_stuck == 0 )); then
    wizard::_ok "no issues detected"
    return 0
  fi

  if (( n_claims > 0 )); then
    wizard::_warn "${n_claims} stuck in-progress task(s) (claimed >${RAFITA_STALE_CLAIM_MINUTES:-30}m ago)"
    local row tid epic title age
    for row in "${WIZ_STALE_CLAIMS[@]}"; do
      tid=$(printf '%s' "$row" | cut -f1)
      title=$(printf '%s' "$row" | cut -f3)
      age=$(printf '%s' "$row" | cut -f5)
      wizard::_info "  ${tid}  (${age}m old)  ${title}"
    done
  fi
  if (( n_done > 0 )); then
    wizard::_warn "${n_done} epic(s) open but all tasks done — should be closed"
    local e; for e in "${WIZ_DONE_EPICS[@]}"; do wizard::_info "  ${e}"; done
  fi
  if (( n_empty > 0 )); then
    wizard::_warn "${n_empty} epic(s) open with zero tasks"
    local e; for e in "${WIZ_EMPTY_EPICS[@]}"; do wizard::_info "  ${e}"; done
  fi
  if (( n_stuck > 0 )); then
    wizard::_warn "${n_stuck} epic(s) stuck (no ready, no in_progress, tasks remain) — broken deps or orphan claim?"
    local e summary
    for e in "${WIZ_STUCK_EPICS[@]}"; do
      summary=$(flowctl::epic_state_summary "$e")
      wizard::_info "  ${e}  [todo=$(printf '%s' "$summary" | cut -f4) blocked=$(printf '%s' "$summary" | cut -f3)]"
    done
  fi
  if (( n_locks > 0 )); then
    wizard::_warn "${n_locks} stale lock file(s) (>${RAFITA_STALE_LOCK_MINUTES:-60}m old)"
  fi
  return 1
}

# -----------------------------------------------------------------------------
# 2) Sanitize

wizard::_apply_release_claims() {
  local row tid count=0
  for row in "${WIZ_STALE_CLAIMS[@]}"; do
    tid=$(printf '%s' "$row" | cut -f1)
    flowctl::release_claim "$tid" && count=$((count + 1))
  done
  wizard::_ok "released ${count} stuck claim(s)"
  WIZ_STALE_CLAIMS=()
}

wizard::_apply_close_done() {
  local e count=0
  for e in "${WIZ_DONE_EPICS[@]}"; do
    flowctl::close_epic "$e" && count=$((count + 1))
  done
  wizard::_ok "closed ${count} fully-done epic(s)"
  # Remove from open list too.
  local kept=()
  for e in "${WIZ_OPEN_EPICS[@]}"; do
    local skip=0 d
    for d in "${WIZ_DONE_EPICS[@]}"; do [[ "$e" == "$d" ]] && skip=1 && break; done
    (( skip == 0 )) && kept+=("$e")
  done
  WIZ_OPEN_EPICS=("${kept[@]}")
  WIZ_DONE_EPICS=()
}

wizard::_apply_close_empty() {
  local e count=0
  for e in "${WIZ_EMPTY_EPICS[@]}"; do
    flowctl::close_epic "$e" && count=$((count + 1))
  done
  wizard::_ok "closed ${count} empty epic(s)"
  local kept=()
  for e in "${WIZ_OPEN_EPICS[@]}"; do
    local skip=0 d
    for d in "${WIZ_EMPTY_EPICS[@]}"; do [[ "$e" == "$d" ]] && skip=1 && break; done
    (( skip == 0 )) && kept+=("$e")
  done
  WIZ_OPEN_EPICS=("${kept[@]}")
  WIZ_EMPTY_EPICS=()
}

wizard::_apply_remove_locks() {
  local row name count=0
  for row in "${WIZ_STALE_LOCKS[@]}"; do
    name=$(printf '%s' "$row" | cut -f1)
    flowctl::remove_lock "$name" && count=$((count + 1))
  done
  wizard::_ok "removed ${count} stale lock(s)"
  WIZ_STALE_LOCKS=()
}

wizard::sanitize() {
  local has_any=0
  (( ${#WIZ_STALE_CLAIMS[@]} > 0 )) && has_any=1
  (( ${#WIZ_DONE_EPICS[@]} > 0 )) && has_any=1
  (( ${#WIZ_EMPTY_EPICS[@]} > 0 )) && has_any=1
  (( ${#WIZ_STALE_LOCKS[@]} > 0 )) && has_any=1
  (( has_any == 0 )) && return 0

  while true; do
    wizard::_section "Sanitize"
    local opts=()
    (( ${#WIZ_STALE_CLAIMS[@]} > 0 )) && { wizard::_info "[1] release ${#WIZ_STALE_CLAIMS[@]} stuck claim(s)"; opts+=(1); }
    (( ${#WIZ_DONE_EPICS[@]}    > 0 )) && { wizard::_info "[2] close ${#WIZ_DONE_EPICS[@]} fully-done epic(s)"; opts+=(2); }
    (( ${#WIZ_EMPTY_EPICS[@]}   > 0 )) && { wizard::_info "[3] close ${#WIZ_EMPTY_EPICS[@]} empty epic(s)"; opts+=(3); }
    (( ${#WIZ_STALE_LOCKS[@]}   > 0 )) && { wizard::_info "[4] remove ${#WIZ_STALE_LOCKS[@]} stale lock(s)"; opts+=(4); }
    wizard::_info "[a] apply all of the above"
    wizard::_info "[s] skip sanitize and continue"

    local ans; ans=$(wizard::_read "  choice> ")
    local applied=0
    case "$ans" in
      1) (( ${#WIZ_STALE_CLAIMS[@]} > 0 )) && { wizard::_apply_release_claims; applied=1; } ;;
      2) (( ${#WIZ_DONE_EPICS[@]}    > 0 )) && { wizard::_apply_close_done;    applied=1; } ;;
      3) (( ${#WIZ_EMPTY_EPICS[@]}   > 0 )) && { wizard::_apply_close_empty;   applied=1; } ;;
      4) (( ${#WIZ_STALE_LOCKS[@]}   > 0 )) && { wizard::_apply_remove_locks;  applied=1; } ;;
      a|A)
        (( ${#WIZ_STALE_CLAIMS[@]} > 0 )) && wizard::_apply_release_claims
        (( ${#WIZ_DONE_EPICS[@]}    > 0 )) && wizard::_apply_close_done
        (( ${#WIZ_EMPTY_EPICS[@]}   > 0 )) && wizard::_apply_close_empty
        (( ${#WIZ_STALE_LOCKS[@]}   > 0 )) && wizard::_apply_remove_locks
        return 0
        ;;
      s|S|"") return 0 ;;
      *) wizard::_warn "unknown choice: $ans"; sleep 1 ;;
    esac

    if (( applied )); then
      # Re-scan from scratch so external changes (other worktrees, manual
      # edits, claim TTLs) also reflect — not just the in-memory bookkeeping.
      wizard::diagnose
      wizard::_clear
      wizard::_print_findings || true
    fi

    local more=0
    (( ${#WIZ_STALE_CLAIMS[@]} > 0 )) && more=1
    (( ${#WIZ_DONE_EPICS[@]}    > 0 )) && more=1
    (( ${#WIZ_EMPTY_EPICS[@]}   > 0 )) && more=1
    (( ${#WIZ_STALE_LOCKS[@]}   > 0 )) && more=1
    (( more == 0 )) && return 0
  done
}

# -----------------------------------------------------------------------------
# 3) Pick epic
# Lists open epics (post-sanitize) with state counts. Orders: epics with
# in_progress first (resume work), then with ready tasks, then the rest.

wizard::_render_epic_table() {
  local tmp; tmp=$(mktemp)
  local e summary ready ip blocked todo done total deps prio
  for e in "${WIZ_OPEN_EPICS[@]}"; do
    summary=$(flowctl::epic_state_summary "$e")
    ready=$(printf '%s' "$summary" | cut -f1)
    ip=$(printf    '%s' "$summary" | cut -f2)
    blocked=$(printf '%s' "$summary" | cut -f3)
    todo=$(printf  '%s' "$summary" | cut -f4)
    done=$(printf  '%s' "$summary" | cut -f5)
    total=$(printf '%s' "$summary" | cut -f6)
    deps=$(flowctl::epic_depends_on "$e")
    if   (( ip      > 0 )); then prio=0
    elif (( ready   > 0 )); then prio=1
    elif (( blocked > 0 )); then prio=2
    else                          prio=3
    fi
    printf '%d\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$prio" "$e" "$ready" "$ip" "$blocked" "$done" "$total" "${deps:-—}" >> "$tmp"
  done
  sort -k1,1n -k2,2 "$tmp"
  rm -f "$tmp"
}

wizard::pick_epic() {
  WIZARD_EPIC=""
  # Clear leftover sanitize output and re-render with the latest state.
  wizard::_clear
  wizard::_print_findings || true

  if (( ${#WIZ_OPEN_EPICS[@]} == 0 )); then
    wizard::_section "Epic picker"
    wizard::_warn "no open epics remain; nothing to do"
    return 1
  fi

  wizard::_section "Pick an epic"
  local rendered; rendered=$(wizard::_render_epic_table)

  printf '  %s%-3s %-46s %5s %5s %5s %5s %5s  %s%s\n' \
    "${UI_DIM:-}" "#" "epic" "ready" "prog" "blkd" "done" "total" "deps" "${UI_RESET:-}" >&2

  local -a choices=()
  local idx=1 line
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local e ready ip blocked done total deps
    e=$(printf       '%s' "$line" | cut -f2)
    ready=$(printf   '%s' "$line" | cut -f3)
    ip=$(printf      '%s' "$line" | cut -f4)
    blocked=$(printf '%s' "$line" | cut -f5)
    done=$(printf    '%s' "$line" | cut -f6)
    total=$(printf   '%s' "$line" | cut -f7)
    deps=$(printf    '%s' "$line" | cut -f8)
    local marker="" color="${UI_RESET:-}"
    if   (( ip    > 0 )); then marker=">"; color="${UI_YELLOW:-}"
    elif (( ready > 0 )); then marker="*"; color="${UI_GREEN:-}"
    fi
    printf '  %s%-3s %-46s %5d %5d %5d %5d %5d  %s%s\n' \
      "$color" "${idx}${marker}" "$e" "$ready" "$ip" "$blocked" "$done" "$total" "$deps" "${UI_RESET:-}" >&2
    choices+=("$e")
    idx=$((idx + 1))
  done <<< "$rendered"

  printf '\n  [A] all open epics (default loop)\n  [Q] quit\n' >&2
  while true; do
    local ans; ans=$(wizard::_read "  choice> ")
    case "$ans" in
      ""|a|A) WIZARD_EPIC=""; return 0 ;;
      q|Q) return 2 ;;
      *)
        if [[ "$ans" =~ ^[0-9]+$ ]] && (( ans >= 1 && ans <= ${#choices[@]} )); then
          WIZARD_EPIC="${choices[$((ans - 1))]}"
          return 0
        fi
        wizard::_warn "invalid choice: $ans"
        ;;
    esac
  done
}

# -----------------------------------------------------------------------------
# 4) Pick mode (only when a specific epic was selected)

wizard::pick_mode() {
  WIZARD_CONTINUE=0
  WIZARD_CLOSER_ONLY=0
  [[ -z "$WIZARD_EPIC" ]] && return 0

  local summary; summary=$(flowctl::epic_state_summary "$WIZARD_EPIC")
  local ip done total
  ip=$(printf    '%s' "$summary" | cut -f2)
  done=$(printf  '%s' "$summary" | cut -f5)
  total=$(printf '%s' "$summary" | cut -f6)

  wizard::_section "Mode for ${WIZARD_EPIC}"
  wizard::_info "[1] normal run (DEV→REVIEW per task)   [default]"
  if (( ip > 0 )); then
    wizard::_info "[2] continue in-progress task first"
  fi
  if (( done > 0 && total > 0 && done == total )); then
    wizard::_info "[3] closer-only (skip DEV/REVIEW; close + publish)"
  elif (( done > 0 )); then
    wizard::_info "[3] closer-only on already-done tasks"
  fi
  local ans; ans=$(wizard::_read "  choice> ")
  case "$ans" in
    ""|1) ;;
    2) WIZARD_CONTINUE=1 ;;
    3) WIZARD_CLOSER_ONLY=1 ;;
    *) wizard::_warn "invalid; using normal" ;;
  esac
}

# -----------------------------------------------------------------------------
# Public entry point. Returns:
#   0 — user chose to proceed (epic_arg / continue / closer set via globals)
#   2 — user chose to quit
wizard::run() {
  wizard::should_run || {
    common::log INFO "wizard skipped (disabled or non-tty)"
    # Even when not interactive, surface the run header so logs/CI have
    # context, and run a silent diagnose so the log captures findings.
    ui::header
    ui::config_summary
    wizard::diagnose
    local n_claims="${#WIZ_STALE_CLAIMS[@]}"
    local n_done="${#WIZ_DONE_EPICS[@]}"
    local n_empty="${#WIZ_EMPTY_EPICS[@]}"
    local n_stuck="${#WIZ_STUCK_EPICS[@]}"
    local n_locks="${#WIZ_STALE_LOCKS[@]}"
    if (( n_claims + n_done + n_empty + n_stuck + n_locks > 0 )); then
      common::log WARN "pre-flight findings: stuck_claims=${n_claims} done_epics=${n_done} empty_epics=${n_empty} stuck_epics=${n_stuck} stale_locks=${n_locks} (run interactively to triage)"
    fi
    return 0
  }

  # Clear leftover terminal noise so the wizard starts on a clean canvas.
  wizard::_clear
  ui::header
  ui::config_summary
  wizard::diagnose
  wizard::_print_findings || true
  wizard::sanitize
  wizard::pick_epic
  local rc=$?
  (( rc == 2 )) && return 2
  (( rc != 0 )) && return $rc
  wizard::pick_mode
  return 0
}
