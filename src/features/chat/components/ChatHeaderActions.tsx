import { t } from '@lingui/core/macro'
import { Eye, FileText, Play, Send } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'
import { IconButton } from '#/shared/ui/IconButton'

interface ChatHeaderActionsProps {
  conversationId?: string
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

export function ChatHeaderActions({
  canSendOffer,
  onSendOffer,
}: ChatHeaderActionsProps) {
  const visible = canSendOffer?.visible ?? false
  const disabled = canSendOffer?.disabled ?? false
  const reason = canSendOffer?.reason

  return (
    <div className="flex items-center gap-1">
      <IconButton aria-label={t`Preview deliverable`}>
        <Eye />
      </IconButton>
      <IconButton aria-label={t`Play draft`}>
        <Play />
      </IconButton>
      <IconButton aria-label={t`Open transcript`}>
        <FileText />
      </IconButton>

      {visible ? (
        <Tooltip>
          {disabled ? (
            <TooltipTrigger asChild>
              <span tabIndex={0} className="ml-1 inline-flex">
                <Button disabled size="sm" className="h-11 min-h-11">
                  <Send />
                  {t`Send Offer`}
                </Button>
              </span>
            </TooltipTrigger>
          ) : (
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="ml-1 h-11 min-h-11"
                onClick={() => onSendOffer?.()}
              >
                <Send />
                {t`Send Offer`}
              </Button>
            </TooltipTrigger>
          )}
          {disabled && reason === 'no-active-campaigns' ? (
            <TooltipContent>{t`No active campaigns`}</TooltipContent>
          ) : null}
        </Tooltip>
      ) : null}
    </div>
  )
}
