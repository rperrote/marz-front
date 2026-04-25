import type { ComponentProps, ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { useFormContext } from '../contexts'

type ButtonProps = ComponentProps<typeof Button>

interface SubmitButtonProps extends Omit<ButtonProps, 'type' | 'disabled'> {
  label: ReactNode
  loadingLabel?: ReactNode
}

export function SubmitButton({
  label,
  loadingLabel,
  ...buttonProps
}: SubmitButtonProps) {
  const form = useFormContext()
  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }) => (
        <Button {...buttonProps} type="submit" disabled={!canSubmit}>
          {isSubmitting && loadingLabel ? loadingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  )
}
