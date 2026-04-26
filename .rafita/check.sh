#!/usr/bin/env bash
# check.sh — audit a project's rafita installation. Reports config quirks,
# profile extension issues, missing deps, flow-next state, git setup, etc.
# With --deep, also invokes claude sonnet to detect logical contradictions
# inside profile extensions.
#
# Usage:
#   .rafita/check.sh                       # quick checks only
#   .rafita/check.sh --deep                # add LLM-based checks
#   .rafita/check.sh --severity=warn       # hide info findings
#   .rafita/check.sh --json                # machine-readable output
#
# Exit codes:
#   0  no errors
#   1  one or more errors
#   2  invalid invocation (bad flag, etc.)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAFITA_DIR="${RAFITA_DIR:-.rafita}"
CONFIG_PATH="${RAFITA_DIR}/config.json"

# ───── findings store ──────────────────────────────────────────────────────
# Three parallel arrays: severity, code, message. Bash 3 has no maps.
FIND_SEVS=()
FIND_CODES=()
FIND_MSGS=()
FIND_HINTS=()

add_finding() {
  # add_finding <severity> <code> <message> <hint>
  FIND_SEVS+=("$1")
  FIND_CODES+=("$2")
  FIND_MSGS+=("$3")
  FIND_HINTS+=("${4:-}")
}

# ───── arg parsing ─────────────────────────────────────────────────────────
deep=0
sev_filter="info"
out_json=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --deep) deep=1; shift ;;
    --severity=*) sev_filter="${1#--severity=}"; shift ;;
    --json) out_json=1; shift ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

case "$sev_filter" in
  info|warn|error) ;;
  *) echo "invalid --severity: $sev_filter (use info|warn|error)" >&2; exit 2 ;;
esac

# ───── helpers ─────────────────────────────────────────────────────────────
get_cfg() {
  # get_cfg <key> [default]
  local key="$1" def="${2:-}"
  if [[ ! -f "$CONFIG_PATH" ]]; then printf '%s' "$def"; return; fi
  python3 - "$key" "$def" << 'PYEOF'
import json, sys, os
key, default = sys.argv[1], sys.argv[2]
path = os.environ.get("CONFIG_PATH", ".rafita/config.json")
try:
    d = json.load(open(path))
except Exception:
    print(default); sys.exit(0)
# nested keys: profileExtensions.dev
cur = d
for part in key.split("."):
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]
    else:
        print(default); sys.exit(0)
if isinstance(cur, (dict, list)):
    print(json.dumps(cur))
else:
    print(cur if cur != "" else default)
PYEOF
}
export CONFIG_PATH

has_cmd() { command -v "$1" >/dev/null 2>&1; }

read_file_safe() {
  local p="$1"
  [[ -f "$p" ]] && cat "$p"
}

# ═══════════════════════════════════════════════════════════════════════════
# CHECKERS
# ═══════════════════════════════════════════════════════════════════════════

# ───── pre-flight ──────────────────────────────────────────────────────────
if [[ ! -f "$CONFIG_PATH" ]]; then
  add_finding error C00 \
    "no se encontró $CONFIG_PATH — rafita no está instalado en este repo" \
    "corré /rafita2:setup primero"
fi

if [[ ! -d "$RAFITA_DIR" ]]; then
  add_finding error C00B \
    "no existe el directorio $RAFITA_DIR" \
    "corré /rafita2:setup"
fi

# Bail early if no config — no point running the rest.
if [[ ! -f "$CONFIG_PATH" ]]; then
  if (( out_json )); then
    printf '{"findings":[{"severity":"error","code":"C00","message":"no config"}]}\n'
  else
    echo "🔴 ERROR [C00] no $CONFIG_PATH — corré /rafita2:setup"
  fi
  exit 1
fi

