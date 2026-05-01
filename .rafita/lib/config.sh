#!/usr/bin/env bash
# config.sh — loads .rafita/config.json and the active profile markdown,
# exports RAFITA_* variables. Defaults applied in one python pass.

# shellcheck disable=SC2155

# --- defaults ---------------------------------------------------------------

config::_defaults_json() {
  cat << 'JSON'
{
  "projectType": "generic",
  "provider": "github",
  "branchByEpic": false,
  "branchPrefix": "feature/claude/",
  "maxReviewRounds": 5,
  "streamOutput": false,
  "yolo": true,
  "claudeBin": "claude",
  "opencodeBin": "opencode",
  "codexBin": "codex",
  "codexModel": "",
  "codexSandbox": "workspace-write",
  "devProvider": "opencode",
  "reviewerProvider": "claude",
  "plannerProvider": "opencode",
  "devModel": "opencode-go/kimi-k2.6",
  "reviewerModel": "claude-opus-4-6",
  "flowctl": ".flow/bin/flowctl",
  "ui": true,
  "notifyWebhook": "",
  "projectName": "",
  "skipOnFailedTask": true,
  "rateLimitTaskRetry": true,
  "rateLimitMaxSleep": 21600,
  "debug": 1,
  "prBase": "",
  "worktreeEnabled": false,
  "worktreeBase": "../.rafita-worktrees",
  "worktreeKeep": false,
  "closerEnabled": false,
  "closerProvider": "",
  "closerModel": "",
  "closerSkipFinalReview": false,
  "maxFinalRounds": 3,
  "profileExtensions": {
    "dev": "",
    "reviewer": "",
    "closer": "",
    "all": ""
  }
}
JSON
}

