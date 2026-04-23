import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_creator/offers')({
  component: OffersPlaceholder,
})

function OffersPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Offers</h1>
      <p className="text-muted-foreground mt-2">
        Coming up when the offers context lands.
      </p>
    </div>
  )
}
