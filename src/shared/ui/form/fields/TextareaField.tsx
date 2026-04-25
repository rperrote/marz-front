import type { ComponentProps, ReactNode } from 'react'
import { Textarea } from '#/components/ui/textarea'
import { useFieldContext } from '../contexts'
import { FieldRow } from '../components/FieldRow'
import { firstErrorMessage } from '../lib/firstErrorMessage'

type TextareaProps = ComponentProps<typeof Textarea>

interface TextareaFieldProps extends Omit<
  TextareaProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name'
> {
  label?: ReactNode
  hint?: ReactNode
}

export function TextareaField({
  label,
  hint,
  className,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const showError =
    field.state.meta.isBlurred && field.state.meta.errors.length > 0
  const error = showError
    ? firstErrorMessage(field.state.meta.errors)
    : undefined

  return (
    <FieldRow label={label} hint={hint} error={error}>
      {(aria) => (
        <Textarea
          {...aria}
          {...textareaProps}
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
