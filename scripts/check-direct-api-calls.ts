/**
 * Detecta llamadas directas al backend (`customFetch(...)`) fuera del cliente
 * generado por Orval. Ayuda a un agente o developer a verificar que un nuevo
 * endpoint use el hook generado en `src/shared/api/generated/` en vez de un
 * fetch ad-hoc.
 *
 * Uso: `pnpm check:api-direct`
 *
 * Exit 0: sin violaciones. Exit 1: hay llamadas directas — listadas en stdout.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.output',
  '.vinxi',
  'dist',
  'build',
])

const EXCLUDED_PATH_SUFFIX_SET = new Set([
  // El propio mutator define customFetch — no es una llamada.
  'src/shared/api/mutator.ts',
])

const EXCLUDED_PATH_INCLUDE_SET = new Set([
  // Código generado por Orval.
  '/src/shared/api/generated/',
  // Tests pueden mockear/usar customFetch libremente.
  '.test.ts',
  '.test.tsx',
  '/test/',
  '/__tests__/',
])

// Identificador `customFetch` como llamada (no import, no comentario).
// La apertura del paréntesis puede estar en la misma línea o en una posterior
// (ej. cuando hay genéricos anidados multilínea).
const CUSTOM_FETCH_RE = /\bcustomFetch\b/

export interface DirectApiCallViolation {
  file: string
  line: number
  snippet: string
  endpoint: string | null
}

export interface FindDirectApiCallViolationsOptions {
  root?: string
  src?: string
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, files)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

function isExcluded(path: string): boolean {
  const normalized = path.replaceAll('\\', '/')
  for (const suffix of EXCLUDED_PATH_SUFFIX_SET) {
    if (normalized.endsWith(suffix)) return true
  }
  for (const segment of EXCLUDED_PATH_INCLUDE_SET) {
    if (normalized.includes(segment)) return true
  }
  return false
}

export function isCustomFetchCall(after: string): boolean {
  let i = 0
  while (i < after.length && /\s/.test(after[i] ?? '')) i++
  if (after[i] === '<') {
    let depth = 0
    while (i < after.length) {
      const c = after[i]
      if (c === '<') depth++
      else if (c === '>') {
        depth--
        if (depth === 0) {
          i++
          break
        }
      }
      i++
    }
    while (i < after.length && /\s/.test(after[i] ?? '')) i++
  }
  return after[i] === '('
}

export function extractCustomFetchEndpoint(
  snippet: string,
  nextLines: string,
): string | null {
  const haystack = `${snippet}\n${nextLines}`
  // Captura primer string literal después de `customFetch...(` (puede haber
  // genéricos anidados y saltos de línea entre el identificador y el `(`).
  const m = haystack.match(/customFetch\b[\s\S]*?\(\s*[`'"]([^`'"]+)[`'"]/)
  return m?.[1] ?? null
}

export function findDirectApiCallViolations(
  options: FindDirectApiCallViolationsOptions = {},
): DirectApiCallViolation[] {
  const root = options.root ?? ROOT
  const src = options.src ?? SRC
  const files = walk(src).filter((f) => !isExcluded(f))
  const violations: DirectApiCallViolation[] = []

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    if (!content.includes('customFetch')) continue

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (!CUSTOM_FETCH_RE.test(line)) continue

      const trimmed = line.trim()
      if (trimmed.startsWith('import ')) continue
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue

      // Confirmar que es una llamada (no una declaración o type ref):
      // después del identificador, saltando whitespace y cualquier bloque
      // genérico balanceado `<...>`, el siguiente carácter debe ser `(`.
      const window = lines.slice(i, i + 5).join('\n')
      const after = window.slice(
        window.indexOf('customFetch') + 'customFetch'.length,
      )
      if (!isCustomFetchCall(after)) continue

      const nextLines = lines.slice(i + 1, i + 5).join('\n')
      violations.push({
        file: relative(root, file),
        line: i + 1,
        snippet: trimmed,
        endpoint: extractCustomFetchEndpoint(line, nextLines),
      })
    }
  }

  return violations
}

function main(): void {
  const violations = findDirectApiCallViolations()

  if (violations.length === 0) {
    console.log('OK: no hay llamadas directas a customFetch fuera de Orval.')
    process.exit(0)
  }

  console.error(
    `FOUND ${violations.length} llamada(s) directa(s) a customFetch fuera de src/shared/api/generated/:\n`,
  )
  for (const v of violations) {
    const endpoint = v.endpoint ? ` → ${v.endpoint}` : ''
    console.error(`  ${v.file}:${v.line}${endpoint}`)
    console.error(`    ${v.snippet}`)
  }
  console.error(
    `\nUsá los hooks generados en src/shared/api/generated/ (Orval). Si el endpoint todavía no existe en el OpenAPI:`,
  )
  console.error(`  1. Agregalo en marz-api OpenAPI`)
  console.error(`  2. Corré 'pnpm api:sync'`)
  console.error(`  3. Reemplazá customFetch por el hook generado`)
  process.exit(1)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main()
}
