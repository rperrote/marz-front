import { useCallback, useEffect, useMemo } from 'react'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { BriefBuilderWizard } from '#/features/campaigns/brief-builder/BriefBuilderWizard'
import { useBriefBuilderStore } from '#/features/campaigns/brief-builder/store'
import { Button } from '#/components/ui/button'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import {
  PHASES,
  getPhaseIndex,
} from '#/features/campaigns/brief-builder/phases'
import { WizardProgress } from '#/shared/ui/wizard/WizardProgress'

export const Route = createFileRoute('/_brand/campaigns/new')({
  // RAFITA:BLOCKER: ServerMeBody no expone membership.role todavia.
  // Cuando el backend agregue el campo, agregar beforeLoad con:
  // if (me?.membership?.role !== 'owner') throw redirect({ to: '/campaigns' })
  // Por ahora: el guard de kind=brand en _brand.tsx beforeLoad es suficiente.
  component: CampaignsNewLayout,
  pendingComponent: CampaignsNewPending,
  errorComponent: CampaignsNewError,
})

function CampaignsNewLayout() {
  const router = useRouter()
  const params = useParams({ strict: false })
  const phaseSlug = 'phase' in params ? params.phase : undefined
  const currentIndex = phaseSlug ? getPhaseIndex(phaseSlug) : -1
  const percent =
    currentIndex === -1 ? 0 : ((currentIndex + 1) / PHASES.length) * 100
  const stepLabel =
    currentIndex === -1
      ? undefined
      : `Fase ${currentIndex + 1} de ${PHASES.length}`

  const handleExit = useCallback(() => {
    useBriefBuilderStore.getState().reset()
    void router.navigate({ to: '/campaigns' })
  }, [router])

  const topbarConfig = useMemo(
    () => ({
      title: 'Nueva campaña',
      back: { to: '/campaigns' },
      progress: stepLabel ? (
        <div className="flex min-w-40 items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {stepLabel}
          </span>
          <WizardProgress
            percent={percent}
            ariaLabel="Progreso del brief builder"
            className="w-24"
          />
        </div>
      ) : undefined,
      actions: (
        <Button type="button" variant="outline" size="sm" onClick={handleExit}>
          Cancelar
        </Button>
      ),
    }),
    [handleExit, percent, stepLabel],
  )

  useRouteTopbar(topbarConfig)

  useEffect(() => {
    useBriefBuilderStore.persist.rehydrate()
  }, [])

  return <BriefBuilderWizard />
}

function CampaignsNewPending() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex h-14 items-center justify-between border-b px-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-1 w-full bg-muted" />
      <main className="flex flex-1 flex-col items-center justify-center px-24 py-12">
        <div className="flex w-full max-w-lg flex-col items-center gap-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </main>
    </div>
  )
}

function CampaignsNewError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <h2 className="text-lg font-semibold text-foreground">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : 'Error inesperado'}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          onClick={() => void router.navigate({ to: '/campaigns' })}
        >
          Volver a campañas
        </Button>
      </div>
    </div>
  )
}
