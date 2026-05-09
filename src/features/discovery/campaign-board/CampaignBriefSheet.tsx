import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { ApiError } from '#/shared/api/mutator'
import type { CreatorCampaignBoardCard } from '#/shared/api/generated/model'

import { CampaignBriefContent } from './CampaignBriefContent'
import { useCampaignBoardDetailQuery } from './hooks/useCampaignBoardDetailQuery'

interface CampaignBriefSheetProps {
  campaignId: string | null
  onOpenChange: (open: boolean) => void
  onApply: (card: CreatorCampaignBoardCard) => void
}

function detailErrorMessage(error: Error) {
  if (error instanceof ApiError) {
    if (
      error.status === 404 ||
      error.code === 'campaign_board_listing_not_found'
    ) {
      return {
        title: t`Brief no encontrado`,
        description: t`Esta campaña ya no está disponible en tu board.`,
      }
    }

    if (error.status === 409 || error.code === 'campaign_not_available') {
      return {
        title: t`Campaña no disponible`,
        description: t`La marca pausó o cerró esta campaña. Podés cerrar el panel y seguir explorando.`,
      }
    }
  }

  return {
    title: t`No pudimos cargar el brief`,
    description: t`Intentá abrirlo de nuevo en unos segundos.`,
  }
}

function SheetSkeleton() {
  return (
    <div
      role="status"
      className="space-y-6 p-6 pt-2"
      aria-label={t`Cargando brief`}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailErrorState({
  error,
  onClose,
}: {
  error: Error
  onClose: () => void
}) {
  const message = detailErrorMessage(error)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {message.title}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message.description}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={onClose}
      >
        {t`Cerrar`}
      </Button>
    </div>
  )
}

export function CampaignBriefSheet({
  campaignId,
  onOpenChange,
  onApply,
}: CampaignBriefSheetProps) {
  const isOpen = campaignId !== null
  const detailQuery = useCampaignBoardDetailQuery(campaignId ?? '', {
    enabled: isOpen,
    staleTime: 60_000,
  })

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border p-6 pr-12">
          <SheetTitle>{t`Brief de campaña`}</SheetTitle>
          <SheetDescription>
            {t`Detalle read-only para revisar antes de postularte.`}
          </SheetDescription>
        </SheetHeader>

        {detailQuery.isPending ? <SheetSkeleton /> : null}

        {detailQuery.isError ? (
          <DetailErrorState
            error={detailQuery.error}
            onClose={() => onOpenChange(false)}
          />
        ) : null}

        {detailQuery.isSuccess ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <CampaignBriefContent
                card={detailQuery.data.card}
                brief={detailQuery.data.brief}
                targeting={detailQuery.data.targeting}
                commercial={detailQuery.data.commercial}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <Button
                type="button"
                className="rounded-xl"
                disabled={
                  !detailQuery.data.card.application.can_apply ||
                  detailQuery.data.card.application.status !== 'none'
                }
                onClick={() => onApply(detailQuery.data.card)}
              >
                {detailQuery.data.card.application.status === 'submitted'
                  ? t`Postulación enviada`
                  : t`Postularme`}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
