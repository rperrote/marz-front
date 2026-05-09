import { t } from '@lingui/core/macro'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

import type { CampaignBoardSearch } from './search-schema'

const sortOptions = [
  { value: 'match_score_desc', label: t`Match score` },
  { value: 'fee_desc', label: t`Fee más alto` },
  { value: 'deadline_asc', label: t`Cierre más próximo` },
  { value: 'recent_desc', label: t`Más recientes` },
] satisfies Array<{ value: CampaignBoardSearch['sort']; label: string }>

interface CampaignBoardSortProps {
  value: CampaignBoardSearch['sort']
  onChange: (sort: CampaignBoardSearch['sort']) => void
}

export function CampaignBoardSort({ value, onChange }: CampaignBoardSortProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t`Ordenar:`}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={t`Ordenar campañas`}
          size="sm"
          className="h-8 rounded-full border-border bg-card text-xs text-foreground shadow-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
