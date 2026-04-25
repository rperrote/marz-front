import type { ComponentProps, ReactNode } from 'react'
import { Input } from '#/components/ui/input'
import { useFieldContext } from '../contexts'
import { FieldRow } from '../components/FieldRow'
import { firstErrorMessage } from '../lib/firstErrorMessage'
import { useFieldShouldShowError } from '../lib/useFieldShouldShowError'

type InputProps = ComponentProps<typeof Input>

interface NumberFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name' | 'type'
> {
  label?: ReactNode
  hint?: ReactNode
}

export function NumberField({
  label,
  hint,
  className,
  ...inputProps
}: NumberFieldProps) {
  const field = useFieldContext<number | null>()
  const showError =
    useFieldShouldShowError(field) && field.state.meta.errors.length > 0
  const error = showError
    ? firstErrorMessage(field.state.meta.errors)
    : undefined

  return (
    <FieldRow label={label} hint={hint} error={error}>
      {(aria) => (
        <Input
          {...aria}
          {...inputProps}
          type="number"
          inputMode="numeric"
          name={field.name}
          value={field.state.value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            field.handleChange(raw === '' ? null : Number(raw))
          }}
          onBlur={field.handleBlur}
          className={className}
        />
      )}
    </FieldRow>
  )
}
