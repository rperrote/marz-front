import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { MagicSentScreen } from './MagicSentScreen'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

const mockCreate = vi.fn()
const mockSendLink = vi.fn()

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useSignIn: () => ({
    signIn: {
      create: mockCreate,
      emailLink: { sendLink: mockSendLink },
    },
    errors: {},
    fetchStatus: 'idle' as const,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
}))

const TEST_EMAIL = 'user@example.com'

function renderScreen() {
  return renderWithProviders(<MagicSentScreen email={TEST_EMAIL} />)
}

describe('MagicSentScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
  })

  it('renders the email passed as prop', async () => {
    renderScreen()
    expect(await screen.findByText(TEST_EMAIL)).toBeInTheDocument()
  })

  it('renders title and info box', async () => {
    renderScreen()
    expect(await screen.findByText('Revisá tu email')).toBeInTheDocument()
    expect(
      await screen.findByText('El link expira en 15 minutos.'),
    ).toBeInTheDocument()
  })

  it('"Usar otro email" links to /auth', async () => {
    renderScreen()
    const link = await screen.findByRole('link', { name: /usar otro email/i })
    expect(link).toHaveAttribute('href', '/auth')
  })

  it('calls Clerk resend and fires analytics on resend click', async () => {
    vi.useRealTimers()
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderScreen()

    const btn = await screen.findByRole('button', {
      name: /reenviar link/i,
    })
    await user.click(btn)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ identifier: TEST_EMAIL })
    })
    expect(mockSendLink).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: TEST_EMAIL }),
    )

    const events = getTrackedEvents()
    expect(events.some((e) => e.event === 'magic_link_requested')).toBe(true)
  })

  it('starts cooldown after successful resend and shows counter', async () => {
    vi.useRealTimers()
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderScreen()

    const btn = await screen.findByRole('button', {
      name: /reenviar link/i,
    })
    await user.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/60s/)).toBeInTheDocument()
    })
  })

  it('disables resend button during cooldown via aria-disabled', async () => {
    vi.useRealTimers()
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderScreen()

    const btn = await screen.findByRole('button', {
      name: /reenviar link/i,
    })
    await user.click(btn)

    await waitFor(() => {
      expect(btn).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('handles Clerk error gracefully without crashing', async () => {
    vi.useRealTimers()
    mockCreate.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    renderScreen()

    const btn = await screen.findByRole('button', {
      name: /reenviar link/i,
    })
    await user.click(btn)

    await waitFor(() => {
      expect(btn).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('is axe-clean', async () => {
    vi.useRealTimers()
    const { container } = renderScreen()
    await screen.findByText('Revisá tu email')
    expect(await axe(container)).toHaveNoViolations()
  })
})
