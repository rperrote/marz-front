export function getConversationOffersQueryKey(conversationId: string) {
  return ['conversations', conversationId, 'offers'] as const
}
