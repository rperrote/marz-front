#!/usr/bin/env bash
# Helpers used by integration tests. Build on fixtures.sh.
#
# Exposes:
#   integration_setup         create tmp repo + .rafita/ wired to scripts dir
#   integration_teardown
#   run_rafita <args...>      run entrypoint, capture stdout+stderr+rc
#                             into INT_STDOUT, INT_STDERR, INT_RC

integration_setup() {
  setup_tmp_repo

  # Write .gitignore for scaffolding BEFORE installing mocks (so their files
  # are ignored from the start).
  cat > .gitignore << 'GI'
_origin.git/
_mockbin/
_claude-invocations.log
_claude-responses.txt
_claude-ratelimit.state
_flow-state.json
_flow.log
_vcs.log
_rl.state
_rl_counter
_review_state
_vcs.pr_created
_opencode-invocations.log
_codex-invocations.log
oc_output.txt
.rafita/runs/
.rafita/plans/
GI
  git add .gitignore
  git commit -q -m "test gitignore"

  # Install mocks. Their artifacts (_mockbin/, _*.log) are already ignored.
  mock_claude_cli
  mock_flowctl
  mock_vcs_cli

  # Scaffold .rafita/.
  mkdir -p "$ROOT_DIR_TEST/.rafita/profiles"
  export RAFITA_DIR="$ROOT_DIR_TEST/.rafita"

  # A minimal profile with no gates that uses our flowctl mock path.
  cat > "$RAFITA_DIR/profiles/generic.md" << 'PF'
## DEV Rules
- be good

## DEV Fix Rules
- only apply fixes

## Review Rules
- [ ] fine

## Plan Rules
(none)

## Format Command
(none)

## Test Command
(none)

## Lint Command
(none)

## Typecheck Command
(none)

## Skills
(none)

## Forbidden Paths
.env
.rafita/**
PF

  # Default config.
  cat > "$RAFITA_DIR/config.json" << JSON
{
  "projectType": "generic",
  "provider": "github",
  "branchByEpic": false,
  "branchPrefix": "feature/claude/",
  "maxReviewRounds": 3,
  "workerTimeout": 30,
  "yolo": false,
  "claudeBin": "claude",
  "devProvider": "claude",
  "reviewerProvider": "claude",
  "closerProvider": "claude",
  "devModel": "claude-opus-4-6",
  "reviewerModel": "claude-sonnet-4-6",
  "flowctl": "$(command -v flowctl)",
  "ui": false,
  "notifyWebhook": "",
  "skipOnFailedTask": true,
  "rateLimitTaskRetry": false,
  "rateLimitMaxSleep": 3600,
  "debug": 1
}
JSON

  # Add origin pointing at a bare throwaway repo so push+PR paths can run.
  local bare="$ROOT_DIR_TEST/_origin.git"
  git init -q --bare "$bare"
  git remote add origin "$bare"

  # Seed initial commit on main so base-branch diff works.
  git branch -m main 2>/dev/null || true
  git push -q origin main 2>/dev/null || true

  export RAFITA_UI=0
}

integration_teardown() {
  teardown_tmp_repo
}

run_rafita() {
  local stdout_tmp stderr_tmp
  stdout_tmp=$(mktemp); stderr_tmp=$(mktemp)
  bash "$RAFITA_SCRIPTS_DIR/rafita.sh" "$@" >"$stdout_tmp" 2>"$stderr_tmp"
  INT_RC=$?
  INT_STDOUT=$(cat "$stdout_tmp")
  INT_STDERR=$(cat "$stderr_tmp")
  rm -f "$stdout_tmp" "$stderr_tmp"
}

# install_scripted_claude <script_body>
# Replaces the mock `claude` in _mockbin with a script whose body decides
# behavior based on the prompt. The body runs after prompt parsing with the
# prompt in $prompt, the model in $model, the invocations log at
# $INV_LOG and the repo root at $REPO_ROOT. Must print response to stdout
# and exit with a code.
install_scripted_claude() {
  local body="$1"
  local bindir="${ROOT_DIR_TEST}/_mockbin"
  cat > "$bindir/claude" << SHELL
#!/usr/bin/env bash
set -u
prompt=""; model=""; of="text"
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    -p|--print)
      if [[ \$# -gt 1 && "\${2:-}" != --* ]]; then
        shift
        prompt="\${1:-}"
      fi
      ;;
    --model) shift; model="\${1:-}" ;;
    --output-format) shift; of="\${1:-}" ;;
    --dangerously-skip-permissions|--verbose|--include-partial-messages) ;;
  esac
  shift || true
done
[[ -z "\$prompt" && ! -t 0 ]] && prompt="\$(cat)"
INV_LOG="${ROOT_DIR_TEST}/_claude-invocations.log"
REPO_ROOT="${ROOT_DIR_TEST}"
python3 -c "import json,sys,time; print(json.dumps({'ts':int(time.time()),'model':sys.argv[1],'prompt':sys.argv[2][:4000]}))" "\$model" "\$prompt" >> "\$INV_LOG"
$body
SHELL
  chmod +x "$bindir/claude"
}

# Count how many times the mock claude was invoked with a prompt that matches
# a substring (looks into $FAKE_CLAUDE_LOG).
claude_invocations_matching() {
  local needle="$1"
  [[ -f "$FAKE_CLAUDE_LOG" ]] || { echo 0; return; }
  python3 - "$FAKE_CLAUDE_LOG" "$needle" << 'PYEOF'
import json, sys
path, needle = sys.argv[1], sys.argv[2]
n=0
with open(path) as f:
    for line in f:
        try:
            d=json.loads(line)
        except: continue
        if needle in d.get("prompt",""):
            n+=1
print(n)
PYEOF
}

# Return the model passed to the Nth (1-based) invocation.
claude_invocation_model() {
  local idx="$1"
  python3 - "$FAKE_CLAUDE_LOG" "$idx" << 'PYEOF'
import json, sys
path, idx = sys.argv[1], int(sys.argv[2])
with open(path) as f:
    lines=[l for l in f if l.strip()]
if idx<1 or idx>len(lines):
    print(""); sys.exit(0)
try:
    d=json.loads(lines[idx-1])
    print(d.get("model",""))
except:
    print("")
PYEOF
}
