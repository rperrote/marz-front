#!/usr/bin/env bash
# git.sh — git wrappers. Enforces: no `git add -A`, forbidden path filter,
# scoped commits, snapshot/revert. Clean-tree check at bootstrap.

# shellcheck disable=SC2155

git::ensure_clean_tree() {
  # Allow changes inside .rafita/ (the tool's own dir) but nothing else.
  local dirty
  dirty=$(git status --porcelain=v1 | grep -v ' \.rafita/' | grep -v '^.. \.rafita/' || true)
  if [[ -n "$dirty" ]]; then
    common::warn "working tree has uncommitted changes outside .rafita/:"
    printf '%s\n' "$dirty" >&2
    common::fail "refusing to run with a dirty tree"
  fi
}

git::ensure_gitignore() {
  local ign=".gitignore"
  if [[ ! -f "$ign" ]]; then touch "$ign"; fi
  local needed=( ".rafita/runs/" ".rafita/plans/" ".rafita/sessions/" )
  local changed=0
  for path in "${needed[@]}"; do
    if ! grep -qxF "$path" "$ign" 2>/dev/null; then
      echo "$path" >> "$ign"
      changed=1
    fi
  done
  if (( changed )); then
    common::log DEBUG "updated .gitignore with rafita runtime paths"
  fi
}

git::current_branch() {
  git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD
}

# git::_branch_local_exists <branch>
git::_branch_local_exists() {
  git rev-parse --verify --quiet "refs/heads/$1" >/dev/null 2>&1
}

# git::_branch_remote_exists <branch>  (in origin/)
git::_branch_remote_exists() {
  git rev-parse --verify --quiet "refs/remotes/origin/$1" >/dev/null 2>&1
}

git::_branch_checked_out_elsewhere() {
  local branch="$1"
  local current; current=$(git::current_branch 2>/dev/null || echo "")
  [[ "$current" == "$branch" ]] && return 1
  git worktree list --porcelain 2>/dev/null \
    | awk -v b="refs/heads/${branch}" '$1=="branch" && $2==b {found=1} END{exit found?0:1}'
}

# git::_safe_checkout <branch> [extra args...]
# Wraps git checkout with retry-on-stat-mismatch. flowctl rewrites JSON files
# with identical content; this bumps mtime and confuses git's index, which
# then aborts checkout with "would be overwritten" even when the working tree
# matches HEAD byte-for-byte. We refresh the index, retry once. If the second
# attempt still fails, the diff is real and we propagate the error.
# Returns the rc of the underlying checkout.
git::_safe_checkout() {
  local branch="$1"; shift
  local err
  err=$(git checkout -q "$branch" "$@" 2>&1)
  local rc=$?
  if [[ $rc -eq 0 ]]; then return 0; fi
  # Detect the specific "phantom dirty" message and retry after a refresh.
  if [[ "$err" == *"would be overwritten by checkout"* ]]; then
    common::log DEBUG "checkout to ${branch} reported phantom dirty; refreshing index and retrying"
    git update-index --really-refresh >/dev/null 2>&1 || true
    err=$(git checkout -q "$branch" "$@" 2>&1)
    rc=$?
    if [[ $rc -eq 0 ]]; then
      common::log DEBUG "retry after index refresh succeeded for ${branch}"
      return 0
    fi
  fi
  # Surface the original error to stderr / log for postmortem.
  printf '%s\n' "$err" >&2
  common::log ERROR "checkout to ${branch} failed: ${err:0:200}"
  return $rc
}

# git::_sync_branch_with_origin <branch>
# Update local <branch> from origin/<branch>. Fast-forward when possible; if
# local and remote diverged, rebase local commits on top of origin/<branch>.
# Caller must ensure <branch> exists locally.
git::_sync_branch_with_origin() {
  local branch="$1"
  git::has_remote || return 0
  git fetch -q origin "$branch" 2>/dev/null || true
  git::_branch_remote_exists "$branch" || return 0
  if git::_branch_checked_out_elsewhere "$branch"; then
    common::warn "branch ${branch} is checked out in another worktree; cannot sync here"
    return 1
  fi
  local prev; prev=$(git::current_branch 2>/dev/null || echo "")
  git checkout -q "$branch" 2>/dev/null || return 1
  if ! git merge -q --ff-only "origin/${branch}" 2>/dev/null; then
    common::log DEBUG "${branch} diverged from origin/${branch}; rebasing local commits"
    if ! git rebase "origin/${branch}" >/dev/null 2>&1; then
      git rebase --abort >/dev/null 2>&1 || true
      common::warn "rebase failed for ${branch} on origin/${branch}; resolve manually and rerun"
      return 1
    fi
  fi
  [[ "$prev" != "$branch" ]] && git checkout -q "$prev" 2>/dev/null || true
}

