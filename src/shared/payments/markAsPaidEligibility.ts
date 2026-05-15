export interface MarkAsPaidOffer {
  id: string
  amount: string
  status: string
  deliverables: Array<{ status: string }>
}

export function canMarkOfferAsPaid(offer: MarkAsPaidOffer) {
  return (
    offer.status === 'accepted' &&
    offer.deliverables.length > 0 &&
    offer.deliverables.every(
      (deliverable) =>
        deliverable.status === 'completed' ||
        deliverable.status === 'link_approved',
    )
  )
}
