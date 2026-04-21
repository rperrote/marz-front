import type { ReactNode } from 'react'

/**
 * Dark pill tooltip — visual presentation only (no positioning). Use inside
 * a radix Tooltip when it's a floater, or as a standalone label chip.
 *
 * In light theme: dark bg, light text. In dark theme: inverts to light bg,
 * dark text (keeps the "contrast pill" intent).
 */
export function DarkTooltip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
      {children}
    </span>
  )
}