# git::_merge_pr_base_into_current
# Merges the resolved prBase (dev/main/master/configured) into the currently
# checked-out branch. Use only when REUSING a pre-existing epic branch — fresh
# branches don't need it because they are created from prBase directly.
# Returns:
#   0 — already up-to-date OR merge applied cleanly
#   1 — merge conflict (caller should skip the epic; tree left clean)
git::_merge_pr_base_into_current() {
  local current; current=$(git::current_branch 2>/dev/null || echo "")
  [[ -z "$current" || "$current" == "HEAD" ]] && return 0
  local base; base=$(vcs::_resolve_pr_base 2>/dev/null || echo "")
  [[ -z "$base" ]] && return 0
  # Don't try to merge a branch into itself.
  [[ "$current" == "$base" ]] && return 0
  # Pull the latest base from origin if available, so the merge brings in
  # whatever was just pushed there (the whole point of this refresh).
  local merge_ref="$base"
  if git::has_remote; then
    git fetch -q origin "$base" 2>/dev/null || true
    if git rev-parse --verify --quiet "origin/${base}" >/dev/null 2>&1; then
      merge_ref="origin/${base}"
    fi
  fi
  git rev-parse --verify --quiet "$merge_ref" >/dev/null 2>&1 || return 0
  # Already up-to-date? Skip the no-op merge commit.
  if git merge-base --is-ancestor "$merge_ref" HEAD 2>/dev/null; then
    common::log DEBUG "branch ${current} already contains ${merge_ref}; skipping refresh merge"
    return 0
  fi
  ui::debug_phase "GIT" "merging ${merge_ref} into ${current} to refresh base..."
  if git merge -q --no-ff -m "rafita: refresh ${current} from ${merge_ref}" "$merge_ref" 2>/dev/null; then
    common::log INFO "refreshed ${current} from ${merge_ref}"
    ui::info "branch ${current} actualizado desde ${merge_ref}"
    return 0
  fi
  # Conflict: clean up and signal the caller to skip the epic. Running on a
  # stale base risks compounding conflicts on every commit.
  git merge --abort 2>/dev/null || true
  common::log WARN "merge conflict refreshing ${current} from ${merge_ref}; skipping epic — rebase manually"
  return 1
}

# git::_push_synced_branch
# After _sync_branch_with_origin (rebase) and/or _merge_pr_base_into_current
# (merge commit), the local branch may be ahead of origin. Push it now so the
# remote reflects the synced state and so push-after-task succeeds without
# fast-forward issues. Uses --force-with-lease when the rebase reordered
# history so we don't clobber concurrent remote updates we haven't seen.
# Returns:
#   0 — pushed cleanly, nothing to push, or no remote
#   1 — push rejected (likely concurrent update; caller should skip the epic)
git::_push_synced_branch() {
  git::has_remote || return 0
  [[ "${RAFITA_PROVIDER:-github}" == "none" ]] && return 0
  local branch; branch=$(git::current_branch 2>/dev/null || echo "")
  [[ -z "$branch" || "$branch" == "HEAD" ]] && return 0

  # Anything to push?
  local local_sha remote_sha
  local_sha=$(git rev-parse --verify "$branch" 2>/dev/null || true)
  remote_sha=$(git rev-parse --verify "origin/${branch}" 2>/dev/null || true)
  if [[ -z "$local_sha" ]]; then return 0; fi
  if [[ -n "$remote_sha" && "$local_sha" == "$remote_sha" ]]; then
    common::log DEBUG "branch ${branch} already in sync with origin; nothing to push"
    return 0
  fi

  # Decide flag: if local is ahead-only (origin is ancestor of local), regular
  # push works. Otherwise rebase reordered history and we need --force-with-lease.
  # The lease syntax is <refname>:<expected_sha> where <refname> is the remote
  # ref name without the "origin/" prefix.
  local push_args=(push -u origin "$branch")
  if [[ -n "$remote_sha" ]] && ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
    push_args=(push --force-with-lease="${branch}:${remote_sha}" -u origin "$branch")
    common::log DEBUG "history of ${branch} diverged from origin; using --force-with-lease"
  fi

  ui::debug_phase "GIT" "pushing synced ${branch} to origin..."
  if git "${push_args[@]}" >/dev/null 2>&1; then
    common::log INFO "pushed synced ${branch} to origin"
    return 0
  fi
  common::log WARN "push of synced ${branch} rejected (concurrent update?); skipping epic"
  return 1
}

