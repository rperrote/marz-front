import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { SignOutButton } from './SignOutButton'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

const mockNavigate = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue(undefined)
const mockClear = vi.fn()
const mockBrandReset = vi.fn()
const mockCreatorReset = vi.fn()

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
    signOut: mockSignOut,
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
      clear: mockClear,
    }),
  }
})

vi.mock('#/features/identity/onboarding/brand/store', () => ({
  useBrandOnboardingStore: {
    getState: () => ({ reset: mockBrandReset }),
  },
}))

vi.mock('#/features/identity/onboarding/creator/store', () => ({
  useCreatorOnboardingStore: {
    getState: () => ({ reset: mockCreatorReset }),
  },
}))

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
  })

  it('renders the sign out button', async () => {
    renderWithProviders(<SignOutButton />)
    expect(await screen.findByText('Sign out')).toBeInTheDocument()
  })

  it('fires sign_out analytics on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    const events = getTrackedEvents()
    expect(events.some((e) => e.event === 'sign_out')).toBe(true)
  })

  it('clears queryClient on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    expect(mockClear).toHaveBeenCalled()
  })

  it('resets brand onboarding store on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    expect(mockBrandReset).toHaveBeenCalled()
  })

  it('resets creator onboarding store on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    expect(mockCreatorReset).toHaveBeenCalled()
  })

  it('calls clerk signOut on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('navigates to /auth on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    await user.click(await screen.findByText('Sign out'))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
  })
})
