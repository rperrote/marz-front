#!/usr/bin/env python3
"""Parse `codex exec --json` JSONL events from stdin.

Two outputs:
  stdout: final assistant text, emitted once at EOF.
  stderr: live human-readable stream of thread, file changes, tool-ish items,
          and final token usage.

If RAFITA_CODEX_THREAD_FILE is set, the parser writes the observed thread_id
there so the shell wrapper can persist it for `codex exec resume`.
"""
import json
import os
import sys
import time


def ts():
    return time.strftime("%H:%M:%S")


def short(v, n=100):
    if v is None:
        return ""
    s = str(v)
    return s if len(s) <= n else s[: n - 1] + "..."


def write_thread_id(thread_id):
    path = os.environ.get("RAFITA_CODEX_THREAD_FILE", "")
    if not path or not thread_id:
        return
    try:
        with open(path, "w") as f:
            f.write(thread_id)
    except OSError:
        pass


def describe_file_change(item):
    changes = item.get("changes") or []
    if not isinstance(changes, list):
        return short(changes)
    parts = []
    for ch in changes[:8]:
        if isinstance(ch, dict):
            kind = ch.get("kind") or "change"
            path = ch.get("path") or "?"
            parts.append(f"{kind}:{path}")
        else:
            parts.append(str(ch))
    more = "" if len(changes) <= 8 else f" (+{len(changes) - 8} more)"
    return ", ".join(parts) + more


def main():
    debug = int(os.environ.get("RAFITA_DEBUG", "1") or "1")
    final_text = None
    text_buffer = []
    thread_id = ""

    for raw in sys.stdin:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        if debug >= 3:
            sys.stderr.write(f"[{ts()}] [raw] {line}\n")
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            sys.stderr.write(f"[{ts()}] [parse-warn] non-JSON: {short(line)}\n")
            sys.stderr.flush()
            continue

        etype = ev.get("type", "")

        if etype == "thread.started":
            thread_id = ev.get("thread_id") or thread_id
            write_thread_id(thread_id)
            sys.stderr.write(f"[{ts()}] [thread]    {thread_id}\n")
            sys.stderr.flush()

        elif etype in ("item.started", "item.completed"):
            item = ev.get("item") or {}
            itype = item.get("type", "")
            status = item.get("status") or ("completed" if etype == "item.completed" else "started")

            if itype == "agent_message":
                text = item.get("text") or ""
                if text:
                    final_text = text
                    text_buffer.append(text)
                    sys.stderr.write(f"[{ts()}] [text]      {short(text, 140)}\n")
                    sys.stderr.flush()
            elif itype == "file_change":
                sys.stderr.write(f"[{ts()}] [file]      {status} {describe_file_change(item)}\n")
                sys.stderr.flush()
            elif itype in ("command_execution", "tool_call", "custom_tool_call"):
                name = item.get("name") or item.get("command") or itype
                sys.stderr.write(f"[{ts()}] [tool]      {status} {short(name, 140)}\n")
                sys.stderr.flush()
            else:
                if debug >= 2:
                    sys.stderr.write(f"[{ts()}] [item:{itype or '?'}] {short(json.dumps(item, ensure_ascii=False), 180)}\n")
                    sys.stderr.flush()

        elif etype == "turn.completed":
            usage = ev.get("usage") or {}
            inp = usage.get("input_tokens", "?")
            out = usage.get("output_tokens", "?")
            reasoning = usage.get("reasoning_output_tokens", "?")
            sys.stderr.write(f"[{ts()}] [result]    in={inp} out={out} reasoning={reasoning}\n")
            sys.stderr.flush()

        elif etype == "turn.failed":
            sys.stderr.write(f"[{ts()}] [error]     {short(json.dumps(ev, ensure_ascii=False), 220)}\n")
            sys.stderr.flush()

        else:
            if debug >= 3:
                sys.stderr.write(f"[{ts()}] [ev:{etype}] {short(line, 140)}\n")
                sys.stderr.flush()

    if thread_id:
        write_thread_id(thread_id)

    if final_text is not None:
        sys.stdout.write(final_text)
    elif text_buffer:
        sys.stdout.write("".join(text_buffer))
    else:
        sys.stderr.write(f"[{ts()}] [parser-err] empty stream - no agent_message text\n")
        sys.stdout.flush()
        sys.stderr.flush()
        sys.exit(2)

    sys.stdout.flush()
    sys.stderr.flush()


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        pass
    except KeyboardInterrupt:
        sys.exit(130)
