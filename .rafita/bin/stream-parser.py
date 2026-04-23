#!/usr/bin/env python3
"""Parse Claude stream-json events from stdin.

stderr: human-readable per-event log lines.
stdout: concatenated 'text' blocks (the final assistant response).

Env:
  RAFITA_DEBUG  — if >= 3, dump full tool_use input payloads.
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


def main():
    debug = int(os.environ.get("RAFITA_DEBUG", "1") or "1")
    for raw in sys.stdin:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        try:
            ev = json.loads(line)
        except Exception:
            sys.stderr.write(f"[{ts()}] [parse-warn] non-JSON line: {short(line)}\n")
            continue
        etype = ev.get("type", "")
        if etype == "assistant":
            msg = ev.get("message") or {}
            content = msg.get("content") or []
            if not isinstance(content, list):
                content = [content]
            for block in content:
                if not isinstance(block, dict):
                    continue
                btype = block.get("type", "")
                if btype == "thinking":
                    text = block.get("thinking") or block.get("text") or ""
                    sys.stderr.write(f"[{ts()}] [thinking]  {short(text, 200)}\n")
                elif btype == "tool_use":
                    name = block.get("name", "?")
                    inp = block.get("input") or {}
                    if debug >= 3:
                        pretty = json.dumps(inp, ensure_ascii=False)[:500]
                    else:
                        # Summarize common fields.
                        interesting = ["path", "file_path", "command", "pattern"]
                        kv = []
                        for k in interesting:
                            if k in inp:
                                kv.append(f"{k}={short(inp[k], 60)}")
                        pretty = ", ".join(kv) or short(json.dumps(inp)[:80])
                    sys.stderr.write(f"[{ts()}] [tool_use]  {name}({pretty})\n")
                elif btype == "text":
                    text = block.get("text") or ""
                    sys.stderr.write(f"[{ts()}] [text]      {short(text, 120)}\n")
                    sys.stdout.write(text)
                    sys.stdout.flush()
        elif etype == "user":
            msg = ev.get("message") or {}
            content = msg.get("content") or []
            if not isinstance(content, list):
                content = [content]
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_result":
                    is_err = block.get("is_error", False)
                    val = block.get("content") or ""
                    if isinstance(val, list):
                        val = " ".join(
                            v.get("text", "") if isinstance(v, dict) else str(v) for v in val
                        )
                    tag = "tool_err" if is_err else "tool_ok"
                    sys.stderr.write(f"[{ts()}] [{tag}]   {short(val, 120)}\n")
        elif etype == "result":
            dur = ev.get("duration_ms", 0)
            usage = ev.get("usage") or {}
            inp = usage.get("input_tokens", "?")
            out = usage.get("output_tokens", "?")
            sys.stderr.write(
                f"[{ts()}] [result]    duration={dur}ms in={inp} out={out}\n"
            )
        else:
            # System/init events: ignore unless debug >= 3.
            if debug >= 3:
                sys.stderr.write(f"[{ts()}] [ev:{etype}] {short(line, 120)}\n")
    sys.stderr.flush()
    sys.stdout.flush()


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        pass
    except KeyboardInterrupt:
        sys.exit(130)
