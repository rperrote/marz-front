#!/usr/bin/env bash
# rafitaV2 setup — copies the full v2 scripts tree into the target project's
# .rafita/ directory and writes a default config.json if none exists.

set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$(pwd)/.rafita}"

printf 'rafitaV2 setup\n'
printf '  source: %s\n' "$SOURCE_DIR"
printf '  target: %s\n' "$TARGET_DIR"

mkdir -p "$TARGET_DIR"

# Copy libs, phases, prompts, bin, profiles, tests, and the entrypoint.
# Use rsync if available for sensible default behavior; fall back to cp -R.
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude='runs/' \
    --exclude='state.json' \
    --exclude='plans/' \
    --exclude='sessions/' \
    --exclude='config.json' \
    --exclude='VERSION' \
    --exclude='custom/' \
    "$SOURCE_DIR/" "$TARGET_DIR/"
else
  for d in lib phases prompts bin profiles tests; do
    rm -rf "$TARGET_DIR/$d"
    cp -R "$SOURCE_DIR/$d" "$TARGET_DIR/$d"
  done
  cp "$SOURCE_DIR/rafita.sh" "$TARGET_DIR/rafita.sh"
  cp "$SOURCE_DIR/worktree-create.sh" "$TARGET_DIR/worktree-create.sh"
  cp "$SOURCE_DIR/check.sh" "$TARGET_DIR/check.sh"
fi

chmod +x "$TARGET_DIR/rafita.sh" "$TARGET_DIR/worktree-create.sh" "$TARGET_DIR/check.sh" \
  "$TARGET_DIR/bin/"*.py "$TARGET_DIR/bin/"*.sh "$TARGET_DIR/tests/run-tests.sh" 2>/dev/null || true

# Stamp the installed version so the user can check what they have.
version_file="$SOURCE_DIR/../VERSION"
if [[ -f "$version_file" ]]; then
  version=$(head -n 1 "$version_file" | tr -d '[:space:]')
else
  version="?"
fi
printf '%s\n' "$version" > "$TARGET_DIR/VERSION"
printf 'installed version: %s\n' "$version"

# Canonical defaults — keep in sync with lib/config.sh::config::_defaults_json.
DEFAULTS_JSON='{
  "projectType": "generic",
  "provider": "github",
  "branchMode": "new",
  "branchPrefix": "feature/claude/",
  "maxReviewRounds": 5,
  "streamOutput": false,
  "yolo": true,
  "claudeBin": "claude",
  "opencodeBin": "opencode",
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
  "resumeEnabled": true,
  "debug": 1,
  "prBase": "",
  "worktreeEnabled": false,
  "worktreeBase": "../.rafita-worktrees",
  "worktreeKeep": false,
  "closerEnabled": false,
  "closerProvider": "",
  "closerModel": "",
  "maxFinalRounds": 3,
  "profileExtensions": {
    "dev": "",
    "reviewer": "",
    "closer": "",
    "all": ""
  }
}'

config_path="$TARGET_DIR/config.json"

if [[ ! -f "$config_path" ]]; then
  printf '%s\n' "$DEFAULTS_JSON" > "$config_path"
  printf 'wrote default config: %s\n' "$config_path"
else
  printf 'config.json preserved (already existed)\n'
  # Report keys present in defaults but missing from the existing config.
  new_keys=$(python3 - "$config_path" << PYEOF
import json, sys
defaults = json.loads('''$DEFAULTS_JSON''')
try:
    existing = json.loads(open(sys.argv[1]).read())
except Exception as e:
    print(f"  warning: could not parse config.json: {e}", flush=True)
    sys.exit(0)
missing = [k for k in defaults if k not in existing]
for k in missing:
    print(f"  + {k}: {json.dumps(defaults[k])}")
PYEOF
)
  if [[ -n "$new_keys" ]]; then
    printf 'new config keys available (not in your config.json):\n'
    printf '%s\n' "$new_keys"
  fi
fi

# Ensure .gitignore entries in the parent repo.
if [[ -d "$TARGET_DIR/.." && -d "$TARGET_DIR/../.git" ]]; then
  ign="$TARGET_DIR/../.gitignore"
  touch "$ign"
  for path in ".rafita/runs/" ".rafita/state.json" ".rafita/plans/" ".rafita/sessions/"; do
    if ! grep -qxF "$path" "$ign" 2>/dev/null; then
      echo "$path" >> "$ign"
    fi
  done
fi

# Ensure custom/ exists so users have an obvious place for their profile extensions.
mkdir -p "$TARGET_DIR/custom"
if [[ ! -f "$TARGET_DIR/custom/README.md" ]]; then
  cat > "$TARGET_DIR/custom/README.md" << 'EOF'
# rafita custom profile extensions

This directory is preserved across `rafita:setup` runs. Put your project-specific
profile markdowns here and reference them in `.rafita/config.json` under
`profileExtensions`:

```json
"profileExtensions": {
  "dev":      ".rafita/custom/dev.md",
  "reviewer": ".rafita/custom/review.md",
  "closer":   ".rafita/custom/closer.md",
  "all":      ".rafita/custom/shared.md"
}
```

Each file follows the same `## Section` format as the base profiles in
`.rafita/profiles/`. Sections you define are merged on top of the base profile
selected by `projectType`:

- Rule-like sections (`DEV Rules`, `DEV Fix Rules`, `Review Rules`,
  `Closer Rules`, `Plan Rules`, `Skills`, `Forbidden Paths`) are **appended**
  to the base.
- Command sections (`Format Command`, `Test Command`, `Lint Command`,
  `Typecheck Command`) **replace** the base when defined.

Do NOT edit files under `.rafita/profiles/` — they get overwritten on the next
setup.
EOF
fi

printf '\ndone. next steps:\n'
printf '  edit %s/config.json to pick your projectType\n' "$TARGET_DIR"
printf '  do NOT edit %s/profiles/*.md — setup overwrites them\n' "$TARGET_DIR"
printf '  put project-specific rules in %s/custom/ and link them via profileExtensions\n' "$TARGET_DIR"
printf '  ensure flowctl is on PATH (or set config.flowctl)\n'
printf '  run: %s/rafita.sh --help\n' "$TARGET_DIR"
