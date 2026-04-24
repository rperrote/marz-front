import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { CallbackScreen } from './CallbackScreen'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

const mockNavigate = vi.fn()
const mockHandleEmailLinkVerification = vi.fn()
const mockFetchQuery = vi.fn()

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
  useClerk: () => ({
    handleEmailLinkVerification: mockHandleEmailLinkVerification,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      fetchQuery: mockFetchQuery,
    }),
  }
})

function renderScreen() {
  return renderWithProviders(<CallbackScreen />)
}

describe('CallbackScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
    mockHandleEmailLinkVerification.mockResolvedValue(undefined)
  })

  it('renders loading spinner and text', async () => {
    mockHandleEmailLinkVerification.mockReturnValue(new Promise(() => {}))
    renderScreen()
    expect(
      await screen.findByText('Verificando tu link...'),
    ).toBeInTheDocument()
  })

  it('calls handleEmailLinkVerification on mount', async () => {
    mockHandleEmailLinkVerification.mockReturnValue(new Promise(() => {}))
    renderScreen()
    await waitFor(() => {
      expect(mockHandleEmailLinkVerification).toHaveBeenCalledOnce()
    })
  })

  it('navigates to redirect_to on success', async () => {
    mockFetchQuery.mockResolvedValue({
      status: 200,
      data: {
        onboarding_status: 'pending_kind',
        kind: 'brand',
        redirect_to: '/onboarding/kind',
      },
    })
    renderScreen()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/onboarding/kind',
      })
    })
  })

  it('navigates to default brand home when no redirect_to', async () => {
    mockFetchQuery.mockResolvedValue({
      status: 200,
      data: {
        onboarding_status: 'onboarded',
        kind: 'brand',
        redirect_to: null,
      },
    })
    renderScreen()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/campaigns',
      })
    })
  })

  it('navigates to default creator home when no redirect_to', async () => {
    mockFetchQuery.mockResolvedValue({
      status: 200,
      data: {
        onboarding_status: 'onboarded',
        kind: 'creator',
        redirect_to: null,
      },
    })
    renderScreen()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/offers',
      })
    })
  })

  it('fires magic_link_succeeded and sign_in_succeeded on success', async () => {
    mockFetchQuery.mockResolvedValue({
      status: 200,
      data: {
        onboarding_status: 'onboarded',
        kind: 'brand',
        redirect_to: '/campaigns',
      },
    })
    renderScreen()
    await waitFor(() => {
      const events = getTrackedEvents()
      expect(events.some((e) => e.event === 'magic_link_succeeded')).toBe(true)
      expect(events.some((e) => e.event === 'sign_in_succeeded')).toBe(true)
    })
    const signInEvent = getTrackedEvents().find(
      (e) => e.event === 'sign_in_succeeded',
    )
    expect(signInEvent?.payload).toEqual({
      onboarding_status: 'onboarded',
      kind: 'brand',
    })
  })

  it('navigates to /auth/link-invalid on verification error', async () => {
    mockHandleEmailLinkVerification.mockRejectedValue(
      new Error('verification failed'),
    )
    renderScreen()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auth/link-invalid',
      })
    })
  })

  it('navigates to /auth/link-invalid on non-200 me response', async () => {
    mockFetchQuery.mockResolvedValue({
      status: 401,
      data: { error: 'unauthorized' },
    })
    renderScreen()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auth/link-invalid',
      })
    })
  })

  it('is axe-clean', async () => {
    mockHandleEmailLinkVerification.mockReturnValue(new Promise(() => {}))
    const { container } = renderScreen()
    await screen.findByText('Verificando tu link...')
    expect(await axe(container)).toHaveNoViolations()
  })
})