# Reads a merged JSON (defaults + user) and exports RAFITA_* env vars.
# Arg: path to config.json (optional; if absent, only defaults apply).
config::load() {
  local path="${1:-${RAFITA_DIR:-.rafita}/config.json}"
  local defaults; defaults=$(config::_defaults_json)
  local user="{}"
  if [[ -f "$path" ]]; then
    user=$(cat "$path")
  fi
  local merged
  merged=$(python3 - "$defaults" "$user" << 'PYEOF'
import json, sys
d=json.loads(sys.argv[1])
try:
  u=json.loads(sys.argv[2]) if sys.argv[2].strip() else {}
except Exception as e:
  print(f"ERR:{e}", file=sys.stderr); sys.exit(2)
# Shallow merge at the top level, but deep-merge one level for dict-valued keys
# (so users can override a single sub-key without wiping defaults — e.g. only
# profileExtensions.dev).
for k, v in (u or {}).items():
    if isinstance(v, dict) and isinstance(d.get(k), dict):
        merged = dict(d[k])
        merged.update(v)
        d[k] = merged
    else:
        d[k] = v
print(json.dumps(d))
PYEOF
  )
  [[ -z "$merged" ]] && { common::fail "config parse failed: $path"; }

  # Export each key as RAFITA_<UPPER_SNAKE>.
  while IFS=$'\t' read -r key val; do
    local name="RAFITA_$(echo "$key" | python3 -c '
import sys, re
s=sys.stdin.read().strip()
# camelCase -> UPPER_SNAKE
out=re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s).upper()
print(out)
')"
    # Normalize booleans to 0/1. python json emits True/False capitalized.
    case "$val" in
      true|True)   val=1 ;;
      false|False) val=0 ;;
    esac
    export "$name=$val"
  done < <(python3 -c '
import json, sys
d=json.loads(sys.argv[1])
for k,v in d.items():
    if isinstance(v, (dict, list)):
        # Nested structures are not flattened to RAFITA_* here; dedicated
        # loaders (e.g. profile extensions) read them from RAFITA_CONFIG_JSON.
        continue
    if isinstance(v, bool):
        print(f"{k}\t{str(v).lower()}")
    else:
        print(f"{k}\t{v}")
' "$merged")

  # Explicit exports for profileExtensions (object). Empty sub-keys stay empty.
  while IFS=$'\t' read -r ext_name ext_val; do
    [[ -z "$ext_name" ]] && continue
    export "$ext_name=$ext_val"
  done < <(python3 -c '
import json, sys
d = json.loads(sys.argv[1])
pe = d.get("profileExtensions") or {}
for sub in ("dev", "reviewer", "closer", "all"):
    val = str(pe.get(sub, "") or "")
    print(f"RAFITA_PROFILE_EXT_{sub.upper()}\t{val}")
' "$merged")

  export RAFITA_CONFIG_PATH="$path"
  export RAFITA_CONFIG_JSON="$merged"

  # Validate flowctl path.
  if [[ -n "${RAFITA_FLOWCTL:-}" ]]; then
    if [[ ! -x "${RAFITA_FLOWCTL}" ]] && ! command -v "${RAFITA_FLOWCTL}" >/dev/null 2>&1; then
      # Only warn here; check_dependencies later enforces presence when needed.
      common::warn "flowctl not executable at ${RAFITA_FLOWCTL} (may be OK if using absolute path later)"
    fi
  fi

  # Load profile.
  config::_load_profile
}

# Apply CLI overrides. Call after config::load.
# Args: associative array of overrides: KEY=VALUE pairs.
config::apply_overrides() {
  for kv in "$@"; do
    [[ -z "$kv" ]] && continue
    export "$kv"
  done
}

# --- profile parsing --------------------------------------------------------

config::_profile_paths() {
  # Search order: repo .rafita/profiles, then rafitaV2 script dir fallback.
  local dir1="${RAFITA_DIR:-.rafita}/profiles"
  local dir2="${RAFITA_SCRIPTS_DIR:-.}/profiles"
  printf '%s\n%s\n' "$dir1" "$dir2"
}

config::_load_profile() {
  local type="${RAFITA_PROJECT_TYPE:-generic}"
  local found=""
  while IFS= read -r dir; do
    if [[ -f "$dir/$type.md" ]]; then found="$dir/$type.md"; break; fi
  done < <(config::_profile_paths)

  if [[ -z "$found" ]]; then
    # Fallback to generic.
    while IFS= read -r dir; do
      if [[ -f "$dir/generic.md" ]]; then found="$dir/generic.md"; break; fi
    done < <(config::_profile_paths)
  fi

  [[ -z "$found" ]] && common::fail "no profile markdown found (looked for $type.md and generic.md)"

  export RAFITA_PROFILE_PATH="$found"

  # Per-role extension files. Missing paths warn and are skipped.
  # Role → sections it owns (concat) and commands it owns (replace).
  local ext_dev;    ext_dev=$(config::_resolve_ext_path "${RAFITA_PROFILE_EXT_DEV:-}")
  local ext_rev;    ext_rev=$(config::_resolve_ext_path "${RAFITA_PROFILE_EXT_REVIEWER:-}")
  local ext_closer; ext_closer=$(config::_resolve_ext_path "${RAFITA_PROFILE_EXT_CLOSER:-}")
  local ext_all;    ext_all=$(config::_resolve_ext_path "${RAFITA_PROFILE_EXT_ALL:-}")

  # Concat sections: base + (role-specific ext) + (all ext).
  # Rules
  export RAFITA_PROFILE_DEV_RULES="$(config::_merge_section_concat     "$found" "DEV Rules"         "$ext_dev"    "$ext_all")"
  export RAFITA_PROFILE_DEV_FIX_RULES="$(config::_merge_section_concat "$found" "DEV Fix Rules"     "$ext_dev"    "$ext_all")"
  export RAFITA_PROFILE_PLAN_RULES="$(config::_merge_section_concat    "$found" "Plan Rules"        "$ext_dev"    "$ext_all")"
  export RAFITA_PROFILE_SKILLS="$(config::_merge_section_concat        "$found" "Skills"            "$ext_dev"    "$ext_all")"
  export RAFITA_PROFILE_FORBIDDEN_PATHS="$(config::_merge_section_concat "$found" "Forbidden Paths" "$ext_dev"    "$ext_all")"
  export RAFITA_PROFILE_REVIEW_RULES="$(config::_merge_section_concat  "$found" "Review Rules"      "$ext_rev"    "$ext_all")"
  export RAFITA_PROFILE_CLOSER_RULES="$(config::_merge_section_concat  "$found" "Closer Rules"      "$ext_closer" "$ext_all")"

  # Commands: replace semantics. Dev-side commands apply to gates (shared by all
  # roles). The 'all' extension can override; otherwise devExtension wins over base.
  export RAFITA_PROFILE_FORMAT_CMD="$(config::_merge_section_replace    "$found" "Format Command"    "$ext_dev" "$ext_all")"
  export RAFITA_PROFILE_TEST_CMD="$(config::_merge_section_replace      "$found" "Test Command"      "$ext_dev" "$ext_all")"
  export RAFITA_PROFILE_LINT_CMD="$(config::_merge_section_replace      "$found" "Lint Command"      "$ext_dev" "$ext_all")"
  export RAFITA_PROFILE_TYPECHECK_CMD="$(config::_merge_section_replace "$found" "Typecheck Command" "$ext_dev" "$ext_all")"
}

# Resolves a user-provided extension path. Empty → empty. Relative → resolved
# against the current working directory (repo root at invocation time). Missing
# file → warns and returns empty so callers can skip gracefully.
config::_resolve_ext_path() {
  local p="${1:-}"
  [[ -z "$p" ]] && { printf ''; return 0; }
  if [[ "$p" != /* ]]; then p="$(pwd)/$p"; fi
  if [[ ! -f "$p" ]]; then
    common::warn "profile extension not found: $p (continuing with base profile only)"
    printf ''
    return 0
  fi
  printf '%s' "$p"
}

# config::_merge_section_concat <base> <name> <ext...>
# Reads section from base; appends the same section from each non-empty ext
# file (in order) separated by a clear marker. Empty extensions are skipped.
config::_merge_section_concat() {
  local base="$1" name="$2"; shift 2
  local result; result=$(config::_extract_section "$base" "$name")
  local ext body
  for ext in "$@"; do
    [[ -z "$ext" ]] && continue
    body=$(config::_extract_section "$ext" "$name")
    [[ -z "$body" ]] && continue
    if [[ -z "$result" ]]; then
      result="$body"
    else
      result="${result}

<!-- user profile extension: $(basename "$ext") -->

${body}"
    fi
  done
  printf '%s' "$result"
}

# config::_merge_section_replace <base> <name> <ext...>
# Reads section from base; if any ext defines it, the LAST non-empty ext wins.
# Order is dev-ext, then all-ext — so 'all' takes precedence when both set it.
config::_merge_section_replace() {
  local base="$1" name="$2"; shift 2
  local result; result=$(config::_extract_section "$base" "$name")
  local ext body
  for ext in "$@"; do
    [[ -z "$ext" ]] && continue
    body=$(config::_extract_section "$ext" "$name")
    [[ -z "$body" ]] && continue
    result="$body"
  done
  printf '%s' "$result"
}

# Extract a markdown section by heading. Ignores "(none)" content.
# Args: file, section_name.
config::_extract_section() {
  local file="$1" name="$2"
  python3 - "$file" "$name" << 'PYEOF'
import sys, re
path, name = sys.argv[1], sys.argv[2]
try:
    text = open(path).read()
except Exception:
    print(""); sys.exit(0)
# Find the section heading "## <name>"
pattern = re.compile(r"^##\s+" + re.escape(name) + r"\s*$", re.M)
m = pattern.search(text)
if not m:
    print(""); sys.exit(0)
start = m.end()
# Next heading of same or higher level.
nm = re.search(r"^#{1,2}\s+", text[start:], re.M)
body = text[start:start+nm.start()] if nm else text[start:]
body = body.strip("\n")
# Ignore "(none)" as empty.
if body.strip().lower() in ("(none)", "none", ""):
    print(""); sys.exit(0)
print(body)
PYEOF
}

# Public: returns all configured gate commands in execution order.
# Emits one command per line (lint, typecheck, tests).
config::gate_commands() {
  [[ -n "${RAFITA_PROFILE_LINT_CMD:-}" ]] && printf 'lint\t%s\n' "$RAFITA_PROFILE_LINT_CMD"
  [[ -n "${RAFITA_PROFILE_TYPECHECK_CMD:-}" ]] && printf 'typecheck\t%s\n' "$RAFITA_PROFILE_TYPECHECK_CMD"
  [[ -n "${RAFITA_PROFILE_TEST_CMD:-}" ]] && printf 'tests\t%s\n' "$RAFITA_PROFILE_TEST_CMD"
}

config::forbidden_paths_list() {
  [[ -z "${RAFITA_PROFILE_FORBIDDEN_PATHS:-}" ]] && return 0
  printf '%s\n' "$RAFITA_PROFILE_FORBIDDEN_PATHS" | sed 's/^[-*]\s*//; /^$/d'
}
