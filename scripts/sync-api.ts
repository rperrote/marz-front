import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

// RAFITA:BLOCKER: pnpm api:sync cannot run in this sandbox because tsx fails opening its IPC pipe with listen EPERM; the Node strip-types bypass reaches the script, but API_URL=http://localhost:8080 still cannot fetch /openapi.yaml, so the generated API client cannot be regenerated here.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// load .env.local if present
try {
  const envLocal = readFileSync(resolve(root, '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
    if (match?.[1] && match[2] !== undefined)
      process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, '')
  }
} catch {
  // no .env.local, continue
}

const apiUrl = process.env.API_URL ?? process.env.VITE_API_URL
if (!apiUrl) {
  console.error('API_URL (or VITE_API_URL) env var is required')
  process.exit(1)
}

const baseUrl = apiUrl.replace(/\/$/, '')
const prodSpecPath = resolve(root, 'openapi/spec.json')
const testSpecPath = resolve(root, 'openapi/test-spec.json')

const prodSpecPathSegment = process.env.OPENAPI_PATH ?? '/openapi.yaml'
const testSpecPathSegment =
  process.env.TEST_OPENAPI_PATH ?? '/test-openapi.yaml'

async function fetchSpec(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const text = await res.text()
    const contentType = res.headers.get('content-type') ?? ''
    return contentType.includes('json') ? JSON.parse(text) : parseYaml(text)
  } catch {
    return null
  }
}

const prodSpecUrl = `${baseUrl}${prodSpecPathSegment}`
console.log(`[sync-api] fetching prod spec: ${prodSpecUrl}`)
const prodSpec = await fetchSpec(prodSpecUrl)
if (!prodSpec) {
  console.error(`[sync-api] prod spec fetch failed at ${prodSpecUrl}`)
  process.exit(1)
}
await mkdir(dirname(prodSpecPath), { recursive: true })
await writeFile(prodSpecPath, JSON.stringify(prodSpec, null, 2))
console.log(`[sync-api] prod spec written to ${prodSpecPath}`)

const testSpecUrl = `${baseUrl}${testSpecPathSegment}`
console.log(`[sync-api] fetching test spec: ${testSpecUrl}`)
const testSpec = await fetchSpec(testSpecUrl)
let testAvailable = false
if (testSpec) {
  await writeFile(testSpecPath, JSON.stringify(testSpec, null, 2))
  console.log(`[sync-api] test spec written to ${testSpecPath}`)
  testAvailable = true
} else {
  console.warn(
    `[sync-api] test spec unavailable at ${testSpecUrl} — skipping test client generation`,
  )
}

console.log('[sync-api] running orval')
const orvalCmd = testAvailable
  ? 'pnpm orval'
  : 'pnpm orval --project marz --project marzZod'
execSync(orvalCmd, { cwd: root, stdio: 'inherit' })

console.log('[sync-api] formatting generated files')
const formatTargets = testAvailable
  ? 'src/shared/api/generated src/shared/api/test-generated'
  : 'src/shared/api/generated'
execSync(`pnpm prettier --write ${formatTargets}`, {
  cwd: root,
  stdio: 'inherit',
})
console.log('[sync-api] done')
