#!/usr/bin/env python3
"""Parse Claude stream-json events from stdin.

Two outputs:
  stdout: the AUTHORITATIVE final assistant response (one shot at EOF).
          Source of truth: the `result` event's `result` field. Falls back to
          concatenated `text` blocks if no `result` event arrives (anomaly).

  stderr: human-readable per-event view, in real time:
          - text blocks (chunk-by-chunk)
          - tool_use (summarized; full input when RAFITA_DEBUG>=3)
          - tool_result (success/error tag + short content)
          - thinking (debug>=2 only, short)
          - result (duration + tokens)
          When RAFITA_DEBUG>=3 every raw line is also dumped before parsing.

Env:
  RAFITA_DEBUG  default 1
                >=2  show thinking + tool blocks live
                >=3  also show full tool_use input + every raw event line

Why this matters: rafita's downstream logic (review parser, <done/> detector,
summary extractor) reads stdout as the model's full response. If the parser
only mirrored text deltas to stdout and the model emitted everything via
tool_use blocks, rafita would receive empty output and loop on a fake "could
not parse verdict" error. Authoritative final response from `result` event
prevents that whole class of failure.
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


def fmt_tool_input(inp, debug):
    if not isinstance(inp, dict):
        return short(str(inp), 80)
    if debug >= 3:
        return json.dumps(inp, ensure_ascii=False)[:500]
    interesting = ["path", "file_path", "command", "pattern", "url", "query"]
    kv = []
    for k in interesting:
        if k in inp:
            kv.append(f"{k}={short(inp[k], 60)}")
    return ", ".join(kv) or short(json.dumps(inp, ensure_ascii=False), 80)


def main():
    debug = int(os.environ.get("RAFITA_DEBUG", "1") or "1")
    text_buffer = []        # fallback if no `result` event arrives
    final_result = None      # authoritative final response, set by `result` event
    saw_result_event = False

    for raw in sys.stdin:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        if debug >= 3:
            sys.stderr.write(f"[{ts()}] [raw] {line}\n")
        try:
            ev = json.loads(line)
        except Exception as e:
            sys.stderr.write(f"[{ts()}] [parse-warn] non-JSON: {short(line)}\n")
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
                if btype == "text":
                    text = block.get("text") or ""
                    text_buffer.append(text)
                    sys.stderr.write(f"[{ts()}] [text]      {short(text, 120)}\n")
                    sys.stderr.flush()
                elif btype == "tool_use":
                    name = block.get("name", "?")
                    pretty = fmt_tool_input(block.get("input"), debug)
                    sys.stderr.write(f"[{ts()}] [tool_use]  {name}({pretty})\n")
                    sys.stderr.flush()
                elif btype == "thinking":
                    if debug >= 2:
                        text = block.get("thinking") or block.get("text") or ""
                        sys.stderr.write(f"[{ts()}] [thinking]  {short(text, 200)}\n")
                        sys.stderr.flush()
                else:
                    if debug >= 3:
                        sys.stderr.write(f"[{ts()}] [block:{btype}] {short(json.dumps(block, ensure_ascii=False), 120)}\n")
                        sys.stderr.flush()

        elif etype == "user":
            # tool_result events come back as user messages.
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
                    sys.stderr.flush()

        elif etype == "result":
            saw_result_event = True
            # Authoritative final response. Even when subtype != "success" we
            # still capture whatever was produced so callers can inspect.
            res = ev.get("result")
            if isinstance(res, str):
                final_result = res
            elif res is not None:
                final_result = json.dumps(res, ensure_ascii=False)
            dur = ev.get("duration_ms", 0)
            usage = ev.get("usage") or {}
            inp = usage.get("input_tokens", "?")
            out = usage.get("output_tokens", "?")
            sub = ev.get("subtype", "?")
            err = ev.get("is_error", False)
            tag = "result-err" if err else "result"
            sys.stderr.write(
                f"[{ts()}] [{tag}]    subtype={sub} duration={dur}ms in={inp} out={out}\n"
            )
            sys.stderr.flush()

        elif etype in ("system", "rate_limit_event"):
            if debug >= 3:
                sub = ev.get("subtype", "")
                sys.stderr.write(f"[{ts()}] [ev:{etype}/{sub}] {short(line, 120)}\n")
                sys.stderr.flush()

        else:
            if debug >= 3:
                sys.stderr.write(f"[{ts()}] [ev:{etype}] {short(line, 120)}\n")
                sys.stderr.flush()

    # Emit the authoritative final response. Prefer result.result; fall back
    # to concatenated text blocks. If neither produced anything, exit non-zero
    # so callers can detect the anomaly.
    if final_result is not None:
        sys.stdout.write(final_result)
    elif text_buffer:
        sys.stderr.write(
            f"[{ts()}] [parser-warn] no `result` event; falling back to text blocks\n"
        )
        sys.stdout.write("".join(text_buffer))
    else:
        sys.stderr.write(
            f"[{ts()}] [parser-err] no result and no text blocks — empty stream\n"
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
