import { t } from '@lingui/core/macro'
import { RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface CampaignBoardHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
}

export function CampaignBoardHeader({
  isRefreshing,
  onRefresh,
}: CampaignBoardHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {t`Campañas abiertas`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t`Postulate a las que matchean con tu perfil. Cuanto más completo tu perfil, mejor el match.`}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={isRefreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          {t`Actualizar`}
        </Button>
      </div>
    </header>
  )
}
