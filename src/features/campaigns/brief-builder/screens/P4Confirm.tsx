import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Check, Loader2, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { Button } from '#/components/ui/button'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { campaignDetailSearchDefaults } from '#/features/campaigns/configuration/hooks'
import { useBriefBuilderStore } from '../store'
import {
  useCreateCampaign,
  getCreateCampaignFieldErrors,
} from '../hooks/useCreateCampaign'

export function P4Confirm() {
  // Select only the draft from the store so unrelated store changes don't
  // re-render this component and re-fire effects (which would otherwise cause
  // an infinite setState loop when setField('campaignId', ...) runs below).
  const draft = useBriefBuilderStore((s) => s.briefDraft)
  const router = useRouter()

  const idempotencyKeyRef = useRef(generateIdempotencyKey())

  const mutation = useCreateCampaign()
  const mutate = mutation.mutate
  const mutationStatus = mutation.status
  const mutationData = mutation.data
  const navigatedRef = useRef(false)

  // Each useMutation call creates its own observer with isolated state.
  // Under React StrictMode dev the component mounts twice, so a single-shot
  // ref would skip dispatch on the second mount and leave that observer
  // forever idle. We dispatch on every mount where the observer is still
  // idle; the backend's Idempotency-Key (refed so it survives remount)
  // protects against duplicate side effects.
  useEffect(() => {
    if (!draft) return
    if (mutationStatus !== 'idle') return

    // Read transient form input via getState() so this effect doesn't depend
    // on every store update.
    const { formInput } = useBriefBuilderStore.getState()
    const sourceSnapshot = {
      websiteUrl: formInput.websiteUrl,
      descriptionText: formInput.descriptionText,
      pdfS3Key: null,
    }

    mutate({
      idempotencyKey: idempotencyKeyRef.current,
      draft,
      source: sourceSnapshot,
    })
  }, [draft, mutate, mutationStatus])

  // Success: persist campaignId so the success screen can offer "Ir a
  // configuración". Run at most once (navigatedRef name kept for continuity)
  // to break the setField → store change → effect re-run loop.
  useEffect(() => {
    if (!mutationData) return
    if (navigatedRef.current) return
    navigatedRef.current = true
    useBriefBuilderStore
      .getState()
      .setField('campaignId', mutationData.campaign_id)
  }, [mutationData])

  // Error: toast user-facing message.
  useEffect(() => {
    if (!mutation.isError) return
    const fieldErrors = getCreateCampaignFieldErrors(mutation.error)
    if (fieldErrors) {
      const messages = Object.values(fieldErrors).flat()
      toast.error(messages[0] ?? t`Error de validación. Revisá los campos.`)
    } else {
      toast.error(t`No se pudo crear la campaña. Intentá de nuevo.`)
    }
  }, [mutation.isError, mutation.error])

  if (!draft) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <WizardSectionTitle
          title={t`Sin brief disponible`}
          subtitle={t`Volvé al paso anterior para completar la información.`}
        />
      </div>
    )
  }

  if (mutation.isPending) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <Loader2 className="size-10 animate-spin text-primary" />
        <WizardSectionTitle
          title={t`Creando tu campaña…`}
          subtitle={t`Esto puede tardar unos segundos.`}
        />
      </div>
    )
  }

  if (mutation.isError) {
    const fieldErrors = getCreateCampaignFieldErrors(mutation.error)
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <WizardSectionTitle
          title={t`Error al crear la campaña`}
          subtitle={
            fieldErrors
              ? t`Hay errores de validación. Volvé al paso anterior para corregirlos.`
              : t`Ocurrió un error inesperado. Podés volver a intentar.`
          }
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              useBriefBuilderStore.getState().goTo(3)
              void router.navigate({
                to: '/campaigns/new/$phase',
                params: { phase: 'review' },
              })
            }}
          >
            <ArrowLeft className="size-4" />
            {t`Volver al formulario`}
          </Button>
          {!fieldErrors && (
            <Button
              onClick={() => {
                const { formInput } = useBriefBuilderStore.getState()
                mutation.mutate({
                  idempotencyKey: idempotencyKeyRef.current,
                  draft,
                  source: {
                    websiteUrl: formInput.websiteUrl,
                    descriptionText: formInput.descriptionText,
                    pdfS3Key: null,
                  },
                })
              }}
            >
              <RotateCcw className="size-4" />
              {t`Volver a intentar`}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const handleGoToConfiguration = () => {
    const campaignId = useBriefBuilderStore.getState().campaignId
    if (!campaignId) return
    void router.navigate({
      to: '/campaigns/$campaignId/configuration',
      params: { campaignId },
      search: {
        ...campaignDetailSearchDefaults,
        from: 'brief-builder',
      },
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-primary/20">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary">
          <Check className="size-6 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>

      <WizardSectionTitle
        title={t`Campaña creada`}
        subtitle={t`Tu campaña fue creada con éxito. Configurá los detalles para activarla.`}
      />

      <div className="flex gap-3">
        <Button onClick={handleGoToConfiguration} disabled={mutation.isPending}>
          {t`Configurar campaña`}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
