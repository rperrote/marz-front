import { Trash2, Plus } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { HardFilter } from '../store'

const FILTER_TYPE_OPTIONS = [
  { value: 'min_followers', label: () => t`Mín. seguidores` },
  { value: 'max_followers', label: () => t`Máx. seguidores` },
  { value: 'min_engagement', label: () => t`Mín. engagement %` },
  { value: 'location', label: () => t`Ubicación` },
  { value: 'language', label: () => t`Idioma` },
  { value: 'verified', label: () => t`Verificado` },
] as const

interface HardFilterFormProps {
  filters: HardFilter[]
  onChange: (filters: HardFilter[]) => void
}

export function HardFilterForm({ filters, onChange }: HardFilterFormProps) {
  const addFilter = () => {
    onChange([
      ...filters,
      { id: crypto.randomUUID(), filter_type: '', filter_value: '' },
    ])
  }

  const updateFilter = (index: number, updated: HardFilter) => {
    onChange(filters.map((f, i) => (i === index ? updated : f)))
  }

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {filters.map((filter, idx) => (
        <div key={filter.id} className="flex items-start gap-2">
          <Select
            value={filter.filter_type}
            onValueChange={(val) =>
              updateFilter(idx, { ...filter, filter_type: val })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t`Tipo de filtro`} />
            </SelectTrigger>
            <SelectContent>
              {FILTER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={filter.filter_value}
            onChange={(e) =>
              updateFilter(idx, { ...filter, filter_value: e.target.value })
            }
            placeholder={t`Valor`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeFilter(idx)}
            aria-label={t`Eliminar filtro ${String(idx + 1)}`}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addFilter}
        className="self-start"
      >
        <Plus className="size-3.5" />
        {t`Agregar filtro`}
      </Button>
    </div>
  )
}