# ───── C0M: keys faltantes en config.json ──────────────────────────────────
# Compara las keys del usuario contra el set canónico (DEFAULTS_JSON del
# setup). Si faltan keys, las listamos como warn — el usuario quizás tiene
# un config.json viejo de antes de que existieran. Run /rafita2:setup arregla.
missing_keys=$(python3 - "$CONFIG_PATH" << 'PYEOF'
import json, sys
canonical = {
    "projectType","provider","branchMode","branchPrefix","maxReviewRounds",
    "streamOutput","yolo","claudeBin","opencodeBin","devProvider",
    "reviewerProvider","plannerProvider","devModel","reviewerModel","flowctl",
    "ui","notifyWebhook","projectName","skipOnFailedTask","rateLimitTaskRetry",
    "rateLimitMaxSleep","resumeEnabled","debug","prBase","worktreeBase",
    "closerEnabled","closerProvider","closerModel","maxFinalRounds",
    "profileExtensions",
}
canonical_pe = {"dev","reviewer","closer","all"}
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
present = set(d.keys())
missing = sorted(canonical - present)
extra = sorted(present - canonical - {"worktreeEnabled","worktreeKeep"})
# profileExtensions sub-keys
pe = d.get("profileExtensions") or {}
pe_missing = sorted(canonical_pe - set(pe.keys())) if isinstance(pe, dict) else list(canonical_pe)
for k in missing:
    print(f"missing\t{k}")
for k in pe_missing:
    print(f"missing_pe\t{k}")
for k in extra:
    print(f"extra\t{k}")
PYEOF
)
while IFS=$'\t' read -r kind key; do
  [[ -z "$kind" ]] && continue
  case "$kind" in
    missing)
      add_finding warn "C0M-${key}" \
        "config.json no tiene la key '${key}'" \
        "ejecutá /rafita2:setup para refrescar el config con todas las keys canónicas"
      ;;
    missing_pe)
      add_finding warn "C0M-pe-${key}" \
        "config.json: profileExtensions no tiene la sub-key '${key}'" \
        "agregala como string vacío si no la usás, o configurala explícitamente"
      ;;
    extra)
      add_finding info "C0X-${key}" \
        "config.json tiene la key '${key}' que no está en el set canónico (probablemente legacy o typo)" \
        "verificá si todavía la necesitás; rafita la ignora si no la lee ningún módulo"
      ;;
  esac
done <<< "$missing_keys"

# ───── C01: projectType=generic ────────────────────────────────────────────
project_type=$(get_cfg projectType generic)
if [[ "$project_type" == "generic" ]]; then
  add_finding warn C01 \
    "projectType=generic — no estás aprovechando un perfil específico del stack" \
    "ajustá a frontend / backend-node / fullstack según corresponda"
fi

# ───── C02: dev y reviewer con mismo modelo ────────────────────────────────
dev_model=$(get_cfg devModel "")
reviewer_model=$(get_cfg reviewerModel "")
if [[ -n "$dev_model" && -n "$reviewer_model" && "$dev_model" == "$reviewer_model" ]]; then
  add_finding warn C02 \
    "devModel == reviewerModel ($dev_model) — el reviewer no aporta diversidad de criterio" \
    "usá modelos distintos (ej: dev=opus, reviewer=sonnet) para que el review encuentre cosas que el dev no vió"
fi

# ───── C03: providers cruzados (info) ──────────────────────────────────────
dev_prov=$(get_cfg devProvider "")
rev_prov=$(get_cfg reviewerProvider "")
if [[ -n "$dev_prov" && -n "$rev_prov" && "$dev_prov" != "$rev_prov" ]]; then
  add_finding info C03 \
    "providers cruzados: dev=$dev_prov, reviewer=$rev_prov" \
    "OK pero verificá que ambos binarios estén instalados y que la latencia/costo te cierre"
fi

# ───── C04: closer enabled sin model explícito ─────────────────────────────
closer_on=$(get_cfg closerEnabled false)
closer_model=$(get_cfg closerModel "")
if [[ "$closer_on" == "True" || "$closer_on" == "true" ]]; then
  if [[ -z "$closer_model" ]]; then
    add_finding warn C04 \
      "closerEnabled=true pero closerModel vacío → va a usar devModel" \
      "configurá closerModel explícitamente para evitar ambigüedad"
  fi
fi

# ───── C05: closer apagado (info) ──────────────────────────────────────────
if [[ "$closer_on" != "True" && "$closer_on" != "true" ]]; then
  add_finding info C05 \
    "closerEnabled=false — perdés el último checkpoint de calidad antes de publicar" \
    "considerá activarlo para epics multi-task"
