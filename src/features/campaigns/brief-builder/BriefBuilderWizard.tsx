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
    return websiteUrl.trim().length === 0 && descriptionText.trim().length === 0
  }

  if (phaseIndex === 1) {
    return store.briefDraft === null
  }

  if (phaseIndex === 2) {
    const draft = store.briefDraft
    return !draft || draft.title.trim().length === 0
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
        nextLabel={isLastPhase ? 'Crear campaña' : 'Continuar'}
        onExit={handleExit}
        exitLabel="Cancelar"
        hideFooter={isProgressPhase}
      >
        <Outlet />
      </WizardShell>
    </WizardStepValidationContext.Provider>
  )
}
