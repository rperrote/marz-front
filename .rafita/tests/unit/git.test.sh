#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/config.sh"
source "$RAFITA_SCRIPTS_DIR/lib/git.sh"

setup() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_RUN_ID="test-git-$$"
  common::init_run_dir
  config::load "$RAFITA_DIR/config.json"
}

teardown() { teardown_tmp_repo; }

test_git_snapshot_and_revert() {
  local snap; snap=$(git::snapshot_head)
  echo "extra" > extra.txt
  git add extra.txt
  git commit -q -m "scratch"
  local head; head=$(git rev-parse HEAD)
  assert_ne "$snap" "$head" "head should have moved"
  git::revert_to "$snap"
  local head2; head2=$(git rev-parse HEAD)
  assert_eq "$snap" "$head2"
  assert_file_not_exists extra.txt
}

test_git_is_forbidden_path_dotenv() {
  assert_rc 0 git::is_forbidden_path ".env"
  assert_rc 0 git::is_forbidden_path ".env.local"
}

test_git_is_forbidden_path_glob_double_star() {
  assert_rc 0 git::is_forbidden_path ".rafita/runs/20260101/foo.log"
  assert_rc 0 git::is_forbidden_path ".rafita/plans/fn-1.md"
}

test_git_is_forbidden_path_allows_code() {
  assert_rc 1 git::is_forbidden_path "src/app.ts"
  assert_rc 1 git::is_forbidden_path "README.md"
}

test_git_commit_scoped_filters_forbidden() {
  echo "secret=xxx" > .env
  echo "hello" > src.ts
  mkdir -p src
  mv src.ts src/app.ts
  git::commit_scoped "fn-1" "add app and env" || true
  # .env must NOT be committed.
  local last; last=$(git log -1 --name-only --pretty=format: | sort -u | grep -v '^$' | tr '\n' ' ')
  assert_contains "$last" "src/app.ts"
  assert_not_contains "$last" ".env"
}

test_git_commit_scoped_nothing_to_commit_returns_error() {
  assert_rc 1 git::commit_scoped "fn-1" "nothing"
}

test_git_commit_scoped_message_format() {
  echo "x" > a.txt
  git::commit_scoped "fn-9.1" "implement feature x"
  local subject
  subject=$(git log -1 --pretty=%s)
  assert_eq "feat(fn-9.1): implement feature x" "$subject"
  local body
  body=$(git log -1 --pretty=%b)
  assert_contains "$body" "Automated via rafita"
}

test_git_ensure_gitignore_adds_entries() {
  rm -f .gitignore
  git::ensure_gitignore
  local content; content=$(<.gitignore)
  assert_contains "$content" ".rafita/runs/"
  assert_contains "$content" ".rafita/plans/"
}

test_git_ensure_clean_tree_fails_on_dirty() {
  echo "dirty" > dirty.txt
  # Run in subshell so assert_rc can capture exit code from common::fail.
  ( git::ensure_clean_tree ) 2>/dev/null
  local rc=$?
  assert_ne "0" "$rc" "expected failure on dirty tree"
  rm -f dirty.txt
}

test_git_ensure_clean_tree_allows_rafita_internals() {
  echo "foo" > .rafita/scratch.txt
  ( git::ensure_clean_tree ) 2>/dev/null
  local rc=$?
  assert_eq "0" "$rc" "changes inside .rafita/ should not fail"
  rm -f .rafita/scratch.txt
}

# -----------------------------------------------------------------------------
# Stash helpers (_stash_flow_if_dirty / _pop_flow_stash)
#
# Regression coverage for the "local path" zsh collision that silently aborted
# the stash and left the working tree dirty for the upcoming checkout.
# -----------------------------------------------------------------------------

test_git_stash_flow_if_dirty_clean_tree_is_noop() {
  RAFITA_FLOW_STASH_REF="presetMustBeCleared"
  git::_stash_flow_if_dirty
  assert_eq "" "$RAFITA_FLOW_STASH_REF" "ref should be empty on clean tree"
  local stashes; stashes=$(git stash list 2>/dev/null)
  assert_eq "" "$stashes" "no stash should be created on clean tree"
}

