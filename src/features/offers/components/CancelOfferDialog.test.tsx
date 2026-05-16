import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ApiError } from '#/shared/api/mutator'
import type { OfferDTO } from '#/features/offers/hooks/useConversationOffers'

import { CancelOfferDialog } from './CancelOfferDialog'
import type { CancelOfferDetail } from './CancelOfferDialog'
import { useCancelOfferMutation } from '../hooks/useCancelOfferMutation'

vi.mock('../hooks/useCancelOfferMutation', () => ({
  useCancelOfferMutation: vi.fn(),
}))

const mockUseCancelOfferMutation = vi.mocked(useCancelOfferMutation)
const mockMutate = vi.fn()
const mockReset = vi.fn()

function createOffer(status: OfferDTO['status']): OfferDTO {
  return {
    id: 'offer-1',
    campaign_id: 'campaign-1',
    brand_workspace_id: 'workspace-1',
    creator_account_id: 'creator-1',
    created_by_account_id: 'brand-1',
    conversation_id: 'conv-1',
    offer_mode: 'same_content',
    status,
    amount: '1000.00',
    currency: 'USD',
    bonus_terms: null,
    tentative_publish_date: '2026-04-25',
    offer_deadline: '2026-05-01',
    expires_at: '2026-05-01T00:00:00.000Z',
    description: '',
    platforms: ['instagram'],
    deliverables: [
      {
        platform: 'instagram',
        format: 'reel',
      },
    ],
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    sent_at: '2026-04-01T00:00:00.000Z',
  }
}

function renderDialog(offer: CancelOfferDetail, todayUtcDateString = '2026-05-15') {
  const onOpenChange = vi.fn()
  render(
    <CancelOfferDialog
      open
      offer={offer}
      conversationId="conv-1"
      onOpenChange={onOpenChange}
      todayUtcDateString={todayUtcDateString}
    />,
  )
  return { onOpenChange }
}

describe('CancelOfferDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCancelOfferMutation.mockReturnValue({
      mutate: mockMutate,
      reset: mockReset,
      isPending: false,
    } as unknown as ReturnType<typeof useCancelOfferMutation>)
  })

  it('uses pre-accept copy for sent offers', () => {
    renderDialog(createOffer('sent'))

    expect(
      screen.getByRole('heading', { name: 'Cancelar oferta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancelar oferta' }),
    ).toBeEnabled()
  })

  it('uses post-accept copy for accepted offers', () => {
    renderDialog(createOffer('accepted'))

    expect(
      screen.getByRole('heading', { name: 'Cancelar oferta aceptada' }),
    ).toBeInTheDocument()
  })

  it('disables accepted offer cancellation when the deadline has not passed', () => {
    renderDialog({
      ...createOffer('accepted'),
      offer_deadline: '2026-05-20',
    })

    expect(
      screen.getByRole('button', { name: 'Cancelar oferta aceptada' }),
    ).toBeDisabled()
    expect(
      screen.getByText('Todavía no pasó el offer deadline.'),
    ).toBeInTheDocument()
  })

  it('enables accepted offer cancellation when the deadline has passed', () => {
    renderDialog({
      ...createOffer('accepted'),
      offer_deadline: '2026-05-14',
    })

    expect(
      screen.getByRole('button', { name: 'Cancelar oferta aceptada' }),
    ).toBeEnabled()
  })

  it('shows live links 409 inline and keeps the dialog open', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce((_variables, options) => {
      options.onError(
        new ApiError(
          409,
          'offer_not_cancellable_live_links',
          'Live links',
        ),
      )
    })
    const { onOpenChange } = renderDialog(createOffer('sent'))

    await user.click(screen.getByRole('button', { name: 'Cancelar oferta' }))

    expect(
      await screen.findByText('Hay links publicados activos para esta oferta.'),
    ).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows deadline pending 409 inline', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce((_variables, options) => {
      options.onError(
        new ApiError(
          409,
          'offer_not_cancellable_deadline_pending',
          'Deadline pending',
        ),
      )
    })
    renderDialog(createOffer('sent'))

    await user.click(screen.getByRole('button', { name: 'Cancelar oferta' }))

    await waitFor(() => {
      expect(
        screen.getByText('Todavía no pasó el offer deadline.'),
      ).toBeInTheDocument()
    })
  })
})
