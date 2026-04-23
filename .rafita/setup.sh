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
    "$SOURCE_DIR/" "$TARGET_DIR/"
else
  for d in lib phases prompts bin profiles tests; do
    rm -rf "$TARGET_DIR/$d"
    cp -R "$SOURCE_DIR/$d" "$TARGET_DIR/$d"
  done
  cp "$SOURCE_DIR/rafita.sh" "$TARGET_DIR/rafita.sh"
fi

chmod +x "$TARGET_DIR/rafita.sh" "$TARGET_DIR/bin/"*.py "$TARGET_DIR/bin/"*.sh "$TARGET_DIR/tests/run-tests.sh" 2>/dev/null || true

# Stamp the installed version so the user can check what they have.
version_file="$SOURCE_DIR/../VERSION"
if [[ -f "$version_file" ]]; then
  version=$(head -n 1 "$version_file" | tr -d '[:space:]')
else
  version="?"
fi
printf '%s\n' "$version" > "$TARGET_DIR/VERSION"
printf 'installed version: %s\n' "$version"

# Write default config.json only if missing.
if [[ ! -f "$TARGET_DIR/config.json" ]]; then
  cat > "$TARGET_DIR/config.json" << 'JSON'
{
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
  "skipOnFailedTask": true,
  "rateLimitTaskRetry": true,
  "rateLimitMaxSleep": 21600,
  "resumeEnabled": true,
  "debug": 1
}
JSON
  printf 'wrote default config: %s/config.json\n' "$TARGET_DIR"
else
  printf 'config.json preserved (already existed)\n'
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

printf '\ndone. next steps:\n'
printf '  edit %s/config.json to pick your projectType\n' "$TARGET_DIR"
printf '  ensure flowctl is on PATH (or set config.flowctl)\n'
printf '  run: %s/rafita.sh --help\n' "$TARGET_DIR"