test_git_stash_flow_if_dirty_with_only_flow_stashes_and_sets_ref() {
  mkdir -p .flow/epics
  echo '{"status":"open"}' > .flow/epics/fn-1.json
  git add .flow/epics/fn-1.json
  git commit -q -m "track fn-1"
  # Modify tracked + add untracked, both inside .flow/.
  echo '{"status":"closed"}' > .flow/epics/fn-1.json
  echo '{"new":1}' > .flow/epics/fn-2.json

  git::_stash_flow_if_dirty

  assert_ne "" "$RAFITA_FLOW_STASH_REF" "RAFITA_FLOW_STASH_REF must be set after stash"
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_eq "" "$porcelain" "tree should be clean after stash"
  local list; list=$(git stash list 2>/dev/null)
  assert_contains "$list" "rafita-flow" "stash entry should be tagged rafita-flow"
}

test_git_stash_flow_if_dirty_with_rafita_dir_dirty_also_stashes() {
  # .rafita/ paths count as ours too (state mutated by rafita itself).
  echo '{"foo":1}' > .rafita/state.json

  git::_stash_flow_if_dirty
  assert_ne "" "$RAFITA_FLOW_STASH_REF" \
    ".rafita/ dirty paths should be stashed as part of rafita state"
}

test_git_stash_flow_if_dirty_with_foreign_changes_skips() {
  # User code modified — must NOT auto-stash. Caller's responsibility to commit.
  echo "hand-written" > foo.go

  git::_stash_flow_if_dirty
  assert_eq "" "$RAFITA_FLOW_STASH_REF" \
    "must not stash when there are changes outside .flow/ or .rafita/"
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_contains "$porcelain" "foo.go" "user changes must be left untouched"
  rm -f foo.go
}

test_git_stash_pop_restores_changes_on_target_branch() {
  # Round-trip: dirty .flow on dev → stash → checkout new branch → pop →
  # changes should land on new branch.
  mkdir -p .flow/epics
  echo '{"status":"open"}' > .flow/epics/fn-1.json
  git add .flow/epics/fn-1.json
  git commit -q -m "track fn-1"
  # Make dirty.
  echo '{"status":"closed"}' > .flow/epics/fn-1.json

  git::_stash_flow_if_dirty
  assert_ne "" "$RAFITA_FLOW_STASH_REF"

  # Move to new branch (would have failed without the stash).
  git checkout -q -b feature/test-pop

  git::_pop_flow_stash
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_contains "$porcelain" ".flow/epics/fn-1.json" \
    "popped changes should be present on target branch"
  local list; list=$(git stash list 2>/dev/null)
  assert_eq "" "$list" "stash list should be empty after successful pop"
}

# -----------------------------------------------------------------------------
# setup_epic_branch end-to-end (the regression that crashed runs on fn-18).
# -----------------------------------------------------------------------------

# Local mocks for flowctl/vcs since git.sh calls into both.
_setup_branch_test_mocks() {
  flowctl::epic_branch_name() { echo ""; }
  flowctl::epic_depends_on() { echo ""; }
  flowctl::set_epic_branch() { :; }
  vcs::_resolve_pr_base() { echo "$_TEST_PR_BASE"; }
  export -f flowctl::epic_branch_name flowctl::epic_depends_on \
    flowctl::set_epic_branch vcs::_resolve_pr_base
}

