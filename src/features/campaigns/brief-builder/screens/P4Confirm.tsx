import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Check,
  Loader2,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { useBriefBuilderStore } from '../store'
import {
  useCreateCampaign,
  getCreateCampaignFieldErrors,
} from '../hooks/useCreateCampaign'
import { BriefSummaryView } from '../components/BriefSummaryView'

export function P4Confirm() {
  const store = useBriefBuilderStore()
  const router = useRouter()
  const draft = store.briefDraft

  const idempotencyKeyRef = useRef(crypto.randomUUID())
  const hasTriggeredRef = useRef(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const mutation = useCreateCampaign()

  useEffect(() => {
    if (!draft || hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    mutation.mutate(
      {
        // TODO(fn-B.x): obtener brandWorkspaceId del auth context
        brandWorkspaceId: 'default' as string,
        idempotencyKey: idempotencyKeyRef.current,
        draft,
      },
      {
        onSuccess: (data) => {
          store.setField('campaignId', data.campaign_id)
        },
        onError: (error) => {
          const fieldErrors = getCreateCampaignFieldErrors(error)
          if (fieldErrors) {
            const messages = Object.values(fieldErrors).flat()
            toast.error(
              messages[0] ?? 'Error de validación. Revisá los campos.',
            )
          } else {
            toast.error('No se pudo crear la campaña. Intentá de nuevo.')
          }
        },
      },
    )
  }, [])

  if (!draft) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <WizardSectionTitle
          title="Sin brief disponible"
          subtitle="Volvé al paso anterior para completar la información."
        />
      </div>
    )
  }

  if (mutation.isPending) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <Loader2 className="size-10 animate-spin text-primary" />
        <WizardSectionTitle
          title="Creando tu campaña…"
          subtitle="Esto puede tardar unos segundos."
        />
      </div>
    )
  }

  if (mutation.isError) {
    const fieldErrors = getCreateCampaignFieldErrors(mutation.error)
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <WizardSectionTitle
          title="Error al crear la campaña"
          subtitle={
            fieldErrors
              ? 'Hay errores de validación. Volvé al paso anterior para corregirlos.'
              : 'Ocurrió un error inesperado. Podés volver a intentar.'
          }
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              store.goTo(3)
              void router.navigate({
                to: '/campaigns/new/$phase',
                params: { phase: 'review' },
              })
            }}
          >
            <ArrowLeft className="size-4" />
            Volver al formulario
          </Button>
          {!fieldErrors && (
            <Button
              onClick={() => {
                mutation.mutate({
                  brandWorkspaceId: 'default' as string,
                  idempotencyKey: idempotencyKeyRef.current,
                  draft,
                })
              }}
            >
              <RotateCcw className="size-4" />
              Volver a intentar
            </Button>
          )}
        </div>
      </div>
    )
  }

  const handleGoToMarketplace = async () => {
    const campaignId = store.campaignId
    try {
      // TODO(fn-X): cuando exista la ruta /marketplace, tipar correctamente
      await router.navigate({
        to: '/marketplace',
        ...(campaignId ? { search: { campaignId } } : {}),
      } as Parameters<typeof router.navigate>[0])
    } catch {
      toast.info(
        'El marketplace no está disponible aún. Te llevamos al inicio.',
      )
      void router.navigate({ to: '/' })
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-primary/20">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary">
          <Check className="size-6 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>

      <WizardSectionTitle
        title="Campaña creada"
        subtitle="Tu campaña fue creada con éxito. Podés ir al marketplace o revisar el brief."
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setSummaryOpen(true)}
          disabled={mutation.isPending}
        >
          <Eye className="size-4" />
          Ver resumen del brief
        </Button>
        <Button onClick={handleGoToMarketplace} disabled={mutation.isPending}>
          Ir al marketplace
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resumen del brief</DialogTitle>
            <DialogDescription>
              Detalle completo de la campaña y brief creados.
            </DialogDescription>
          </DialogHeader>
          <BriefSummaryView draft={draft} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
