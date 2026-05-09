import { useEffect, useMemo, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Checkbox, Popover } from 'radix-ui'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import type { CreatorCampaignBoardAvailableFilters } from '#/shared/api/generated/model'

import { useDebounce } from './hooks/useDebounce'
import type { CampaignBoardSearch } from './search-schema'

const SEARCH_DEBOUNCE_MS = 300
const MIN_MATCH_SCORE_MIN = 0
const MIN_MATCH_SCORE_MAX = 100
const decimalAmountPattern = /^\d+(?:\.\d{1,2})?$/
const campaignBoardPlatforms = ['instagram', 'tiktok', 'youtube'] as const
type CampaignBoardPlatform = (typeof campaignBoardPlatforms)[number]

interface CampaignBoardFiltersProps {
  search: CampaignBoardSearch
  available?: CreatorCampaignBoardAvailableFilters
  onSearchChange: (patch: Partial<CampaignBoardSearch>) => void
  onReset: () => void
}

export function CampaignBoardFilters({
  search,
  available,
  onSearchChange,
  onReset,
}: CampaignBoardFiltersProps) {
  const [query, setQuery] = useState(search.q ?? '')
  const [feeMin, setFeeMin] = useState(search.fee_min_amount ?? '')
  const [feeMax, setFeeMax] = useState(search.fee_max_amount ?? '')
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const feeRangeError = getFeeRangeError(feeMin, feeMax)

  useEffect(() => {
    setQuery(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    setFeeMin(search.fee_min_amount ?? '')
  }, [search.fee_min_amount])

  useEffect(() => {
    setFeeMax(search.fee_max_amount ?? '')
  }, [search.fee_max_amount])

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim()
    const nextQuery = trimmedQuery === '' ? undefined : trimmedQuery
    if (nextQuery === search.q) return
    onSearchChange({ q: nextQuery })
  }, [debouncedQuery, onSearchChange, search.q])

  function handleFeeChange(nextMin: string, nextMax: string) {
    setFeeMin(nextMin)
    setFeeMax(nextMax)

    if (getFeeRangeError(nextMin, nextMax) !== undefined) return

    onSearchChange({
      fee_min_amount: nextMin === '' ? undefined : nextMin,
      fee_max_amount: nextMax === '' ? undefined : nextMax,
    })
  }

  const matchScore = clampMatchScore(search.min_match_score)

  return (
    <section className="space-y-4" aria-label={t`Filtros de campañas`}>
      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={t`Buscar campañas`}
          placeholder={t`Buscar por marca, campaña o nicho`}
          value={query}
          maxLength={80}
          onChange={(event) => setQuery(event.target.value.slice(0, 80))}
          className="rounded-full bg-card pl-9 pr-9"
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label={t`Limpiar búsqueda`}
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label={t`Categoría`}
            selected={search.niches ?? []}
            options={available?.niches ?? []}
            onChange={(niches) => onSearchChange({ niches })}
          />
          <MultiSelectFilter
            label={t`Intereses`}
            selected={search.interests ?? []}
            options={available?.interests ?? []}
            onChange={(interests) => onSearchChange({ interests })}
          />
          <MultiSelectFilter
            label={t`Plataformas`}
            selected={search.platforms ?? []}
            options={available?.platforms ?? []}
            onChange={(platforms) =>
              onSearchChange({
                platforms: filterCampaignBoardPlatforms(platforms),
              })
            }
          />
          <MultiSelectFilter
            label={t`Deliverables`}
            selected={search.deliverables ?? []}
            options={available?.deliverables ?? []}
            onChange={(deliverables) => onSearchChange({ deliverables })}
          />
          <FeeRangeFilter
            feeMin={feeMin}
            feeMax={feeMax}
            error={feeRangeError}
            onChange={handleFeeChange}
          />
          <MatchScoreFilter
            value={matchScore}
            onChange={(minMatchScore) =>
              onSearchChange({ min_match_score: minMatchScore })
            }
          />
        </div>

        <label className="inline-flex h-9 items-center gap-3 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm">
          <span>{t`Solo recomendadas para mí`}</span>
          <Switch
            size="sm"
            checked={search.recommended_only}
            onCheckedChange={(recommendedOnly) =>
              onSearchChange({ recommended_only: recommendedOnly })
            }
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <ActiveFilterSummary search={search} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-xs"
          onClick={onReset}
        >
          {t`Limpiar filtros`}
        </Button>
      </div>
    </section>
  )
}

