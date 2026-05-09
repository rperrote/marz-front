import { t } from '@lingui/core/macro'
import { Megaphone, Search, User } from 'lucide-react'
import type { ChangeEvent } from 'react'

import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type {
  BrandPaymentsFilters as BrandPaymentsFilterOptions,
  BrandPaymentsSearch,
} from '../api/brandPaymentsSchemas'

interface BrandPaymentsFiltersProps {
  filters: BrandPaymentsSearch
  options: BrandPaymentsFilterOptions
  onChange: (filters: BrandPaymentsSearch) => void
}

const allCampaignsValue = 'all-campaigns'
const allCreatorsValue = 'all-creators'

export function BrandPaymentsFilters({
  filters,
  options,
  onChange,
}: BrandPaymentsFiltersProps) {
  const updateFilter = (next: Partial<BrandPaymentsSearch>) => {
    onChange({ ...filters, ...next })
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFilter({ q: event.target.value })
  }

  return (
    <div className="flex items-center gap-2 border-b border-border p-4">
      <h2 className="mr-auto text-sm font-semibold text-foreground">
        {t`Pagos`}
      </h2>

      <label className="sr-only" htmlFor="brand-payments-campaign">
        {t`Filtrar por campaña`}
      </label>
      <Select
        value={filters.campaignId ?? allCampaignsValue}
        onValueChange={(value) =>
          updateFilter({
            campaignId: value === allCampaignsValue ? undefined : value,
          })
        }
      >
        <SelectTrigger
          id="brand-payments-campaign"
          size="sm"
          className="h-8 rounded-full border-0 bg-input px-3 text-xs"
        >
          <Megaphone className="size-3 text-muted-foreground" aria-hidden />
          <SelectValue placeholder={t`Todas las campañas`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allCampaignsValue}>
            {t`Todas las campañas`}
          </SelectItem>
          {options.campaigns.map((campaign) => (
            <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
              {campaign.campaign_name ?? t`Campaña sin nombre`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="sr-only" htmlFor="brand-payments-creator">
        {t`Filtrar por creator`}
      </label>
      <Select
        value={filters.creatorId ?? allCreatorsValue}
        onValueChange={(value) =>
          updateFilter({
            creatorId: value === allCreatorsValue ? undefined : value,
          })
        }
      >
        <SelectTrigger
          id="brand-payments-creator"
          size="sm"
          className="h-8 rounded-full border-0 bg-input px-3 text-xs"
        >
          <User className="size-3 text-muted-foreground" aria-hidden />
          <SelectValue placeholder={t`Cualquier creator`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value={allCreatorsValue}
          >{t`Cualquier creator`}</SelectItem>
          {options.creators.map((creator) => (
            <SelectItem
              key={creator.creator_account_id}
              value={creator.creator_account_id}
            >
              {getCreatorLabel(creator)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative w-[260px]">
        <label className="sr-only" htmlFor="brand-payments-search">
          {t`Buscar pagos`}
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="brand-payments-search"
          type="search"
          value={filters.q ?? ''}
          onChange={handleSearchChange}
          placeholder={t`Buscar creator o campaña`}
          className="h-8 rounded-full border-0 bg-input pr-3 pl-8 text-xs"
        />
      </div>
    </div>
  )
}

function getCreatorLabel(
  creator: BrandPaymentsFilterOptions['creators'][number],
): string {
  if (creator.display_name && creator.handle) {
    return `${creator.display_name} (${creator.handle})`
  }
  return creator.display_name ?? creator.handle ?? t`Creator sin nombre`
}
