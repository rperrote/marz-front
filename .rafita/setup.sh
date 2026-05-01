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
}'

config_path="$TARGET_DIR/config.json"

if [[ ! -f "$config_path" ]]; then
  printf '%s\n' "$DEFAULTS_JSON" > "$config_path"
  printf 'wrote default config: %s\n' "$config_path"
else
  # Merge missing default keys into the existing config.json so the user
  # always sees every available setting. User values are preserved verbatim;
  # only keys absent from the existing config are appended (with their
  # defaults). For dict-valued keys (e.g. profileExtensions), missing
  # sub-keys are filled in too without touching the ones the user already set.
  merge_report=$(python3 - "$config_path" << PYEOF
import json, sys
from collections import OrderedDict

defaults = json.loads('''$DEFAULTS_JSON''')
path = sys.argv[1]
try:
    with open(path) as f:
        existing = json.load(f, object_pairs_hook=OrderedDict)
except Exception as e:
    print(f"ERR could not parse config.json: {e}")
    sys.exit(0)

added_top = []
added_nested = []
merged = OrderedDict(existing)
for k, v in defaults.items():
    if k not in merged:
        merged[k] = v
        added_top.append(k)
    elif isinstance(v, dict) and isinstance(merged.get(k), dict):
        sub = OrderedDict(merged[k])
        for sk, sv in v.items():
            if sk not in sub:
                sub[sk] = sv
                added_nested.append(f"{k}.{sk}")
        merged[k] = sub

if added_top or added_nested:
    with open(path, "w") as f:
        json.dump(merged, f, indent=2)
        f.write("\n")
    for k in added_top:
        print(f"  + {k}: {json.dumps(defaults[k])}")
    for k in added_nested:
        top, sub = k.split(".", 1)
        print(f"  + {k}: {json.dumps(defaults[top][sub])}")
else:
    print("OK")
PYEOF
)
  if [[ "$merge_report" == "OK" ]]; then
    printf 'config.json preserved (already up to date)\n'
  elif [[ "$merge_report" == ERR* ]]; then
    printf 'config.json preserved (parse error — leaving untouched):\n'
    printf '  %s\n' "${merge_report#ERR }"
  else
    printf 'config.json updated with new default keys:\n'
    printf '%s\n' "$merge_report"
  fi
fi

# Ensure .gitignore entries in the parent repo.
if [[ -d "$TARGET_DIR/.." && -d "$TARGET_DIR/../.git" ]]; then
  ign="$TARGET_DIR/../.gitignore"
  touch "$ign"
  for path in ".rafita/runs/" ".rafita/plans/" ".rafita/sessions/"; do
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
