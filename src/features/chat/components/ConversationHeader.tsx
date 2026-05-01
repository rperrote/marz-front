import { t } from '@lingui/core/macro'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { TooltipProvider } from '#/components/ui/tooltip'
import type { ConversationDetail } from '#/features/chat/types'

import { ChatHeaderActions } from './ChatHeaderActions'
import { PresenceBadge } from './PresenceBadge'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'

interface ConversationHeaderProps {
  conversation: ConversationDetail
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

export function ConversationHeader({
  conversation,
  canSendOffer,
  onSendOffer,
}: ConversationHeaderProps) {
  const { counterpart } = conversation
  const fallback = counterpart.display_name.charAt(0).toUpperCase()

  return (
    <TooltipProvider>
      <header
        aria-label={t`Conversation with ${counterpart.display_name}`}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-3"
      >
        <Avatar size="lg">
          {counterpart.avatar_url ? (
            <AvatarImage
              src={counterpart.avatar_url}
              alt={counterpart.display_name}
            />
          ) : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {counterpart.display_name}
            </span>
            {counterpart.handle ? (
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                @{counterpart.handle}
              </span>
            ) : null}
          </div>
          <PresenceBadge accountId={counterpart.id} />
        </div>

        <ChatHeaderActions
          conversationId={conversation.id}
          canSendOffer={canSendOffer}
          onSendOffer={onSendOffer}
        />
      </header>
    </TooltipProvider>
  )
}
