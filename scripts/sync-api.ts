import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const specPath = resolve(root, 'openapi/spec.json')

const apiUrl = process.env.API_URL ?? process.env.VITE_API_URL
if (!apiUrl) {
  console.error('API_URL (or VITE_API_URL) env var is required')
  process.exit(1)
}

const specPathSegment = process.env.OPENAPI_PATH ?? '/openapi.yaml'
const specUrl = `${apiUrl.replace(/\/$/, '')}${specPathSegment}`

console.log(`[sync-api] fetching ${specUrl}`)
const res = await fetch(specUrl)
if (!res.ok) {
  console.error(`[sync-api] fetch failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const text = await res.text()
const contentType = res.headers.get('content-type') ?? ''
const spec = contentType.includes('json') ? JSON.parse(text) : parseYaml(text)
await mkdir(dirname(specPath), { recursive: true })
await writeFile(specPath, JSON.stringify(spec, null, 2))
console.log(`[sync-api] spec written to ${specPath}`)

console.log('[sync-api] running orval')
execSync('pnpm orval', { cwd: root, stdio: 'inherit' })
console.log('[sync-api] done')
