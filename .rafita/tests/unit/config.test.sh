#!/usr/bin/env bash
# Unit tests for lib/config.sh

# shellcheck disable=SC1091
source "$RAFITA_SCRIPTS_DIR/lib/common.sh"
source "$RAFITA_SCRIPTS_DIR/lib/config.sh"

test_config_load_applies_defaults_when_no_file() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  export RAFITA_SCRIPTS_DIR
  config::load "$RAFITA_DIR/config.json"
  assert_eq "generic" "$RAFITA_PROJECT_TYPE"
  assert_eq "github" "$RAFITA_PROVIDER"
  assert_eq "5" "$RAFITA_MAX_REVIEW_ROUNDS"
  assert_eq "claude-opus-4-6" "$RAFITA_DEV_MODEL"
  assert_eq "claude-sonnet-4-6" "$RAFITA_REVIEWER_MODEL"
  teardown_tmp_repo
}

test_config_load_user_overrides_defaults() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"frontend","maxReviewRounds":3,"devModel":"claude-opus-4-7"}
JSON
  config::load "$RAFITA_DIR/config.json"
  assert_eq "frontend" "$RAFITA_PROJECT_TYPE"
  assert_eq "3" "$RAFITA_MAX_REVIEW_ROUNDS"
  assert_eq "claude-opus-4-7" "$RAFITA_DEV_MODEL"
  # Unrelated defaults preserved.
  assert_eq "github" "$RAFITA_PROVIDER"
  teardown_tmp_repo
}

test_config_load_normalizes_booleans() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"ui":false,"yolo":true,"resumeEnabled":false}
JSON
  config::load "$RAFITA_DIR/config.json"
  assert_eq "0" "$RAFITA_UI"
  assert_eq "1" "$RAFITA_YOLO"
  assert_eq "0" "$RAFITA_RESUME_ENABLED"
  teardown_tmp_repo
}

test_config_falls_back_to_generic_profile() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"nonexistent"}
JSON
  config::load "$RAFITA_DIR/config.json"
  # Should use the package's generic.md.
  assert_contains "$RAFITA_PROFILE_PATH" "generic.md"
  assert_contains "$RAFITA_PROFILE_DEV_RULES" "CLAUDE.md"
  teardown_tmp_repo
}

test_config_extract_section_ignores_none() {
  setup_tmp_repo
  local pf="$ROOT_DIR_TEST/profile.md"
  cat > "$pf" << 'EOF'
## DEV Rules
- rule 1

## Format Command
(none)
EOF
  local dev_rules format_cmd
  dev_rules=$(config::_extract_section "$pf" "DEV Rules")
  format_cmd=$(config::_extract_section "$pf" "Format Command")
  assert_contains "$dev_rules" "rule 1"
  assert_eq "" "$format_cmd"
  teardown_tmp_repo
}

test_config_plan_phase_detection() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  cp "$RAFITA_SCRIPTS_DIR/profiles/generic.md" "$RAFITA_DIR/profiles/with-plan.md"
  # Insert a non-empty Plan Rules section.
  python3 - "$RAFITA_DIR/profiles/with-plan.md" << 'PYEOF'
import sys, re, pathlib
p=pathlib.Path(sys.argv[1])
t=p.read_text()
t=t.replace("## Plan Rules\n(none)","## Plan Rules\n- step by step plan required")
p.write_text(t)
PYEOF
  cat > "$RAFITA_DIR/config.json" << 'JSON'
{"projectType":"with-plan"}
JSON
  config::load "$RAFITA_DIR/config.json"
  assert_rc 0 config::has_plan_phase
  teardown_tmp_repo
}

test_config_forbidden_paths_list() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  config::load "$RAFITA_DIR/config.json"
  local list
  list=$(config::forbidden_paths_list)
  assert_contains "$list" ".env"
  assert_contains "$list" "package-lock.json"
  teardown_tmp_repo
}

test_config_gate_commands_empty_when_none() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
  config::load "$RAFITA_DIR/config.json"
  local list
  list=$(config::gate_commands)
  assert_eq "" "$list"
  teardown_tmp_repo
}

test_config_gate_commands_from_profile() {
  setup_tmp_repo
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"
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
pnpm test --run

## Lint Command
pnpm lint

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
  local list
  list=$(config::gate_commands)
  assert_contains "$list" "pnpm lint"
  assert_contains "$list" "pnpm test --run"
  teardown_tmp_repo
}
