import { t } from '@lingui/core/macro'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type {
  ListCampaignParticipantsPlatform,
  ListCampaignParticipantsStatus,
} from '#/shared/api/generated/model'
import { cn } from '#/lib/utils'

export interface CreatorsFilterParams {
  search?: string
  status?: ListCampaignParticipantsStatus
  platform?: ListCampaignParticipantsPlatform
}

interface CreatorsFiltersProps {
  params: CreatorsFilterParams
  onParamsChange: (params: CreatorsFilterParams) => void
}

const ALL_PLATFORMS = 'all'

const statusOptions: ReadonlyArray<{
  value: ListCampaignParticipantsStatus
  label: string
}> = [
  { value: 'invited', label: t`Invited` },
  { value: 'active', label: t`Active` },
  { value: 'in_review', label: t`In review` },
  { value: 'approved', label: t`Approved` },
  { value: 'paid', label: t`Paid` },
]

const platformOptions: ReadonlyArray<{
  value: ListCampaignParticipantsPlatform
  label: string
}> = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X' },
  { value: 'twitch', label: 'Twitch' },
]

export function CreatorsFilters({
  params,
  onParamsChange,
}: CreatorsFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? '')

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchValue.trim()
      if ((params.search ?? '') === nextSearch) return
      onParamsChange({
        ...params,
        search: nextSearch.length > 0 ? nextSearch : undefined,
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [onParamsChange, params, searchValue])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => {
          const active = params.status === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={cn(
                'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-surface-hover hover:text-foreground',
              )}
              onClick={() =>
                onParamsChange({
                  ...params,
                  status: active ? undefined : option.value,
                })
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 sm:w-60">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t`Search creator`}
            aria-label={t`Search creators`}
            className="rounded-xl bg-background pl-9"
          />
        </div>

        <Select
          value={params.platform ?? ALL_PLATFORMS}
          onValueChange={(value) =>
            onParamsChange({
              ...params,
              platform: isPlatform(value) ? value : undefined,
            })
          }
        >
          <SelectTrigger
            className="h-9 rounded-xl bg-background sm:w-[150px]"
            aria-label={t`Filter by platform`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PLATFORMS}>{t`All platforms`}</SelectItem>
            {platformOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!hasActiveFilters(params)}
          onClick={() => {
            setSearchValue('')
            onParamsChange({})
          }}
        >
          <X className="size-3.5" aria-hidden />
          {t`Clear`}
        </Button>
      </div>
    </div>
  )
}

export function hasActiveFilters(params: CreatorsFilterParams) {
  return (
    (params.search?.trim().length ?? 0) > 0 ||
    params.status !== undefined ||
    params.platform !== undefined
  )
}

function isPlatform(value: string): value is ListCampaignParticipantsPlatform {
  return platformOptions.some((option) => option.value === value)
}
