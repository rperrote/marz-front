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
    common::log INFO "updated .gitignore with rafita runtime paths"
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
    common::log INFO "${branch} diverged from origin/${branch}; rebasing local commits"
    if ! git rebase "origin/${branch}" >/dev/null 2>&1; then
      git rebase --abort >/dev/null 2>&1 || true
      common::warn "rebase failed for ${branch} on origin/${branch}; resolve manually and rerun"
      return 1
    fi
  fi
  [[ "$prev" != "$branch" ]] && git checkout -q "$prev" 2>/dev/null || true
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

git::setup_epic_branch() {
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
        common::warn "epic ${epic} depende de ${d} pero no encontré rama '$(git::_local_branch_for_epic "$d")' (ni local ni en origin)"
        common::warn "abortando setup de ${epic}; corré la dep primero o creá la rama manualmente"
        return 1
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
      git checkout -q "$branch" || return 1
      git::_sync_branch_with_origin "$branch" || return 1
      common::log INFO "epic ${epic} reuses dependency branch: ${branch}"
      ui::info "branch = ${branch} (dep compartida)"
      return 0
    fi
  fi

  flowctl::set_epic_branch "$epic" "$branch"

  if git::_branch_local_exists "$branch"; then
    if git::_branch_checked_out_elsewhere "$branch"; then
      common::warn "branch ${branch} is checked out in another worktree; cannot checkout here"
      return 1
    fi
    git checkout -q "$branch" || return 1
    git::_sync_branch_with_origin "$branch" || return 1
    return 0
  fi

  if git::has_remote; then
    git fetch -q origin "$branch" 2>/dev/null || true
    if git::_branch_remote_exists "$branch"; then
      git branch -q "$branch" "origin/${branch}" 2>/dev/null || true
      git checkout -q "$branch" || return 1
      git::_sync_branch_with_origin "$branch" || return 1
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
    git checkout -q "$base" 2>/dev/null \
      || common::warn "checkout ${base} failed; branching from current HEAD"
    git::_sync_branch_with_origin "$base"
  else
    if (( ${#resolved_branches[@]} == 1 )); then
      base="${resolved_branches[0]}"
      git checkout -q "$base" \
        || { common::warn "checkout ${base} failed"; return 1; }
      common::log INFO "epic ${epic} basa en dep branch: ${base}"
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
      common::log INFO "epic ${epic} basa en merge de deps: ${resolved_branches[*]}"
      ui::info "branch base = ${base} (auto-merge de ${#resolved_branches[@]} deps)"
    fi
  fi

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
  local path="$1"
  local globs; globs=$(config::forbidden_paths_list)
  [[ -z "$globs" ]] && return 1
  while IFS= read -r glob; do
    [[ -z "$glob" ]] && continue
    # shellcheck disable=SC2053
    case "$path" in
      $glob) return 0 ;;
    esac
    # Also match ** anywhere.
    if [[ "$glob" == *"**"* ]]; then
      local rex
      rex=$(printf '%s' "$glob" | sed 's|\.|\\.|g; s|\*\*/|.*/|g; s|/\*\*|/.*|g; s|\*|[^/]*|g')
      if [[ "$path" =~ ^$rex$ ]]; then return 0; fi
    fi
  done <<< "$globs"
  return 1
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
