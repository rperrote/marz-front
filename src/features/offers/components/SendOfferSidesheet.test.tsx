import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ApiError } from '#/shared/api/mutator'

import { SendOfferSidesheet } from './SendOfferSidesheet'
import { useSendOfferWizard } from '../store/sendOfferWizardStore'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutateAsync = vi.fn()

vi.mock('../hooks/useCreateOfferMutation', () => ({
  useCreateOfferMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

const campaignId = '018f9b3f-2394-7a08-9cb8-b4bd3b8d0e12'
const creatorAccountId = '018f9b3f-2394-7a08-9cb8-b4bd3b8d0e12'

let mockCampaignsData = [
  {
    id: campaignId,
    name: 'Summer Campaign',
    status: 'active' as const,
    budget_currency: 'USD',
    budget_remaining: '5000.00',
  },
]

vi.mock('#/shared/api/activeCampaigns', () => ({
  useActiveCampaigns: () => ({
    get data() {
      return mockCampaignsData
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
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
  useSendOfferWizard.setState({
    isOpen: true,
    conversationId: 'conv-1',
    mode: 'same_content',
  })

  return render(
    <SendOfferSidesheet
      creatorName="Test Creator"
      creatorAccountId={creatorAccountId}
    />,
    { wrapper: createWrapper() },
  )
}

async function fillRequiredFields() {
  const user = userEvent.setup()

  await user.click(screen.getByRole('combobox', { name: /campaña/i }))
  await user.click(
    await screen.findByRole('option', { name: 'Summer Campaign' }),
  )
  await user.clear(screen.getByLabelText(/monto/i))
  await user.type(screen.getByLabelText(/monto/i), '1000')
  await user.type(screen.getByLabelText(/publicación tentativa/i), '2099-12-30')
  await user.type(
    screen.getByLabelText(/fecha límite/i),
    '2099-12-31',
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCampaignsData = [
    {
      id: campaignId,
      name: 'Summer Campaign',
      status: 'active' as const,
      budget_currency: 'USD',
      budget_remaining: '5000.00',
    },
  ]
  useSendOfferWizard.getState().reset()
})

describe('SendOfferSidesheet', () => {
  it('submits a same-content offer and closes the sheet', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({ status: 201, data: {} })
    renderSheet()

    await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /enviar oferta/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'conv-1',
          campaign_id: campaignId,
          creator_account_id: creatorAccountId,
          offer_mode: 'same_content',
          amount: 1000,
          platforms: ['instagram'],
        }),
      )
    })
    expect(useSendOfferWizard.getState().isOpen).toBe(false)
  })

  it('keeps form values when switching offer mode', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.clear(screen.getByLabelText(/monto/i))
    await user.type(screen.getByLabelText(/monto/i), '1200')
    await user.click(screen.getByRole('switch', { name: /un contenido/i }))

    expect(screen.getByLabelText(/monto/i)).toHaveValue(1200)
    expect(useSendOfferWizard.getState().mode).toBe('per_platform')

    await user.click(screen.getByRole('switch', { name: /un contenido/i }))

    expect(screen.getByLabelText(/monto/i)).toHaveValue(1200)
    expect(useSendOfferWizard.getState().mode).toBe('same_content')
    expect(useSendOfferWizard.getState().draft.amount).toBe(1200)
  })

  it('hides and ignores bonuses in per-platform mode', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.click(screen.getByRole('switch', { name: /bonos de oferta/i }))
    expect(screen.getByText(/agregar bono/i)).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /un contenido/i }))

    expect(screen.queryByText(/agregar bono/i)).not.toBeInTheDocument()
    expect(useSendOfferWizard.getState().draft.bonus_terms).toEqual({
      enabled: false,
      speed_bonus_windows: [],
    })
  })

  it('maps bonus_not_supported_for_per_platform inline', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(
        422,
        'bonus_not_supported_for_per_platform',
        'Bonus not supported',
      ),
    )
    renderSheet()

    await user.click(screen.getByRole('switch', { name: /un contenido/i }))
    await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /enviar oferta/i }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    expect(
      await screen.findByText(/bonos sólo están disponibles/i),
    ).toBeInTheDocument()
  })

  it('maps backend date validation to the field', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(422, 'validation_error', 'Validation failed', {
        field_errors: {
          offer_deadline: ['La fecha límite no es válida'],
        },
      }),
    )
    renderSheet()

    await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /enviar oferta/i }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    expect(
      await screen.findByText('La fecha límite no es válida'),
    ).toBeInTheDocument()
  })

  it('shows empty state when no active campaigns', () => {
    mockCampaignsData = []
    renderSheet()

    expect(screen.getByText(/no tenés campañas activas/i)).toBeInTheDocument()
  })

  it('has no axe violations when open', async () => {
    const { container } = renderSheet()

    expect(await axe(container)).toHaveNoViolations()
  })
})