fi

# ───── C08: yolo apagado ───────────────────────────────────────────────────
yolo=$(get_cfg yolo true)
if [[ "$yolo" == "False" || "$yolo" == "false" ]]; then
  add_finding info C08 \
    "yolo=false → claude/opencode van a pedir permisos por cada tool, frena el flow autónomo" \
    "activá yolo=true si querés runs sin intervención"
fi

# ───── C09: prBase vacío ───────────────────────────────────────────────────
pr_base=$(get_cfg prBase "")
if [[ -z "$pr_base" ]]; then
  add_finding warn C09 \
    "prBase vacío — rafita va a inferir dev/main/master, podés terminar comparando contra la rama equivocada" \
    "configurá prBase explícitamente (ej: \"dev\")"
fi

# ───── C10: notify webhook vacío ───────────────────────────────────────────
notify=$(get_cfg notifyWebhook "")
if [[ -z "$notify" ]]; then
  add_finding info C10 \
    "notifyWebhook vacío — sin notificaciones de fin de run" \
    "configurá una URL de webhook (Discord/Slack/genérico) si querés ping al terminar"
fi

# ───── C11: stream activo sin parser ───────────────────────────────────────
debug=$(get_cfg debug 1)
if [[ "$debug" =~ ^[0-9]+$ ]] && (( debug >= 2 )); then
  if [[ ! -f "${RAFITA_DIR}/bin/stream-parser.py" ]]; then
    add_finding error C11 \
      "debug=$debug activa stream pero falta ${RAFITA_DIR}/bin/stream-parser.py" \
      "re-ejecutá /rafita2:setup para restaurar archivos"
  fi
fi

