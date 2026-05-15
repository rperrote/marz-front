import { test as base, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'
import type { Browser, Page } from '@playwright/test'

import {
  createTestAccount,
  createTestConversation,
  deleteTestAccount,
  onboardTestAccountFull,
  setTestOnboardingState,
} from '#/shared/api/test-generated/test/test'
import type {
  AccountKind,
  CreateTestConversationResponse,
  MeResponse,
  OnboardingStatus,
  SeedMessagesInput,
  SeedOfferReadyInput,
} from '#/shared/api/test-generated/model'

const CLERK_SECRET = process.env.CLERK_SECRET_KEY
const CLERK_API_URL = 'https://api.clerk.com/v1'

interface ClerkUser {
  id: string
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

async function getClerkUserByEmail(email: string): Promise<ClerkUser | null> {
  const searchParams = new URLSearchParams()
  searchParams.append('email_address', email)

  const response = await clerkApi(`/users?${searchParams.toString()}`)
  // Clerk returns an array directly: [user, ...]
  if (!Array.isArray(response)) return null
  const first = response[0]
  return isClerkUser(first) ? first : null
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
  accountId: string | null = null

  constructor(
    public workerId: string,
    public email: string,
    public fullName: string,
  ) {
    // placeholder until we get the real Clerk ID
    this.clerkUserId = workerId
  }

  async ensureExists(): Promise<MeResponse> {
    // 1. Ensure user exists in Clerk and get the real Clerk ID
    if (CLERK_SECRET) {
      const existing = await getClerkUserByEmail(this.email)
      if (!existing) {
        const clerkUser = await createClerkUser({
          workerId: this.workerId,
          email: this.email,
          fullName: this.fullName,
        })
        this.clerkUserId = clerkUser.id
      } else {
        this.clerkUserId = existing.id
      }
    }

    // 2. Ensure user exists in our backend
    const res = await createTestAccount({
      clerk_user_id: this.clerkUserId,
      email: this.email,
      full_name: this.fullName,
    })
    const me = (res as { data: MeResponse }).data
    this.accountId = me.id
    return me
  }

  async setOnboardingState(
    status: OnboardingStatus,
    kind?: AccountKind,
  ): Promise<MeResponse> {
    const res = await setTestOnboardingState(this.clerkUserId, {
      status,
      ...(kind ? { kind } : {}),
    })
    const me = (res as { data: MeResponse }).data
    return me
  }

  // Idempotent: creates the brand_workspace or creator_profile side-effect
  // that the real onboarding flow would, leaving the account fully usable.
  async onboardFull(kind: AccountKind): Promise<MeResponse> {
    const res = await onboardTestAccountFull(this.clerkUserId, { kind })
    const me = (res as { data: MeResponse }).data
    return me
  }

  async delete(): Promise<void> {
    // Backend hard-deletes and is idempotent (204 even if account is gone).
    await deleteTestAccount(this.clerkUserId)
    // Clerk dev instances cap at 100 users — without this, repeated runs
    // accumulate ghosts and eventually 403 user_quota_exceeded.
    if (CLERK_SECRET) {
      const res = await fetch(`${CLERK_API_URL}/users/${this.clerkUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${CLERK_SECRET}` },
      })
      // 404 means the user was already deleted upstream — keep it idempotent.
      if (!res.ok && res.status !== 404) {
        const text = await res.text()
        throw new Error(
          `Clerk DELETE /users/${this.clerkUserId} failed: ${res.status} ${text}`,
        )
      }
    }
  }

  async signIn(page: Page): Promise<void> {
    // Navigate to app so Clerk.js loads before signing in.
    await page.goto('/')
    await clerk.signIn({ page, emailAddress: this.email })
  }

  async signOut(page: Page): Promise<void> {
    await clerk.signOut({ page })
  }
}

interface ChatPair {
  conversationId: string
  brandWorkspaceId: string
  deliverableId?: string
  campaignId?: string
  brand: TestUser
  creator: TestUser
  brandPage: Page
  creatorPage: Page
}

interface ConversationDeliverablesResponseBody {
  data?: {
    deliverables?: Array<{
      id?: string
      status?: string
    }>
  }
}

async function getCompletedDeliverableId(
  page: Page,
  conversationId: string,
  brandWorkspaceId: string,
): Promise<string | undefined> {
  const response = await page.request.get(
    `/v1/conversations/${conversationId}/deliverables`,
    {
      headers: {
        'X-Brand-Workspace-Id': brandWorkspaceId,
      },
    },
  )

  if (!response.ok()) {
    throw new Error(
      `Failed to load seeded deliverables: ${response.status()} ${await response.text()}`,
    )
  }

  const body = (await response.json()) as ConversationDeliverablesResponseBody
  const deliverable = body.data?.deliverables?.find(
    (item) => item.status === 'completed',
  )

  return deliverable?.id
}

