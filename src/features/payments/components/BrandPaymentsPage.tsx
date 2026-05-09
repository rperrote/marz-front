import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '#/components/ui/button'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import type {
  BrandPaymentHistoryRow,
  BrandPaymentsSearch,
} from '../api/brandPaymentsSchemas'
import {
  getBrandPaymentsSpendingQueryKey,
  useBrandPaymentsSpendingQuery,
} from '../hooks/useBrandPaymentsSpendingQuery'
import { BrandPaymentsFilters } from './BrandPaymentsFilters'
import { BrandPaymentsTable } from './BrandPaymentsTable'
import { CampaignSpendDonut } from './CampaignSpendDonut'
import { MonthlySpendBarChart } from './MonthlySpendBarChart'
import { PaymentKpiGrid } from './PaymentKpiGrid'
import { PaymentsEmptyState } from './PaymentsEmptyState'
import { PaymentsPeriodSegmentedControl } from './PaymentsPeriodSegmentedControl'

interface BrandPaymentsPageProps {
  filters: BrandPaymentsSearch
  onFiltersChange: (filters: BrandPaymentsSearch) => void
  onOpenPayment?: (row: BrandPaymentHistoryRow) => void
}

export function BrandPaymentsPage({
  filters,
  onFiltersChange,
  onOpenPayment,
}: BrandPaymentsPageProps) {
  const queryClient = useQueryClient()
  const { brandWorkspace } = useBrandSession()
  const spendingQuery = useBrandPaymentsSpendingQuery({ filters })
  const pages = spendingQuery.data?.pages ?? []
  const visibleResponse = pages[0]
  const visibleRows = useMemo(
    () => pages.flatMap((page) => page.payments.data),
    [pages],
  )
  const nextCursor = pages.at(-1)?.payments.next_cursor ?? null
  const hasActiveResultFilters = Boolean(
    filters.campaignId || filters.creatorId || filters.q,
  )
  const emptyVariant =
    hasActiveResultFilters ||
    Number(visibleResponse?.summary.total_spent ?? '0') > 0
      ? 'no-results'
      : 'no-payments'

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: getBrandPaymentsSpendingQueryKey(brandWorkspace.id, {
        filters,
      }).slice(0, 2),
    })
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-auto bg-background p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {t`Pagos y gastos`}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t`Pagos realizados a creators y análisis de gastos por campaña.`}
          </p>
        </div>
        <PaymentsPeriodSegmentedControl
          value={filters.period}
          onChange={(period) => onFiltersChange({ ...filters, period })}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={spendingQuery.isFetching}
          className="rounded-full"
        >
          <RefreshCw className="size-4" aria-hidden />
          {t`Actualizar`}
        </Button>
      </div>

      {spendingQuery.isPending && !visibleResponse ? (
        <BrandPaymentsPageSkeleton />
      ) : null}

      {visibleResponse ? (
        <div className="flex flex-col gap-5">
          <PaymentKpiGrid summary={visibleResponse.summary} />

          <div className="flex gap-4">
            <MonthlySpendBarChart data={visibleResponse.monthly_spend} />
            <CampaignSpendDonut
              data={visibleResponse.campaign_breakdown}
              totalAmount={visibleResponse.summary.period_spend}
            />
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <BrandPaymentsFilters
              filters={filters}
              options={visibleResponse.filters}
              onChange={(nextFilters) =>
                onFiltersChange({
                  ...nextFilters,
                  period: nextFilters.period,
                })
              }
            />
            {visibleRows.length === 0 ? (
              <PaymentsEmptyState variant={emptyVariant} />
            ) : (
              <BrandPaymentsTable
                rows={visibleRows}
                nextCursor={nextCursor}
                loadingMore={spendingQuery.isFetchingNextPage}
                onLoadMore={() => {
                  if (
                    spendingQuery.hasNextPage &&
                    !spendingQuery.isFetchingNextPage
                  ) {
                    void spendingQuery.fetchNextPage()
                  }
                }}
                onOpenPayment={onOpenPayment}
              />
            )}
          </section>
        </div>
      ) : null}

      {spendingQuery.isError ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          {t`No pudimos cargar el dashboard de pagos.`}
        </div>
      ) : null}
    </main>
  )
}

function BrandPaymentsPageSkeleton() {
  return (
    <div aria-label={t`Cargando pagos`} className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </div>
      <div className="flex gap-4">
        <div className="h-[300px] flex-1 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-[300px] w-[480px] animate-pulse rounded-lg border border-border bg-card" />
      </div>
      <div className="h-[340px] animate-pulse rounded-lg border border-border bg-card" />
    </div>
  )
}
