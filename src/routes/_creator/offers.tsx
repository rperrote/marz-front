import { createFileRoute } from '@tanstack/react-router'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'

export const Route = createFileRoute('/_creator/offers')({
  component: OffersPlaceholder,
})

const offersTopbarConfig = {
  title: 'Offers',
}

function OffersPlaceholder() {
  useRouteTopbar(offersTopbarConfig)

  return (
    <div className="p-6">
      <p className="text-muted-foreground mt-2">
        Coming up when the offers context lands.
      </p>
    </div>
  )
}
