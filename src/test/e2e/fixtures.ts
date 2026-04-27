import { test as base, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const API_URL = (process.env.VITE_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)
const CLERK_SECRET = process.env.CLERK_SECRET_KEY

const clerkClient = CLERK_SECRET
  ? createClerkClient({ secretKey: CLERK_SECRET })
  : null

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
    if (clerkClient) {
      const existing = await clerkClient.users.getUserList({
        emailAddress: [this.email],
      })
      if (!existing.data.length) {
        const [firstName, ...rest] = this.fullName.split(' ')
        try {
          const clerkUser = await clerkClient.users.createUser({
            externalId: this.workerId,
            emailAddress: [this.email],
            firstName,
            lastName: rest.join(' ') || undefined,
          })
          this.clerkUserId = clerkUser.id
        } catch (err: any) {
          console.error(
            '[E2E] Failed to create Clerk user:',
            err.errors || err.message,
          )
          throw err
        }
      } else {
        this.clerkUserId = existing.data[0]!.id
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
