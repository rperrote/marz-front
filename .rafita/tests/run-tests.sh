#!/usr/bin/env bash
# Minimal bash test runner. Discovers *.test.sh under unit/ and integration/,
# runs every function starting with test_ in a subshell, reports pass/fail.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export RAFITA_TEST_HELPERS_DIR="$ROOT/helpers"
export RAFITA_SCRIPTS_DIR="$(cd "$ROOT/.." && pwd)"
export RAFITA_TESTS_DIR="$ROOT"

VERBOSE=0
FILTER=""
SUBSET=""
for arg in "$@"; do
  case "$arg" in
    -v|--verbose) VERBOSE=1 ;;
    unit|unit/) SUBSET="unit" ;;
    integration|integration/) SUBSET="integration" ;;
    -f=*|--filter=*) FILTER="${arg#*=}" ;;
    -h|--help)
      echo "Usage: run-tests.sh [-v] [unit|integration] [--filter=<name>]"
      exit 0
      ;;
  esac
done

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; NC=$'\033[0m'
if [[ ! -t 1 || -n "${NO_COLOR:-}" ]]; then RED=""; GREEN=""; YELLOW=""; NC=""; fi

total=0
passed=0
failed=0
failures=()

discover() {
  local dirs=()
  case "$SUBSET" in
    unit) dirs=("$ROOT/unit") ;;
    integration) dirs=("$ROOT/integration") ;;
    *) dirs=("$ROOT/unit" "$ROOT/integration") ;;
  esac
  for d in "${dirs[@]}"; do
    [[ -d "$d" ]] || continue
    while IFS= read -r -d '' f; do
      printf '%s\n' "$f"
    done < <(find "$d" -type f -name '*.test.sh' -print0 | sort -z)
  done
}

run_file() {
  local file="$1"
  local rel="${file#$ROOT/}"
  echo ""
  echo "${YELLOW}── $rel${NC}"
  # Run each test in a subshell; discover test_ functions.
  local fns
  fns=$(bash -c "
    set +e
    source '$RAFITA_TEST_HELPERS_DIR/assert.sh'
    source '$RAFITA_TEST_HELPERS_DIR/fixtures.sh'
    source '$file'
    declare -F | awk '{print \$3}' | grep '^test_' || true
  ")
  [[ -z "$fns" ]] && { echo "  (no tests)"; return 0; }
  for fn in $fns; do
    if [[ -n "$FILTER" && "$fn" != *"$FILTER"* ]]; then continue; fi
    total=$((total+1))
    local start_ts end_ts dur output
    start_ts=$(date +%s)
    output=$(
      bash -c "
        set -u
        source '$RAFITA_TEST_HELPERS_DIR/assert.sh'
        source '$RAFITA_TEST_HELPERS_DIR/fixtures.sh'
        if [[ -f '$RAFITA_TEST_HELPERS_DIR/integration.sh' ]]; then source '$RAFITA_TEST_HELPERS_DIR/integration.sh'; fi
        source '$file'
        if declare -F setup >/dev/null; then setup; fi
        $fn
        rc=\$?
        if declare -F teardown >/dev/null; then teardown || true; fi
        exit \$rc
      " 2>&1
    )
    local rc=$?
    end_ts=$(date +%s)
    dur=$((end_ts-start_ts))
    if [[ $rc -eq 0 ]]; then
      passed=$((passed+1))
      echo "  ${GREEN}✓${NC} $fn (${dur}s)"
      if [[ $VERBOSE -eq 1 && -n "$output" ]]; then
        printf '%s\n' "$output" | sed 's/^/      /'
      fi
    else
      failed=$((failed+1))
      failures+=("$rel::$fn")
      echo "  ${RED}✗${NC} $fn (${dur}s, rc=$rc)"
      printf '%s\n' "$output" | sed 's/^/      /'
    fi
  done
}

while IFS= read -r file; do
  run_file "$file"
done < <(discover)

echo ""
echo "────────────────────────────────────────"
if [[ $failed -gt 0 ]]; then
  echo "${RED}FAILED${NC}: $failed / $total"
  for f in "${failures[@]}"; do echo "  - $f"; done
  exit 1
fi
echo "${GREEN}OK${NC}: $passed / $total"
exit 0
