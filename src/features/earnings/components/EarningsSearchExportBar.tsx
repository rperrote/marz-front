import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Download, Search, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import {
  trackEarningsCsvExported,
  trackEarningsPaymentSearchUsed,
} from '../analytics'
import { useExportCreatorEarningsMutation } from '../hooks/useExportCreatorEarnings'
import { buildEarningsCsvFilename, downloadCsvBlob } from '../utils/exportCsv'

const SEARCH_DEBOUNCE_MS = 300
const MAX_SEARCH_LENGTH = 120

interface EarningsSearchExportBarProps {
  period: CreatorEarningsPeriod
  q?: string
  rowCount: number
  onTruncatedExport: () => void
}

export function EarningsSearchExportBar({
  period,
  q,
  rowCount,
  onTruncatedExport,
}: EarningsSearchExportBarProps) {
  const navigate = useNavigate({ from: '/earnings' })
  const exportMutation = useExportCreatorEarningsMutation()
  const [localSearch, setLocalSearch] = useState(q ?? '')
  const [exportError, setExportError] = useState<string | null>(null)
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    const timer = window.setTimeout(() => {
      const trimmed = localSearch.trim()
      if (trimmed.length > 0) {
        trackEarningsPaymentSearchUsed({ q: trimmed })
      }

      void navigate({
        search: (previous) => ({
          ...previous,
          q: trimmed || undefined,
          cursor: undefined,
        }),
        replace: true,
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [localSearch, navigate])

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLocalSearch(event.target.value.slice(0, MAX_SEARCH_LENGTH))
  }

  function handleClearSearch() {
    setLocalSearch('')
  }

  function handleExport() {
    setExportError(null)
    exportMutation.mutate(
      {
        period,
        q: q?.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          downloadCsvBlob({
            blob: result.blob,
            filename: buildEarningsCsvFilename(period),
          })
          trackEarningsCsvExported({
            period,
            q: q?.trim() || undefined,
            truncated: result.truncated,
            row_count: rowCount,
          })
          if (result.truncated) {
            onTruncatedExport()
          }
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'no_payments_to_export'
          ) {
            setExportError(
              t`No hay pagos para exportar con los filtros actuales.`,
            )
            return
          }

          setExportError(t`No pudimos exportar el CSV. Intentá de nuevo.`)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={t`Buscar pagos por marca o campaña`}
            placeholder={t`Buscar por marca o campaña`}
            value={localSearch}
            onChange={handleSearchChange}
            className="rounded-full pl-9 pr-9"
          />
          {localSearch.length > 0 ? (
            <button
              type="button"
              aria-label={t`Limpiar búsqueda`}
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="rounded-full"
        >
          <Download className="size-4" aria-hidden="true" />
          {exportMutation.isPending ? t`Exportando...` : t`Exportar CSV`}
        </Button>
      </div>

      {exportError ? (
        <p role="alert" className="text-sm text-destructive">
          {exportError}
        </p>
      ) : null}
      <span className="sr-only">
        <Trans>La búsqueda se aplica automáticamente.</Trans>
      </span>
    </div>
  )
}
