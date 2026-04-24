import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useAuthGuard } from './useAuthGuard'

const mockNavigate = vi.fn()
let mockIsSignedIn = false
let mockIsLoaded = true
let mockMeData: unknown = undefined
let mockMeLoading = false

vi.mock('@clerk/tanstack-react-start', () => ({
  useAuth: () => ({
    isLoaded: mockIsLoaded,
    isSignedIn: mockIsSignedIn,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: (opts: { query: { enabled: boolean } }) => {
    if (!opts.query.enabled) {
      return { data: undefined, isLoading: false }
    }
    return { data: mockMeData, isLoading: mockMeLoading }
  },
}))

describe('useAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSignedIn = false
    mockIsLoaded = true
    mockMeData = undefined
    mockMeLoading = false
  })

  it('returns showLoading true when auth not loaded', () => {
    mockIsLoaded = false
    const { result } = renderHook(() => useAuthGuard())
    expect(result.current.showLoading).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('returns showLoading false when not signed in', () => {
    mockIsSignedIn = false
    const { result } = renderHook(() => useAuthGuard())
    expect(result.current.showLoading).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('returns showLoading true while me is loading', () => {
    mockIsSignedIn = true
    mockMeLoading = true
    const { result } = renderHook(() => useAuthGuard())
    expect(result.current.showLoading).toBe(true)
  })

  it('redirects to /campaigns for onboarded brand', async () => {
    mockIsSignedIn = true
    mockMeData = {
      status: 200,
      data: {
        onboarding_status: 'onboarded',
        kind: 'brand',
        redirect_to: null,
      },
    }
    renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/campaigns' }),
      )
    })
  })

  it('redirects to /offers for onboarded creator', async () => {
    mockIsSignedIn = true
    mockMeData = {
      status: 200,
      data: {
        onboarding_status: 'onboarded',
        kind: 'creator',
        redirect_to: null,
      },
    }
    renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/offers' }),
      )
    })
  })

  it('redirects to redirect_to when onboarding incomplete', async () => {
    mockIsSignedIn = true
    mockMeData = {
      status: 200,
      data: {
        onboarding_status: 'kind_pending',
        kind: null,
        redirect_to: '/onboarding/kind',
      },
    }
    renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/onboarding/kind' }),
      )
    })
  })

  it('does not redirect when me returns non-200', () => {
    mockIsSignedIn = true
    mockMeData = { status: 401, data: {} }
    renderHook(() => useAuthGuard())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
