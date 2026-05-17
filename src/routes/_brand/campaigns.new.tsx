import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { BriefBuilderWizard } from '#/features/campaigns/brief-builder/BriefBuilderWizard'
import { useBriefBuilderStore } from '#/features/campaigns/brief-builder/store'
import { Button } from '#/components/ui/button'
import { WizardTopbar } from '#/shared/ui/wizard/WizardTopbar'
import {
  PHASES,
  getPhaseIndex,
} from '#/features/campaigns/brief-builder/phases'

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
  const [hasHydrated, setHasHydrated] = useState(() =>
    useBriefBuilderStore.persist.hasHydrated(),
  )
  const params = useParams({ strict: false })
  const phaseSlug = 'phase' in params ? params.phase : undefined
  const currentIndex = phaseSlug ? getPhaseIndex(phaseSlug) : -1
  const currentPhase = currentIndex + 1
  const totalPhases = PHASES.length
  const stepLabel =
    currentIndex === -1 ? undefined : t`Fase ${currentPhase} de ${totalPhases}`

  const handleExit = useCallback(() => {
    useBriefBuilderStore.getState().reset()
    void router.navigate({ to: '/campaigns' })
  }, [router])

  useEffect(() => {
    let mounted = true
    const unsubscribe = useBriefBuilderStore.persist.onFinishHydration(() => {
      if (mounted) setHasHydrated(true)
    })
    void Promise.resolve(useBriefBuilderStore.persist.rehydrate()).then(() => {
      if (mounted) setHasHydrated(true)
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <WizardTopbar
        stepLabel={stepLabel ?? t`Nueva campaña`}
        onExit={handleExit}
        exitLabel={t`Cancelar`}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {hasHydrated ? <BriefBuilderWizard /> : <CampaignsNewPending />}
      </main>
    </div>
  )
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
      <h2 className="text-lg font-semibold text-foreground">
        <Trans>Algo salió mal</Trans>
      </h2>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : t`Error inesperado`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <Trans>Reintentar</Trans>
        </Button>
        <Button
          variant="ghost"
          onClick={() => void router.navigate({ to: '/campaigns' })}
        >
          <Trans>Volver a campañas</Trans>
        </Button>
      </div>
    </div>
  )
}