git::_local_branch_for_epic() {
  local epic="$1"
  local stored; stored=$(flowctl::epic_branch_name "$epic" 2>/dev/null || echo "")
  if [[ -n "$stored" ]]; then
    printf '%s' "$stored"
  else
    printf '%s%s' "${RAFITA_BRANCH_PREFIX:-feature/claude/}" "$epic"
  fi
}

# git::_resolve_dep_branch <dep_epic_id>
# Returns the local branch name to use as base for a dep, or empty if not
# resolvable. Side effect: creates a local tracking branch from origin/<...>
# if only the remote exists. Updates the local copy from origin if possible.
git::_resolve_dep_branch() {
  local dep_epic="$1"
  local dep_branch; dep_branch=$(git::_local_branch_for_epic "$dep_epic")

  if git::_branch_local_exists "$dep_branch"; then
    git::_sync_branch_with_origin "$dep_branch" || return 1
    printf '%s' "$dep_branch"
    return 0
  fi
  # Local missing — try to fetch from origin.
  if git::has_remote; then
    git fetch -q origin "$dep_branch" 2>/dev/null || true
    if git::_branch_remote_exists "$dep_branch"; then
      git branch -q "$dep_branch" "origin/${dep_branch}" 2>/dev/null || true
      printf '%s' "$dep_branch"
      return 0
    fi
  fi
  printf ''
  return 1
}

