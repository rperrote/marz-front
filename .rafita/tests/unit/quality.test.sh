#!/usr/bin/env bash
# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/config.sh"
source "$RAFITA_SCRIPTS_DIR/lib/quality.sh"

setup() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_RUN_ID="test-quality-$$"
  common::init_run_dir
}
teardown() { teardown_tmp_repo; }

test_quality_no_gates_returns_0() {
  config::load "$RAFITA_DIR/config.json"  # generic has no gate cmds
  local out
  out=$(quality::run_gates fn-1 1)
  local rc=$?
  assert_eq "0" "$rc"
  assert_eq "" "$out"
}

test_quality_passing_gate() {
  cat > "$RAFITA_DIR/profiles/custom.md" << 'EOF'
## DEV Rules
- r
## DEV Fix Rules
- r
## Review Rules
- [ ] r
## Plan Rules
(none)
## Format Command
(none)
## Test Command
true
## Lint Command
true
## Typecheck Command
(none)
## Skills
(none)
## Forbidden Paths
.env
EOF
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"custom"}
JSON
  config::load "$RAFITA_DIR/config.json"
  assert_rc 0 quality::run_gates fn-1 1
}

test_quality_failing_gate_returns_shaped_json() {
  cat > "$RAFITA_DIR/profiles/bad.md" << 'EOF'
## DEV Rules
- r
## DEV Fix Rules
- r
## Review Rules
- [ ] r
## Plan Rules
(none)
## Format Command
(none)
## Test Command
bash -c "echo 'test failure detail'; exit 1"
## Lint Command
(none)
## Typecheck Command
(none)
## Skills
(none)
## Forbidden Paths
.env
EOF
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"bad"}
JSON
  config::load "$RAFITA_DIR/config.json"
  local out rc
  out=$(quality::run_gates fn-1 1)
  rc=$?
  assert_eq "1" "$rc"
  assert_json_field "$out" approved "False"
  assert_json_field "$out" source "quality_gate"
  assert_contains "$out" "test failure detail"
}

test_quality_stops_on_first_failure() {
  # lint fails → tests should NOT run.
  cat > "$RAFITA_DIR/profiles/chain.md" << 'EOF'
## DEV Rules
- r
## DEV Fix Rules
- r
## Review Rules
- [ ] r
## Plan Rules
(none)
## Format Command
(none)
## Test Command
bash -c "touch $ROOT_DIR_TEST/tests_ran.marker; exit 0"
## Lint Command
bash -c "exit 1"
## Typecheck Command
(none)
## Skills
(none)
## Forbidden Paths
.env
EOF
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"chain"}
JSON
  config::load "$RAFITA_DIR/config.json"
  quality::run_gates fn-1 1 >/dev/null
  assert_file_not_exists "$ROOT_DIR_TEST/tests_ran.marker"
}

test_quality_writes_log_file() {
  cat > "$RAFITA_DIR/profiles/loggy.md" << 'EOF'
## DEV Rules
- r
## DEV Fix Rules
- r
## Review Rules
- [ ] r
## Plan Rules
(none)
## Format Command
(none)
## Test Command
bash -c "echo important-marker-in-log; exit 0"
## Lint Command
(none)
## Typecheck Command
(none)
## Skills
(none)
## Forbidden Paths
.env
EOF
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"loggy"}
JSON
  config::load "$RAFITA_DIR/config.json"
  quality::run_gates fn-1 3 >/dev/null
  local log="$RAFITA_RUN_DIR/fn-1/gate-tests-round-3.log"
  assert_file_exists "$log"
  assert_contains "$(cat "$log")" "important-marker-in-log"
}
