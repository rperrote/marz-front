import { t } from '@lingui/core/macro'

import { ChatRailItem } from '#/features/chat/components/ChatRailItem'
import { usePresence } from '#/features/chat/stores/presenceStore'

import { formatRelativeTime } from './formatRelativeTime'
import type { ConversationListItem } from './types'

interface ConversationRailItemProps {
  conversation: ConversationListItem
  active?: boolean
  onClick?: (conversationId: string) => void
}

export function ConversationRailItem({
  conversation,
  active = false,
  onClick,
}: ConversationRailItemProps) {
  const { counterpart, last_message_preview, unread_count, last_activity_at } =
    conversation

  const presenceState = usePresence(counterpart.id)
  const online = presenceState === 'online'

  const preview = resolvePreview(
    last_message_preview.kind,
    last_message_preview.text,
  )
  const timestamp = formatRelativeTime(last_activity_at)
  const fallback = counterpart.display_name.charAt(0).toUpperCase()

  return (
    <div role="listitem">
      <ChatRailItem
        name={counterpart.display_name}
        preview={`${timestamp} · ${preview}`}
        avatarUrl={counterpart.avatar_url ?? undefined}
        avatarFallback={fallback}
        online={online}
        active={active}
        unread={unread_count > 0}
        onClick={() => onClick?.(conversation.id)}
      />
    </div>
  )
}

function resolvePreview(
  kind: ConversationListItem['last_message_preview']['kind'],
  text: string,
): string {
  switch (kind) {
    case 'empty':
      return t`Conversación iniciada`
    case 'system_event':
      return text
    case 'attachment':
      return t`Archivo adjunto`
    case 'text':
      return text
  }
}
