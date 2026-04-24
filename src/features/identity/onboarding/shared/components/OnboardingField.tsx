import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement, useId } from 'react'
import { cn } from '#/lib/utils'

interface OnboardingFieldProps {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function OnboardingField({
  label,
  hint,
  error,
  children,
  className,
}: OnboardingFieldProps) {
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()

  const child = Children.only(children)
  const enhancedChild = isValidElement(child)
    ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        id: inputId,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
      })
    : child

  return (
    <div className={cn('flex max-w-[440px] flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground"
      >
        {label}
      </label>
      {enhancedChild}
      {error && (
        <p
          id={errorId}
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p
          id={hintId}
          className="text-[length:var(--font-size-xs)] text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  )
}
