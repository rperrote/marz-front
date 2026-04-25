import { useId } from 'react'
import type { ReactNode } from 'react'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

export interface FieldRowAriaProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

interface FieldRowProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  children: (aria: FieldRowAriaProps) => ReactNode
  className?: string
}

export function FieldRow({
  label,
  hint,
  error,
  children,
  className,
}: FieldRowProps) {
  const controlId = useId()
  const errorId = useId()
  const hintId = useId()

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {label ? (
        <Label
          htmlFor={controlId}
          className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground"
        >
          {label}
        </Label>
      ) : null}
      {children({
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p
          id={hintId}
          className="text-[length:var(--font-size-xs)] text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