# ───── C12: profile extensions — archivos referenciados ────────────────────
for sub in dev reviewer closer all; do
  ext_path=$(get_cfg "profileExtensions.${sub}" "")
  [[ -z "$ext_path" ]] && continue
  # Resolve relative to repo root (where check.sh runs)
  abs_path="$ext_path"
  [[ "$abs_path" != /* ]] && abs_path="$(pwd)/$ext_path"
  if [[ ! -f "$abs_path" ]]; then
    add_finding error "C12-${sub}" \
      "profileExtensions.${sub} apunta a '${ext_path}' pero el archivo no existe" \
      "creá el archivo o vaciá profileExtensions.${sub} en config.json"
  fi
done

# ───── C13: extension no tiene la sección esperada ─────────────────────────
declare_section_for() {
  case "$1" in
    dev) echo "DEV Rules" ;;
    reviewer) echo "Review Rules" ;;
    closer) echo "Closer Rules" ;;
    all) echo "" ;;  # all extends multiple sections; no single required section
  esac
}
for sub in dev reviewer closer; do
  ext_path=$(get_cfg "profileExtensions.${sub}" "")
  [[ -z "$ext_path" ]] && continue
  abs_path="$ext_path"
  [[ "$abs_path" != /* ]] && abs_path="$(pwd)/$ext_path"
  [[ ! -f "$abs_path" ]] && continue
  expected=$(declare_section_for "$sub")
  [[ -z "$expected" ]] && continue
  if ! grep -qE "^##\s+${expected}\s*$" "$abs_path"; then
    add_finding warn "C13-${sub}" \
      "profileExtensions.${sub}='${ext_path}' no tiene sección \`## ${expected}\` — su contenido será ignorado parcialmente" \
      "envolvé el contenido bajo \`## ${expected}\` para que rafita lo concatene al profile base"
  fi
done

# ───── C15: flowctl no ejecutable ──────────────────────────────────────────
flowctl=$(get_cfg flowctl ".flow/bin/flowctl")
if [[ ! -x "$flowctl" ]] && ! has_cmd "$flowctl"; then
  add_finding error C15 \
    "flowctl no es ejecutable: $flowctl" \
    "instalá flow-next o ajustá la key 'flowctl' en config.json"
fi

# ───── C16: provider binaries en PATH ──────────────────────────────────────
for provider in $dev_prov $rev_prov $(get_cfg closerProvider ""); do
  case "$provider" in
    claude)
      if ! has_cmd "$(get_cfg claudeBin claude)"; then
        add_finding error "C16-claude" \
          "binario 'claude' no está en PATH pero está configurado como provider" \
          "instalá claude CLI o ajustá claudeBin en config.json"
      fi
      ;;
    opencode)
      if ! has_cmd "$(get_cfg opencodeBin opencode)"; then
        add_finding error "C16-opencode" \
          "binario 'opencode' no está en PATH pero está configurado como provider" \
          "instalá opencode CLI o ajustá opencodeBin en config.json"
      fi
      ;;
  esac
done

# ───── C17: .flow/epics vacío o inexistente ────────────────────────────────
if [[ ! -d ".flow/epics" ]]; then
  add_finding warn C17 \
    "no existe .flow/epics/ — rafita no tiene épicas para procesar" \
    "creá épicas con flowctl antes de correr rafita"
elif [[ -z "$(ls -A .flow/epics 2>/dev/null)" ]]; then
  add_finding warn C17 \
    ".flow/epics/ está vacío" \
    "creá épicas con flowctl antes de correr rafita"
fi

# ───── C18: worktreeBase ──────────────────────────────────────────────────
wt_base=$(get_cfg worktreeBase "../.rafita-worktrees")
if [[ "$wt_base" != /* ]]; then
  # relative — resolve against repo root
  resolved="$(pwd)/$wt_base"
  parent="$(dirname "$resolved")"
  if [[ ! -d "$parent" ]]; then
    add_finding warn C18 \
      "worktreeBase='$wt_base' resuelve a un parent que no existe ($parent)" \
      "verificá la ruta o cambiá a una válida (ej: ../.rafita-worktrees)"
  fi
fi

# ───── C19: repo sin remote ────────────────────────────────────────────────
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  if [[ -z "$(git remote 2>/dev/null)" ]]; then
    add_finding info C19 \
      "el repo no tiene remote configurado — rafita no podrá pushear ni crear PRs" \
      "agregá un remote (git remote add origin ...) o esperá hasta que esté listo"
  fi
fi

# ───── C20: profile base existe para projectType ───────────────────────────
profile_dirs=("${RAFITA_DIR}/profiles" "${SCRIPT_DIR}/profiles")
profile_found=""
for pdir in "${profile_dirs[@]}"; do
  if [[ -f "$pdir/${project_type}.md" ]]; then
    profile_found="$pdir/${project_type}.md"
    break
  fi
done
if [[ -z "$profile_found" ]]; then
  add_finding error C20 \
    "no existe perfil base para projectType='$project_type'" \
    "ajustá projectType a uno de los perfiles disponibles, o agregá ${project_type}.md a .rafita/profiles/"
fi

# ───── C22: package manager mismatch ──────────────────────────────────────
if [[ -f "package.json" ]]; then
  pkg_mgr=""
  if [[ -f "pnpm-lock.yaml" ]]; then pkg_mgr="pnpm";
  elif [[ -f "yarn.lock" ]]; then pkg_mgr="yarn";
  elif [[ -f "package-lock.json" ]]; then pkg_mgr="npm";
  fi

  for sub in dev reviewer closer all; do
    ext_path=$(get_cfg "profileExtensions.${sub}" "")
    [[ -z "$ext_path" ]] && continue
    [[ ! -f "$ext_path" ]] && continue
    # Find package manager mentions in extension
    for mgr in pnpm yarn npm; do
      [[ "$mgr" == "$pkg_mgr" ]] && continue
      if grep -qwE "$mgr (run |install|test|lint|format)" "$ext_path" 2>/dev/null; then
        add_finding warn "C22-${sub}-${mgr}" \
          "profileExtensions.${sub}='${ext_path}' menciona '${mgr}' pero el repo usa '${pkg_mgr:-ninguno detectado}'" \
          "actualizá los comandos en la extensión para que matcheen el package manager del repo"
      fi
    done
  done
fi

# ───── C23: extensions referencian paths inexistentes ─────────────────────
for sub in dev reviewer closer all; do
  ext_path=$(get_cfg "profileExtensions.${sub}" "")
  [[ -z "$ext_path" ]] && continue
  [[ ! -f "$ext_path" ]] && continue
  # Look for backtick-quoted paths that look like file refs (have / and an extension)
  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    # Skip URLs, npm scripts, node_modules paths, glob patterns
    [[ "$ref" =~ ^https?:// ]] && continue
    [[ "$ref" =~ ^node_modules/ ]] && continue
    [[ "$ref" =~ \* ]] && continue
    if [[ ! -e "$ref" ]]; then
      add_finding info "C23-${sub}" \
        "profileExtensions.${sub} menciona path '${ref}' que no existe en el repo" \
        "verificá si el path es correcto o actualizalo"
    fi
  done < <(grep -oE '`[A-Za-z0-9_./-]+\.[a-z]+`' "$ext_path" 2>/dev/null \
           | sed 's/`//g' | sort -u | head -20)
done

# ───── C26: specs muy cortas ──────────────────────────────────────────────
if [[ -d ".flow/tasks" ]]; then
  while IFS= read -r spec_file; do
    lines=$(wc -l < "$spec_file" | tr -d ' ')
    if (( lines < 10 )); then
      task_id=$(basename "$spec_file" .md)
      add_finding warn "C26-${task_id}" \
        "spec ${task_id} tiene solo ${lines} líneas — el dev no va a tener contexto suficiente" \
        "ampliá la descripción, scope, acceptance criteria"
    fi
  done < <(find .flow/tasks -name "*.md" -type f 2>/dev/null)
fi

# ───── C27: specs sin Acceptance ──────────────────────────────────────────
if [[ -d ".flow/tasks" ]]; then
  while IFS= read -r spec_file; do
    if ! grep -qiE "^##\s+(acceptance|criteri|definition of done|aceptaci)" "$spec_file"; then
      task_id=$(basename "$spec_file" .md)
      add_finding warn "C27-${task_id}" \
        "spec ${task_id} no tiene sección de Acceptance/Criteria — el reviewer no tiene cómo validar" \
        "agregá '## Acceptance' con criterios verificables"
    fi
  done < <(find .flow/tasks -name "*.md" -type f 2>/dev/null)
fi

# ───── C29: depends_on inválido ────────────────────────────────────────────
if [[ -d ".flow/tasks" ]]; then
  python3 - << 'PYEOF' || true
import json, os, glob, sys
all_tasks = set()
deps = {}
for f in glob.glob(".flow/tasks/*.json"):
    try:
        d = json.load(open(f))
        tid = d.get("id")
        if tid:
            all_tasks.add(tid)
            deps[tid] = d.get("depends_on") or []
    except Exception:
        continue
findings = []
for tid, dep_list in deps.items():
    for dep in dep_list:
        if dep not in all_tasks:
            findings.append((tid, dep))
for tid, dep in findings:
    print(f"C29\t{tid}\t{dep}")
PYEOF
  while IFS=$'\t' read -r code tid dep; do
    [[ -z "$code" ]] && continue
    add_finding error "${code}-${tid}" \
      "task ${tid} depende de '${dep}' que no existe" \
      "corregí el depends_on en .flow/tasks/${tid}.json"
  done < <(python3 - << 'PYEOF' 2>/dev/null
import json, glob
all_tasks = set()
deps = {}
for f in glob.glob(".flow/tasks/*.json"):
    try:
        d = json.load(open(f))
        tid = d.get("id")
        if tid:
            all_tasks.add(tid)
            deps[tid] = d.get("depends_on") or []
    except Exception:
        continue
for tid, dep_list in deps.items():
    for dep in dep_list:
        if dep not in all_tasks:
            print(f"C29\t{tid}\t{dep}")
PYEOF
)
fi

# ───── C30: epic sin tasks ─────────────────────────────────────────────────
if [[ -d ".flow/epics" ]]; then
  while IFS= read -r epic_file; do
    epic_id=$(basename "$epic_file" .json)
    if ! ls .flow/tasks/${epic_id}.*.json >/dev/null 2>&1; then
      add_finding warn "C30-${epic_id}" \
        "epic ${epic_id} no tiene tasks asociadas" \
        "creá tasks con flowctl o eliminá el epic vacío"
    fi
  done < <(find .flow/epics -name "*.json" -type f 2>/dev/null)
fi

# ───── C35: dirty working tree ─────────────────────────────────────────────
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  dirty=$(git status --porcelain=v1 2>/dev/null | grep -v ' \.rafita/' | grep -v '^.. \.rafita/' || true)
  if [[ -n "$dirty" ]]; then
    add_finding warn C35 \
      "working tree dirty fuera de .rafita/ — rafita aborta runs con cambios sin commitear" \
      "commiteá o stash antes de correr rafita"
  fi
fi

# ───── C36: gitignore missing rafita paths ────────────────────────────────
if [[ -f ".gitignore" ]]; then
  needed=(".rafita/runs/" ".rafita/state.json" ".rafita/sessions/")
  missing=()
  for p in "${needed[@]}"; do
    if ! grep -qxF "$p" .gitignore 2>/dev/null; then
      missing+=("$p")
    fi
  done
  if (( ${#missing[@]} > 0 )); then
    add_finding info C36 \
      ".gitignore no incluye: ${missing[*]}" \
      "rafita lo agrega automáticamente al primer run, pero podés agregar ahora"
  fi
fi

# ───── C38: prBase no existe localmente ────────────────────────────────────
if [[ -n "$pr_base" ]] && git rev-parse --show-toplevel >/dev/null 2>&1; then
  if ! git rev-parse --verify --quiet "$pr_base" >/dev/null 2>&1; then
    add_finding error C38 \
      "prBase='$pr_base' no existe como rama local" \
      "ejecutá 'git fetch origin $pr_base:$pr_base' o ajustá prBase en config.json"
  fi
fi

# ───── C41: lockfile no commiteado ────────────────────────────────────────
if [[ -f "package.json" ]]; then
  for lock in pnpm-lock.yaml yarn.lock package-lock.json; do
    if [[ -f "$lock" ]]; then
      if git rev-parse --show-toplevel >/dev/null 2>&1; then
        if ! git ls-files --error-unmatch "$lock" >/dev/null 2>&1; then
          add_finding warn "C41-${lock}" \
            "$lock existe pero no está commiteado" \
            "agregalo al repo: git add $lock"
        fi
      fi
      break
    fi
  done
fi

# ───── C43: profileExtensions duplican comandos con 'all' ──────────────────
ext_all=$(get_cfg "profileExtensions.all" "")
if [[ -n "$ext_all" && -f "$ext_all" ]]; then
  for cmd_section in "Format Command" "Test Command" "Lint Command" "Typecheck Command"; do
    if grep -qE "^##\s+${cmd_section}\s*$" "$ext_all"; then
      for sub in dev reviewer closer; do
        ext_sub=$(get_cfg "profileExtensions.${sub}" "")
        [[ -z "$ext_sub" || ! -f "$ext_sub" ]] && continue
        if grep -qE "^##\s+${cmd_section}\s*$" "$ext_sub"; then
          add_finding info "C43-${sub}-${cmd_section// /_}" \
            "profileExtensions.all y profileExtensions.${sub} ambos definen '${cmd_section}' — 'all' gana" \
            "decidí cuál querés y eliminá el duplicado"
        fi
      done
    fi
  done
fi

# ───── C49: CLAUDE.md / README en raíz ────────────────────────────────────
if [[ ! -f "CLAUDE.md" && ! -f "AGENTS.md" ]]; then
  add_finding warn C49 \
    "no hay CLAUDE.md ni AGENTS.md en la raíz — los agentes no van a tener contexto del proyecto" \
    "creá un CLAUDE.md con visión general, stack, convenciones"
fi

# ───── C51: epics vs tasks count desincronizado ───────────────────────────
if [[ -d ".flow/epics" && -d ".flow/tasks" ]]; then
  python3 - << 'PYEOF' 2>/dev/null
import json, glob, os
for ef in glob.glob(".flow/epics/*.json"):
    try:
        e = json.load(open(ef))
    except Exception:
        continue
    eid = e.get("id") or os.path.basename(ef).replace(".json", "")
    declared = e.get("tasks") or e.get("task_count") or None
    actual = len(glob.glob(f".flow/tasks/{eid}.*.json"))
    if declared is not None and isinstance(declared, int) and declared != actual:
        print(f"{eid}\t{declared}\t{actual}")
PYEOF
  while IFS=$'\t' read -r eid declared actual; do
    [[ -z "$eid" ]] && continue
    add_finding error "C51-${eid}" \
      "epic ${eid} declara ${declared} tasks pero hay ${actual} archivos en .flow/tasks/" \
      "sincronizá: agregá las tasks faltantes o ajustá el count"
  done < <(python3 - << 'PYEOF' 2>/dev/null
import json, glob, os
for ef in glob.glob(".flow/epics/*.json"):
    try:
        e = json.load(open(ef))
    except Exception:
        continue
    eid = e.get("id") or os.path.basename(ef).replace(".json", "")
    declared = e.get("tasks") or e.get("task_count") or None
    actual = len(glob.glob(f".flow/tasks/{eid}.*.json"))
    if declared is not None and isinstance(declared, int) and declared != actual:
        print(f"{eid}\t{declared}\t{actual}")
PYEOF
)
fi

# ───── C52: projectName vacío (info) ──────────────────────────────────────
proj_name=$(get_cfg projectName "")
if [[ -z "$proj_name" ]]; then
  add_finding info C52 \
    "projectName vacío — se autodetecta del repo root" \
    "configurá projectName si querés override en notificaciones"
fi

# ═══════════════════════════════════════════════════════════════════════════
# DEEP CHECKS (LLM-based, only with --deep)
# ═══════════════════════════════════════════════════════════════════════════
if (( deep )); then
  if ! has_cmd "$(get_cfg claudeBin claude)"; then
    add_finding warn C-DEEP \
      "--deep solicitado pero claude CLI no está disponible — saltando checks LLM" \
      "instalá claude o quitá --deep"
  else
    deep_model="${RAFITA_CHECK_MODEL:-claude-sonnet-4-6}"
    cb="$(get_cfg claudeBin claude)"

    # ───── C46: contradicciones extension vs base profile ──────────────────
    for sub in dev reviewer closer; do
      ext_path=$(get_cfg "profileExtensions.${sub}" "")
      [[ -z "$ext_path" || ! -f "$ext_path" ]] && continue
      [[ -z "$profile_found" ]] && continue

      base_content=$(cat "$profile_found")
      ext_content=$(cat "$ext_path")

      prompt=$(cat << EOF
Sos un auditor de configuración. Acá hay dos archivos:

BASE (perfil de rafita):
\`\`\`
$base_content
\`\`\`

EXTENSIÓN del usuario para el rol "${sub}":
\`\`\`
$ext_content
\`\`\`

Identificá si hay reglas en la extensión que **contradicen** reglas del base. Solo contradicciones reales, no estilo.

Devolvé UN bloque \`<audit>...</audit>\` con JSON:

<audit>{"contradictions": [{"base_rule": "texto", "ext_rule": "texto", "severity": "warn|error", "explanation": "1 línea"}]}</audit>

Si no hay contradicciones: \`<audit>{"contradictions": []}</audit>\`. Sin prosa fuera del bloque.
EOF
)
      echo "  · running deep check on profileExtensions.${sub}..." >&2
      out=$(printf '%s' "$prompt" | "$cb" -p --model "$deep_model" --dangerously-skip-permissions 2>/dev/null || true)
      contradictions=$(printf '%s' "$out" | python3 - << 'PYEOF' 2>/dev/null
import sys, re, json
raw = sys.stdin.read()
m = re.search(r"<audit>(.*?)</audit>", raw, re.S)
if not m:
    sys.exit(0)
try:
    d = json.loads(m.group(1).strip())
except Exception:
    sys.exit(0)
for c in d.get("contradictions", []):
    sev = c.get("severity", "warn")
    base = (c.get("base_rule") or "")[:120]
    ext = (c.get("ext_rule") or "")[:120]
    expl = c.get("explanation", "")[:200]
    print(f"{sev}\t{base} <→> {ext}\t{expl}")
PYEOF
)
      while IFS=$'\t' read -r sev pair expl; do
        [[ -z "$sev" ]] && continue
        add_finding "$sev" "C46-${sub}" \
          "contradicción en extension '${sub}': ${pair}" \
          "${expl}"
      done <<< "$contradictions"
    done

    # ───── C50: CLAUDE.md genérico ──────────────────────────────────────────
    if [[ -f "CLAUDE.md" ]]; then
      claude_md=$(head -200 CLAUDE.md)
      prompt="Acá está el CLAUDE.md de un proyecto:
\`\`\`
$claude_md
\`\`\`

¿Es un CLAUDE.md útil o es genérico/vacío/placeholder? Devolvé UN bloque <audit>:

<audit>{\"useful\": true|false, \"reason\": \"1 línea\"}</audit>

Sin prosa fuera del bloque."
      echo "  · running deep check on CLAUDE.md..." >&2
      out=$(printf '%s' "$prompt" | "$cb" -p --model "$deep_model" --dangerously-skip-permissions 2>/dev/null || true)
      useful=$(printf '%s' "$out" | python3 - << 'PYEOF' 2>/dev/null
import sys, re, json
raw = sys.stdin.read()
m = re.search(r"<audit>(.*?)</audit>", raw, re.S)
if not m: sys.exit(0)
try:
    d = json.loads(m.group(1).strip())
except Exception: sys.exit(0)
print(f"{d.get('useful')}\t{d.get('reason','')}")
PYEOF
)
      IFS=$'\t' read -r useful reason <<< "$useful"
      if [[ "$useful" == "False" ]]; then
        add_finding warn C50 \
          "CLAUDE.md parece genérico/poco útil: ${reason}" \
          "expandí con contexto real del producto, stack, convenciones, dominio"
      fi
    fi
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT
# ═══════════════════════════════════════════════════════════════════════════

# Severity weights for filtering.
sev_weight() {
  case "$1" in
    info) echo 0 ;;
    warn) echo 1 ;;
    error) echo 2 ;;
    *) echo 0 ;;
  esac
}
filter_w=$(sev_weight "$sev_filter")

errors=0; warns=0; infos=0
for s in "${FIND_SEVS[@]}"; do
  case "$s" in
    error) errors=$((errors+1)) ;;
    warn) warns=$((warns+1)) ;;
    info) infos=$((infos+1)) ;;
  esac
done

if (( out_json )); then
  # Build JSON manually to avoid bash↔python quoting issues with arrays.
  printf '{"findings":['
  first=1
  for i in "${!FIND_SEVS[@]}"; do
    w=$(sev_weight "${FIND_SEVS[$i]}")
    (( w < filter_w )) && continue
    (( first )) || printf ','
    first=0
    msg_esc=$(printf '%s' "${FIND_MSGS[$i]}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
    hint_esc=$(printf '%s' "${FIND_HINTS[$i]}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
    printf '{"severity":"%s","code":"%s","message":%s,"hint":%s}' \
      "${FIND_SEVS[$i]}" "${FIND_CODES[$i]}" "$msg_esc" "$hint_esc"
  done
  printf '],"summary":{"errors":%d,"warns":%d,"infos":%d}}\n' "$errors" "$warns" "$infos"
else
  # Group by severity for readable output
  printed_header=0
  for level in error warn info; do
    w=$(sev_weight "$level")
    (( w < filter_w )) && continue
    icon="🔴"; label="ERROR"
    case "$level" in
      warn) icon="🟡"; label="WARN" ;;
      info) icon="🔵"; label="INFO" ;;
    esac
    section_printed=0
    for i in "${!FIND_SEVS[@]}"; do
      [[ "${FIND_SEVS[$i]}" != "$level" ]] && continue
      if (( ! section_printed )); then
        (( printed_header )) && echo
        echo "$icon $label"
        section_printed=1
        printed_header=1
      fi
      printf '  [%s] %s\n' "${FIND_CODES[$i]}" "${FIND_MSGS[$i]}"
      [[ -n "${FIND_HINTS[$i]}" ]] && printf '    → %s\n' "${FIND_HINTS[$i]}"
    done
  done

  if (( ! printed_header )); then
    echo "✅ no findings (severity ≥ $sev_filter)"
  fi

  echo
  printf '──────────\n%d errors, %d warns, %d infos' "$errors" "$warns" "$infos"
  (( deep )) && printf ' (deep mode)'
  echo
fi

# Exit code
(( errors > 0 )) && exit 1
exit 0
