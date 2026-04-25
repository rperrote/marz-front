import type { ComponentProps, ReactNode } from 'react'
import { Switch } from '#/components/ui/switch'
import { useFieldContext } from '../contexts'
import { FieldRow } from '../components/FieldRow'
import { firstErrorMessage } from '../lib/firstErrorMessage'

type SwitchProps = ComponentProps<typeof Switch>

interface SwitchFieldProps extends Omit<
  SwitchProps,
  'checked' | 'onCheckedChange' | 'onBlur' | 'id' | 'name'
> {
  label?: ReactNode
  hint?: ReactNode
}

export function SwitchField({
  label,
  hint,
  className,
  ...switchProps
}: SwitchFieldProps) {
  const field = useFieldContext<boolean>()
  const showError =
    field.state.meta.isBlurred && field.state.meta.errors.length > 0
  const error = showError
    ? firstErrorMessage(field.state.meta.errors)
    : undefined

  return (
    <FieldRow label={label} hint={hint} error={error}>
      {(aria) => (
        <Switch
          {...aria}
          {...switchProps}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(v) => field.handleChange(v)}
          onBlur={field.handleBlur}
          className={className}
        />
      )}
    </FieldRow>
  )
}
