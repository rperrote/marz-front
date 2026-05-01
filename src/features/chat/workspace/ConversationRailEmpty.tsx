import { t } from '@lingui/core/macro'

type ConversationRailEmptyVariant =
  | 'no_conversations'
  | 'no_search_results'
  | 'no_filter_results'

interface ConversationRailEmptyProps {
  variant: ConversationRailEmptyVariant
  activeFilter?: 'all' | 'unread' | 'needs_reply'
}

function getEmptyMessage(
  variant: ConversationRailEmptyVariant,
  activeFilter?: 'all' | 'unread' | 'needs_reply',
): string {
  switch (variant) {
    case 'no_conversations':
      return t`Las conversaciones aparecen cuando se inicia una colaboración (vía Match, Application, Invite u Offer)`
    case 'no_search_results':
      return t`No hay conversaciones que coincidan`
    case 'no_filter_results':
      if (activeFilter === 'needs_reply') {
        return t`No hay conversaciones con respuesta pendiente`
      }
      if (activeFilter === 'all' || activeFilter === undefined) {
        return t`No hay conversaciones para esta campaña`
      }
      return t`No hay conversaciones no leídas`
  }
}

export function ConversationRailEmpty({
  variant,
  activeFilter,
}: ConversationRailEmptyProps) {
  const message = getEmptyMessage(variant, activeFilter)

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
