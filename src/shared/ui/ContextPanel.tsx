import type { ReactNode } from 'react'

export function ContextPanel({
  headerSlot,
  nextStepSlot,
  offerSlot,
  archiveSlot,
  errorSlot,
}: {
  headerSlot?: ReactNode
  nextStepSlot?: ReactNode
  offerSlot?: ReactNode
  archiveSlot?: ReactNode
  errorSlot?: ReactNode
}) {
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col gap-3 overflow-y-auto bg-muted p-4">
      {headerSlot}
      {nextStepSlot}
      {offerSlot}
      {archiveSlot}
      {errorSlot}
    </aside>
  )
}
