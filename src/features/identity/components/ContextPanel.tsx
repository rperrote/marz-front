import type { ReactNode } from 'react'

/**
 * Vertical panel that sits on the right of a chat/workspace view. Pure layout
 * container — consumers pass:
 *   - `headerSlot` (BrandHeaderCard or CreatorHeaderCard)
 *   - `offerSlot`  (OfferBlock with deliverables or stages inside)
 *   - `archiveSlot` (ArchivedOffersList, optional)
 *
 * This panel is used by both sides: brand side renders `CreatorHeaderCard`
 * + offer (showing the creator at the top); creator side renders
 * `BrandHeaderCard` + offer (showing the brand at the top). Same structure,
 * different subject — matching the `.pen`'s BrandContextPanel/V2 and
 * CreatorContextPanel.
 */
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
