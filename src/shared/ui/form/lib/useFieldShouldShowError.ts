import { useStore } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/react-form'

export function useFieldShouldShowError(field: AnyFieldApi): boolean {
  const isBlurred = useStore(field.store, (s) => s.meta.isBlurred)
  const submissionAttempts = useStore(
    field.form.store,
    (s) => s.submissionAttempts,
  )
  return isBlurred || submissionAttempts > 0
}
