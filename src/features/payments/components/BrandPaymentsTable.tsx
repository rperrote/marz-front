import { t } from '@lingui/core/macro'
import { ChevronRight } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { Button } from '#/components/ui/button'
import type { BrandPaymentHistoryRow } from '../api/brandPaymentsSchemas'
import { formatPaymentDate, formatUsd } from './paymentFormatting'

interface BrandPaymentsTableProps {
  rows: BrandPaymentHistoryRow[]
  nextCursor: string | null
  loadingMore: boolean
  onLoadMore: () => void
  onOpenPayment?: (row: BrandPaymentHistoryRow) => void
}

export function BrandPaymentsTable({
  rows,
  nextCursor,
  loadingMore,
  onLoadMore,
  onOpenPayment,
}: BrandPaymentsTableProps) {
  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    row: BrandPaymentHistoryRow,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpenPayment?.(row)
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{t`Historial de pagos`}</caption>
        <thead className="bg-context-panel">
          <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="w-[130px] px-4 py-3">
              {t`Fecha`}
            </th>
            <th scope="col" className="px-4 py-3">
              {t`Creator`}
            </th>
            <th scope="col" className="px-4 py-3">
              {t`Campaña`}
            </th>
            <th scope="col" className="px-4 py-3">
              {t`Deliverable`}
            </th>
            <th scope="col" className="w-[130px] px-4 py-3 text-right">
              {t`Monto`}
            </th>
            <th scope="col" className="w-12 px-4 py-3">
              <span className="sr-only">{t`Abrir`}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={onOpenPayment ? 0 : undefined}
              onClick={() => onOpenPayment?.(row)}
              onKeyDown={(event) => handleRowKeyDown(event, row)}
              className="border-b border-border outline-none transition-colors last:border-b-0 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <td className="px-4 py-3 text-xs text-foreground">
                {formatPaymentDate(row.declared_at)}
              </td>
              <td className="min-w-0 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
                  >
                    {getCreatorInitials(row)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">
                      {row.creator.display_name ?? t`Creator sin nombre`}
                    </div>
                    {row.creator.handle ? (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {row.creator.handle}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="truncate px-4 py-3 text-xs text-foreground">
                {row.campaign.name ?? t`Campaña sin nombre`}
              </td>
              <td className="truncate px-4 py-3 text-xs text-muted-foreground">
                {row.deliverable.label}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">
                {formatUsd(row.amount)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                <ChevronRight className="ml-auto size-4" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {nextCursor ? (
        <div className="flex justify-center border-t border-border p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full"
          >
            {loadingMore ? t`Cargando...` : t`Cargar más`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function getCreatorInitials(row: BrandPaymentHistoryRow): string {
  const label = row.creator.display_name ?? row.creator.handle ?? ''
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'CR'
}
