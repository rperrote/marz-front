#!/usr/bin/env python3
"""Parse reviewer verdicts from stdin.

Usage:
  review-parse.py           → parse <review>{...}</review>
  review-parse.py --final   → parse <final-review>{...}</final-review>
  review-parse.py --fixes <json>  → render a markdown fixes block for prompts
"""
import json
import os
import re
import sys


def normalize_verdict(d):
    if not isinstance(d, dict):
        return fail_closed("verdict is not a JSON object")
    out = {
        "approved": bool(d.get("approved", False)),
        "fixes": d.get("fixes") or [],
        "summary": d.get("summary", ""),
        "source": d.get("source", "llm_review"),
    }
    norm_fixes = []
    for f in out["fixes"]:
        if isinstance(f, dict):
            norm_fixes.append({
                "file": str(f.get("file", "")),
                "issue": str(f.get("issue", "")),
                "suggestion": str(f.get("suggestion", "")),
                "fixed": bool(f.get("fixed", False)),
            })
        else:
            norm_fixes.append({"file": "", "issue": str(f), "suggestion": "", "fixed": False})
    out["fixes"] = norm_fixes
    return out


def fail_closed(reason):
    return {
        "approved": False,
        "fixes": [{
            "file": "(verdict-parser)",
            "issue": "could not parse reviewer verdict",
            "suggestion": reason[:400],
            "fixed": False,
        }],
        "summary": "verdict parse failed",
        "source": "parse_error",
    }


def parse_review(raw):
    m = re.search(r"<review>(.*?)</review>", raw, re.S)
    body = m.group(1).strip() if m else ""
    if not body:
        # Fallback: find an outer JSON object that contains "approved".
        idx = 0
        best = None
        while True:
            start = raw.find("{", idx)
            if start == -1:
                break
            depth = 0
            i = start
            while i < len(raw):
                c = raw[i]
                if c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        candidate = raw[start:i+1]
                        if "\"approved\"" in candidate:
                            best = candidate
                        break
                i += 1
            idx = start + 1
        body = best or ""
    if not body:
        return fail_closed("no <review> tag and no parseable JSON")
    try:
        d = json.loads(body)
    except Exception as e:
        return fail_closed(f"JSON decode error: {e}")
    return normalize_verdict(d)


def parse_final(raw):
    m = re.search(r"<final-review>(.*?)</final-review>", raw, re.S)
    body = m.group(1).strip() if m else ""
    if not body:
        return {"status": "fail", "issues": [{"issue": "no <final-review> tag"}], "summary": "no <final-review> tag"}
    try:
        d = json.loads(body)
    except Exception as e:
        return {"status": "fail", "issues": [{"issue": f"json: {e}"}], "summary": f"json decode: {e}"}
    return {
        "status": d.get("status", "fail"),
        "issues": d.get("issues") or [],
        "summary": d.get("summary", ""),
    }


def render_fixes(verdict_json):
    try:
        d = json.loads(verdict_json)
    except Exception:
        print("- (no parseable fixes)")
        return
    fixes = d.get("fixes") or []
    if not fixes:
        print("- (no specific fixes listed)")
        return
    for i, f in enumerate(fixes, 1):
        if not isinstance(f, dict):
            print(f"{i}. {f}")
            continue
        file = f.get("file", "")
        issue = f.get("issue", "")
        suggestion = f.get("suggestion", "")
        label = file or "(global)"
        print(f"{i}. **{label}** — {issue}")
        if suggestion:
            print(f"   - {suggestion}")


def main():
    args = sys.argv[1:]
    if args and args[0] == "--final":
        raw = sys.stdin.read()
        print(json.dumps(parse_final(raw)))
        return
    if args and args[0] == "--fixes":
        verdict_json = args[1] if len(args) > 1 else sys.stdin.read()
        render_fixes(verdict_json)
        return
    raw = sys.stdin.read()
    print(json.dumps(parse_review(raw)))


if __name__ == "__main__":
    main()
