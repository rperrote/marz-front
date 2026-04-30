import { clerkSetup } from '@clerk/testing/playwright'
import type { FullConfig } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local no existe, OK
  }
}

export default async function globalSetup(_config: FullConfig) {
  loadEnvLocal()

  const publishable =
    process.env.VITE_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY
  if (publishable && !process.env.CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = publishable
  }

  const testSecret = process.env.MARZ_TEST_SECRET
  if (!testSecret) {
    throw new Error(
      'MARZ_TEST_SECRET no está definido. ' +
        'Agregalo a .env.local con el valor que coincida con el backend de test.',
    )
  }

  if (!process.env.CLERK_SECRET_KEY || !publishable) {
    throw new Error(
      'CLERK_SECRET_KEY y CLERK_PUBLISHABLE_KEY son requeridos para E2E. ' +
        'Asegurate de tenerlos en .env.local',
    )
  }

  await clerkSetup()
}
