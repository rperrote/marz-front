import { Eye, Hourglass, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import type { OfferDTO } from '#/features/offers/hooks/useConversationOffers'

interface NextStepProps {
  offer: OfferDTO | null
  sessionKind: 'brand' | 'creator'
}

// Sistema de tonos:
// - action  (azul)    = tenés que hacer algo
// - waiting (amarillo) = estás esperando que el otro haga algo
// - success (verde)    = algo correcto / completado
// - error   (rojo)     = algo rechazado
type NextStepTone = 'action' | 'waiting' | 'success' | 'error'

interface NextStepMeta {
  label: string
  tone: NextStepTone
  icon: LucideIcon
}

function getNextStepMeta(
  status: string,
  sessionKind: 'brand' | 'creator',
): NextStepMeta | null {
  if (status === 'sent') {
    if (sessionKind === 'creator') {
      return {
        label: t`Tenés una oferta para revisar`,
        tone: 'action',
        icon: Eye,
      }
    }
    return {
      label: t`El creator está analizando la oferta`,
      tone: 'waiting',
      icon: Hourglass,
    }
  }

  if (status === 'accepted') {
    if (sessionKind === 'creator') {
      return {
        label: t`Tenés que subir el draft`,
        tone: 'action',
        icon: Upload,
      }
    }
    return {
      label: t`Esperando que el creator suba el draft`,
      tone: 'waiting',
      icon: Hourglass,
    }
  }

  return null
}

const toneClass: Record<NextStepTone, string> = {
  action: 'bg-info/10 text-info',
  waiting: 'bg-warning/15 text-warning',
  success: 'bg-success/10 text-success',
  error: 'bg-destructive/10 text-destructive',
}

export function NextStep({ offer, sessionKind }: NextStepProps) {
  if (!offer) return null

  const meta = getNextStepMeta(offer.status, sessionKind)
  if (!meta) return null

  const Icon = meta.icon

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${toneClass[meta.tone]}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{meta.label}</span>
    </div>
  )
}
