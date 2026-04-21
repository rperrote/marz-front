#!/usr/bin/env python3
"""
Parses claude --output-format stream-json NDJSON from stdin.
Prints live activity to stderr, writes final text output to stdout.
"""
import sys
import json
import signal

# Exit cleanly on SIGINT/SIGPIPE
signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
signal.signal(signal.SIGPIPE, lambda *_: sys.exit(0))

dim = "\033[2m"
reset = "\033[0m"
no_color = len(sys.argv) > 1 and sys.argv[1] == "--no-color"
if no_color:
    dim = ""
    reset = ""

full_text = []
seen_tools = set()


def emit(msg):
    sys.stderr.write(f"   {dim}{msg}{reset}\n")
    sys.stderr.flush()


def handle_tool_use(block):
    name = block.get("name", "")
    inp = block.get("input", {})
    tool_id = block.get("id", "")

    # Deduplicate: partial messages re-send the same tool_use block
    if tool_id and tool_id in seen_tools:
        return
    if tool_id:
        seen_tools.add(tool_id)

    if name == "Read":
        emit(f"Reading {inp.get('file_path', '?')}")
    elif name == "Write":
        emit(f"Writing {inp.get('file_path', '?')}")
    elif name == "Edit":
        emit(f"Editing {inp.get('file_path', '?')}")
    elif name == "Bash":
        cmd = inp.get("command", "")
        if len(cmd) > 80:
            cmd = cmd[:77] + "..."
        emit(f"$ {cmd}")
    elif name == "Grep":
        emit(f"Grep: {inp.get('pattern', '?')}")
    elif name == "Glob":
        emit(f"Glob: {inp.get('pattern', '?')}")
    elif name == "Task":
        emit(f"Task: {inp.get('description', '?')}")
    elif name == "Skill":
        emit(f"Skill: {inp.get('skill', '?')}")
    else:
        emit(f"Tool: {name}")


for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        ev = json.loads(line)
    except json.JSONDecodeError:
        continue

    etype = ev.get("type", "")

    # stream_event wrapper — unwrap the inner event
    if etype == "stream_event":
        inner = ev.get("event", {})
        inner_type = inner.get("type", "")

        # content_block_start with tool_use
        if inner_type == "content_block_start":
            cb = inner.get("content_block", {})
            if cb.get("type") == "tool_use":
                handle_tool_use(cb)

    # Full assistant message (emitted after each turn)
    elif etype == "assistant" and "message" in ev:
        msg = ev["message"]
        for block in msg.get("content", []):
            btype = block.get("type", "")
            if btype == "tool_use":
                handle_tool_use(block)
            elif btype == "text":
                full_text.append(block.get("text", ""))

    # Result event — final output
    elif etype == "result":
        result_text = ev.get("result", "")
        if result_text:
            full_text.append(result_text)

# Final text to stdout
print("\n".join(full_text))
