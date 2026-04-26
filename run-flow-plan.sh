#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<EOF
Uso: $(basename "$0") <feat-start> [feat-end]

  feat-start  Número de FEAT inicial (ej: 003).
  feat-end    Número de FEAT final (opcional). Si se omite, corre hasta
              la última FEAT existente en marz-docs/features/.

Por cada FEAT en el rango, levanta un claude y corre:
  /flow-next:flow-next:plan <ruta-absoluta-a-03-solution.md>

Ejemplos:
  $(basename "$0") 003
  $(basename "$0") 003 007
EOF
  exit 1
}

[[ $# -lt 1 || $# -gt 2 ]] && usage

FEAT_START_RAW="$1"
FEAT_END_RAW="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_ROOT="$WORKSPACE_ROOT/marz-docs"
FEATURES_DIR="$DOCS_ROOT/features"

[[ -d "$FEATURES_DIR" ]] || { echo "features dir no existe: $FEATURES_DIR" >&2; exit 1; }

pad() { printf "%03d" "$((10#$1))"; }

START=$(pad "$FEAT_START_RAW")

ALL_FEATS=()
while IFS= read -r line; do
  ALL_FEATS+=("$line")
done < <(
  find "$FEATURES_DIR" -maxdepth 1 -type d -name 'FEAT-*' \
    -exec basename {} \; | sort
)

[[ ${#ALL_FEATS[@]} -gt 0 ]] || { echo "no hay carpetas FEAT-* en $FEATURES_DIR" >&2; exit 1; }

if [[ -n "$FEAT_END_RAW" ]]; then
  END=$(pad "$FEAT_END_RAW")
else
  LAST="${ALL_FEATS[$((${#ALL_FEATS[@]} - 1))]}"
  END="${LAST#FEAT-}"
  END="${END%%-*}"
fi

SELECTED=()
for dir in "${ALL_FEATS[@]}"; do
  num="${dir#FEAT-}"
  num="${num%%-*}"
  if [[ "$num" > "$START" || "$num" == "$START" ]] && \
     [[ "$num" < "$END"   || "$num" == "$END"   ]]; then
    SELECTED+=("$dir")
  fi
done

if [[ ${#SELECTED[@]} -eq 0 ]]; then
  echo "no hay features en el rango FEAT-$START..FEAT-$END" >&2
  exit 1
fi

echo "rango:   FEAT-$START..FEAT-$END"
echo "features:"
printf '  - %s\n' "${SELECTED[@]}"
echo

for feat in "${SELECTED[@]}"; do
  SOLUTION_PATH="$FEATURES_DIR/$feat/03-solution.md"

  echo "============================================"
  echo ">> $feat"
  echo "============================================"

  if [[ ! -f "$SOLUTION_PATH" ]]; then
    echo "SKIP: no existe $SOLUTION_PATH" >&2
    continue
  fi

  PROMPT="/flow-next:flow-next:plan $SOLUTION_PATH plan depth standar, no research, no review"

  OUTPUT_FILE="$(mktemp -t marz-run-flow-plan.XXXXXX)"
  trap 'rm -f "$OUTPUT_FILE"' EXIT

  set +e
  claude -p "$PROMPT" --permission-mode bypassPermissions 2>&1 | tee "$OUTPUT_FILE"
  CLAUDE_EXIT=${PIPESTATUS[0]}
  set -e

  rm -f "$OUTPUT_FILE"
  trap - EXIT

  if [[ $CLAUDE_EXIT -ne 0 ]]; then
    echo "ABORT: claude exit $CLAUDE_EXIT en $feat" >&2
    exit $CLAUDE_EXIT
  fi

  echo ">> $feat OK"
  echo
done

echo "done: ${#SELECTED[@]} features procesadas"
