// Crea (o reusa) un usuario de test, lo onboardea, y abre un browser headed
// con la sesión iniciada (igual que el e2e pero sin cerrar la ventana).
//
// Use:
//   pnpm tsx scripts/open-as-test-user.ts --kind=brand
//   pnpm tsx scripts/open-as-test-user.ts --kind=creator --email=foo+clerk_test@example.com --name="Foo Bar"
//
// Cerrá la ventana del browser para terminar el proceso.

import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

import {
  arg,
  ensureUser,
  loadEnvLocal,
  openSignedInBrowser,
  readEnv,
} from './lib/test-user.ts'
import type { AccountKind } from './lib/test-user.ts'

loadEnvLocal(resolve(import.meta.dirname, '..'))

const kind = arg('kind') as AccountKind | undefined
if (kind !== 'brand' && kind !== 'creator') {
  console.error(
    'Usage: pnpm tsx scripts/open-as-test-user.ts --kind=brand|creator [--email=...] [--name="..."]',
  )
  process.exit(1)
}

const email = arg('email') ?? `e2e.manual.${kind}+clerk_test@example.com`
const fullName =
  arg('name') ?? `Manual ${kind === 'brand' ? 'Brand' : 'Creator'}`

const env = readEnv()

console.log('1. Ensure user...')
const user = await ensureUser(env, { email, fullName, kind })

console.log('2. clerkSetup() — fetch testing token...')
await clerkSetup()

console.log('3. Lanzar browser headed...')
const browser = await chromium.launch({ headless: false })
const page = await openSignedInBrowser(browser, env.appUrl, user)
void page

console.log(`\nListo. Browser abierto como ${email} (${kind}).`)
console.log(`Cerrá la ventana para terminar.\n`)

browser.on('disconnected', () => {
  process.exit(0)
})
