// Cleanup ad-hoc: borra los usuarios default de seed-conversation
// (brand + creator) en backend + Clerk. Idempotente.
//
// Use:
//   pnpm tsx scripts/cleanup-seed.ts
//   pnpm tsx scripts/cleanup-seed.ts --brand-email=... --creator-email=...

import { resolve } from 'node:path'

import { arg, back, clerkApi, loadEnvLocal, readEnv } from './lib/test-user.ts'

loadEnvLocal(resolve(import.meta.dirname, '..'))

const brandEmail =
  arg('brand-email') ?? 'e2e.manual.brand+clerk_test@example.com'
const creatorEmail =
  arg('creator-email') ?? 'e2e.manual.creator+clerk_test@example.com'

const env = readEnv()

async function resolveClerkId(email: string): Promise<string | null> {
  const list = await clerkApi<Array<{ id: string }>>(
    env,
    `/users?email_address=${encodeURIComponent(email)}`,
  )
  return list[0]?.id ?? null
}

async function deleteOne(label: string, fn: () => Promise<unknown>) {
  console.log(`  [...]  ${label}`)
  try {
    await fn()
    console.log(`  [ok]   ${label}`)
  } catch (err) {
    console.error(`  [fail] ${label}: ${(err as Error).message}`)
  }
}

const [brandId, creatorId] = await Promise.all([
  resolveClerkId(brandEmail),
  resolveClerkId(creatorEmail),
])

console.log(`brand   = ${brandEmail} -> ${brandId ?? '(no existe)'}`)
console.log(`creator = ${creatorEmail} -> ${creatorId ?? '(no existe)'}`)

await Promise.all([
  brandId
    ? deleteOne(`backend brand ${brandId}`, () =>
        back(env, `/v1/test/accounts/${brandId}`, { method: 'DELETE' }),
      )
    : Promise.resolve(),
  creatorId
    ? deleteOne(`backend creator ${creatorId}`, () =>
        back(env, `/v1/test/accounts/${creatorId}`, { method: 'DELETE' }),
      )
    : Promise.resolve(),
  brandId
    ? deleteOne(`clerk brand ${brandId}`, () =>
        clerkApi(env, `/users/${brandId}`, { method: 'DELETE' }),
      )
    : Promise.resolve(),
  creatorId
    ? deleteOne(`clerk creator ${creatorId}`, () =>
        clerkApi(env, `/users/${creatorId}`, { method: 'DELETE' }),
      )
    : Promise.resolve(),
])

console.log('Cleanup completo.')
