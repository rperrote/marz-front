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
  else
    git checkout -q -b "$branch"
  fi
  common::log INFO "branch: $branch"
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

# Diff accumulated on current branch vs source branch (for final review).
git::diff_since_base() {
  local base="${1:-main}"
  # Fall back to last known common ancestor, else master, else empty.
  if ! git rev-parse --verify --quiet "$base" >/dev/null; then
    base=$(git rev-parse --verify --quiet master >/dev/null && echo master || echo HEAD~1)
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
