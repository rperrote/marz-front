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
  assert_contains "$content" ".rafita/state.json"
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
