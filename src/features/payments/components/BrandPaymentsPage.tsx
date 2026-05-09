import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { Download, RefreshCw } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { ApiError } from '#/shared/api/mutator'
import {
  trackBrandPaymentsCsvExported,
  trackBrandPaymentsFilterChanged,
  trackBrandPaymentsPeriodChanged,
  trackBrandPaymentsRefreshClicked,
  trackBrandPaymentsSearchUsed,
  trackBrandPaymentsViewed,
} from '../analytics'
import type {
  BrandPaymentHistoryRow,
  BrandPaymentsSearch,
} from '../api/brandPaymentsSchemas'
import {
  getBrandPaymentsSpendingQueryKey,
  useBrandPaymentsSpendingQuery,
} from '../hooks/useBrandPaymentsSpendingQuery'
import { useExportBrandPaymentsCsvMutation } from '../hooks/useExportBrandPaymentsCsvMutation'
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
  const exportCsvMutation = useExportBrandPaymentsCsvMutation()
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

  useEffect(() => {
    trackBrandPaymentsViewed({ workspace_id: brandWorkspace.id })
  }, [brandWorkspace.id])

  useEffect(() => {
    const query = filters.q?.trim()
    if (!query) return

    const timeoutId = window.setTimeout(() => {
      trackBrandPaymentsSearchUsed({ query_length: query.length })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [filters.q])

  const handleRefresh = () => {
    trackBrandPaymentsRefreshClicked({ workspace_id: brandWorkspace.id })
    void queryClient.invalidateQueries({
      queryKey: getBrandPaymentsSpendingQueryKey(brandWorkspace.id, {
        filters,
      }).slice(0, 2),
    })
  }

  const handleExportCsv = () => {
    exportCsvMutation.mutate(
      { filters },
      {
        onSuccess: async (response) => {
          try {
            const filename = getCsvFilename(response, brandWorkspace.id)
            const blob = await response.blob()
            downloadBlob(blob, filename)
            trackBrandPaymentsCsvExported({
              workspace_id: brandWorkspace.id,
              period: filters.period,
              has_campaign_filter: Boolean(filters.campaignId),
              has_creator_filter: Boolean(filters.creatorId),
              has_search: Boolean(filters.q?.trim()),
            })
          } catch {
            toast.error(t`No pudimos exportar los pagos. Intentá de nuevo.`)
          }
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'no_payments_to_export'
          ) {
            toast.info(t`No hay pagos para exportar con estos filtros.`)
            return
          }

          if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'export_exceeds_limit'
          ) {
            toast.error(
              t`El export excede el límite. Contactá al administrador (Marz) para obtenerlo manualmente.`,
            )
            return
          }

          toast.error(t`No pudimos exportar los pagos. Intentá de nuevo.`)
        },
      },
    )
  }

  const handlePeriodChange = (period: BrandPaymentsSearch['period']) => {
    trackBrandPaymentsPeriodChanged({ period })
    onFiltersChange({ ...filters, period })
  }

  const handleFiltersChange = (nextFilters: BrandPaymentsSearch) => {
    if (nextFilters.campaignId !== filters.campaignId) {
      trackBrandPaymentsFilterChanged({
        filter: 'campaign',
        has_value: Boolean(nextFilters.campaignId),
      })
    }
    if (nextFilters.creatorId !== filters.creatorId) {
      trackBrandPaymentsFilterChanged({
        filter: 'creator',
        has_value: Boolean(nextFilters.creatorId),
      })
    }

    onFiltersChange(nextFilters)
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
          onChange={handlePeriodChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={exportCsvMutation.isPending}
          className="rounded-full"
        >
          <Download className="size-4" aria-hidden />
          {t`Export CSV`}
        </Button>
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
              onChange={handleFiltersChange}
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

export function getCsvFilename(
  response: Response,
  workspaceId: string,
  now = new Date(),
): string {
  const contentDisposition = response.headers.get('content-disposition')
  const headerFilename = contentDisposition
    ? parseContentDispositionFilename(contentDisposition)
    : null

  if (headerFilename) return headerFilename

  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `marz-payments-${workspaceId}-${yyyy}${mm}${dd}.csv`
}

function parseContentDispositionFilename(value: string): string | null {
  const filenameStarMatch = /filename\*=UTF-8''([^;]+)/i.exec(value)
  const encodedFilename = filenameStarMatch?.[1]
  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename)
    } catch {
      return encodedFilename
    }
  }

  const filenameMatch = /filename="?([^";]+)"?/i.exec(value)
  return filenameMatch?.[1] ?? null
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
