export type MarkAsPaidViewerRole = 'owner' | 'admin' | 'member'

export type MarkAsPaidViewer = {
  kind: 'brand' | 'creator' | undefined
  role: MarkAsPaidViewerRole | undefined
}

export type MarkAsPaidDeliverableStatus =
  | 'pending'
  | 'draft_submitted'
  | 'changes_requested'
  | 'draft_approved'
  | 'link_submitted'
  | 'link_approved'
  | 'completed'
  | 'paid'

export function canMarkDeliverableAsPaid({
  viewer,
  deliverableStatus,
}: {
  viewer: MarkAsPaidViewer
  deliverableStatus: MarkAsPaidDeliverableStatus | undefined
}) {
  return (
    viewer.kind === 'brand' &&
    viewer.role === 'owner' &&
    deliverableStatus === 'completed'
  )
}
