import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { SendOfferSidesheet } from './SendOfferSidesheet'
import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutateAsync = vi.fn()

vi.mock('../hooks/useCreateSingleOffer', () => ({
  useCreateSingleOffer: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

let mockCampaignsData = [
  {
    id: 'camp-1',
    name: 'Summer Campaign',
    status: 'active' as const,
    budget_currency: 'USD',
    budget_remaining: '5000.00',
  },
]
let mockCampaignsLoading = false

vi.mock('../hooks/useActiveCampaigns', () => ({
  useActiveCampaigns: () => ({
    get data() {
      return mockCampaignsData
    },
    get isLoading() {
      return mockCampaignsLoading
    },
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderSheet() {
  useSendOfferSheetStore.setState({
    isOpen: true,
    conversationId: 'conv-1',
  })
  return render(<SendOfferSidesheet creatorName="Test Creator" />, {
    wrapper: createWrapper(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCampaignsData = [
    {
      id: 'camp-1',
      name: 'Summer Campaign',
      status: 'active' as const,
      budget_currency: 'USD',
      budget_remaining: '5000.00',
    },
  ]
  mockCampaignsLoading = false
  useSendOfferSheetStore.setState({
    isOpen: false,
    conversationId: null,
  })
})

describe('SendOfferSidesheet', () => {
  describe('form validation', () => {
    it('shows error when deadline is in the past', async () => {
      const user = userEvent.setup()
      renderSheet()

      const deadlineInput = screen.getByLabelText(/^deadline$/i)
      await user.clear(deadlineInput)
      await user.type(deadlineInput, '2020-01-01')
      await user.tab()

      expect(
        await screen.findByText(/deadline must be a future date/i),
      ).toBeInTheDocument()
    })

    it('shows error when amount is zero', async () => {
      const user = userEvent.setup()
      renderSheet()

      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '0.00')
      await user.tab()

      expect(
        await screen.findByText(/amount must be greater than 0/i),
      ).toBeInTheDocument()
    })

    it('shows error when amount format is invalid', async () => {
      const user = userEvent.setup()
      renderSheet()

      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '123')
      await user.tab()

      expect(await screen.findByText(/use format 0\.00/i)).toBeInTheDocument()
    })

    it('shows error when early_deadline >= deadline on submit', async () => {
      const user = userEvent.setup()
      renderSheet()

      await user.click(screen.getByLabelText(/campaign/i))
      await user.click(
        await screen.findByRole('option', { name: 'Summer Campaign' }),
      )

      await user.click(screen.getByLabelText(/platform/i))
      await user.click(await screen.findByRole('option', { name: 'YouTube' }))

      await user.click(screen.getByLabelText(/format/i))
      await user.click(
        await screen.findByRole('option', { name: 'Long Video' }),
      )

      await user.type(screen.getByLabelText(/amount/i), '1000.00')
      await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

      const toggle = screen.getByRole('switch')
      await user.click(toggle)

      await user.type(screen.getByLabelText(/early deadline/i), '2099-12-31')
      await user.type(screen.getByLabelText(/bonus amount/i), '100.00')

      const submitButton = screen.getByRole('button', { name: /send offer/i })
      await user.click(submitButton)

      expect(
        await screen.findByText(/early deadline must be before the deadline/i),
      ).toBeInTheDocument()
    })
  })

  describe('budget warning', () => {
    it('shows warning when amount exceeds budget without blocking submit', async () => {
      const user = userEvent.setup()
      renderSheet()

      await user.click(screen.getByLabelText(/campaign/i))
      await user.click(
        await screen.findByRole('option', { name: 'Summer Campaign' }),
      )

      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '6000.00')
      await user.tab()

      expect(
        await screen.findByText(/exceeds the campaign's remaining budget/i),
      ).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no active campaigns', () => {
      mockCampaignsData = []
      renderSheet()

      expect(
        screen.getByText(/don't have any active campaigns/i),
      ).toBeInTheDocument()
    })
  })

  describe('backend error mapping', () => {
    async function fillAndSubmit() {
      const user = userEvent.setup()
      renderSheet()

      await user.click(screen.getByLabelText(/campaign/i))
      await user.click(
        await screen.findByRole('option', { name: 'Summer Campaign' }),
      )

      await user.click(screen.getByLabelText(/platform/i))
      await user.click(await screen.findByRole('option', { name: 'YouTube' }))

      await user.click(screen.getByLabelText(/format/i))
      await user.click(
        await screen.findByRole('option', { name: 'Long Video' }),
      )

      await user.type(screen.getByLabelText(/amount/i), '1000.00')
      await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

      const submitButton = screen.getByRole('button', { name: /send offer/i })
      await user.click(submitButton)
    }

    it('maps campaign_not_active error to banner', async () => {
      const { ApiError } = await import('#/shared/api/mutator')
      mockMutateAsync.mockRejectedValueOnce(
        new ApiError(409, 'campaign_not_active', 'Campaign is not active'),
      )

      await fillAndSubmit()

      await waitFor(() => {
        expect(
          screen.getByText(/campaign is no longer active/i),
        ).toBeInTheDocument()
      })
    })

    it('maps backend field_errors to form field errors', async () => {
      const { ApiError } = await import('#/shared/api/mutator')
      mockMutateAsync.mockRejectedValueOnce(
        new ApiError(422, 'validation_error', 'Validation failed', {
          field_errors: { amount: ['Amount exceeds campaign budget'] },
        }),
      )

      await fillAndSubmit()

      await waitFor(() => {
        expect(
          screen.getByText(/amount exceeds campaign budget/i),
        ).toBeInTheDocument()
      })
    })

    it('shows toast for generic errors', async () => {
      const { toast } = await import('sonner')
      mockMutateAsync.mockRejectedValueOnce(new Error('Network failure'))

      await fillAndSubmit()

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network failure')
      })
    })
  })

  describe('accessibility', () => {
    it('has no axe violations when open', async () => {
      const { container } = renderSheet()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
