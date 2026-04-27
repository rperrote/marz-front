const MESSAGES_KEY = 'conversation-messages'

export function getMessagesQueryKey(conversationId: string) {
  return [MESSAGES_KEY, conversationId] as const
}
