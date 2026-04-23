#!/usr/bin/env bash
# notify.sh — desktop + webhook notifications. All failures are silent to
# avoid breaking a run because a notification couldn't be delivered.

notify::_desktop() {
  local title="$1" body="$2"
  if command -v osascript >/dev/null 2>&1; then
    # Escape quotes for AppleScript.
    local t="${title//\"/\\\"}" b="${body//\"/\\\"}"
    osascript -e "display notification \"$b\" with title \"$t\"" >/dev/null 2>&1 || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "$title" "$body" >/dev/null 2>&1 || true
  fi
}

notify::_webhook() {
  local kind="$1" text="$2"
  [[ -z "${RAFITA_NOTIFY_WEBHOOK:-}" ]] && return 0
  command -v curl >/dev/null 2>&1 || return 0
  local payload
  payload=$(python3 -c '
import json, sys, os
print(json.dumps({
  "kind": sys.argv[1],
  "text": sys.argv[2],
  "run_id": os.environ.get("RAFITA_RUN_ID",""),
}))' "$kind" "$text")
  curl -sS -m 5 -H 'Content-Type: application/json' -X POST \
    -d "$payload" "$RAFITA_NOTIFY_WEBHOOK" >/dev/null 2>&1 || true
}

notify::send_summary() {
  local done="${1:-0}" skipped="${2:-0}" failed="${3:-0}"
  local msg="rafita: ${done} done, ${skipped} skipped, ${failed} failed"
  notify::_desktop "rafita done" "$msg"
  notify::_webhook "summary" "$msg"
}

notify::send_failure() {
  local rc="${1:-?}"
  notify::_desktop "rafita failed" "exit rc=${rc}"
  notify::_webhook "failure" "rafita failed rc=${rc}"
}

notify::send_pr() {
  local url="${1:-}"
  [[ -z "$url" ]] && return 0
  notify::_desktop "rafita PR" "$url"
  notify::_webhook "pr" "PR opened: $url"
}
