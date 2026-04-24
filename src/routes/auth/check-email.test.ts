import { describe, it, expect } from 'vitest'
import { redirect } from '@tanstack/react-router'

import { Route } from './check-email'

function callBeforeLoad(search: Record<string, unknown>, state?: unknown) {
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        search: Record<string, unknown>
        location: { state: unknown }
      }) => unknown
    }
  ).beforeLoad
  return beforeLoad({ search, location: { state } })
}

describe('/auth/check-email beforeLoad', () => {
  it('redirects to /auth when email is missing from search and state', () => {
    expect(() => callBeforeLoad({})).toThrow()
    try {
      callBeforeLoad({})
    } catch (e) {
      expect(e).toEqual(redirect({ to: '/auth' }))
    }
  })

  it('returns email from search param', () => {
    const result = callBeforeLoad({ email: 'a@b.com' })
    expect(result).toEqual({ email: 'a@b.com' })
  })

  it('falls back to location.state.email when search is empty', () => {
    const result = callBeforeLoad({}, { email: 'c@d.com' })
    expect(result).toEqual({ email: 'c@d.com' })
  })

  it('prefers search param over state', () => {
    const result = callBeforeLoad(
      { email: 'search@test.com' },
      { email: 'state@test.com' },
    )
    expect(result).toEqual({ email: 'search@test.com' })
  })
})
