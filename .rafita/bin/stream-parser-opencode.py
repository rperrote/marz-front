#!/usr/bin/env python3
# stream-parser-opencode.py — parse opencode --format json stream into plain text.
# Reads JSON events from stdin, emits accumulated text to stdout,
# and mirrors text to stderr in real-time for live viewing.
# Ignores non-text events (tool_use, step_start, etc).

import json, sys

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            # Fallback: pass through non-JSON lines
            sys.stdout.write(line + "\n")
            sys.stdout.flush()
            sys.stderr.write(line + "\n")
            sys.stderr.flush()
            continue

        etype = event.get("type")
        if etype == "text":
            part = event.get("part", {})
            if isinstance(part, dict) and part.get("type") == "text":
                text = part.get("text", "")
                if text:
                    sys.stdout.write(text)
                    sys.stdout.flush()
                    sys.stderr.write(text)
                    sys.stderr.flush()
        # tool_use, step_start, step_finish, etc. are silently dropped
        # from stdout but could be logged if debug mode is needed.

    sys.stdout.flush()
    sys.stderr.flush()

if __name__ == "__main__":
    main()
