import { useMemo } from 'react'
import { Outlet, useParams, useRouter } from '@tanstack/react-router'

import { WizardShell } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from './store'
import type { Phase } from './store'
import { PHASES, getPhaseIndex, getPhaseSlug } from './phases'
import {
  WizardStepValidationContext,
  useStepValidatorRef,
  useCallStepValidator,
} from './validation'

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

  if (currentIndex === -1) {
    return (
      <WizardStepValidationContext.Provider value={validationCtx}>
        <Outlet />
      </WizardStepValidationContext.Provider>
    )
  }

  const percent = ((currentIndex + 1) / PHASES.length) * 100
  const stepLabel = `Fase ${currentIndex + 1} de ${PHASES.length}`
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

  return (
    <WizardStepValidationContext.Provider value={validationCtx}>
      <WizardShell
        stepLabel={stepLabel}
        percent={percent}
        onBack={currentIndex > 0 ? handleBack : undefined}
        onNext={() => void handleNext()}
        nextDisabled={nextDisabled}
        nextLabel={
          isLastPhase
            ? 'Crear campaña'
            : currentIndex === 0
              ? 'Analizar'
              : currentIndex === 2
                ? 'Confirmar'
                : 'Continuar'
        }
        onExit={handleExit}
        exitLabel="Cancelar"
        hideFooter={isProgressPhase || isConfirmPhase}
      >
        <Outlet />
      </WizardShell>
    </WizardStepValidationContext.Provider>
  )
}
