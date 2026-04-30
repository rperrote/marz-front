import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { usePresence } from '#/features/chat/stores/presenceStore'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'

interface PresenceBadgeProps {
  accountId: string
}

const STATE_CONFIG = {
  online: {
    dotClass: 'bg-success',
    label: () => t`En línea`,
  },
  offline: {
    dotClass: 'bg-muted-foreground',
    label: () => t`Desconectado`,
  },
  disconnected: {
    dotClass: 'bg-destructive',
    label: () => t`Cuenta inactiva`,
  },
} as const

export function PresenceBadge({ accountId }: PresenceBadgeProps) {
  const state = usePresence(accountId)
  const config = STATE_CONFIG[state]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1.5"
          role="status"
          aria-label={config.label()}
        >
          <span
            className={cn('size-2 shrink-0 rounded-full', config.dotClass)}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">
            {config.label()}
          </span>
        </span>
      </TooltipTrigger>
      {state === 'disconnected' ? (
        <TooltipContent>
          {t`Esta cuenta está inactiva y no puede recibir mensajes`}
        </TooltipContent>
      ) : null}
    </Tooltip>
  )
}
