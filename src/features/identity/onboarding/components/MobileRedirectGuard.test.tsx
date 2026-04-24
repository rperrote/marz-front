import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MobileRedirectGuard } from './MobileRedirectGuard'

const mockNavigate = vi.fn()
let mockIsMobile = false
let mockPathname = '/'

vi.mock('#/features/identity/onboarding/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}))

describe('MobileRedirectGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobile = false
    mockPathname = '/'
    sessionStorage.clear()
  })

  it('does not redirect on desktop', () => {
    mockIsMobile = false
    mockPathname = '/auth'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects to /desktop-only on mobile at /auth', () => {
    mockIsMobile = true
    mockPathname = '/auth'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/desktop-only' })
    expect(sessionStorage.getItem('marz:desktop-only:returnTo')).toBe('/auth')
  })

  it('redirects to /desktop-only on mobile at /auth/kind', () => {
    mockIsMobile = true
    mockPathname = '/auth/kind'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/desktop-only' })
    expect(sessionStorage.getItem('marz:desktop-only:returnTo')).toBe(
      '/auth/kind',
    )
  })

  it('redirects to /desktop-only on mobile at /onboarding/brand', () => {
    mockIsMobile = true
    mockPathname = '/onboarding/brand'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/desktop-only' })
  })

  it('does not redirect on mobile at /_brand/campaigns', () => {
    mockIsMobile = true
    mockPathname = '/_brand/campaigns'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not redirect on mobile at /_creator/offers', () => {
    mockIsMobile = true
    mockPathname = '/_creator/offers'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not redirect if already on /desktop-only', () => {
    mockIsMobile = true
    mockPathname = '/desktop-only'
    renderHook(() => MobileRedirectGuard())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('saves pathname to sessionStorage before redirecting', () => {
    mockIsMobile = true
    mockPathname = '/onboarding/creator'
    renderHook(() => MobileRedirectGuard())
    expect(sessionStorage.getItem('marz:desktop-only:returnTo')).toBe(
      '/onboarding/creator',
    )
  })
})
