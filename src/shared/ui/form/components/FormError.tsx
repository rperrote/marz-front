import { cn } from '#/lib/utils'
import { useFormContext } from '../contexts'
import { firstErrorMessage } from '../lib/firstErrorMessage'

interface FormErrorProps {
  className?: string
}

export function FormError({ className }: FormErrorProps) {
  const form = useFormContext()
  return (
    <form.Subscribe
      selector={(state) => state.errors as ReadonlyArray<unknown>}
    >
      {(errors) => {
        const message = firstErrorMessage(errors)
        if (!message) return null
        return (
          <p
            role="alert"
            className={cn(
              'text-[length:var(--font-size-sm)] text-destructive',
              className,
            )}
          >
            {message}
          </p>
        )
      }}
    </form.Subscribe>
  )
}
