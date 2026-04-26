import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { WizardSectionTitle } from '#/shared/ui/wizard'
import { Button } from '#/components/ui/button'
import { useBriefBuilderStore } from '../store'
import { trackBriefBuilderStarted } from '../analytics/brief-builder-analytics'
import { useBriefBuilderWS } from '../hooks/useBriefBuilderWS'
import { useProcessBrief } from '../hooks/useProcessBrief'
import { BriefProcessingStep } from '../components/BriefProcessingStep'

export function P2Progress() {
  const processingToken = useBriefBuilderStore((s) => s.processingToken)
  const setField = useBriefBuilderStore((s) => s.setField)
  const goTo = useBriefBuilderStore((s) => s.goTo)
  const ws = useBriefBuilderWS(processingToken)
  const processBrief = useProcessBrief()

  const hasTrackedStarted = useRef(false)

  useEffect(() => {
    if (processingToken && !hasTrackedStarted.current) {
      hasTrackedStarted.current = true
      trackBriefBuilderStarted({
        // TODO(fn-2.11): obtener brandWorkspaceId del auth context cuando Identity lo exponga en session
        workspace_id: 'default',
        processing_token: processingToken,
      })
    }
  }, [processingToken])

  useEffect(() => {
    if (
      (ws.status === 'completed' || ws.status === 'partial') &&
      ws.briefDraft
    ) {
      setField('briefDraft', ws.briefDraft)
      goTo(3)
    }
  }, [ws.status, ws.briefDraft, setField, goTo])

  if (ws.status === 'failed') {
    return (
      <div className="flex w-full flex-col items-center gap-8" role="alert">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <WizardSectionTitle
            title={t`Error en el análisis`}
            subtitle={ws.errorMessage ?? t`Ocurrió un error inesperado.`}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => goTo(1)}>
            {t`Volver al formulario`}
          </Button>
          <Button
            disabled={!ws.retryable || processBrief.isPending}
            onClick={() => {
              if (processingToken) {
                processBrief.mutate(processingToken)
              }
            }}
          >
            {processBrief.isPending ? t`Reintentando…` : t`Reintentar`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title={t`Generando tu brief`}
        subtitle={t`Estamos armando una propuesta personalizada para tu campaña.`}
      />
      <div className="flex w-full max-w-sm flex-col gap-4" aria-live="polite">
        {ws.steps.map((step) => (
          <BriefProcessingStep
            key={step.step}
            stepNumber={step.step}
            label={step.label}
            status={step.status}
            errorMessage={step.errorMessage}
          />
        ))}
      </div>
    </div>
  )
}
