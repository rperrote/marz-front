import { t } from '@lingui/core/macro'

interface NewMessagesPillProps {
  count: number
  onClick: () => void
}

export function NewMessagesPill({ count, onClick }: NewMessagesPillProps) {
  if (count === 0) return null

  const label = count === 1 ? t`1 mensaje nuevo` : t`${count} mensajes nuevos`

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-in slide-in-from-bottom-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      aria-label={label}
    >
      <span className="mr-1.5">↓</span>
      {label}
    </button>
  )
}
