#!/usr/bin/env python3
"""spawn-session.py — exec a command as the leader of a new session.

Equivalent to `setsid` on Linux (not always available on macOS). By becoming a
session leader, the PGID of the child equals its PID, and the parent shell
can later do `kill -- -<pid>` to reap the whole subtree.

Usage:
  spawn-session.py <command> [args...]

Replaces the current process with <command>, so the PID seen by the caller
(bash $!) is the session leader's PID.
"""
import os
import sys


def main():
    if len(sys.argv) < 2:
        print("usage: spawn-session.py <command> [args...]", file=sys.stderr)
        sys.exit(2)
    try:
        os.setsid()
    except OSError:
        # Already a session leader (unlikely here); ignore and continue.
        pass
    try:
        os.execvp(sys.argv[1], sys.argv[1:])
    except OSError as e:
        print(f"spawn-session: {e}", file=sys.stderr)
        sys.exit(127)


if __name__ == "__main__":
    main()
