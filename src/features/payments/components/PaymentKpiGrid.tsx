import { t } from '@lingui/core/macro'
import {
  CalendarClock,
  CircleDollarSign,
  Clock3,
  WalletCards,
} from 'lucide-react'

import type { BrandPaymentsSummary } from '../api/brandPaymentsSchemas'
import { formatPaymentDate, formatUsd } from './paymentFormatting'

interface PaymentKpiGridProps {
  summary: BrandPaymentsSummary
}

export function PaymentKpiGrid({ summary }: PaymentKpiGridProps) {
  const kpis = [
    {
      key: 'total_spent',
      label: t`Total spent`,
      value: formatUsd(summary.total_spent),
      detail: t`Todos los pagos históricos`,
      Icon: CircleDollarSign,
    },
    {
      key: 'period_spend',
      label: t`Period spend`,
      value: formatUsd(summary.period_spend),
      detail: t`Según el periodo seleccionado`,
      Icon: WalletCards,
    },
    {
      key: 'pending_approval',
      label: t`Pending approval`,
      value: formatUsd(summary.pending_approval),
      detail: t`Deliverables pendientes`,
      Icon: Clock3,
    },
    {
      key: 'next_debit',
      label: t`Next debit`,
      value: formatUsd(summary.next_debit.amount),
      detail: summary.next_debit.date_available
        ? formatPaymentDate(summary.next_debit.date ?? '')
        : t`Fecha no disponible`,
      Icon: CalendarClock,
    },
  ]

  return (
    <section aria-label={t`KPIs de pagos`} className="grid grid-cols-4 gap-4">
      {kpis.map(({ key, label, value, detail, Icon }) => (
        <article
          key={key}
          className="min-w-0 rounded-lg border border-border bg-card p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <span>{label}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </article>
      ))}
    </section>
  )
}
