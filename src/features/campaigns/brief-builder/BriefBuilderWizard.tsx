import { useEffect, useMemo } from 'react'
import { Outlet, useParams, useRouter } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'

import { WizardShell } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from './store'
import type { Phase } from './store'
import { PHASES, getPhaseIndex, getPhaseSlug } from './phases'
import {
  WizardStepValidationContext,
  useStepValidatorRef,
  useCallStepValidator,
} from './validation'
import { useLeaveGuard } from './hooks/useLeaveGuard'
import { LeaveConfirmDialog } from './components/LeaveConfirmDialog'
import { trackBriefBuilderAbandoned } from './analytics/brief-builder-analytics'

function useNextDisabled(phaseIndex: number): boolean {
  const store = useBriefBuilderStore()

  if (phaseIndex === 0) {
    const { websiteUrl, descriptionText } = store.formInput
    return (
      websiteUrl.trim().length === 0 &&
      descriptionText.trim().length === 0 &&
      store.pdfFile === null
    )
  }

  if (phaseIndex === 1) {
    return store.briefDraft === null
  }

  if (phaseIndex === 2) {
    const draft = store.briefDraft
    if (!draft) return true
    const dims = draft.brief.scoring_dimensions
    const weightSum = dims.reduce((a, d) => a + d.weight_pct, 0)
    return (
      draft.campaign.name.trim().length === 0 ||
      !draft.campaign.objective ||
      !draft.campaign.budget_amount ||
      dims.length === 0 ||
      weightSum !== 100
    )
  }

  return false
}

export function BriefBuilderWizard() {
  const router = useRouter()
  const params: { phase?: string } = useParams({ strict: false })
  const phaseSlug = params.phase
  const currentIndex = phaseSlug ? getPhaseIndex(phaseSlug) : -1
  const store = useBriefBuilderStore()
  const nextDisabled = useNextDisabled(currentIndex)

  const validatorRef = useStepValidatorRef()
  const callValidator = useCallStepValidator(validatorRef)

  const validationCtx = useMemo(() => ({ validatorRef }), [validatorRef])

  const { blocker } = useLeaveGuard()

  useEffect(() => {
    return () => {
      useBriefBuilderStore.getState().reset()
    }
  }, [])

  if (currentIndex === -1) {
    return (
      <WizardStepValidationContext value={validationCtx}>
        <Outlet />
      </WizardStepValidationContext>
    )
  }

  const currentPhase = currentIndex + 1
  const totalPhases = PHASES.length
  const percent = (currentPhase / totalPhases) * 100
  const stepLabel = t`Fase ${currentPhase} de ${totalPhases}`
  const isLastPhase = currentIndex === PHASES.length - 1
  const isProgressPhase = currentIndex === 1
  const isConfirmPhase = isLastPhase

  const handleNext = async () => {
    const isValid = await callValidator()
    if (!isValid) return

    if (currentIndex < PHASES.length - 1) {
      const nextIndex = currentIndex + 1
      const nextSlug = getPhaseSlug(nextIndex)
      store.goTo((nextIndex + 1) as Phase)
      void router.navigate({
        to: '/campaigns/new/$phase',
        params: { phase: nextSlug },
      })
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevSlug = getPhaseSlug(prevIndex)
      store.goTo((prevIndex + 1) as Phase)
      void router.navigate({
        to: '/campaigns/new/$phase',
        params: { phase: prevSlug },
      })
    }
  }

  const handleExit = () => {
    store.reset()
    void router.navigate({ to: '/campaigns' })
  }

  const handleBlockerConfirm = () => {
    if (blocker.status === 'blocked') {
      trackBriefBuilderAbandoned({
        phase: store.currentPhase,
        processing_token: store.processingToken,
      })
      blocker.proceed()
    }
  }

  const handleBlockerCancel = () => {
    if (blocker.status === 'blocked') {
      blocker.reset()
    }
  }

  return (
    <WizardStepValidationContext value={validationCtx}>
      <LeaveConfirmDialog
        open={blocker.status === 'blocked'}
        onConfirm={handleBlockerConfirm}
        onCancel={handleBlockerCancel}
      />
      <WizardShell
        stepLabel={stepLabel}
        percent={percent}
        topbar={null}
        progress={null}
        rootClassName="h-full"
        onBack={currentIndex > 0 ? handleBack : undefined}
        onNext={() => void handleNext()}
        nextDisabled={nextDisabled}
        nextLabel={
          isLastPhase
            ? t`Crear campaña`
            : currentIndex === 0
              ? t`Analizar`
              : currentIndex === 2
                ? t`Confirmar`
                : t`Continuar`
        }
        onExit={handleExit}
        exitLabel={t`Cancelar`}
        hideFooter={isProgressPhase || isConfirmPhase}
      >
        <Outlet />
      </WizardShell>
    </WizardStepValidationContext>
  )
}
