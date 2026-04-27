import { createFileRoute } from '@tanstack/react-router'

import { EmptyConversationState } from '#/features/chat/workspace/EmptyConversationState'

export const Route = createFileRoute('/workspace/')({
  component: EmptyConversationState,
})
