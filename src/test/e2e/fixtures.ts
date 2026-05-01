import { test as base, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const API_URL = (process.env.VITE_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)
const CLERK_SECRET = process.env.CLERK_SECRET_KEY

const CLERK_API_URL = 'https://api.clerk.com/v1'

interface ClerkUser {
  id: string
}

interface ClerkUserListResponse {
  data: ClerkUser[]
}

async function testApi(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Secret': TEST_SECRET!,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Test API ${method} ${path} failed: ${res.status} ${text}`)
  }
  return res.status === 204 ? null : res.json()
}

async function clerkApi(path: string, init?: RequestInit): Promise<unknown> {
  if (!CLERK_SECRET) return null

  const res = await fetch(`${CLERK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Clerk API ${path} failed: ${res.status} ${text}`)
  }

  return res.json()
}

function isClerkUser(value: unknown): value is ClerkUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
  )
}

function isClerkUserListResponse(
  value: unknown,
): value is ClerkUserListResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray(value.data) &&
    value.data.every(isClerkUser)
  )
}

async function getClerkUserByEmail(email: string): Promise<ClerkUser | null> {
  const searchParams = new URLSearchParams()
  searchParams.append('email_address', email)

  const response = await clerkApi(`/users?${searchParams.toString()}`)
  if (!isClerkUserListResponse(response)) return null

  return response.data[0] ?? null
}

async function createClerkUser(params: {
  workerId: string
  email: string
  fullName: string
}): Promise<ClerkUser> {
  const [firstName = params.fullName, ...rest] = params.fullName.split(' ')
  const response = await clerkApi('/users', {
    method: 'POST',
    body: JSON.stringify({
      external_id: params.workerId,
      email_address: [params.email],
      first_name: firstName,
      last_name: rest.join(' ') || undefined,
    }),
  })

  if (!isClerkUser(response)) {
    throw new Error('Clerk API create user returned an invalid response')
  }

  return response
}

export class TestUser {
  clerkUserId: string

  constructor(
    public workerId: string,
    public email: string,
    public fullName: string,
  ) {
    // placeholder until we get the real Clerk ID
    this.clerkUserId = workerId
  }

  async ensureExists() {
    // 1. Ensure user exists in Clerk and get the real Clerk ID
    if (CLERK_SECRET) {
      const existing = await getClerkUserByEmail(this.email)
      if (!existing) {
        try {
          const clerkUser = await createClerkUser({
            workerId: this.workerId,
            email: this.email,
            fullName: this.fullName,
          })
          this.clerkUserId = clerkUser.id
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error('[E2E] Failed to create Clerk user:', message)
          throw err
        }
      } else {
        this.clerkUserId = existing.id
      }
    }

    // 2. Ensure user exists in our backend
    return testApi('POST', '/v1/test/accounts', {
      clerk_user_id: this.clerkUserId,
      email: this.email,
      full_name: this.fullName,
    })
  }

  async setOnboardingState(status: string, kind?: string) {
    return testApi('POST', `/v1/test/accounts/${this.clerkUserId}/onboarding`, {
      status,
      ...(kind ? { kind } : {}),
    })
  }

  async delete() {
    return testApi('DELETE', `/v1/test/accounts/${this.clerkUserId}`)
  }

  async signIn(page: Parameters<typeof clerk.signIn>[0]['page']) {
    // Navigate to app so Clerk.js loads before signing in
    await page.goto('/')
    await clerk.signIn({ page, emailAddress: this.email })
  }

  async signOut(page: Parameters<typeof clerk.signOut>[0]['page']) {
    await clerk.signOut({ page })
  }
}

export const test = base.extend<{
  testUser: TestUser
  brandOnboardingUser: TestUser
  creatorOnboardingUser: TestUser
  onboardedBrandUser: TestUser
  onboardedCreatorUser: TestUser
  signedInPage: typeof clerk.signIn
}>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use, testInfo) => {
    if (!TEST_SECRET) {
      throw new Error(
        'MARZ_TEST_SECRET no está configurado. ' +
          'Agregalo a .env.local y asegurate de que coincida con el backend.',
      )
    }
    // Unique suffix per run to avoid stale soft-deleted accounts
    const runId = Date.now().toString(36)
    const user = new TestUser(
      `e2e_worker_${testInfo.workerIndex}_${runId}`,
      `e2e.worker${testInfo.workerIndex}.${runId}@example.com`,
      'E2E Test User',
    )
    await user.ensureExists()
    await use(user)
    await user.delete()
  },

  brandOnboardingUser: async ({ testUser }, use) => {
    await testUser.setOnboardingState('onboarding_pending', 'brand')
    await use(testUser)
  },

  creatorOnboardingUser: async ({ testUser }, use) => {
    await testUser.setOnboardingState('onboarding_pending', 'creator')
    await use(testUser)
  },

  onboardedBrandUser: async ({ testUser }, use) => {
    await testUser.setOnboardingState('onboarded', 'brand')
    await use(testUser)
  },

  onboardedCreatorUser: async ({ testUser }, use) => {
    await testUser.setOnboardingState('onboarded', 'creator')
    await use(testUser)
  },
})

export { expect }
