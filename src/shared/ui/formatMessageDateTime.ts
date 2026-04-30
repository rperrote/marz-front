/**
 * Formats an ISO timestamp for chat timeline display.
 * Uses explicit 'es-AR' locale and medium date + short time to avoid
 * OS/browser locale drift in CI and keep output consistent.
 */
export function formatMessageDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
