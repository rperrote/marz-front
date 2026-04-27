export function getConversationOffersQueryKey(conversationId: string) {
  return ['conversations', conversationId, 'offers'] as const
}

export function getOfferQueryKey(offerId: string) {
  return ['offer', offerId] as const
}
