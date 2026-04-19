import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_brand/campaigns')({
  component: CampaignsPlaceholder,
})

function CampaignsPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Campaigns</h1>
      <p className="text-muted-foreground mt-2">Coming up in FEAT-001.</p>
    </div>
  )
}
