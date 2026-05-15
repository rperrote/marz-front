#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<EOF
Uso: $(basename "$0") <ruta-a-archivo.md>

  archivo.md  Ruta (absoluta o relativa) al archivo markdown de solution/spec
              a pasar a /flow-next:flow-next:plan.

Levanta un claude y corre:
  /flow-next:flow-next:plan <ruta-absoluta-al-md>

Ejemplo:
  $(basename "$0") /abs/path/to/03-solution.md
EOF
  exit 1
}

case "${1:-}" in
  -h|--help) usage ;;
esac

[[ $# -eq 1 ]] || usage

INPUT_PATH="$1"

[[ -f "$INPUT_PATH" ]] || { echo "no existe archivo: $INPUT_PATH" >&2; exit 1; }

SOLUTION_PATH="$(cd "$(dirname "$INPUT_PATH")" && pwd)/$(basename "$INPUT_PATH")"

echo "solution: $SOLUTION_PATH"
echo

PROMPT="/flow-next:flow-next:plan $SOLUTION_PATH plan depth standar, no research, no review"

claude -p "$PROMPT" --permission-mode bypassPermissions
