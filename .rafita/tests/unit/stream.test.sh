#!/usr/bin/env bash
# Unit tests for stream parser.

# Assumes RAFITA_SCRIPTS_DIR is set by the runner.
PARSER="$RAFITA_SCRIPTS_DIR/bin/stream-parser.py"
CODEX_PARSER="$RAFITA_SCRIPTS_DIR/bin/stream-parser-codex.py"

test_stream_parser_emits_text_to_stdout() {
  local stdout_tmp stderr_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  python3 "$PARSER" > "$stdout_tmp" 2>"$stderr_tmp" << 'IN'
{"type":"assistant","message":{"content":[{"type":"text","text":"hello world"}]}}
{"type":"result","duration_ms":10,"usage":{"input_tokens":5,"output_tokens":7}}
IN
  local body; body=$(cat "$stdout_tmp")
  local logs; logs=$(cat "$stderr_tmp")
  assert_eq "hello world" "$body"
  assert_contains "$logs" "[text]"
  assert_contains "$logs" "[result]"
  rm -f "$stdout_tmp" "$stderr_tmp"
}

test_stream_parser_logs_tool_use() {
  local stdout_tmp stderr_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  python3 "$PARSER" > "$stdout_tmp" 2>"$stderr_tmp" << 'IN'
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"/tmp/x.ts"}}]}}
IN
  local logs; logs=$(cat "$stderr_tmp")
  assert_contains "$logs" "[tool_use]"
  assert_contains "$logs" "Read"
  assert_contains "$logs" "file_path=/tmp/x.ts"
  rm -f "$stdout_tmp" "$stderr_tmp"
}

test_stream_parser_logs_thinking() {
  local stderr_tmp; stderr_tmp=$(mktemp)
  python3 "$PARSER" > /dev/null 2>"$stderr_tmp" << 'IN'
{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Analyzing the diff"}]}}
IN
  local logs; logs=$(cat "$stderr_tmp")
  assert_contains "$logs" "[thinking]"
  assert_contains "$logs" "Analyzing the diff"
  rm -f "$stderr_tmp"
}

test_stream_parser_skips_malformed_lines() {
  local stdout_tmp stderr_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  python3 "$PARSER" > "$stdout_tmp" 2>"$stderr_tmp" << 'IN'
this is not json
{"type":"assistant","message":{"content":[{"type":"text","text":"ok"}]}}
IN
  local rc=$?
  assert_eq "0" "$rc" "parser must not crash on malformed line"
  local body; body=$(cat "$stdout_tmp")
  assert_eq "ok" "$body"
  local logs; logs=$(cat "$stderr_tmp")
  assert_contains "$logs" "[parse-warn]"
  rm -f "$stdout_tmp" "$stderr_tmp"
}

test_stream_parser_tool_result_logged() {
  local stderr_tmp; stderr_tmp=$(mktemp)
  python3 "$PARSER" > /dev/null 2>"$stderr_tmp" << 'IN'
{"type":"user","message":{"content":[{"type":"tool_result","content":[{"type":"text","text":"file contents"}],"is_error":false}]}}
IN
  local logs; logs=$(cat "$stderr_tmp")
  assert_contains "$logs" "[tool_ok]"
  assert_contains "$logs" "file contents"
  rm -f "$stderr_tmp"
}

test_codex_stream_parser_emits_agent_message_and_thread_file() {
  local stdout_tmp stderr_tmp thread_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp); thread_tmp=$(mktemp)
  RAFITA_CODEX_THREAD_FILE="$thread_tmp" python3 "$CODEX_PARSER" > "$stdout_tmp" 2>"$stderr_tmp" << 'IN'
{"type":"thread.started","thread_id":"019dd548-1111-7000-8000-abcdefabcdef"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"hello codex"}}
{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":2,"reasoning_output_tokens":0}}
IN
  local body; body=$(cat "$stdout_tmp")
  local logs; logs=$(cat "$stderr_tmp")
  local thread; thread=$(cat "$thread_tmp")
  assert_eq "hello codex" "$body"
  assert_eq "019dd548-1111-7000-8000-abcdefabcdef" "$thread"
  assert_contains "$logs" "[thread]"
  assert_contains "$logs" "[result]"
  rm -f "$stdout_tmp" "$stderr_tmp" "$thread_tmp"
}

test_codex_stream_parser_logs_file_changes() {
  local stdout_tmp stderr_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  python3 "$CODEX_PARSER" > "$stdout_tmp" 2>"$stderr_tmp" << 'IN'
{"type":"thread.started","thread_id":"019dd548-2222-7000-8000-abcdefabcdef"}
{"type":"item.started","item":{"id":"item_0","type":"file_change","changes":[{"path":"/tmp/x.txt","kind":"add"}],"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"done"}}
IN
  local logs; logs=$(cat "$stderr_tmp")
  assert_contains "$logs" "[file]"
  assert_contains "$logs" "add:/tmp/x.txt"
  rm -f "$stdout_tmp" "$stderr_tmp"
}