async function createChatPair(
  browser: Browser,
  workerIndex: number,
  seedMessages?: SeedMessagesInput,
  options?: {
    requireCompletedDeliverable?: boolean
    seedOfferReady?: SeedOfferReadyInput
  },
): Promise<{ pair: ChatPair; cleanup: () => Promise<void> }> {
  const brand = new TestUser(
    `e2e_brand_${workerIndex}`,
    `e2e.brand${workerIndex}+clerk_test@example.com`,
    'E2E Brand',
  )
  const creator = new TestUser(
    `e2e_creator_${workerIndex}`,
    `e2e.creator${workerIndex}+clerk_test@example.com`,
    'E2E Creator',
  )

  // If anything in setup throws, clean up what was already created so the
  // next run isn't poisoned with leftover Clerk users / backend rows.
  try {
    await Promise.all([
      brand.ensureExists().then(() => brand.onboardFull('brand')),
      creator.ensureExists().then(() => creator.onboardFull('creator')),
    ])
  } catch (err) {
    await Promise.all([
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  let conversation: CreateTestConversationResponse
  try {
    const res = await createTestConversation({
      brand_clerk_user_id: brand.clerkUserId,
      creator_clerk_user_id: creator.clerkUserId,
      ...(seedMessages ? { seed_messages: seedMessages } : {}),
      ...(options?.seedOfferReady
        ? { seed_offer_ready: options.seedOfferReady }
        : {}),
    })
    conversation = (res as { data: CreateTestConversationResponse }).data
  } catch (err) {
    await Promise.all([
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  const [brandCtx, creatorCtx] = await Promise.all([
    browser.newContext(),
    browser.newContext(),
  ])
  const [brandPage, creatorPage] = await Promise.all([
    brandCtx.newPage(),
    creatorCtx.newPage(),
  ])
  try {
    await Promise.all([brand.signIn(brandPage), creator.signIn(creatorPage)])
  } catch (err) {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  let deliverableId: string | undefined
  try {
    deliverableId = options?.requireCompletedDeliverable
      ? await getCompletedDeliverableId(
          brandPage,
          conversation.conversation_id,
          conversation.brand_workspace_id,
        )
      : undefined
  } catch (err) {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  const pair: ChatPair = {
    conversationId: conversation.conversation_id,
    brandWorkspaceId: conversation.brand_workspace_id,
    deliverableId,
    campaignId: conversation.campaign_id,
    brand,
    creator,
    brandPage,
    creatorPage,
  }

  const cleanup = async () => {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete(),
      creator.delete(),
    ])
  }

  return { pair, cleanup }
}

function buildCompletedDeliverableSeedMessages(count: number): SeedMessagesInput {
  return {
    count,
    alternating_authors: true,
    mark_read_for: 'both',
  }
}

export const test = base.extend<{
  testUser: TestUser
  brandOnboardingUser: TestUser
  creatorOnboardingUser: TestUser
  onboardedBrandUser: TestUser
  onboardedCreatorUser: TestUser
  chatPair: ChatPair
  chatPairWithHistory: ChatPair
  chatPairWithCompletedDeliverable: ChatPair
  chatPairWithCompletedDeliverableScrollable: ChatPair
  chatPairOfferReady: ChatPair
}>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, run, testInfo) => {
    const user = new TestUser(
      `e2e_worker_${testInfo.workerIndex}`,
      // The `+clerk_test` suffix makes Clerk treat this as a test email:
      // signup/signin work without sending OTP and don't consume the 100/mo
      // dev-instance email quota. See https://clerk.com/docs/testing/test-emails
      `e2e.worker${testInfo.workerIndex}+clerk_test@example.com`,
      'E2E Test User',
    )
    await user.ensureExists()
    await run(user)
    await user.delete()
  },

  brandOnboardingUser: async ({ testUser }, run) => {
    await testUser.setOnboardingState('onboarding_pending', 'brand')
    await run(testUser)
  },

  creatorOnboardingUser: async ({ testUser }, run) => {
    await testUser.setOnboardingState('onboarding_pending', 'creator')
    await run(testUser)
  },

  onboardedBrandUser: async ({ testUser }, run) => {
    // onboardFull (not setOnboardingState) so the brand_workspace exists.
    // Without it the conversations query 422s with brand_workspace_required
    // and the rail loading skeleton never resolves.
    await testUser.onboardFull('brand')
    await run(testUser)
  },

  onboardedCreatorUser: async ({ testUser }, run) => {
    await testUser.onboardFull('creator')
    await run(testUser)
  },

  chatPair: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      testInfo.workerIndex,
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithHistory: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      testInfo.workerIndex,
      {
        count: 60,
        alternating_authors: true,
      },
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithCompletedDeliverable: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      testInfo.workerIndex,
      buildCompletedDeliverableSeedMessages(2),
      { requireCompletedDeliverable: true },
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithCompletedDeliverableScrollable: async (
    { browser },
    run,
    testInfo,
  ) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      testInfo.workerIndex,
      buildCompletedDeliverableSeedMessages(60),
      { requireCompletedDeliverable: true },
    )
    await run(pair)
    await cleanup()
  },

  chatPairOfferReady: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      testInfo.workerIndex,
      undefined,
      {
        seedOfferReady: {
          campaign_name: 'E2E OfferSent Campaign',
          currency: 'USD',
        },
      },
    )
    await run(pair)
    await cleanup()
  },
})

export { expect }
