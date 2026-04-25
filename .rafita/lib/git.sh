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
  local needed=( ".rafita/runs/" ".rafita/state.json" ".rafita/plans/" ".rafita/sessions/" )
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

git::setup_epic_branch() {
  # Args: epic_id. Creates (or switches to) <prefix><epic_id>. No-op in 'current' mode.
  local epic="$1"
  if [[ "${RAFITA_BRANCH_MODE:-new}" == "current" ]]; then
    common::log INFO "branch mode=current, staying on $(git::current_branch)"
    return 0
  fi
  local prefix="${RAFITA_BRANCH_PREFIX:-feature/claude/}"
  local branch="${prefix}${epic}"
  if git rev-parse --verify --quiet "$branch" >/dev/null; then
    git checkout -q "$branch"
    return 0
  fi
  # Branch doesn't exist yet — fetch + checkout prBase first so the new branch
  # starts from the correct base, not from wherever HEAD happens to be.
  local base; base=$(vcs::_resolve_pr_base)
  if git::has_remote; then
    git fetch -q origin "$base" 2>/dev/null || common::warn "fetch ${base} failed; branching from local"
  fi
  git checkout -q "$base" 2>/dev/null || common::warn "checkout ${base} failed; branching from current HEAD"
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
# When --current-branch is used the caller should pass RAFITA_PR_BASE, not
# the current branch itself. Fallback chain: prBase config → dev → main →
# master → HEAD~1 (last resort so diff is never against self).
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

  git diff "$base"...HEAD
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
# One worktree per run. Caller cd's into it; rafita continues to create/switch
# branches inside as usual. State/artifacts stay in the original repo (RAFITA_DIR
# must be absolute before calling this).

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
  local wt_path="$wt_parent/run-$run_id"

  if [[ -e "$wt_path" ]]; then
    common::fail "worktree path already exists: $wt_path"
  fi

  # Pick starting ref. In branchMode=current, mirror the user's current branch
  # so they can continue work in an isolated checkout. Otherwise start from the
  # resolved base branch (prBase → dev → main → master).
  # NOTE: vcs::_resolve_pr_base skips the current branch (correct for PR base
  # selection — you can't open a PR from dev to dev). For worktree start_ref
  # that skip is wrong: if user is on dev with prBase=dev, the worktree must
  # still start from dev, not silently fall through to main (which may be
  # behind and carry stale .flow/epics/*.json state).
  local start_ref
  if [[ "${RAFITA_BRANCH_MODE:-new}" == "current" ]]; then
    start_ref=$(git::current_branch)
  elif [[ -n "${RAFITA_PR_BASE:-}" ]] && git rev-parse --verify --quiet "${RAFITA_PR_BASE}" >/dev/null 2>&1; then
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
