// Crea (o reusa) un brand + un creator + una conversation entre ellos, y abre
// dos browsers headed (uno por cada usuario) ya en la URL de la conversation.
//
// Use:
//   pnpm tsx scripts/seed-conversation.ts
//   pnpm tsx scripts/seed-conversation.ts --brand-email=... --creator-email=...
//   pnpm tsx scripts/seed-conversation.ts --seed-messages=20
//
// Cerrá cualquiera de las dos ventanas para terminar el proceso.

import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

import {
  arg,
  back,
  clerkApi,
  ensureUser,
  loadEnvLocal,
  openSignedInBrowser,
  readEnv,
} from './lib/test-user.ts'

loadEnvLocal(resolve(import.meta.dirname, '..'))

const brandEmail =
  arg('brand-email') ?? 'e2e.manual.brand+clerk_test@example.com'
const creatorEmail =
  arg('creator-email') ?? 'e2e.manual.creator+clerk_test@example.com'
const seedCountRaw = arg('seed-messages')
const seedCount = seedCountRaw ? Number(seedCountRaw) : 0
if (
  seedCountRaw &&
  (!Number.isFinite(seedCount) || seedCount < 0 || seedCount > 500)
) {
  console.error('--seed-messages debe ser un entero entre 0 y 500')
  process.exit(1)
}

const env = readEnv()

console.log('1. Ensure brand + creator (idempotente)...')
const [brand, creator] = await Promise.all([
  ensureUser(env, {
    email: brandEmail,
    fullName: 'Manual Brand',
    kind: 'brand',
  }),
  ensureUser(env, {
    email: creatorEmail,
    fullName: 'Manual Creator',
    kind: 'creator',
  }),
])

console.log('2. Crear conversation + campaign + application aceptada...')
const conv = await back<{
  conversation_id: string
  brand_workspace_id: string
  campaign_id?: string
}>(env, '/v1/test/conversations', {
  method: 'POST',
  body: JSON.stringify({
    brand_clerk_user_id: brand.clerkUserId,
    creator_clerk_user_id: creator.clerkUserId,
    seed_offer_ready: {
      campaign_name: `Seed Campaign ${new Date().toISOString()}`,
      currency: 'USD',
    },
    ...(seedCount > 0
      ? { seed_messages: { count: seedCount, alternating_authors: true } }
      : {}),
  }),
})
console.log(`   conversation_id: ${conv.conversation_id}`)
if (conv.campaign_id) {
  console.log(`   campaign_id:     ${conv.campaign_id}`)
}

console.log('3. clerkSetup() — fetch testing token...')
await clerkSetup()

const conversationPath = `/workspace/conversations/${conv.conversation_id}`

console.log('4. Lanzar browsers headed (brand + creator)...')
const browser = await chromium.launch({
  headless: false,
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
})

// Sign-in en serie: clerk.signIn navega y hace polling, lanzar dos en paralelo
// puede pisarse con el handshake del backend.
const brandPage = await openSignedInBrowser(
  browser,
  env.appUrl,
  brand,
  conversationPath,
)
const creatorPage = await openSignedInBrowser(
  browser,
  env.appUrl,
  creator,
  conversationPath,
)
void brandPage
void creatorPage

console.log(`\nListo. Dos browsers abiertos en la conversation:`)
console.log(`  brand   = ${brand.email}`)
console.log(`  creator = ${creator.email}`)
console.log(`  ${env.appUrl}${conversationPath}`)
console.log(`\nApretá Ctrl+C para terminar (corre cleanup y sale).\n`)

let cleaningUp = false
async function deleteOne(label: string, fn: () => Promise<unknown>) {
  console.log(`  [...]  ${label}`)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout 10s')), 10_000),
  )
  try {
    await Promise.race([fn(), timeout])
    console.log(`  [ok]   ${label}`)
  } catch (err) {
    console.error(`  [fail] ${label}: ${(err as Error).message}`)
  }
}
async function cleanup(exitCode: number) {
  if (cleaningUp) return
  cleaningUp = true
  console.log(
    '\nLimpiando cuentas de prueba (cascade borra conversation + campaign)...',
  )
  await deleteOne(`backend brand ${brand.clerkUserId}`, () =>
    back(env, `/v1/test/accounts/${brand.clerkUserId}`, { method: 'DELETE' }),
  )
  await deleteOne(`backend creator ${creator.clerkUserId}`, () =>
    back(env, `/v1/test/accounts/${creator.clerkUserId}`, { method: 'DELETE' }),
  )
  await deleteOne(`clerk brand ${brand.clerkUserId}`, () =>
    clerkApi(env, `/users/${brand.clerkUserId}`, { method: 'DELETE' }),
  )
  await deleteOne(`clerk creator ${creator.clerkUserId}`, () =>
    clerkApi(env, `/users/${creator.clerkUserId}`, { method: 'DELETE' }),
  )
  console.log('Cleanup completo.')
  process.exit(exitCode)
}

// Si el usuario hace Ctrl+C dos veces seguidas, no le quitamos la posibilidad de salir.
let sigintCount = 0
process.on('SIGINT', () => {
  sigintCount++
  if (sigintCount === 1) {
    console.log(
      '\nSIGINT recibido — corriendo cleanup. Volvé a apretar Ctrl+C para abortar.',
    )
    void cleanup(130)
  } else {
    console.log('\nAbort forzado.')
    process.exit(130)
  }
})
process.on('SIGTERM', () => void cleanup(143))
