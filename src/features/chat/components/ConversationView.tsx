import { t } from '@lingui/core/macro'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'

import { ConversationHeader } from './ConversationHeader'
import { EmptyConversationFallback } from './EmptyConversationFallback'

interface ConversationViewProps {
  conversationId: string
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const detailQuery = useConversationDetailQuery(conversationId)

  // Prefetch messages alongside detail
  useMessagesInfiniteQuery(conversationId)

  if (detailQuery.isLoading) {
    return <ConversationViewSkeleton />
  }

  if (detailQuery.isError) {
    return <EmptyConversationFallback />
  }

  const conversation = detailQuery.data
  if (!conversation) {
    return <EmptyConversationFallback />
  }

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader conversation={conversation} />

      {/* Timeline placeholder — wired in F.4 */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t`Timeline de mensajes`}
        </p>
      </div>

      {/* Composer placeholder — wired in F.5 */}
      <div className="flex shrink-0 items-center border-t border-border px-5 py-3">
        <div className="flex h-10 flex-1 items-center rounded-full border border-border bg-background px-4">
          <span className="text-sm text-muted-foreground">
            {t`Escribí un mensaje...`}
          </span>
        </div>
      </div>
    </div>
  )
}

function ConversationViewSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1" />
    </div>
  )
}
