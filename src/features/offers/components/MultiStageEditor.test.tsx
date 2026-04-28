import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { MultiStageEditor } from './MultiStageEditor'
import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutateAsync = vi.fn()

vi.mock('../hooks/useCreateMultistageOffer', () => ({
  useCreateMultistageOffer: () => ({
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
    offerType: 'multistage',
    pendingOfferType: null,
    isTypeChangeConfirmationOpen: false,
  })
  return render(<MultiStageEditor onClose={vi.fn()} />, {
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

async function fillStage(
  user: ReturnType<typeof userEvent.setup>,
  stageIndex: number,
  values: {
    name?: string
    description?: string
    deadline?: string
    amount?: string
  },
) {
  const stages = screen.getAllByRole('group')
  const stage = stages[stageIndex]
  if (!stage) throw new Error(`Stage ${stageIndex} not found`)

  if (values.name !== undefined) {
    const input = within(stage).getByLabelText(/^stage name$/i)
    await user.type(input, values.name)
  }
  if (values.description !== undefined) {
    const input = within(stage).getByLabelText(/^description$/i)
    await user.type(input, values.description)
  }
  if (values.deadline !== undefined) {
    const input = within(stage).getByLabelText(/^deadline$/i)
    await user.type(input, values.deadline)
  }
  if (values.amount !== undefined) {
    const input = within(stage).getByLabelText(/^amount$/i)
    await user.type(input, values.amount)
  }
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

describe('MultiStageEditor', () => {
  it('renders with one initial stage and add stage button', () => {
    renderEditor()
    expect(screen.getByText(/stage 1/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add stage/i }),
    ).toBeInTheDocument()
  })

  it('minTwoStages_disablesSubmit', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-31',
      amount: '1000.00',
    })

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    expect(submitButton).toBeDisabled()
  })

  it('equalConsecutiveDeadlines_blocksSubmit_andHighlightsRow', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-15',
      amount: '1000.00',
    })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await fillStage(user, 1, {
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-15',
      amount: '500.00',
    })

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()

    const stages = screen.getAllByRole('group')
    const stage2 = stages[1]
    expect(stage2).toBeDefined()
    expect(
      await within(stage2!).findByText(/must be after the previous stage/i),
    ).toBeInTheDocument()
  })

  it('descendingDeadlines_blocksSubmit', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-20',
      amount: '1000.00',
    })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await fillStage(user, 1, {
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-10',
      amount: '500.00',
    })

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('amountPerStageMustBePositive', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-15',
      amount: '0',
    })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await fillStage(user, 1, {
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-20',
      amount: '100.00',
    })

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('totalAmountIsSumOfStages', async () => {
    const user = userEvent.setup()
    renderEditor()

    await selectOption(
      user,
      screen.getByLabelText(/campaign/i),
      'Summer Campaign',
    )

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-15',
      amount: '1200.00',
    })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await fillStage(user, 1, {
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-20',
      amount: '800.00',
    })

    expect(screen.getByText(/2000\.00/)).toBeInTheDocument()
  })

  it('noSpeedBonusBlock', () => {
    renderEditor()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('submits successfully with type multistage and correct fields', async () => {
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

    await fillStage(user, 0, {
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-15',
      amount: '1200.00',
    })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await fillStage(user, 1, {
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-20',
      amount: '800.00',
    })

    const submitButton = screen.getByRole('button', { name: /send offer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })

    const payload = mockMutateAsync.mock.calls[0]![0]
    expect(payload.type).toBe('multistage')
    expect(payload.campaign_id).toBe('camp-1')
    expect(payload.conversation_id).toBe('conv-1')
    expect(payload.stages).toHaveLength(2)
    expect(payload.stages[0]).toMatchObject({
      name: 'Stage One',
      description: 'First stage',
      deadline: '2099-12-15',
      amount: '1200.00',
    })
    expect(payload.stages[1]).toMatchObject({
      name: 'Stage Two',
      description: 'Second stage',
      deadline: '2099-12-20',
      amount: '800.00',
    })
    expect(payload.total_amount).toBeUndefined()
    expect(payload.speed_bonus).toBeUndefined()
  })

  it('is axe-clean', async () => {
    const { container } = renderEditor()
    expect(await axe(container)).toHaveNoViolations()
  })
})
