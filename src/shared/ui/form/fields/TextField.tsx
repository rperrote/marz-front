import type { ComponentProps, ReactNode } from 'react'
import { Input } from '#/components/ui/input'
import { useFieldContext } from '../contexts'
import { FieldRow } from '../components/FieldRow'
import { firstErrorMessage } from '../lib/firstErrorMessage'
import { useFieldShouldShowError } from '../lib/useFieldShouldShowError'

type InputProps = ComponentProps<typeof Input>

interface TextFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name'
> {
  label?: ReactNode
  hint?: ReactNode
}

export function TextField({
  label,
  hint,
  type = 'text',
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>()
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
          type={type}
          name={field.name}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className={className}
        />
      )}
    </FieldRow>
  )
}