test_setup_epic_branch_with_dirty_flow_lands_on_epic_branch() {
  # Setup a "dev" base branch and an existing epic branch.
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "dev work" > dev_marker.txt && git add dev_marker.txt && git commit -q -m "dev marker"
  git checkout -q -b feature/claude/fn-9
  echo "epic work" > epic_marker.txt && git add epic_marker.txt && git commit -q -m "epic marker"
  git checkout -q dev

  # Wizard mutated .flow/.
  mkdir -p .flow/epics
  echo '{"status":"open"}' > .flow/epics/fn-9.json
  git add .flow/epics/fn-9.json && git commit -q -m "track"
  echo '{"status":"open","next_task":1}' > .flow/epics/fn-9.json

  _TEST_PR_BASE="dev"
  _setup_branch_test_mocks

  # Run.
  git::setup_epic_branch fn-9
  local rc=$?
  assert_eq "0" "$rc" "setup_epic_branch should succeed"

  local current; current=$(git::current_branch)
  assert_eq "feature/claude/fn-9" "$current" \
    "must end on the epic's branch, not back on dev"

  # The wizard's .flow change should be present on the epic branch.
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_contains "$porcelain" ".flow/epics/fn-9.json" \
    "popped .flow change should ride along to the epic branch"

  # No leftover stash.
  local list; list=$(git stash list 2>/dev/null)
  assert_eq "" "$list" "stash should not be left behind"
}

test_setup_epic_branch_creates_fresh_branch_when_missing() {
  # No existing local or remote branch — should create from prBase.
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "x" > base.txt && git add base.txt && git commit -q -m "base"

  _TEST_PR_BASE="dev"
  _setup_branch_test_mocks

  git::setup_epic_branch fn-fresh
  local rc=$?
  assert_eq "0" "$rc"
  assert_eq "feature/claude/fn-fresh" "$(git::current_branch)"
}

# -----------------------------------------------------------------------------
# sweep_residuals_before_epic_switch — the guard against contaminating dev
# with `chore: residual` commits when setup_epic_branch failed.
# -----------------------------------------------------------------------------

test_sweep_residuals_does_not_commit_to_wrong_branch() {
  # Stand on dev with residuals while pretending the epic branch is something
  # else — sweep must reset/clean but NEVER make a commit on dev.
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "main" > a.txt && git add a.txt && git commit -q -m "init dev"
  local before_sha; before_sha=$(git rev-parse HEAD)
  echo "leftover" > residue.txt
  echo "modified" >> a.txt

  flowctl::epic_branch_name() { echo "feature/claude/fn-99"; }
  flowctl::epic_depends_on() { echo ""; }
  export -f flowctl::epic_branch_name flowctl::epic_depends_on

  git::sweep_residuals_before_epic_switch fn-99

  local after_sha; after_sha=$(git rev-parse HEAD)
  assert_eq "$before_sha" "$after_sha" \
    "sweep must not commit on a branch that isn't the epic's branch"
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_eq "" "$porcelain" "tree should be clean (reset+clean) after sweep"
}

test_sweep_residuals_commits_when_on_correct_branch() {
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "x" > base.txt && git add base.txt && git commit -q -m "base"
  git checkout -q -b feature/claude/fn-7
  echo "leftover" > drift.txt

  flowctl::epic_branch_name() { echo "feature/claude/fn-7"; }
  flowctl::epic_depends_on() { echo ""; }
  export -f flowctl::epic_branch_name flowctl::epic_depends_on

  git::sweep_residuals_before_epic_switch fn-7

  local subject; subject=$(git log -1 --pretty=%s)
  assert_contains "$subject" "chore(fn-7)" \
    "sweep should commit residuals when on the matching epic branch"
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_eq "" "$porcelain" "tree should be clean after sweep"
}

# -----------------------------------------------------------------------------
# _push_synced_branch — covers the --force-with-lease syntax fix and the
# concurrent-update-rejection escape hatch.
# -----------------------------------------------------------------------------

# Sets up a bare remote and connects it as origin to the test repo.
_setup_remote() {
  local bare; bare="$ROOT_DIR_TEST/_bare.git"
  rm -rf "$bare"
  git init -q --bare "$bare"
  git remote add origin "$bare" 2>/dev/null || git remote set-url origin "$bare"
}

test_push_synced_branch_noop_when_in_sync() {
  _setup_remote
  git checkout -q -b feature/claude/fn-sync
  echo "v" > x.txt && git add x.txt && git commit -q -m c
  git push -q -u origin feature/claude/fn-sync

  RAFITA_PROVIDER=github git::_push_synced_branch
  local rc=$?
  assert_eq "0" "$rc" "in-sync push should be a clean no-op"
}

