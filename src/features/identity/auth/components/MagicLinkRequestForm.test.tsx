import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { MagicLinkRequestForm } from './MagicLinkRequestForm'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

const mockCreate = vi.fn()
const mockSendLink = vi.fn()
const mockNavigate = vi.fn()

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

vi.mock('@tanstack/react-router', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...mod,
    useRouter: () => ({
      navigate: mockNavigate,
    }),
  }
})

function renderForm() {
  return renderWithProviders(<MagicLinkRequestForm />)
}

async function getEmailInput() {
  return screen.findByLabelText('Email')
}

async function getSubmitButton() {
  return screen.findByRole('button', { name: /continuar con email/i })
}

describe('MagicLinkRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
  })

  it('renders form with email input and submit button', async () => {
    renderForm()
    expect(await getEmailInput()).toBeInTheDocument()
    expect(await getSubmitButton()).toBeInTheDocument()
  })

  it('shows error for invalid email without calling Clerk', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'not-an-email')
    await user.click(await getSubmitButton())

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls signIn.create and emailLink.sendLink on valid email', async () => {
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'test@example.com')
    await user.click(await getSubmitButton())

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: 'test@example.com',
      })
    })

    expect(mockSendLink).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'test@example.com',
        verificationUrl: expect.stringContaining('/auth/callback'),
      }),
    )
  })

  it('navigates to /auth/check-email with email in search on success', async () => {
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'test@example.com')
    await user.click(await getSubmitButton())

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/auth/check-email',
          search: { email: 'test@example.com' },
        }),
      )
    })
  })

  it('fires magic_link_requested analytics on success', async () => {
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'test@example.com')
    await user.click(await getSubmitButton())

    await waitFor(() => {
      const events = getTrackedEvents()
      expect(events.some((e) => e.event === 'magic_link_requested')).toBe(true)
    })
  })

  it('shows Clerk error on create failure', async () => {
    mockCreate.mockResolvedValue({
      error: { message: 'Rate limited', longMessage: 'Too many attempts' },
    })

    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'test@example.com')
    await user.click(await getSubmitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts',
    )
    expect(mockSendLink).not.toHaveBeenCalled()
  })

  it('shows Clerk error on sendLink failure', async () => {
    mockCreate.mockResolvedValue({ error: null })
    mockSendLink.mockResolvedValue({
      error: { message: 'Failed', longMessage: 'Email delivery failed' },
    })

    const user = userEvent.setup()
    renderForm()

    await user.type(await getEmailInput(), 'test@example.com')
    await user.click(await getSubmitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email delivery failed',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('is axe-clean', async () => {
    const { container } = renderForm()
    await getEmailInput()
    expect(await axe(container)).toHaveNoViolations()
  })
})
