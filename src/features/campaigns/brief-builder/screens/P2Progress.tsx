import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'

const STEPS = [
  'Analizando tu marca...',
  'Investigando tu industria...',
  'Generando el brief...',
]

export function P2Progress() {
  const store = useBriefBuilderStore()
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (stepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => setStepIndex((i) => i + 1), 2500)
      return () => clearTimeout(timer)
    }
  }, [stepIndex])

  const isProcessing =
    store.processingToken !== null || store.briefDraft === null

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title="Generando tu brief"
        subtitle="Estamos armando una propuesta personalizada para tu campaña."
      />
      <div className="flex flex-col items-center gap-6">
        {isProcessing ? (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {STEPS[stepIndex]}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Brief generado. Continuá para revisarlo.
          </p>
        )}
      </div>
    </div>
  )
}
