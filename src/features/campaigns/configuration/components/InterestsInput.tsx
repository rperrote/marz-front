import { X } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'

interface InterestsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onBlur: () => void
  label: string
  placeholder: string
  error?: string
}

export function InterestsInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  error,
}: InterestsInputProps) {
  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (tag.length === 0 || value.includes(tag)) return
    onChange([...value, tag])
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag))
  }

  return (
    <FieldRow label={label} error={error}>
      {(aria) => (
        <div className="flex flex-col gap-2">
          <Input
            {...aria}
            onBlur={onBlur}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              addTag(event.currentTarget.value)
              event.currentTarget.value = ''
            }}
            placeholder={placeholder}
            className="h-11 rounded-full"
          />
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => removeTag(tag)}
                  aria-label={t`Quitar ${tag}`}
                >
                  {tag}
                  <X className="size-3" aria-hidden="true" />
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </FieldRow>
  )
}
