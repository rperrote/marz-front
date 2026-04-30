#!/usr/bin/env bash
# vcs.sh — push + PR/MR creation agnostic of provider (github/gitlab).

vcs::push() {
  local remote="${1:-origin}"
  if [[ "${RAFITA_PROVIDER:-github}" == "none" ]]; then
    common::log INFO "provider=none; skipping push"
    return 0
  fi
  git::has_remote || { common::log WARN "no git remote; skipping push"; return 0; }
  git::push_branch "$remote" >>"${RAFITA_RUN_LOG:-/dev/null}" 2>&1 || {
    common::warn "push failed"
    return 1
  }
}

# vcs::open_or_update_pr <epic_id> <title> <body_file>
# Prints PR/MR URL on stdout, empty on failure.
vcs::open_or_update_pr() {
  local epic="$1" title="$2" body_file="$3"
  local provider="${RAFITA_PROVIDER:-github}"
  case "$provider" in
    github) vcs::_gh_pr "$epic" "$title" "$body_file" ;;
    gitlab) vcs::_glab_mr "$epic" "$title" "$body_file" ;;
    none) common::log INFO "provider=none; skipping PR"; return 0 ;;
    *) common::warn "unknown provider: $provider"; return 1 ;;
  esac
}

vcs::_resolve_pr_base() {
  # Returns the base branch for PRs. Fallback chain: prBase config → dev → main → master.
  local current; current=$(git::current_branch)
  for candidate in "${RAFITA_PR_BASE:-}" dev main master; do
    [[ -z "$candidate" ]] && continue
    [[ "$candidate" == "$current" ]] && continue
    if git rev-parse --verify --quiet "$candidate" >/dev/null 2>&1; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  printf 'main'
}

vcs::_gh_pr() {
  local epic="$1" title="$2" body_file="$3"
  command -v gh >/dev/null 2>&1 || { common::warn "gh not installed"; return 1; }
  local base; base=$(vcs::_resolve_pr_base)
  local existing
  existing=$(gh pr view --json url -q .url 2>/dev/null || true)
  if [[ -n "$existing" ]]; then
    gh pr edit --title "$title" --body-file "$body_file" >/dev/null 2>&1 || true
    printf '%s\n' "$existing"
    return 0
  fi
  local url
  url=$(gh pr create --title "$title" --body-file "$body_file" --base "$base" --fill 2>/dev/null \
        | grep -Eo 'https?://[^ ]+' | tail -n1)
  [[ -z "$url" ]] && url=$(gh pr view --json url -q .url 2>/dev/null || true)
  printf '%s\n' "$url"
}

vcs::_glab_mr() {
  local epic="$1" title="$2" body_file="$3"
  command -v glab >/dev/null 2>&1 || { common::warn "glab not installed"; return 1; }
  local base; base=$(vcs::_resolve_pr_base)
  local url
  url=$(glab mr create --title "$title" --description "$(cat "$body_file")" \
        --target-branch "$base" --yes 2>/dev/null \
        | grep -Eo 'https?://[^ ]+' | tail -n1)
  printf '%s\n' "$url"
}
