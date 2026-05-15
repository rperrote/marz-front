import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ApiError } from '#/shared/api/mutator'
import {
  canMarkOfferAsPaid,
  type MarkAsPaidOffer,
} from '#/shared/payments/markAsPaidEligibility'

import { MarkAsPaidDialog } from './MarkAsPaidDialog'
import { useMarkOfferPaidMutation } from '../hooks/useMarkOfferPaidMutation'

vi.mock('../hooks/useMarkOfferPaidMutation', () => ({
  useMarkOfferPaidMutation: vi.fn(),
}))

const mockUseMarkOfferPaidMutation = vi.mocked(useMarkOfferPaidMutation)
const mockMutate = vi.fn()
const mockReset = vi.fn()

const offer: MarkAsPaidOffer = {
  id: 'offer-1',
  amount: '1000.00',
  status: 'accepted',
  deliverables: [{ status: 'completed' }, { status: 'link_approved' }],
}

function renderDialog() {
  const onOpenChange = vi.fn()
  render(
    <MarkAsPaidDialog
      open
      offer={offer}
      conversationId="conv-1"
      onOpenChange={onOpenChange}
    />,
  )
  return { onOpenChange }
}

describe('MarkAsPaidDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarkOfferPaidMutation.mockReturnValue({
      mutate: mockMutate,
      reset: mockReset,
      isPending: false,
    } as unknown as ReturnType<typeof useMarkOfferPaidMutation>)
  })

  it('gates accepted offers with completed or link-approved deliverables', () => {
    expect(canMarkOfferAsPaid(offer)).toBe(true)
    expect(
      canMarkOfferAsPaid({
        ...offer,
        deliverables: [{ status: 'completed' }, { status: 'draft_submitted' }],
      }),
    ).toBe(false)
    expect(canMarkOfferAsPaid({ ...offer, status: 'sent' })).toBe(false)
  })

  it('initializes the editable amount from the offer and submits it', async () => {
    const user = userEvent.setup()
    renderDialog()

    const input = screen.getByLabelText('Monto pagado')
    expect(input).toHaveValue('1000.00')

    await user.clear(input)
    await user.type(input, '1250.50')
    await user.click(screen.getByRole('button', { name: 'Marcar como pagado' }))

    expect(mockMutate).toHaveBeenCalledWith(
      {
        offerId: 'offer-1',
        conversationId: 'conv-1',
        amount: '1250.50',
      },
      expect.any(Object),
    )
  })

  it('shows offer_already_paid 409 inline and keeps the dialog open', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce((_variables, options) => {
      options.onError(new ApiError(409, 'offer_already_paid', 'Already paid'))
    })
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Marcar como pagado' }))

    expect(
      await screen.findByText('Esta oferta ya fue marcada como pagada.'),
    ).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
