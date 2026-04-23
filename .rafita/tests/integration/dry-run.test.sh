#!/usr/bin/env bash
# Integration: dry-run flow end-to-end.
setup() { integration_setup; }
teardown() { integration_teardown; }

test_dry_run_end_to_end() {
  flow_add_epic "fn-100" "test epic"
  flow_add_task "fn-100" "fn-100.1" "first task" "do a thing"
  run_rafita --dry-run fn-100
  assert_eq "0" "$INT_RC" "dry run must succeed (stderr: ${INT_STDERR:0:300})"
  # Dry-run means no real claude calls but our mock captured the dispatch; the
  # orchestrator short-circuits via RAFITA_DRY_RUN=1 inside claude::_invoke.
  # So the FAKE_CLAUDE_LOG should be empty — the short-circuit is before CLI.
  local invocations; invocations=$(wc -l < "$FAKE_CLAUDE_LOG" 2>/dev/null || echo 0)
  invocations=${invocations// /}
  assert_eq "0" "$invocations" "dry-run must not invoke the claude CLI"
  # State must be cleared on successful completion.
  assert_file_not_exists "$RAFITA_DIR/state.json"
}

test_dry_run_produces_run_artifacts() {
  flow_add_epic "fn-200" "another"
  flow_add_task "fn-200" "fn-200.1" "task one" "spec one"
  run_rafita --dry-run fn-200
  if [[ $INT_RC -ne 0 ]]; then
    echo "rafita exit=$INT_RC stderr: ${INT_STDERR}" >&2
    return 1
  fi
  # A run dir should exist under runs/. Check with ls (find -maxdepth may be
  # flaky with zero matches on some macOS versions).
  if ! ls "$RAFITA_DIR/runs" 2>/dev/null | grep -q '[0-9]'; then
    echo "no run dir under $RAFITA_DIR/runs" >&2
    ls -la "$RAFITA_DIR/runs" 2>&1 >&2 || true
    return 1
  fi
}
