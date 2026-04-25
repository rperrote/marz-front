#!/usr/bin/env python3
# stream-parser-opencode.py — parse opencode --format json stream.
# stderr: human-readable per-event view (text + tool calls in debug=2; raw
# passthrough additionally in debug=3).
# stdout: accumulated assistant text only (the final response).

import json, os, sys, time


def ts():
    return time.strftime("%H:%M:%S")


def short(v, n=80):
    if v is None:
        return ""
    s = str(v)
    return s if len(s) <= n else s[: n - 1] + "…"


def main():
    debug = int(os.environ.get("RAFITA_DEBUG", "1") or "1")
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

        etype = event.get("type")
        if etype == "text":
            part = event.get("part", {})
            if isinstance(part, dict) and part.get("type") == "text":
                text = part.get("text", "")
                if text:
                    sys.stdout.write(text)
                    sys.stdout.flush()
                    sys.stderr.write(f"[{ts()}] [text]      {short(text, 120)}\n")
        elif etype in ("tool_use", "tool"):
            part = event.get("part") or event
            name = part.get("name") or part.get("tool") or "?"
            args = part.get("input") or part.get("args") or {}
            interesting = ["path", "file_path", "command", "pattern"]
            kv = []
            if isinstance(args, dict):
                for k in interesting:
                    if k in args:
                        kv.append(f"{k}={short(args[k], 60)}")
                pretty = ", ".join(kv) or short(json.dumps(args)[:80])
            else:
                pretty = short(str(args), 80)
            sys.stderr.write(f"[{ts()}] [tool_use]  {name}({pretty})\n")
        elif etype in ("tool_result", "step_finish"):
            sys.stderr.write(f"[{ts()}] [{etype}]   {short(json.dumps(event)[:120])}\n")
        elif debug >= 3:
            sys.stderr.write(f"[{ts()}] [ev:{etype}] {short(line, 120)}\n")

    sys.stdout.flush()
    sys.stderr.flush()


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        pass
    except KeyboardInterrupt:
        sys.exit(130)