test_push_synced_branch_pushes_when_local_ahead() {
  _setup_remote
  git checkout -q -b feature/claude/fn-ahead
  echo "v1" > x.txt && git add x.txt && git commit -q -m c1
  git push -q -u origin feature/claude/fn-ahead
  echo "v2" > x.txt && git commit -q -am c2

  RAFITA_PROVIDER=github git::_push_synced_branch
  local rc=$?
  assert_eq "0" "$rc"
  local local_sha remote_sha
  local_sha=$(git rev-parse HEAD)
  remote_sha=$(git rev-parse origin/feature/claude/fn-ahead)
  assert_eq "$local_sha" "$remote_sha" "remote should be updated"
}

test_push_synced_branch_uses_force_with_lease_after_rebase() {
  # Rebase reorders history so origin/branch is no longer ancestor of HEAD.
  # The lease syntax (we fixed) must accept and force-push.
  _setup_remote
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "main" > main.txt && git add main.txt && git commit -q -m main
  git push -q -u origin dev

  git checkout -q -b feature/claude/fn-rebase
  echo "epic" > epic.txt && git add epic.txt && git commit -q -m epic
  git push -q -u origin feature/claude/fn-rebase

  # Advance dev and rebase the epic on top of it (rewrites epic commit's parent).
  git checkout -q dev && echo "dev2" > dev2.txt && git add dev2.txt && git commit -q -m dev2
  git push -q origin dev
  git checkout -q feature/claude/fn-rebase
  git rebase -q dev

  RAFITA_PROVIDER=github git::_push_synced_branch
  local rc=$?
  assert_eq "0" "$rc" "force-with-lease push should succeed when origin matches expected"
  local local_sha remote_sha
  local_sha=$(git rev-parse HEAD)
  remote_sha=$(git rev-parse origin/feature/claude/fn-rebase)
  assert_eq "$local_sha" "$remote_sha" "remote should reflect the rebased history"
}

test_push_synced_branch_skips_when_provider_none() {
  _setup_remote
  git checkout -q -b feature/claude/fn-noprov
  echo v > y.txt && git add y.txt && git commit -q -m c

  RAFITA_PROVIDER=none git::_push_synced_branch
  local rc=$?
  assert_eq "0" "$rc" "provider=none should short-circuit without pushing"
  # Verify nothing was pushed.
  local remote; remote=$(git rev-parse --verify --quiet origin/feature/claude/fn-noprov 2>/dev/null || echo missing)
  assert_eq "missing" "$remote" "remote ref must not exist"
}

# -----------------------------------------------------------------------------
# _merge_pr_base_into_current — returns rc=1 on conflict (was rc=0 before).
# -----------------------------------------------------------------------------

test_merge_pr_base_returns_zero_when_already_up_to_date() {
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "x" > a.txt && git add a.txt && git commit -q -m base
  git checkout -q -b feature/claude/fn-uptodate
  # Branch already contains dev (it was created from it).

  vcs::_resolve_pr_base() { echo "dev"; }
  export -f vcs::_resolve_pr_base

  git::_merge_pr_base_into_current
  local rc=$?
  assert_eq "0" "$rc" "no-op merge should return 0"
}

test_merge_pr_base_returns_one_on_conflict_and_aborts() {
  git checkout -q -b dev 2>/dev/null || git checkout -q dev
  echo "v1" > shared.txt && git add shared.txt && git commit -q -m v1
  git checkout -q -b feature/claude/fn-conflict
  echo "epic-version" > shared.txt && git commit -q -am epic
  # Diverge dev with a conflicting change to the same file.
  git checkout -q dev
  echo "dev-version" > shared.txt && git commit -q -am dev
  git checkout -q feature/claude/fn-conflict

  vcs::_resolve_pr_base() { echo "dev"; }
  export -f vcs::_resolve_pr_base

  git::_merge_pr_base_into_current
  local rc=$?
  assert_eq "1" "$rc" "conflict must propagate as rc=1 so caller can skip the epic"
  # Tree must be clean (merge --abort ran).
  local porcelain; porcelain=$(git status --porcelain 2>/dev/null)
  assert_eq "" "$porcelain" "merge must abort cleanly on conflict"
}