function MultiSelectFilter({
  label,
  selected,
  options,
  onChange,
}: {
  label: string
  selected: string[]
  options: string[]
  onChange: (selected: string[] | undefined) => void
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const count = selected.length
  const triggerLabel = count === 0 ? label : `${label} · ${count}`

  function toggleOption(option: string) {
    const next = selectedSet.has(option)
      ? selected.filter((selectedOption) => selectedOption !== option)
      : [...selected, option]
    onChange(next.length === 0 ? undefined : next)
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm',
            count > 0 && 'border-primary/60 bg-primary/10',
          )}
        >
          {triggerLabel}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="max-h-72 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {t`Sin opciones disponibles`}
              </p>
            ) : (
              options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox.Root
                    checked={selectedSet.has(option)}
                    onCheckedChange={() => toggleOption(option)}
                    className="flex size-4 items-center justify-center rounded border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  >
                    <Checkbox.Indicator>
                      <Check className="size-3 text-primary-foreground" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="truncate">{formatFilterOption(option)}</span>
                </label>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function FeeRangeFilter({
  feeMin,
  feeMax,
  error,
  onChange,
}: {
  feeMin: string
  feeMax: string
  error?: string
  onChange: (feeMin: string, feeMax: string) => void
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-invalid={error !== undefined}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm aria-invalid:border-destructive"
        >
          {t`Fee range`}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 space-y-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              {t`Mínimo USD`}
              <Input
                inputMode="decimal"
                pattern="\\d+(\\.\\d{1,2})?"
                value={feeMin}
                onChange={(event) => onChange(event.target.value, feeMax)}
                aria-invalid={error !== undefined}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              {t`Máximo USD`}
              <Input
                inputMode="decimal"
                pattern="\\d+(\\.\\d{1,2})?"
                value={feeMax}
                onChange={(event) => onChange(feeMin, event.target.value)}
                aria-invalid={error !== undefined}
              />
            </label>
          </div>
          {error !== undefined ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function MatchScoreFilter({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number | undefined) => void
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-sm"
        >
          {t`Match score`}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 space-y-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{t`Match mínimo`}</span>
            <span className="text-muted-foreground">{value}%</span>
          </div>
          <Slider
            aria-label={t`Match mínimo`}
            min={MIN_MATCH_SCORE_MIN}
            max={MIN_MATCH_SCORE_MAX}
            step={1}
            value={[value]}
            onValueChange={(nextValue) => {
              const [firstValue] = nextValue
              const clamped = clampMatchScore(firstValue)
              onChange(clamped === MIN_MATCH_SCORE_MIN ? undefined : clamped)
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ActiveFilterSummary({ search }: { search: CampaignBoardSearch }) {
  const activeCount = [
    search.q,
    search.niches,
    search.interests,
    search.platforms,
    search.deliverables,
    search.fee_min_amount,
    search.fee_max_amount,
    search.min_match_score,
    search.recommended_only ? true : undefined,
  ].filter((value) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined
  }).length

  return (
    <p className="text-xs text-muted-foreground">
      {activeCount === 0
        ? t`Sin filtros activos`
        : t`${activeCount} filtros activos`}
    </p>
  )
}

function clampMatchScore(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return MIN_MATCH_SCORE_MIN
  return Math.min(MIN_MATCH_SCORE_MAX, Math.max(MIN_MATCH_SCORE_MIN, value))
}

function formatFilterOption(option: string) {
  return option
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function filterCampaignBoardPlatforms(platforms: string[] | undefined) {
  if (platforms === undefined) return undefined
  const filteredPlatforms = platforms.filter(isCampaignBoardPlatform)
  return filteredPlatforms.length === 0 ? undefined : filteredPlatforms
}

function isCampaignBoardPlatform(
  platform: string,
): platform is CampaignBoardPlatform {
  return campaignBoardPlatforms.some(
    (allowedPlatform) => allowedPlatform === platform,
  )
}

function getFeeRangeError(feeMin: string, feeMax: string) {
  const hasInvalidMin =
    feeMin !== '' && decimalAmountPattern.exec(feeMin) === null
  const hasInvalidMax =
    feeMax !== '' && decimalAmountPattern.exec(feeMax) === null

  if (hasInvalidMin || hasInvalidMax) {
    return t`Ingresá montos con hasta dos decimales.`
  }

  if (feeMin !== '' && feeMax !== '' && Number(feeMax) < Number(feeMin)) {
    return t`El fee máximo debe ser mayor o igual al mínimo.`
  }

  return undefined
}
