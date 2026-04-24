import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { DesktopOnlyScreen } from './DesktopOnlyScreen'

const mockNavigate = vi.fn()
let mockIsMobile = true

vi.mock('#/features/identity/onboarding/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const SESSION_KEY = 'marz:desktop-only:returnTo'

describe('DesktopOnlyScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobile = true
    sessionStorage.clear()
  })

  it('renders heading copy', () => {
    render(<DesktopOnlyScreen />)
    expect(
      screen.getByText('Abrí Marz desde tu computadora'),
    ).toBeInTheDocument()
  })

  it('renders description copy', () => {
    render(<DesktopOnlyScreen />)
    expect(
      screen.getByText(/Marz todavía no está optimizado para mobile/),
    ).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    render(<DesktopOnlyScreen />)
    expect(
      screen.getByRole('button', { name: 'Refrescar' }),
    ).toBeInTheDocument()
  })

  it('calls window.location.reload on button click', async () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    })

    render(<DesktopOnlyScreen />)
    await userEvent.click(screen.getByRole('button', { name: 'Refrescar' }))
    expect(reloadMock).toHaveBeenCalled()
  })

  it('does not navigate when isMobile is true', () => {
    mockIsMobile = true
    render(<DesktopOnlyScreen />)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to stored returnTo path when isMobile becomes false', () => {
    mockIsMobile = false
    sessionStorage.setItem(SESSION_KEY, '/onboarding/brand')
    render(<DesktopOnlyScreen />)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/brand' })
  })

  it('navigates to /auth as fallback when no returnTo is stored', () => {
    mockIsMobile = false
    render(<DesktopOnlyScreen />)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
  })

  it('clears sessionStorage after navigating', () => {
    mockIsMobile = false
    sessionStorage.setItem(SESSION_KEY, '/auth/kind')
    render(<DesktopOnlyScreen />)
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
