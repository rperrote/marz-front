import { BriefcaseBusiness } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'

export const Route = createFileRoute('/_creator/offers')({
  component: OffersPlaceholder,
})

function OffersPlaceholder() {
  const offersTopbarConfig = {
    breadcrumb: [{ icon: BriefcaseBusiness, label: t`Offers` }],
  }
  useRouteTopbar(offersTopbarConfig)

  return (
    <div className="p-6">
      <p className="text-muted-foreground mt-2">
        <Trans>Coming up when the offers context lands.</Trans>
      </p>
    </div>
  )
}
