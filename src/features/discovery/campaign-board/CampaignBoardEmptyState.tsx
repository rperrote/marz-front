import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

import type { CampaignBoardEmptyStateType } from './utils/classifyEmptyState'

interface CampaignBoardEmptyStateProps {
  type: CampaignBoardEmptyStateType
  onAction?: () => void
}

const emptyStateCopy = {
  error: {
    title: t`No pudimos cargar las campañas`,
    description: t`Intentá actualizar el board. Si sigue fallando, probá de nuevo más tarde.`,
    action: t`Actualizar`,
  },
  no_campaigns: {
    title: t`Sin campañas por ahora`,
    description: t`Todavía no hay campañas abiertas que matcheen con vos. Te avisamos cuando lleguen.`,
    action: t`Editar mi perfil`,
  },
  no_filters: {
    title: t`Sin resultados para esos filtros`,
    description: t`Probá ajustar la búsqueda o limpiar filtros para volver a ver campañas disponibles.`,
    action: t`Limpiar filtros`,
  },
  no_recommendations: {
    title: t`Sin campañas recomendadas por ahora`,
    description: t`No tenemos recomendaciones para vos en este momento. Sacá el filtro para ver todo el board.`,
    action: t`Ver todo el board`,
  },
} satisfies Record<
  CampaignBoardEmptyStateType,
  { title: string; description: string; action: string }
>

export function CampaignBoardEmptyState({
  type,
  onAction,
}: CampaignBoardEmptyStateProps) {
  const copy = emptyStateCopy[type]
  const isError = type === 'error'

  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {copy.description}
        </p>
      </div>
      <Button
        type="button"
        variant={isError ? 'default' : 'outline'}
        className="rounded-xl"
        onClick={onAction}
        data-ticket={
          type === 'no_campaigns' ? 'F.4-creator-profile-navigation' : undefined
        }
      >
        {copy.action}
      </Button>
    </section>
  )
}
