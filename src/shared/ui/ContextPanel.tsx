import type { ReactNode } from 'react'

export function ContextPanel({
  headerSlot,
  offerSlot,
  archiveSlot,
}: {
  headerSlot: ReactNode
  offerSlot?: ReactNode
  archiveSlot?: ReactNode
}) {
  return (
    <aside className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-muted/40 p-3">
      {headerSlot}
      {offerSlot}
      {archiveSlot}
    </aside>
  )
}
