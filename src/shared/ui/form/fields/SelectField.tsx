import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useFieldContext } from '../contexts'
import { FieldRow } from '../components/FieldRow'
import { firstErrorMessage } from '../lib/firstErrorMessage'

interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

interface SelectFieldProps {
  label?: ReactNode
  hint?: ReactNode
  placeholder?: string
  options: ReadonlyArray<SelectOption>
  className?: string
  triggerClassName?: string
}

export function SelectField({
  label,
  hint,
  placeholder,
  options,
  className,
  triggerClassName,
}: SelectFieldProps) {
  const field = useFieldContext<string>()
  const showError =
    field.state.meta.isBlurred && field.state.meta.errors.length > 0
  const error = showError
    ? firstErrorMessage(field.state.meta.errors)
    : undefined

  return (
    <FieldRow label={label} hint={hint} error={error} className={className}>
      {(aria) => (
        <Select
          name={field.name}
          value={field.state.value}
          onValueChange={(v) => {
            field.handleChange(v)
            field.handleBlur()
          }}
        >
          <SelectTrigger
            id={aria.id}
            aria-describedby={aria['aria-describedby']}
            aria-invalid={aria['aria-invalid']}
            className={triggerClassName ?? 'w-full'}
            onBlur={field.handleBlur}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldRow>
  )
}
