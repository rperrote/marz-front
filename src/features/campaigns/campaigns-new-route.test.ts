import { describe, it, expect, vi } from 'vitest'

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

describe('/_brand/campaigns/new route', () => {
  it('has no beforeLoad guard (delegates to _brand parent guard)', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const options = Route.options as unknown as Record<string, unknown>
    expect(options.beforeLoad).toBeUndefined()
  })

  // RAFITA:BLOCKER: cuando ServerMeBody exponga membership.role,
  // agregar beforeLoad con redirect y habilitar este test:
  // it('redirects to /campaigns when membership.role !== owner', ...)
})
