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
    // If the user added scoring dimensions they must sum to 100; an empty
    // list is allowed (the AI may have returned partial draft and we don't
    // want to block the user from continuing manually).
    if (dims.length > 0 && weightSum !== 100) return true
    return (
      draft.campaign.name.trim().length === 0 ||
      !draft.campaign.objective ||
      !draft.campaign.budget_amount
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

  // Guard: post-input phases require source data (URL, description, PDF, or
  // an existing briefDraft). Land users that deep-link straight to a later
  // phase back at phase 1 instead of letting them submit an empty brief.
  // Skip the guard when a campaign was just created (campaignId !== null) —
  // the success path of P4Confirm is navigating away and we don't want a
  // store-reset race to bounce us back to /campaigns/new/input.
  useEffect(() => {
    if (currentIndex <= 0) return
    if (store.campaignId !== null) return
    const hasSource =
      store.formInput.websiteUrl.trim().length > 0 ||
      store.formInput.descriptionText.trim().length > 0 ||
      store.pdfFile !== null ||
      store.briefDraft !== null
    if (hasSource) return
    void router.navigate({
      to: '/campaigns/new/$phase',
      params: { phase: getPhaseSlug(0) },
      replace: true,
    })
  }, [
    currentIndex,
    store.formInput.websiteUrl,
    store.formInput.descriptionText,
    store.pdfFile,
    store.briefDraft,
    store.campaignId,
    router,
  ])

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
