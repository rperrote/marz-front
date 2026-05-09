import { Search, X } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { cn } from '#/lib/utils'

const COUNTRY_OPTIONS = [
  { code: 'AR', label: () => t`Argentina` },
  { code: 'BO', label: () => t`Bolivia` },
  { code: 'BR', label: () => t`Brasil` },
  { code: 'CL', label: () => t`Chile` },
  { code: 'CO', label: () => t`Colombia` },
  { code: 'MX', label: () => t`México` },
  { code: 'PE', label: () => t`Perú` },
  { code: 'UY', label: () => t`Uruguay` },
  { code: 'US', label: () => t`Estados Unidos` },
  { code: 'ES', label: () => t`España` },
] as const

interface CountryMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  onBlur: () => void
  label: string
  error?: string
}

export function CountryMultiSelect({
  value,
  onChange,
  onBlur,
  label,
  error,
}: CountryMultiSelectProps) {
  const selected = new Set(value)

  const addCountry = (raw: string) => {
    const code = raw.trim().toUpperCase()
    if (code.length === 0 || selected.has(code)) return
    onChange([...value, code])
  }

  const removeCountry = (code: string) => {
    onChange(value.filter((item) => item !== code))
  }

  return (
    <FieldRow label={label} error={error}>
      {(aria) => (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              {...aria}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                addCountry(event.currentTarget.value)
                event.currentTarget.value = ''
              }}
              placeholder={t`Agregar países...`}
              className="h-11 rounded-full pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((country) => {
              const isSelected = selected.has(country.code)
              return (
                <Button
                  key={country.code}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-full',
                    isSelected && 'text-primary-foreground',
                  )}
                  onClick={() =>
                    isSelected
                      ? removeCountry(country.code)
                      : onChange([...value, country.code])
                  }
                  aria-pressed={isSelected}
                >
                  {country.label()}
                </Button>
              )
            })}
            {value
              .filter(
                (code) =>
                  !COUNTRY_OPTIONS.some((country) => country.code === code),
              )
              .map((code) => (
                <Button
                  key={code}
                  type="button"
                  variant="default"
                  size="sm"
                  className="rounded-full text-primary-foreground"
                  onClick={() => removeCountry(code)}
                  aria-label={t`Quitar país ${code}`}
                >
                  {code}
                  <X className="size-3" aria-hidden="true" />
                </Button>
              ))}
          </div>
        </div>
      )}
    </FieldRow>
  )
}
