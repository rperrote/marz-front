// Shared helpers for scripts that seed test users / conversations against
// the backend's /v1/test/* endpoints + Clerk Admin API.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Browser, Page } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

export type AccountKind = 'brand' | 'creator'

export function loadEnvLocal(rootDir: string): void {
  const loadFile = (file: string): boolean => {
    try {
      const raw = readFileSync(resolve(rootDir, file), 'utf-8')
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
        if (m?.[1] && m[2] !== undefined)
          process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, '')
      }
      return true
    } catch {
      return false
    }
  }
  if (!loadFile('.env.local')) loadFile('.env')
  if (
    !process.env.CLERK_PUBLISHABLE_KEY &&
    process.env.VITE_CLERK_PUBLISHABLE_KEY
  ) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY
  }
}

export function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const found = process.argv.find((a) => a.startsWith(prefix))
  return found?.slice(prefix.length)
}

interface Env {
  clerkSecret: string
  testSecret: string
  apiUrl: string
  appUrl: string
}

export function readEnv(): Env {
  const clerkSecret = process.env.CLERK_SECRET_KEY
  const testSecret = process.env.MARZ_TEST_SECRET
  if (!clerkSecret) throw new Error('CLERK_SECRET_KEY missing en .env.local')
  if (!testSecret) throw new Error('MARZ_TEST_SECRET missing en .env.local')
  if (!process.env.CLERK_PUBLISHABLE_KEY)
    throw new Error(
      'CLERK_PUBLISHABLE_KEY (o VITE_CLERK_PUBLISHABLE_KEY) missing en .env.local',
    )
  return {
    clerkSecret,
    testSecret,
    apiUrl: (process.env.VITE_API_URL ?? 'http://localhost:8080').replace(
      /\/$/,
      '',
    ),
    appUrl: (process.env.VITE_APP_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    ),
  }
}

export async function clerkApi<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.clerkSecret}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok)
    throw new Error(`clerk ${path}: ${res.status} ${await res.text()}`)
  return (await res.json()) as T
}

export async function back<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'X-Test-Secret': env.testSecret,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok)
    throw new Error(`back ${path}: ${res.status} ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface EnsuredUser {
  clerkUserId: string
  email: string
  fullName: string
  kind: AccountKind
}

// Idempotent: crea (o reusa) usuario en Clerk + account en backend + onboard-full.
export async function ensureUser(
  env: Env,
  params: { email: string; fullName: string; kind: AccountKind; log?: boolean },
): Promise<EnsuredUser> {
  const { email, fullName, kind } = params
  const log = params.log ?? true

  if (!email.includes('+clerk_test@')) {
    console.warn(
      `WARN: el email "${email}" no tiene sufijo +clerk_test — clerk.signIn solo funciona con test emails de Clerk dev.`,
    )
  }

  if (log) console.log(`  [${kind}] buscar/crear en Clerk (${email})...`)
  const existing = await clerkApi<Array<{ id: string }>>(
    env,
    `/users?email_address=${encodeURIComponent(email)}`,
  )
  let clerkUserId: string
  if (existing.length > 0 && existing[0]) {
    clerkUserId = existing[0].id
    if (log) console.log(`  [${kind}] reusando ${clerkUserId}`)
  } else {
    const [firstName = fullName, ...rest] = fullName.split(' ')
    const created = await clerkApi<{ id: string }>(env, '/users', {
      method: 'POST',
      body: JSON.stringify({
        email_address: [email],
        first_name: firstName,
        last_name: rest.join(' ') || undefined,
      }),
    })
    clerkUserId = created.id
    if (log) console.log(`  [${kind}] creado ${clerkUserId}`)
  }

  if (log) console.log(`  [${kind}] account + onboard-full...`)
  await back(env, '/v1/test/accounts', {
    method: 'POST',
    body: JSON.stringify({
      clerk_user_id: clerkUserId,
      email,
      full_name: fullName,
    }),
  })
  await back(env, `/v1/test/accounts/${clerkUserId}/onboard-full`, {
    method: 'POST',
    body: JSON.stringify({ kind }),
  })

  return { clerkUserId, email, fullName, kind }
}

export async function openSignedInBrowser(
  browser: Browser,
  appUrl: string,
  user: EnsuredUser,
  startPath = '/',
): Promise<Page> {
  const context = await browser.newContext({
    baseURL: appUrl,
    viewport: null,
  })
  const page = await context.newPage()
  await page.goto(startPath)
  await clerk.signIn({ page, emailAddress: user.email })
  if (startPath !== '/') {
    await page.goto(startPath)
  }
  return page
}
