#!/usr/bin/env python3
"""Parse opencode --format json stream events from stdin.

Two outputs:
  stdout: the AUTHORITATIVE final assistant response (one shot at EOF).
          Source of truth (in order of preference):
            1. `result` event with `result` field (if opencode emits one)
            2. `step_finish` / `assistant_finish` event with full text
            3. concatenated text deltas from `text` events
          Empty stream → exit 2.

  stderr: human-readable per-event view, in real time:
          - text deltas (chunk-by-chunk)
          - tool_use (summarized; full args when RAFITA_DEBUG>=3)
          - tool_result (short)
          - any other event when RAFITA_DEBUG>=3
          When RAFITA_DEBUG>=3 every raw line is dumped before parsing.

Env:
  RAFITA_DEBUG  default 1 ; >=2 live view ; >=3 verbose + raw lines

Why like this: same rationale as stream-parser.py for claude. rafita reads
stdout as the final response. If opencode emits the final answer in a
single end event but the parser only mirrors deltas, we lose data when the
model uses tool_use without text, or when delta chunking is incomplete.
The authoritative final-event path eliminates that whole class of failure;
text-buffer fallback covers older opencode versions that lack a clean
end-event.
"""
import json
import os
import sys
import time


def ts():
    return time.strftime("%H:%M:%S")


def short(v, n=80):
    if v is None:
        return ""
    s = str(v)
    return s if len(s) <= n else s[: n - 1] + "…"


def fmt_args(args, debug):
    if not isinstance(args, dict):
        return short(str(args), 80)
    if debug >= 3:
        return json.dumps(args, ensure_ascii=False)[:500]
    interesting = ["path", "file_path", "command", "pattern", "url", "query"]
    kv = []
    for k in interesting:
        if k in args:
            kv.append(f"{k}={short(args[k], 60)}")
    return ", ".join(kv) or short(json.dumps(args, ensure_ascii=False), 80)


def extract_final_text(event):
    """Look in known shapes for the assembled final text. Returns str or None."""
    # opencode end-events use various shapes across versions; try them all.
    # Top-level "result"
    res = event.get("result")
    if isinstance(res, str) and res:
        return res
    # Nested under message/content
    msg = event.get("message") or {}
    content = msg.get("content")
    if isinstance(content, str) and content:
        return content
    if isinstance(content, list):
        chunks = []
        for blk in content:
            if isinstance(blk, dict) and blk.get("type") == "text":
                t = blk.get("text") or ""
                if t:
                    chunks.append(t)
        if chunks:
            return "".join(chunks)
    # Some versions put the answer in "text" or "output"
    for key in ("text", "output", "content_text"):
        v = event.get(key)
        if isinstance(v, str) and v:
            return v
    return None


def main():
    debug = int(os.environ.get("RAFITA_DEBUG", "1") or "1")
    text_buffer = []
    final_text = None

    for raw in sys.stdin:
        line = raw.strip()
        if not line:
            continue
        if debug >= 3:
            sys.stderr.write(f"[{ts()}] [raw] {line}\n")
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            sys.stderr.write(f"[{ts()}] [parse-warn] non-JSON: {short(line)}\n")
            continue

        etype = event.get("type", "")

        if etype == "text":
            part = event.get("part") or {}
            if isinstance(part, dict) and part.get("type") == "text":
                text = part.get("text") or ""
                if text:
                    text_buffer.append(text)
                    sys.stderr.write(f"[{ts()}] [text]      {short(text, 120)}\n")
                    sys.stderr.flush()

        elif etype in ("tool_use", "tool", "tool_call"):
            part = event.get("part") or event
            name = part.get("name") or part.get("tool") or "?"
            args = part.get("input") or part.get("args") or {}
            sys.stderr.write(f"[{ts()}] [tool_use]  {name}({fmt_args(args, debug)})\n")
            sys.stderr.flush()

        elif etype in ("tool_result", "tool_response"):
            payload = event.get("part") or event.get("result") or event
            sys.stderr.write(f"[{ts()}] [tool_ok]   {short(json.dumps(payload, ensure_ascii=False), 120)}\n")
            sys.stderr.flush()

        elif etype in ("step_finish", "assistant_finish", "result", "message_finish", "done"):
            # Possible end-of-turn events. Try to harvest authoritative text.
            candidate = extract_final_text(event)
            if candidate:
                final_text = candidate
            sys.stderr.write(f"[{ts()}] [end:{etype}] {short(json.dumps(event, ensure_ascii=False), 120)}\n")
            sys.stderr.flush()

        elif etype == "error":
            sys.stderr.write(f"[{ts()}] [error]     {short(json.dumps(event, ensure_ascii=False), 200)}\n")
            sys.stderr.flush()

        else:
            if debug >= 3:
                sys.stderr.write(f"[{ts()}] [ev:{etype}] {short(line, 120)}\n")
                sys.stderr.flush()

    if final_text is not None:
        sys.stdout.write(final_text)
    elif text_buffer:
        if debug >= 2:
            sys.stderr.write(
                f"[{ts()}] [parser-warn] no end-event with text; using delta buffer\n"
            )
        sys.stdout.write("".join(text_buffer))
    else:
        sys.stderr.write(
            f"[{ts()}] [parser-err] empty stream — no final text and no deltas\n"
        )
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
