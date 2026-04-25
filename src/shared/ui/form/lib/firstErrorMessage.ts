export function firstErrorMessage(
  errors: ReadonlyArray<unknown>,
): string | undefined {
  for (const err of errors) {
    if (err == null) continue
    if (typeof err === 'string') return err
    if (typeof err === 'object' && 'message' in err) {
      const msg = (err as { message: unknown }).message
      if (typeof msg === 'string') return msg
    }
  }
  return undefined
}
