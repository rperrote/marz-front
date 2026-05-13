import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { X } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type {
  CreatorEarningsPayments,
  CreatorEarningsPaymentRow,
  CreatorEarningsPeriod,
} from '#/shared/api/generated/model'
import { trackEarningsPaymentOpened } from '../analytics'
import { EarningsSearchExportBar } from './EarningsSearchExportBar'

interface EarningsPaymentsTableProps {
  period: CreatorEarningsPeriod
  q?: string
  payments: CreatorEarningsPayments
}

export function EarningsPaymentsTable({
  period,
  q,
  payments,
}: EarningsPaymentsTableProps) {
  const navigateFromEarnings = useNavigate({ from: '/earnings' })
  const [showTruncatedBanner, setShowTruncatedBanner] = useState(false)

  function handleRowClick(payment: CreatorEarningsPaymentRow) {
    trackEarningsPaymentOpened({
      payment_kind: payment.kind,
      conversation_id: payment.conversation_id,
    })
    void navigateFromEarnings({
      to: payment.href,
      search: (previous) => previous,
    })
  }

  function handleNextPage() {
    if (!payments.next_cursor) {
      return
    }

    void navigateFromEarnings({
      search: (previous) => ({
        ...previous,
        cursor: payments.next_cursor ?? undefined,
      }),
    })
  }

  return (
    <section
      aria-labelledby="earnings-payments-title"
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 id="earnings-payments-title" className="text-sm font-semibold">
            <Trans>Pagos</Trans>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <Trans>Historial de pagos y cobros pendientes</Trans>
          </p>
        </div>

        <EarningsSearchExportBar
          key={q ?? ''}
          period={period}
          q={q}
          rowCount={payments.total_visible}
          onTruncatedExport={() => setShowTruncatedBanner(true)}
        />

        {showTruncatedBanner ? (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm text-foreground"
          >
            <p>
              <Trans>
                Se exportaron las 10k filas más recientes. Para el export
                completo, contactá al administrador (Marz)
              </Trans>
            </p>
            <button
              type="button"
              aria-label={t`Ocultar aviso de exportación truncada`}
              onClick={() => setShowTruncatedBanner(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {payments.items.length > 0 ? (
          <>
            <DesktopPaymentsTable
              payments={payments.items}
              onRowClick={handleRowClick}
            />
            <MobilePaymentsList
              payments={payments.items}
              onRowClick={handleRowClick}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            <Trans>No hay pagos para mostrar con estos filtros.</Trans>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            <Trans>{payments.total_visible} pagos visibles</Trans>
          </p>
          {payments.has_more ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleNextPage}
              disabled={!payments.next_cursor}
            >
              <Trans>Siguiente página</Trans>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

interface PaymentsListProps {
  payments: CreatorEarningsPaymentRow[]
  onRowClick: (payment: CreatorEarningsPaymentRow) => void
}

function DesktopPaymentsTable({ payments, onRowClick }: PaymentsListProps) {
  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    payment: CreatorEarningsPaymentRow,
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onRowClick(payment)
  }

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/70 text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              <Trans>Marca y campaña</Trans>
            </th>
            <th scope="col" className="px-4 py-3">
              <Trans>Entregable</Trans>
            </th>
            <th scope="col" className="px-4 py-3">
              <Trans>Fecha</Trans>
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              <Trans>Monto</Trans>
            </th>
            <th scope="col" className="px-4 py-3">
              <Trans>Estado</Trans>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              tabIndex={0}
              role="row"
              aria-label={paymentRowLabel(payment)}
              onClick={() => onRowClick(payment)}
              onKeyDown={(event) => handleRowKeyDown(event, payment)}
              className="cursor-pointer transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <td className="min-w-0 px-4 py-3">
                <span className="block truncate font-medium text-foreground">
                  {payment.brand_name ?? t`Marca sin nombre`}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {payment.campaign_name ?? t`Campaña sin nombre`}
                </span>
              </td>
              <td className="min-w-0 truncate px-4 py-3 text-muted-foreground">
                {payment.deliverable_label}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatPaymentDate(payment.occurred_at)}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatUsdAmount(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge payment={payment} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobilePaymentsList({ payments, onRowClick }: PaymentsListProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {payments.map((payment) => (
        <button
          key={payment.id}
          type="button"
          onClick={() => onRowClick(payment)}
          aria-label={paymentRowLabel(payment)}
          className="rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {payment.brand_name ?? t`Marca sin nombre`}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {payment.campaign_name ?? t`Campaña sin nombre`}
              </p>
            </div>
            <PaymentStatusBadge payment={payment} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {payment.deliverable_label}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {formatPaymentDate(payment.occurred_at)}
            </span>
            <span className="font-medium">
              {formatUsdAmount(payment.amount)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function PaymentStatusBadge({
  payment,
}: {
  payment: CreatorEarningsPaymentRow
}) {
  const isPaid = payment.status === 'paid'
  return (
    <Badge
      variant="secondary"
      className={
        isPaid
          ? 'bg-success/15 text-success ring-1 ring-success/20'
          : 'bg-muted text-muted-foreground ring-1 ring-border'
      }
    >
      {payment.visible_status_label}
    </Badge>
  )
}

function paymentRowLabel(payment: CreatorEarningsPaymentRow) {
  const brand = payment.brand_name ?? t`marca sin nombre`
  const campaign = payment.campaign_name ?? t`campaña sin nombre`
  return t`Abrir conversación de ${brand}, ${campaign}, ${payment.deliverable_label}`
}

function formatPaymentDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatUsdAmount(value: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value))
}
