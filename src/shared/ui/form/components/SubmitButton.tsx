import type { ComponentProps, ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { useFormContext } from '../contexts'

type ButtonProps = ComponentProps<typeof Button>

interface SubmitButtonProps extends Omit<ButtonProps, 'type' | 'disabled'> {
  label: ReactNode
  loadingLabel?: ReactNode
  requireDirty?: boolean
}

export function SubmitButton({
  label,
  loadingLabel,
  requireDirty = false,
  ...buttonProps
}: SubmitButtonProps) {
  const form = useFormContext()
  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isDirty: state.isDirty,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isDirty, isSubmitting }) => (
        <Button
          {...buttonProps}
          type="submit"
          disabled={!canSubmit || (requireDirty && !isDirty)}
        >
          {isSubmitting && loadingLabel ? loadingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  )
}
