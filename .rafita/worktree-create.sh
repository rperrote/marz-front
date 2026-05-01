#!/usr/bin/env bash
# worktree-create.sh — create a git worktree for an isolated rafita run.
#
# Standalone: rafita.sh does NOT call this. You decide when and where to
# create a worktree.
#
# Usage:
#   ./.rafita/worktree-create.sh             # detached from configured base
#   ./.rafita/worktree-create.sh --from dev  # explicit start ref
#   ./.rafita/worktree-create.sh --name dbg  # custom suffix
#
# Output:
#   stdout = `cd '<absolute path>'` (always — designed for `eval`)
#   stderr = human messages
#
# Recommended usage (enters the worktree in your current shell):
#   eval "$(./.rafita/worktree-create.sh)"
#
# If you only want the path, read it from stderr or strip the `cd ` prefix.
#
# Config (from .rafita/config.json or env):
#   worktreeBase  RAFITA_WORKTREE_BASE  default: ../.rafita-worktrees
#
# No deps installation is performed — that is project-specific. Run
# `pnpm install` (or whatever) yourself inside the worktree if you need it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat << EOF
worktree-create.sh — create a git worktree for an isolated rafita run

Usage: $(basename "$0") [--from <ref>] [--name <suffix>] [-h]

Options:
  --from <ref>    Start ref for the worktree (default: prBase/dev/main/master)
  --name <suffix> Custom suffix for the worktree directory (default: run-<runid>)
  -h, --help      Show this help

Stdout: prints \`cd '<absolute path>'\` so it can be evaled directly.
Stderr: human messages.

Recommended:
  eval "\$($(basename "$0"))"
EOF
}

main() {
  local from_ref=""
  local name_suffix=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --from) from_ref="$2"; shift 2 ;;
      --name) name_suffix="$2"; shift 2 ;;
      *) echo "unknown arg: $1" >&2; usage >&2; exit 2 ;;
    esac
  done

  # Must be in a git repo.
  local repo_root
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null) \
    || { echo "worktree-create: not in a git repo" >&2; exit 1; }

  # Read worktreeBase/prBase from config or env (no full config loader needed).
  local cfg="$repo_root/.rafita/config.json"
  local base_dir="${RAFITA_WORKTREE_BASE:-}"
  local pr_base="${RAFITA_PR_BASE:-}"
  if [[ -z "$base_dir" && -f "$cfg" ]]; then
    base_dir=$(python3 -c "
import json,sys
try:
    d=json.load(open('$cfg'))
    print(d.get('worktreeBase') or '')
except Exception:
    pass
")
  fi
  if [[ -z "$pr_base" && -f "$cfg" ]]; then
    pr_base=$(python3 -c "
import json,sys
try:
    d=json.load(open('$cfg'))
    print(d.get('prBase') or '')
except Exception:
    pass
")
  fi
  [[ -z "$base_dir" ]] && base_dir="../.rafita-worktrees"

  # Resolve base_dir relative to repo root.
  local wt_parent
  if [[ "$base_dir" = /* ]]; then
    wt_parent="$base_dir"
  else
    wt_parent="$repo_root/$base_dir"
  fi
  mkdir -p "$wt_parent"
  wt_parent=$(cd "$wt_parent" && pwd)

  # Resolve start_ref.
  if [[ -z "$from_ref" ]]; then
    local candidate
    for candidate in "$pr_base" dev main master; do
      [[ -z "$candidate" ]] && continue
      if git rev-parse --verify --quiet "origin/${candidate}" >/dev/null 2>&1; then
        from_ref="origin/${candidate}"
        break
      fi
      if git rev-parse --verify --quiet "$candidate" >/dev/null 2>&1; then
        from_ref="$candidate"
        break
      fi
    done
    if [[ -z "$from_ref" ]]; then
      from_ref=$(git rev-parse --short HEAD)
    fi
  fi
  git rev-parse --verify --quiet "$from_ref" >/dev/null 2>&1 \
    || { echo "worktree-create: ref not found: $from_ref" >&2; exit 1; }

  # Resolve worktree path.
  local repo_name; repo_name=$(basename "$repo_root")
  local suffix
  if [[ -n "$name_suffix" ]]; then
    suffix="$name_suffix"
  else
    suffix="run-$(date -u +"%Y%m%dT%H%M%SZ")-$$"
  fi
  local wt_path="$wt_parent/${repo_name}-${suffix}"

  if [[ -e "$wt_path" ]]; then
    echo "worktree-create: path already exists: $wt_path" >&2
    exit 1
  fi

  echo "worktree-create: creating $wt_path detached at $from_ref" >&2
  git worktree add -q --detach "$wt_path" "$from_ref" \
    || { echo "worktree-create: git worktree add failed" >&2; exit 1; }

  echo "worktree-create: ready at $wt_path" >&2
  echo "worktree-create: hint — eval the stdout to enter it, then run rafita" >&2
  # Stdout is meant to be evaled. Single-quote the path; embedded single
  # quotes are escaped per POSIX shell rules ('"'"').
  local quoted="${wt_path//\'/\'\"\'\"\'}"
  printf "cd '%s'\n" "$quoted"
}

main "$@"
