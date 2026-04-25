#!/usr/bin/env bash
# notify.sh — desktop + webhook notifications. All failures are silent to
# avoid breaking a run because a notification couldn't be delivered.
#
# Single completion event fires at end-of-run (from _on_exit) with the full
# run summary: project, status, counts, task lists, epics, branch, PR, final
# review verdict, duration. The webhook format auto-detects Discord by URL
# and sends an embed; any other URL gets the raw generic JSON.

notify::_desktop() {
  local title="$1" body="$2"
  if command -v osascript >/dev/null 2>&1; then
    local t="${title//\"/\\\"}" b="${body//\"/\\\"}"
    osascript -e "display notification \"$b\" with title \"$t\"" >/dev/null 2>&1 || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "$title" "$body" >/dev/null 2>&1 || true
  fi
}

# notify::_is_discord <url>  → rc 0 if the URL is a Discord webhook.
notify::_is_discord() {
  [[ "${1:-}" == *"discord.com/api/webhooks/"* ]] || [[ "${1:-}" == *"discordapp.com/api/webhooks/"* ]]
}

# notify::_post <url> <json_payload>  → POSTs silently, short timeout.
notify::_post() {
  local url="$1" payload="$2"
  command -v curl >/dev/null 2>&1 || return 0
  curl -sS -m 5 -H 'Content-Type: application/json' -X POST \
    -d "$payload" "$url" >/dev/null 2>&1 || true
}

# notify::send_completion <rc>
# Fires the end-of-run notification. Reads run state from RAFITA_* env.
notify::send_completion() {
  local rc="${1:-0}"
  local url="${RAFITA_NOTIFY_WEBHOOK:-}"
  local project; project=$(common::project_name)

  # Derive status from rc + counters.
  local status
  case "$rc" in
    130) status="interrupted" ;;
    0)
      if [[ "${RAFITA_TASKS_FAILED:-0}" -gt 0 || "${RAFITA_TASKS_SKIPPED:-0}" -gt 0 ]]; then
        status="partial"
      else
        status="success"
      fi
      ;;
    *) status="failure" ;;
  esac

  local duration_s; duration_s=$(common::elapsed 2>/dev/null || echo 0)
  local branch; branch=$(git::current_branch 2>/dev/null || echo "")

  # Desktop first (cheap, local).
  local desktop_title="rafita: ${project} — ${status}"
  local desktop_body
  desktop_body=$(printf '%s done, %s skipped, %s failed (%ss)' \
    "${RAFITA_TASKS_DONE:-0}" "${RAFITA_TASKS_SKIPPED:-0}" "${RAFITA_TASKS_FAILED:-0}" "$duration_s")
  notify::_desktop "$desktop_title" "$desktop_body"

  # Webhook is optional.
  [[ -z "$url" ]] && return 0

  local payload
  if notify::_is_discord "$url"; then
    payload=$(notify::_build_discord_payload "$project" "$status" "$rc" "$duration_s" "$branch")
  else
    payload=$(notify::_build_generic_payload "$project" "$status" "$rc" "$duration_s" "$branch")
  fi
  notify::_post "$url" "$payload"
}

# notify::_build_generic_payload <project> <status> <rc> <duration_s> <branch>
# Emits the full JSON shape useful for any consumer (Line, custom, etc.).
notify::_build_generic_payload() {
  python3 -c '
import json, os, sys
project, status, rc, duration_s, branch = sys.argv[1:6]

def split_csv(s):
    return [x for x in (s or "").split(",") if x]

verdict_raw = os.environ.get("RAFITA_LAST_FINAL_VERDICT", "")
verdict = None
if verdict_raw:
    try:
        verdict = json.loads(verdict_raw)
    except Exception:
        verdict = None

payload = {
    "kind": "completion",
    "project": project,
    "status": status,
    "rc": int(rc),
    "run_id": os.environ.get("RAFITA_RUN_ID", ""),
    "duration_s": int(duration_s),
    "counts": {
        "done": int(os.environ.get("RAFITA_TASKS_DONE", "0") or 0),
        "skipped": int(os.environ.get("RAFITA_TASKS_SKIPPED", "0") or 0),
        "failed": int(os.environ.get("RAFITA_TASKS_FAILED", "0") or 0),
    },
    "tasks": {
        "done": split_csv(os.environ.get("RAFITA_TASKS_DONE_LIST", "")),
        "skipped": split_csv(os.environ.get("RAFITA_TASKS_SKIPPED_LIST", "")),
        "failed": split_csv(os.environ.get("RAFITA_TASKS_FAILED_LIST", "")),
    },
    "epics": split_csv(os.environ.get("RAFITA_EPICS_LIST", "")),
    "branch": branch,
    "pr_url": os.environ.get("RAFITA_LAST_PR_URL", "") or None,
    "final_review": {
        "status": (verdict or {}).get("status", ""),
        "summary": (verdict or {}).get("summary", ""),
    } if verdict else None,
    "worktree": os.environ.get("RAFITA_WORKTREE_PATH", "") or None,
}
print(json.dumps(payload))
' "$1" "$2" "$3" "$4" "$5"
}

