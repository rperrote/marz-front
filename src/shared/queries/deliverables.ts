export function getConversationDeliverablesQueryKey(conversationId: string) {
  return ['conversation-deliverables', conversationId] as const
}
