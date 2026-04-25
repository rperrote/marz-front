import type { AnyFormApi } from '@tanstack/react-form'
import { ApiError } from '#/shared/api/mutator'

interface ApplyOptions {
  fallback?: (message: string) => void
}

export function applyBackendFieldErrors(
  form: AnyFormApi,
  error: unknown,
  options: ApplyOptions = {},
): boolean {
  if (!(error instanceof ApiError)) {
    options.fallback?.(extractMessage(error))
    return false
  }

  const fieldErrors = error.details?.field_errors
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    options.fallback?.(error.message)
    return false
  }

  let mapped = 0
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages[0]
    if (!message) continue
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      errorMap: { ...prev.errorMap, onServer: message },
      isTouched: true,
      isBlurred: true,
      isDirty: true,
    }))
    mapped += 1
  }

  if (mapped === 0) {
    options.fallback?.(error.message)
    return false
  }
  return true
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error inesperado'
}
