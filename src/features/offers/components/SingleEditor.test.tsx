import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { SingleEditor } from './SingleEditor'
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

vi.mock('#/shared/api/activeCampaigns', () => ({
  useActiveCampaigns: () => ({
    data: [
      {
        id: 'camp-1',
        name: 'Summer Campaign',
        status: 'active',
        budget_currency: 'USD',
        budget_remaining: '5000.00',
      },
    ],
    isLoading: false,
    isError: false,
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

function renderEditor() {
  useSendOfferSheetStore.setState({
    isOpen: true,
    conversationId: 'conv-1',
    offerType: 'single',
    pendingOfferType: null,
    isTypeChangeConfirmationOpen: false,
  })
  return render(<SingleEditor onClose={vi.fn()} />, {
    wrapper: createWrapper(),
  })
}

function cleanupRadixPortals() {
  document.body
    .querySelectorAll('[role="listbox"]')
    .forEach((el) => el.remove())
  document.body.removeAttribute('data-scroll-locked')
  document.body.style.pointerEvents = ''
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string,
) {
  const wrapper = trigger.closest('div')
  const nativeSelect = wrapper?.querySelector('select[aria-hidden="true"]')
  if (!nativeSelect) throw new Error('Native select not found')
  const option = Array.from(nativeSelect.querySelectorAll('option')).find(
    (opt) => (opt.textContent ?? '').trim() === optionName,
  )
  if (!option) throw new Error(`Option "${optionName}" not found`)
  await user.selectOptions(nativeSelect, option.value)
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await selectOption(
    user,
    screen.getByLabelText(/campaign/i),
    'Summer Campaign',
  )
  await selectOption(user, screen.getByLabelText(/^platform/i), 'YouTube')
  await selectOption(user, screen.getByLabelText(/^format/i), 'Long Video')
  await user.type(screen.getByLabelText(/^amount/i), '1000.00')
  await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')
}

beforeEach(() => {
  vi.clearAllMocks()
  cleanupRadixPortals()
  useSendOfferSheetStore.setState({
    isOpen: false,
    conversationId: null,
    offerType: 'single',
    pendingOfferType: null,
    isTypeChangeConfirmationOpen: false,
  })
})

describe('SingleEditor', () => {
  it('validates speed bonus windows', async () => {
    const user = userEvent.setup()
    renderEditor()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /add window/i }))

    const hours = screen.getByLabelText(/window hours/i)
    await user.clear(hours)
    await user.type(hours, '0')
    await user.type(screen.getByLabelText(/bonus percentage/i), '0')
    await user.tab()

    await user.click(screen.getByRole('button', { name: /send offer/i }))

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(await screen.findByText(/minimum 1 hour/i)).toBeInTheDocument()
    expect(
      await screen.findByText(/bonus percentage must be greater than 0/i),
    ).toBeInTheDocument()
  })

  it('submits bonus_terms sorted by window hours', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      data: { id: 'offer-1' },
      status: 200,
    })
    const user = userEvent.setup()
    renderEditor()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /add window/i }))
    await user.click(screen.getByRole('button', { name: /add window/i }))

    const hours = screen.getAllByLabelText(/window hours/i)
    const percentages = screen.getAllByLabelText(/bonus percentage/i)
    await user.clear(hours[0]!)
    await user.type(hours[0]!, '48')
    await user.type(percentages[0]!, '15.5')
    await user.clear(hours[1]!)
    await user.type(hours[1]!, '24')
    await user.type(percentages[1]!, '10')

    await user.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })

    const payload = mockMutateAsync.mock.calls[0]![0]
    expect(payload).toMatchObject({
      type: 'single',
      campaign_id: 'camp-1',
      conversation_id: 'conv-1',
      amount: '1000.00',
      deadline: '2099-12-31T00:00:00Z',
      deliverable: {
        platform: 'youtube',
        format: 'yt_long',
      },
      bonus_terms: {
        speed_bonus_windows: [
          { window_hours: 24, bonus_pct: '10' },
          { window_hours: 48, bonus_pct: '15.5' },
        ],
      },
    })
  })

  it('is axe-clean', async () => {
    const { container } = renderEditor()
    expect(await axe(container)).toHaveNoViolations()
  })
})
