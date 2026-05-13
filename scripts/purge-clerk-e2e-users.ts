// One-shot: lista y borra usuarios e2e dejados en Clerk por runs históricos.
// Pattern: email empieza con "e2e." (e2e.worker0@…, e2e.brand1@…, e2e.creator2@…).
// Use: pnpm tsx scripts/purge-clerk-e2e-users.ts [--dry-run]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

try {
  const envLocal = readFileSync(resolve(root, '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
    if (match?.[1] && match[2] !== undefined)
      process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, '')
  }
} catch {
  // no .env.local
}

const CLERK_SECRET = process.env.CLERK_SECRET_KEY
if (!CLERK_SECRET) {
  console.error('CLERK_SECRET_KEY required')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const CLERK_API = 'https://api.clerk.com/v1'

interface ClerkUser {
  id: string
  email_addresses: Array<{ email_address: string }>
  external_id: string | null
  created_at: number
}

async function clerk<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Clerk ${path} → ${res.status} ${text}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function isE2EUser(user: ClerkUser): boolean {
  if (user.external_id?.startsWith('e2e_')) return true
  return user.email_addresses.some((e) => e.email_address.startsWith('e2e.'))
}

async function listAllUsers(): Promise<ClerkUser[]> {
  const all: ClerkUser[] = []
  let offset = 0
  const limit = 100
  for (;;) {
    const page = await clerk<ClerkUser[]>(
      `/users?limit=${limit}&offset=${offset}`,
    )
    if (page.length === 0) break
    all.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return all
}

const users = await listAllUsers()
const targets = users.filter(isE2EUser)

console.log(`Total users in Clerk: ${users.length}`)
console.log(`E2E users to purge:   ${targets.length}`)
for (const u of targets) {
  const email = u.email_addresses[0]?.email_address ?? '(no email)'
  console.log(`  ${u.id}  ${email}  external_id=${u.external_id ?? '-'}`)
}

if (DRY_RUN) {
  console.log('\n[dry-run] no deletions performed')
  process.exit(0)
}

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const API_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

// Back-side bulk purge by email pattern. Catches zombie rows whose
// clerk_user_id no longer matches any live Clerk user.
let backPurged = 0
if (TEST_SECRET) {
  try {
    const res = await fetch(`${API_URL}/v1/test/accounts:purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Secret': TEST_SECRET,
      },
      body: JSON.stringify({ email_like: 'e2e.%' }),
    })
    if (res.ok) {
      const body = (await res.json()) as { deleted: number }
      backPurged = body.deleted
    } else {
      console.error(`back purge: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error(`back purge: ${(err as Error).message}`)
  }
}

const results = await Promise.allSettled(
  targets.map((u) => clerk(`/users/${u.id}`, { method: 'DELETE' })),
)
let clerkDeleted = 0
let failed = 0
for (const [i, result] of results.entries()) {
  if (result.status === 'fulfilled') {
    clerkDeleted++
  } else {
    failed++
    console.error(
      `clerk DELETE ${targets[i]!.id}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
    )
  }
}
console.log(
  `\nClerk deleted: ${clerkDeleted}  Back purged (email_like e2e.%): ${backPurged}  Failed: ${failed}`,
)