# git::_stash_flow_if_dirty
# Stashes any uncommitted changes whose paths fall under rafita-managed
# directories (.flow/ + .rafita/ — both contain state mutated by the wizard
# and by flowctl). Bails without stashing if there are changes outside those
# directories (they are the user's; preserving them is more important than
# auto-recovery). Sets RAFITA_FLOW_STASH_REF on success.
git::_stash_flow_if_dirty() {
  RAFITA_FLOW_STASH_REF=""
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  if [[ -z "$porcelain" ]]; then
    common::log DEBUG "stash check: working tree already clean"
    return 0
  fi
  common::log DEBUG "stash check: porcelain has $(printf '%s' "$porcelain" | wc -l | tr -d ' ') line(s)"

  # Parse paths from porcelain (cols 1-2 are flags, col 3+ is path; rename
  # entries have "old -> new" — we only care about the destination).
  local foreign=""
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local p="${line:3}"
    # Rename: "old -> new"; take the new path.
    if [[ "$p" == *' -> '* ]]; then p="${p##* -> }"; fi
    # Strip surrounding quotes if git used them for special chars.
    p="${p#\"}"; p="${p%\"}"
    case "$p" in
      .flow/*|.rafita/*) ;;  # ours, ok to stash
      *)
        foreign="$p"
        break
        ;;
    esac
  done <<< "$porcelain"

  if [[ -n "$foreign" ]]; then
    common::log WARN "dirty entries outside .flow/ and .rafita/ present (e.g. ${foreign}); not stashing — checkout will likely fail. Commit or discard those first."
    return 0
  fi

  local msg="rafita-flow ${RAFITA_RUN_ID:-?} ${RAFITA_CURRENT_EPIC:-?}"
  # Note: we must capture the stash ref reliably. `git stash push` with
  # pathspecs only stashes matching paths but git's pathspec parsing doesn't
  # accept "-- .flow/ .rafita/" reliably across versions when one of them is
  # absent. Stash everything (we already verified nothing foreign is dirty),
  # which is simpler and guaranteed.
  if git stash push --include-untracked -m "$msg" >/dev/null 2>&1; then
    RAFITA_FLOW_STASH_REF=$(git stash list --format='%gd' | head -1)
    if [[ -z "$RAFITA_FLOW_STASH_REF" ]]; then
      common::log WARN "stash push reported success but no stash recorded; aborting"
      return 1
    fi
    common::log INFO "stashed rafita state changes as ${RAFITA_FLOW_STASH_REF} (${msg})"
  else
    common::log WARN "git stash push failed; checkout will likely fail"
  fi
}

# git::_pop_flow_stash
# Restore the .flow/ stash created by _stash_flow_if_dirty onto the current
# branch. On conflict, leaves the stash in `git stash list` and warns; the
# user can resolve manually. Idempotent: no-op when no stash was created.
git::_pop_flow_stash() {
  [[ -z "${RAFITA_FLOW_STASH_REF:-}" ]] && return 0
  local ref="$RAFITA_FLOW_STASH_REF"
  RAFITA_FLOW_STASH_REF=""
  if git stash pop "$ref" >/dev/null 2>&1; then
    common::log DEBUG "popped .flow/ stash onto $(git::current_branch)"
    return 0
  fi
  common::log WARN ".flow/ stash pop failed (conflict?); kept as ${ref} — run 'git stash list' to inspect"
  return 0
}

git::setup_epic_branch() {
  # Wrapper. Steps in order:
  #   1) Stash any rafita-owned dirty state (.flow/, .rafita/) so checkouts
  #      don't trip over uncommitted wizard mutations.
  #   2) Move to the epic branch (create / sync / merge prBase / push).
  #   3) Pop the stash onto the epic branch so the .flow updates travel with
  #      it (where they belong).
  #   4) Belt-and-suspenders: verify we ended up on the right branch and the
  #      tree is clean. If not, fail loudly.
  local epic="$1"
  git::_stash_flow_if_dirty

  local rc=0
  git::_setup_epic_branch_inner "$epic" || rc=$?

  git::_pop_flow_stash

  if [[ $rc -ne 0 ]]; then
    common::log WARN "setup_epic_branch for ${epic} failed (rc=${rc}); current branch: $(git::current_branch 2>/dev/null || echo unknown)"
    return $rc
  fi

  # Verify final state. Two invariants we must hold before letting the epic run:
  #   - We're on the expected epic branch (not stranded on dev/etc.)
  #   - Working tree is clean (any popped flow changes get committed by the
  #     first task; if the pop conflicted there is no clean state to start from)
  local expected; expected=$(git::_local_branch_for_epic "$epic" 2>/dev/null || echo "")
  local current;  current=$(git::current_branch 2>/dev/null || echo "")
  # Dep-shared branches use the dep's name, not the epic's; only enforce the
  # match when no deps were resolved (own branch path).
  local deps_csv; deps_csv=$(flowctl::epic_depends_on "$epic" 2>/dev/null)
  if [[ -z "$deps_csv" || "${RAFITA_BRANCH_BY_EPIC:-0}" == "1" ]]; then
    if [[ "$current" != "$expected" ]]; then
      common::log ERROR "setup_epic_branch: ended on '${current}' but expected '${expected}'; refusing to run epic on wrong branch"
      return 1
    fi
  fi
  common::log INFO "branch ready: ${current} (epic ${epic})"
  return 0
}

git::_setup_epic_branch_inner() {
  # Args: epic_id. Creates/switches to the branch assigned to the epic. By
  # default, epics that depend on another epic reuse that dependency branch.
  local epic="$1"
  local own_branch; own_branch=$(git::_local_branch_for_epic "$epic")
  local branch="$own_branch"
  local deps_csv; deps_csv=$(flowctl::epic_depends_on "$epic")
  local -a resolved_branches=()

  if [[ -n "$deps_csv" ]]; then
    local IFS=','
    local -a deps
    # shellcheck disable=SC2206
    deps=( $deps_csv )
    unset IFS

    local d resolved
    for d in "${deps[@]}"; do
      [[ -z "$d" ]] && continue
      resolved=$(git::_resolve_dep_branch "$d") || true
      if [[ -z "$resolved" ]]; then
        common::warn "epic ${epic} depende de ${d} pero no encontré rama '$(git::_local_branch_for_epic "$d")' (ni local ni en origin); usaré prBase como base"
        continue
      fi
      case " ${resolved_branches[*]:-} " in
        *" ${resolved} "*) ;;
        *) resolved_branches+=("$resolved") ;;
      esac
    done

    if [[ "${RAFITA_BRANCH_BY_EPIC:-0}" != "1" && ${#resolved_branches[@]} -eq 1 ]]; then
      branch="${resolved_branches[0]}"
      flowctl::set_epic_branch "$epic" "$branch"
      if git::_branch_checked_out_elsewhere "$branch"; then
        common::warn "branch ${branch} is checked out in another worktree; cannot reuse it here"
        return 1
      fi
      git::_safe_checkout "$branch" || return 1
      git::_sync_branch_with_origin "$branch" || return 1
      common::log DEBUG "epic ${epic} reuses dependency branch: ${branch}"
      ui::info "branch = ${branch} (dep compartida)"
      return 0
    fi
  fi

  flowctl::set_epic_branch "$epic" "$branch"

  if git::_branch_local_exists "$branch"; then
    common::log DEBUG "epic ${epic}: local branch '${branch}' exists; checking out"
    if git::_branch_checked_out_elsewhere "$branch"; then
      common::warn "branch ${branch} is checked out in another worktree; cannot checkout here"
      return 1
    fi
    git::_safe_checkout "$branch" || return 1
    # Verify checkout actually moved us (some failures are silent).
    local on; on=$(git::current_branch 2>/dev/null || echo "")
    if [[ "$on" != "$branch" ]]; then
      common::log ERROR "checkout reported success but HEAD is on '${on}', not '${branch}'"
      return 1
    fi
    common::log DEBUG "on ${branch}; syncing with origin"
    git::_sync_branch_with_origin "$branch" || return 1
    common::log DEBUG "merging prBase into ${branch}"
    git::_merge_pr_base_into_current || return 1
    common::log DEBUG "pushing synced ${branch} to origin"
    git::_push_synced_branch || return 1
    return 0
  fi

  if git::has_remote; then
    common::log DEBUG "epic ${epic}: local branch '${branch}' missing; checking origin"
    git fetch -q origin "$branch" 2>/dev/null || true
    if git::_branch_remote_exists "$branch"; then
      common::log DEBUG "epic ${epic}: remote branch found; creating local from origin/${branch}"
      git branch -q "$branch" "origin/${branch}" 2>/dev/null || true
      git::_safe_checkout "$branch" || return 1
      local on; on=$(git::current_branch 2>/dev/null || echo "")
      if [[ "$on" != "$branch" ]]; then
        common::log ERROR "checkout reported success but HEAD is on '${on}', not '${branch}'"
        return 1
      fi
      git::_sync_branch_with_origin "$branch" || return 1
      git::_merge_pr_base_into_current || return 1
      git::_push_synced_branch || return 1
      return 0
    fi
  fi

  # Branch doesn't exist. Pick the right base.
  #   - No deps         → prBase (dev / main / master).
  #   - 1 dep           → branch of that dep in --branch-by-epic mode.
  #   - N deps          → temp branch with all deps merged together; abort
  #                       this epic (rc=1) if a merge conflict appears so
  #                       the user can resolve it manually.
  local base=""
  if (( ${#resolved_branches[@]} == 0 )); then
    base=$(vcs::_resolve_pr_base)
    if git::has_remote; then
      git fetch -q origin "$base" 2>/dev/null \
        || common::warn "fetch ${base} failed; branching from local"
    fi
    if ! git checkout -q "$base" 2>/dev/null; then
      # Checkout failed — typically because $base is checked out in another
      # worktree. Fall back to a detached checkout at the resolved SHA so
      # the new branch is created from the right commit (origin/$base if
      # available, otherwise local $base) instead of whatever HEAD happens
      # to be from a previous epic's dep branch.
      local base_sha=""
      if git::has_remote && git rev-parse --verify --quiet "origin/${base}" >/dev/null 2>&1; then
        base_sha=$(git rev-parse --verify "origin/${base}" 2>/dev/null || true)
      fi
      if [[ -z "$base_sha" ]] && git rev-parse --verify --quiet "$base" >/dev/null 2>&1; then
        base_sha=$(git rev-parse --verify "$base" 2>/dev/null || true)
      fi
      if [[ -n "$base_sha" ]]; then
        git checkout -q --detach "$base_sha" \
          || { common::warn "detached checkout ${base_sha} failed; branching from current HEAD"; }
        common::log DEBUG "checkout ${base} unavailable (likely another worktree); using detached ${base_sha:0:8}"
      else
        common::warn "checkout ${base} failed; branching from current HEAD"
      fi
    else
      git::_sync_branch_with_origin "$base"
    fi
  else
    if (( ${#resolved_branches[@]} == 1 )); then
      base="${resolved_branches[0]}"
      git checkout -q "$base" \
        || { common::warn "checkout ${base} failed"; return 1; }
      common::log DEBUG "epic ${epic} basa en dep branch: ${base}"
      ui::info "branch base = ${base} (dep única)"
    else
      # Multiple deps → auto-merge into a throwaway temp branch.
      base="rafita-tmp-base/${epic}"
      # Clean up any leftover from a previous interrupted attempt.
      if git::_branch_local_exists "$base"; then
        git branch -qD "$base" 2>/dev/null || true
      fi
      # Start temp from the first dep.
      git checkout -q "${resolved_branches[0]}" \
        || { common::warn "checkout ${resolved_branches[0]} failed"; return 1; }
      ui::debug_phase "GIT" "creating temp base branch ${base}..."
      git checkout -q -b "$base" \
        || { common::warn "creating temp base ${base} failed"; return 1; }
      # Merge the rest.
      local i
      for (( i=1; i<${#resolved_branches[@]}; i++ )); do
        local other="${resolved_branches[$i]}"
        if ! git merge -q --no-ff -m "rafita: merge ${other} into base for ${epic}" "$other" 2>/dev/null; then
          common::warn "merge conflict combinando deps de ${epic} (${other} sobre ${resolved_branches[0]} ...)"
          common::warn "abortá el merge a mano (git merge --abort) y resolvé las deps antes de re-correr"
          # Abort the in-progress merge so we leave the worktree clean.
          git merge --abort 2>/dev/null || true
          # Drop temp branch so a retry can rebuild it cleanly.
          git checkout -q "${resolved_branches[0]}" 2>/dev/null || true
          git branch -qD "$base" 2>/dev/null || true
          return 1
        fi
      done
      common::log DEBUG "epic ${epic} basa en merge de deps: ${resolved_branches[*]}"
      ui::info "branch base = ${base} (auto-merge de ${#resolved_branches[@]} deps)"
    fi
  fi

  ui::debug_phase "GIT" "creating branch ${branch} from ${base}..."
  git checkout -q -b "$branch"
  common::log INFO "branch: $branch (from ${base})"
}

git::snapshot_head() {
  git rev-parse HEAD
}

git::revert_to() {
  local ref="$1"
  git reset --hard -q "$ref"
  # Also discard any untracked files created during the task.
  git clean -fd -q .
}

git::changed_paths_since() {
  local ref="$1"
  git diff --name-only "$ref" HEAD
  # Also include currently unstaged/untracked.
  git status --porcelain=v1 | awk '{ if ($1 == "??") print $2; else print $2 }'
}

# Returns 0 if <path> matches any of the forbidden globs.
git::is_forbidden_path() {
  local p="$1"
  local globs; globs=$(config::forbidden_paths_list)
  [[ -z "$globs" ]] && return 1
  while IFS= read -r glob; do
    [[ -z "$glob" ]] && continue
    # shellcheck disable=SC2053
    case "$p" in
      $glob) return 0 ;;
    esac
    # Also match ** anywhere.
    if [[ "$glob" == *"**"* ]]; then
      local rex
      rex=$(printf '%s' "$glob" | sed 's|\.|\\.|g; s|\*\*/|.*/|g; s|/\*\*|/.*|g; s|\*|[^/]*|g')
      if [[ "$p" =~ ^$rex$ ]]; then return 0; fi
    fi
  done <<< "$globs"
  return 1
}

