import { t } from '@lingui/core/macro'
import { SearchX, WalletCards } from 'lucide-react'

interface PaymentsEmptyStateProps {
  variant: 'no-payments' | 'no-results'
}

export function PaymentsEmptyState({ variant }: PaymentsEmptyStateProps) {
  const Icon = variant === 'no-payments' ? WalletCards : SearchX
  const title =
    variant === 'no-payments' ? t`Todavía no hay pagos` : t`Sin resultados`
  const description =
    variant === 'no-payments'
      ? t`Cuando declares pagos a creators, el historial y el análisis van a aparecer acá.`
      : t`No encontramos pagos para los filtros actuales. Probá ajustar la búsqueda, campaña o creator.`

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
