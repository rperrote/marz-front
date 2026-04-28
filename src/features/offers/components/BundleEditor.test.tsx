import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BundleEditor } from './BundleEditor'
import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutateAsync = vi.fn()

vi.mock('../hooks/useCreateBundleOffer', () => ({
  useCreateBundleOffer: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

vi.mock('../hooks/useActiveCampaigns', () => ({
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
    offerType: 'bundle',
    pendingOfferType: null,
    isTypeChangeConfirmationOpen: false,
  })
  return render(<BundleEditor onClose={vi.fn()} />, {
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
    (opt) => opt.textContent.trim() === optionName,
  )
  if (!option) throw new Error(`Option "${optionName}" not found`)
  await user.selectOptions(nativeSelect, option.value)
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

describe('BundleEditor', () => {
  it('renders with one initial row and add deliverable button', () => {
    renderEditor()
    expect(screen.getByText(/deliverable 1/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add deliverable/i }),
    ).toBeInTheDocument()
  })

  it('minTwoDeliverables_disablesSubmit', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )
    await selectOption(user, screen.getByLabelText(/^platform/i), 'YouTube')
    await selectOption(user, screen.getByLabelText(/^format/i), 'Long Video')

    await user.type(screen.getByLabelText(/total amount/i), '1000.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    expect(submitButton).toBeDisabled()
  })

  it('amountSumMismatch_blocksSubmit', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await user.click(screen.getByRole('button', { name: /add deliverable/i }))

    const rows = screen.getAllByRole('group')
    for (let i = 0; i < 2; i++) {
      const row = rows[i]!
      const platform = within(row).getByLabelText(/^platform/i)
      await selectOption(user, platform, 'YouTube')

      const format = within(row).getByLabelText(/^format/i)
      await selectOption(user, format, 'Long Video')

      const amount = within(row).getByLabelText(/amount/i)
      await user.type(amount, '300.00')
    }

    await user.type(screen.getByLabelText(/total amount/i), '1000.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/amounts must sum to total/i),
    ).toBeInTheDocument()
  })

  it('amountPartialDeclaration_blocksSubmit', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await user.click(screen.getByRole('button', { name: /add deliverable/i }))

    const rows = screen.getAllByRole('group')
    for (let i = 0; i < 2; i++) {
      const row = rows[i]!
      const platform = within(row).getByLabelText(/^platform/i)
      await selectOption(user, platform, 'YouTube')

      const format = within(row).getByLabelText(/^format/i)
      await selectOption(user, format, 'Long Video')
    }

    const rows2 = screen.getAllByRole('group')
    const amount = within(rows2[0]!).getByLabelText(/amount/i)
    await user.type(amount, '500.00')

    await user.type(screen.getByLabelText(/total amount/i), '500.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/declare all amounts or none/i),
    ).toBeInTheDocument()
  })

  it('deadlineMustBeFuture', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await user.click(screen.getByRole('button', { name: /add deliverable/i }))

    const rows = screen.getAllByRole('group')
    for (let i = 0; i < 2; i++) {
      const row = rows[i]!
      const platform = within(row).getByLabelText(/^platform/i)
      await selectOption(user, platform, 'YouTube')

      const format = within(row).getByLabelText(/^format/i)
      await selectOption(user, format, 'Long Video')
    }

    await user.type(screen.getByLabelText(/total amount/i), '1000.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2020-01-01')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/deadline must be a future date/i),
    ).toBeInTheDocument()
  })

  it('speedBonusEarlyDeadlineBeforeDeadline', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await user.click(screen.getByRole('button', { name: /add deliverable/i }))

    const rows = screen.getAllByRole('group')
    for (let i = 0; i < 2; i++) {
      const row = rows[i]!
      const platform = within(row).getByLabelText(/^platform/i)
      await selectOption(user, platform, 'YouTube')

      const format = within(row).getByLabelText(/^format/i)
      await selectOption(user, format, 'Long Video')
    }

    await user.type(screen.getByLabelText(/total amount/i), '1000.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    await user.type(screen.getByLabelText(/early deadline/i), '2099-12-31')
    await user.type(screen.getByLabelText(/bonus amount/i), '100.00')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/early deadline must be before the deadline/i),
    ).toBeInTheDocument()
  })

  it('submits successfully with type bundle and correct fields', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      data: { id: 'offer-1' },
      status: 200,
    })

    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await user.click(screen.getByRole('button', { name: /add deliverable/i }))

    const rows = screen.getAllByRole('group')
    for (let i = 0; i < 2; i++) {
      const row = rows[i]!
      const platform = within(row).getByLabelText(/^platform/i)
      await selectOption(user, platform, 'YouTube')

      const format = within(row).getByLabelText(/^format/i)
      await selectOption(user, format, 'Long Video')
    }

    await user.type(screen.getByLabelText(/total amount/i), '1000.00')
    await user.type(screen.getByLabelText(/^deadline$/i), '2099-12-31')

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })

    const payload = mockMutateAsync.mock.calls[0]![0]
    expect(payload.type).toBe('bundle')
    expect(payload.campaign_id).toBe('camp-1')
    expect(payload.total_amount).toBe('1000.00')
    expect(payload.deadline).toBe('2099-12-31')
    expect(payload.deliverables).toHaveLength(2)
    expect(payload.deliverables[0]).toMatchObject({
      platform: 'youtube',
      format: 'yt_long',
      quantity: 1,
      amount: undefined,
    })
  })

  it('is axe-clean', async () => {
    const { container } = renderEditor()
    expect(await axe(container)).toHaveNoViolations()
  })
})