# git::sweep_residuals_before_epic_switch <epic>
# Inter-epic guard. Detects any uncommitted changes left in the working tree
# at the END of an epic and commits them as a "chore(<epic>): residual ..."
# stash on the current branch, then hard-resets so the next epic starts on a
# clean tree. The double-check (commit + reset --hard + clean) is intentional:
# the commit preserves work for postmortem; the reset guarantees isolation
# even if the commit failed (e.g. all paths forbidden). Untracked files
# outside .gitignore are also wiped via `git clean -fd`. RAFITA-runtime dirs
# (.rafita/) are already in .gitignore, so they are preserved.
#
# Returns 0 always; this is best-effort cleanup.
git::sweep_residuals_before_epic_switch() {
  local epic="$1"
  # Anything to clean? --porcelain returns non-empty if there are untracked,
  # modified, staged, deleted, or renamed entries.
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  if [[ -z "$porcelain" ]]; then
    common::log DEBUG "epic ${epic} ended with clean working tree"
    return 0
  fi

  # Safety guard: only commit residuals to the epic's branch. If the current
  # branch is something else (typically because setup_epic_branch failed and
  # we never moved off prBase / dev), DON'T commit — that's how dev ended up
  # with chore residual commits from fn-18. Just reset+clean to leave a clean
  # tree for the next attempt; the wizard's flow stash (if any) was already
  # popped/lost by setup_epic_branch's failure path.
  local current; current=$(git::current_branch 2>/dev/null || echo "")
  local expected; expected=$(git::_local_branch_for_epic "$epic" 2>/dev/null || echo "")
  if [[ -z "$current" || "$current" == "HEAD" ]]; then
    common::log WARN "epic ${epic} ended in detached HEAD with residuals; resetting without commit"
    git reset --hard HEAD >/dev/null 2>&1 || true
    git clean -fd >/dev/null 2>&1 || true
    return 0
  fi
  if [[ -n "$expected" && "$current" != "$expected" ]]; then
    common::log WARN "epic ${epic} ended with residuals but current branch is '${current}' (expected '${expected}'); resetting without commit to avoid contaminating ${current}"
    # Show what we're throwing away so it's visible in the log.
    common::log WARN "discarded residual paths: $(printf '%s' "$porcelain" | head -10 | tr '\n' '|')"
    git reset --hard HEAD >/dev/null 2>&1 || true
    git clean -fd >/dev/null 2>&1 || true
    return 0
  fi

  common::log WARN "epic ${epic} ended with residual changes; preserving as commit before switching"
  ui::debug_phase "GIT" "sweeping residuals from ${epic}..."

  # Stage everything (modified + untracked + deletions). The forbidden-path
  # filtering inside the helper unstages anything dangerous.
  if [[ -n "$current" && "$current" != "HEAD" ]]; then
    git add -A 2>/dev/null || true

    # Filter forbidden paths.
    local staged=() blocked=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && staged+=("$line")
    done < <(git diff --cached --name-only 2>/dev/null)

    local p
    for p in "${staged[@]}"; do
      if git::is_forbidden_path "$p"; then
        blocked+=("$p")
      fi
    done
    if (( ${#blocked[@]} )); then
      git reset HEAD -- "${blocked[@]}" >/dev/null 2>&1 || true
      for p in "${blocked[@]}"; do
        common::log WARN "residual on forbidden path (will be wiped by reset): $p"
      done
    fi

    # Commit only if there's something left after filtering.
    local kept; kept=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$kept" != "0" ]]; then
      local msg="chore(${epic}): residual changes after epic close

These changes were left in the working tree at the end of the epic and were
swept here to keep working-tree isolation between epics. Review and discard
if they were debug leftovers, or cherry-pick if they belong elsewhere.

Automated via rafita
run_id: ${RAFITA_RUN_ID:-?}"
      if git commit -q -m "$msg" 2>/dev/null; then
        common::log INFO "swept residuals into ${current} (commit $(git rev-parse --short HEAD 2>/dev/null))"
      else
        common::log WARN "residual commit failed on ${current}; will reset anyway"
      fi
    else
      common::log DEBUG "residual cleanup: only forbidden paths were dirty; nothing to commit"
    fi
  else
    common::log WARN "no current branch; cannot preserve residuals (detached HEAD?)"
  fi

  # Hard double-check: regardless of whether the commit succeeded, leave the
  # tree pristine so the next epic does not inherit anything.
  git reset --hard HEAD >/dev/null 2>&1 || true
  git clean -fd >/dev/null 2>&1 || true

  # Verify.
  local after; after=$(git status --porcelain 2>/dev/null)
  if [[ -n "$after" ]]; then
    common::log ERROR "working tree still dirty after sweep+reset+clean: ${after:0:200}"
  else
    common::log DEBUG "working tree clean after sweep"
  fi
  return 0
}

# git::commit_scoped task_id title
git::commit_scoped() {
  local task_id="$1" title="$2"

  # Stage everything first (deletes, renames, untracked) so we have a single
  # source of truth from the index.
  git add -A

  # Read exactly what is staged.
  local staged=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && staged+=("$line")
  done < <(git diff --cached --name-only)

  if (( ${#staged[@]} == 0 )); then
    common::log INFO "commit_scoped: nothing to commit"
    return 1
  fi

  local allowed=()
  local blocked=()
  for p in "${staged[@]}"; do
    if git::is_forbidden_path "$p"; then
      blocked+=("$p")
    else
      allowed+=("$p")
    fi
  done

  # Unstage forbidden paths so they don't leak into the commit.
  if (( ${#blocked[@]} )); then
    git reset HEAD -- "${blocked[@]}" >/dev/null 2>&1 || true
    for p in "${blocked[@]}"; do
      common::warn "forbidden path blocked from commit: $p"
      common::log WARN "forbidden path blocked: $p"
    done
  fi

  if (( ${#allowed[@]} == 0 )); then
    common::log WARN "commit_scoped: all paths blocked by forbidden list"
    return 1
  fi

  local trunc="${title:0:60}"
  local msg="feat(${task_id}): ${trunc}

Automated via rafita
run_id: ${RAFITA_RUN_ID:-?}"
  git commit -q -m "$msg"
}

# git::commit_closer <epic> <round>
# Commits any pending closer edits as a separate "chore(epic): close" commit.
# Same forbidden-path filtering as commit_scoped. Returns 1 if nothing to commit.
git::commit_closer() {
  local epic="$1" round="${2:-?}"
  git add -A

  local staged=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && staged+=("$line")
  done < <(git diff --cached --name-only)

  if (( ${#staged[@]} == 0 )); then
    common::log INFO "commit_closer: nothing to commit"
    return 1
  fi

  local blocked=()
  for p in "${staged[@]}"; do
    if git::is_forbidden_path "$p"; then
      blocked+=("$p")
    fi
  done
  if (( ${#blocked[@]} )); then
    git reset HEAD -- "${blocked[@]}" >/dev/null 2>&1 || true
    for p in "${blocked[@]}"; do
      common::warn "forbidden path blocked from closer commit: $p"
    done
  fi

  # Re-check after filtering.
  local kept
  kept=$(git diff --cached --name-only | wc -l | tr -d ' ')
  if [[ "$kept" == "0" ]]; then
    common::log WARN "commit_closer: all paths blocked by forbidden list"
    return 1
  fi

  local msg="chore(${epic}): close epic (round ${round})

Automated via rafita closer
run_id: ${RAFITA_RUN_ID:-?}"
  git commit -q -m "$msg"
}

# Diff accumulated on current branch vs base branch (for final review).
# Fallback chain: prBase config → dev → main → master → HEAD~1 (last resort
# so diff is never against self).
git::diff_since_base() {
  local requested="${1:-}"
  local current; current=$(git::current_branch)

  # Resolve base: skip if it equals current branch (would diff nothing).
  local base=""
  for candidate in "$requested" "${RAFITA_PR_BASE:-}" dev main master; do
    [[ -z "$candidate" ]] && continue
    [[ "$candidate" == "$current" ]] && continue
    if git rev-parse --verify --quiet "$candidate" >/dev/null 2>&1; then
      base="$candidate"
      break
    fi
  done

  # Last resort: one commit back.
  if [[ -z "$base" ]]; then
    base="HEAD~1"
  fi

  git diff "$base"...HEAD -- $(git::_diff_excludes)
}

# Emit pathspec excludes for diffs sent to LLM reviewers.
# Filters lockfiles, generated code, and other noise that adds no review value.
git::_diff_excludes() {
  printf '%s ' \
    ':(exclude)*.sum' \
    ':(exclude)*.lock' \
    ':(exclude)package-lock.json' \
    ':(exclude)pnpm-lock.yaml' \
    ':(exclude)yarn.lock' \
    ':(exclude)go.sum' \
    ':(exclude)Cargo.lock' \
    ':(exclude)Gemfile.lock' \
    ':(exclude)poetry.lock' \
    ':(exclude)*.pb.go' \
    ':(exclude)*_gen.go' \
    ':(exclude)*.generated.ts' \
    ':(exclude)*.generated.tsx' \
    ':(exclude)dist/**' \
    ':(exclude).flow/**'
}

git::push_branch() {
  local remote="${1:-origin}"
  local branch; branch=$(git::current_branch)
  git push -q -u "$remote" "$branch" 2>&1
}

git::has_remote() {
  git remote | grep -q .
}

# --- worktrees --------------------------------------------------------------
# DEPRECATED for production use. rafita.sh no longer manages worktrees —
# create one yourself with worktree-create.sh and run rafita inside it.
# These helpers remain for tests and manual scripts that may still call them.

# git::create_run_worktree <run_id>
# Prints the absolute worktree path on stdout.
git::create_run_worktree() {
  local run_id="$1"
  local base_dir="${RAFITA_WORKTREE_BASE:-../.rafita-worktrees}"
  # Resolve base_dir relative to the repo root (not cwd), then absolutize.
  local repo_root; repo_root=$(git rev-parse --show-toplevel)
  local wt_parent
  if [[ "$base_dir" = /* ]]; then
    wt_parent="$base_dir"
  else
    wt_parent="$repo_root/$base_dir"
  fi
  mkdir -p "$wt_parent"
  wt_parent=$(cd "$wt_parent" && pwd)
  # Worktree name: <repo-basename>-run-<run_id> for human readability when
  # multiple repos drop their worktrees in a shared parent dir.
  local repo_name; repo_name=$(basename "$repo_root")
  local wt_path="$wt_parent/${repo_name}-run-${run_id}"

  if [[ -e "$wt_path" ]]; then
    common::fail "worktree path already exists: $wt_path"
  fi

  # Pick starting ref from prBase → dev → main → master.
  local start_ref
  if [[ -n "${RAFITA_PR_BASE:-}" ]] && git rev-parse --verify --quiet "${RAFITA_PR_BASE}" >/dev/null 2>&1; then
    start_ref="${RAFITA_PR_BASE}"
  else
    start_ref=$(vcs::_resolve_pr_base)
  fi

  # Detached HEAD: later git::setup_epic_branch will create/switch branches
  # inside the worktree. A checked-out branch in the worktree would collide if
  # the same branch is also checked out in the main repo.
  git worktree add -q --detach "$wt_path" "$start_ref" \
    || common::fail "failed to create worktree at $wt_path from $start_ref"

  common::log INFO "worktree created: $wt_path (from $start_ref)"
  printf '%s' "$wt_path"
}

# git::remove_run_worktree <path>
git::remove_run_worktree() {
  local wt_path="$1"
  [[ -z "$wt_path" || ! -d "$wt_path" ]] && return 0
  # Caller must have cd'd out first.
  git worktree remove --force "$wt_path" 2>/dev/null \
    || common::warn "could not remove worktree at $wt_path (try: git worktree prune)"
  common::log INFO "worktree removed: $wt_path"
}