# notify::_build_discord_payload <project> <status> <rc> <duration_s> <branch>
# Emits a Discord webhook payload with a single embed.
notify::_build_discord_payload() {
  python3 -c '
import json, os, sys
project, status, rc, duration_s, branch = sys.argv[1:6]

COLORS = {
    "success":     0x2ecc71,
    "partial":     0xf1c40f,
    "failure":     0xe74c3c,
    "interrupted": 0x95a5a6,
}
ICONS = {
    "success": "✅", "partial": "⚠️", "failure": "❌", "interrupted": "⏸",
}

def split_csv(s):
    return [x for x in (s or "").split(",") if x]

def truncate(s, n=1024):
    if not s: return "—"
    return s if len(s) <= n else s[:n-1] + "…"

def fmt_list(items, n=1024):
    if not items: return "—"
    text = "\n".join(f"• {x}" for x in items)
    return truncate(text, n)

def fmt_duration(seconds):
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h: return f"{h}h{m:02d}m{sec:02d}s"
    if m: return f"{m}m{sec:02d}s"
    return f"{sec}s"

done = split_csv(os.environ.get("RAFITA_TASKS_DONE_LIST", ""))
skipped = split_csv(os.environ.get("RAFITA_TASKS_SKIPPED_LIST", ""))
failed = split_csv(os.environ.get("RAFITA_TASKS_FAILED_LIST", ""))
epics = split_csv(os.environ.get("RAFITA_EPICS_LIST", ""))

counts = {
    "done": int(os.environ.get("RAFITA_TASKS_DONE", "0") or 0),
    "skipped": int(os.environ.get("RAFITA_TASKS_SKIPPED", "0") or 0),
    "failed": int(os.environ.get("RAFITA_TASKS_FAILED", "0") or 0),
}

verdict_raw = os.environ.get("RAFITA_LAST_FINAL_VERDICT", "")
verdict = None
if verdict_raw:
    try:
        verdict = json.loads(verdict_raw)
    except Exception:
        verdict = None

pr_url = os.environ.get("RAFITA_LAST_PR_URL", "")
run_id = os.environ.get("RAFITA_RUN_ID", "")

c_done = counts["done"]
c_skipped = counts["skipped"]
c_failed = counts["failed"]
description = (
    f"**{c_done}** done · **{c_skipped}** skipped · "
    f"**{c_failed}** failed · {fmt_duration(duration_s)}"
)
if int(rc) != 0:
    description += f"\n`rc={rc}`"

fields = []
if epics:
    fields.append({"name": "Epics", "value": truncate(", ".join(epics), 1024), "inline": True})
if branch:
    fields.append({"name": "Branch", "value": truncate(branch, 1024), "inline": True})
fields.append({"name": "Tasks done",    "value": fmt_list(done),    "inline": False})
if skipped:
    fields.append({"name": "Tasks skipped", "value": fmt_list(skipped), "inline": False})
if failed:
    fields.append({"name": "Tasks failed",  "value": fmt_list(failed),  "inline": False})
if verdict:
    v_summary = verdict.get("summary", "") or "—"
    v_status = verdict.get("status", "?")
    fields.append({
        "name": f"Final review — {v_status}",
        "value": truncate(v_summary, 1024),
        "inline": False,
    })
if pr_url:
    fields.append({"name": "Pull request", "value": pr_url, "inline": False})

icon = ICONS.get(status, "•")
embed = {
    "title": f"{icon} rafita: {project} — {status.upper()}",
    "description": description,
    "color": COLORS.get(status, 0x95a5a6),
    "fields": fields,
    "footer": {"text": f"run_id: {run_id}"},
}

payload = {
    "username": "rafita",
    "embeds": [embed],
}
print(json.dumps(payload))
' "$1" "$2" "$3" "$4" "$5"
}
