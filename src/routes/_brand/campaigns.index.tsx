import { t } from '@lingui/core/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { CampaignMiniCard } from '#/features/campaigns/components/CampaignMiniCard'
import { useCampaignsList } from '#/features/campaigns/hooks/useCampaignsList'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'

export const Route = createFileRoute('/_brand/campaigns/')({
  component: CampaignsPage,
})

const campaignsTopbarConfig = {
  title: 'Campaigns',
  actions: (
    <Button asChild>
      <Link to="/campaigns/new">
        <Plus className="size-4" />
        Nueva campaña
      </Link>
    </Button>
  ),
}

function CampaignsPage() {
  useRouteTopbar(campaignsTopbarConfig)

  const campaignsQuery = useCampaignsList()
  const campaigns = campaignsQuery.data ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="size-4" />
            Nueva campaña
          </Link>
        </Button>
      </div>

      {campaignsQuery.isLoading ? (
        <div className="mt-24 text-center text-sm text-muted-foreground">
          {t`Cargando campañas...`}
        </div>
      ) : campaignsQuery.isError ? (
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-sm text-destructive">
            {t`No pudimos cargar tus campañas. Intentá de nuevo.`}
          </p>
          <Button
            variant="outline"
            onClick={() => void campaignsQuery.refetch()}
          >
            {t`Reintentar`}
          </Button>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignMiniCard
              key={campaign.id}
              campaignId={campaign.id}
              name={campaign.name}
              startDate={formatCampaignDate(campaign.startDate)}
              status={campaign.status}
              creators={campaign.creators}
              budget={campaign.budget}
              videos={campaign.videos}
              platforms={campaign.platforms}
              configurationComplete={campaign.configurationComplete}
              configurationCurrentStep={campaign.configurationCurrentStep}
            />
          ))}
        </div>
      ) : (
        <CampaignsEmptyState />
      )}
    </div>
  )
}

function formatCampaignDate(value: string | null) {
  if (!value) return t`Sin fecha`

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function CampaignsEmptyState() {
  return (
    <div className="mt-24 flex flex-col items-center gap-4 text-center">
      <h2 className="text-lg font-medium text-foreground">
        Todavía no tenés campañas
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Creá tu primera campaña para empezar a conectar con creadores y lanzar
        tu estrategia de influencer marketing.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link to="/campaigns/new">
          <Plus className="size-4" />
          Crear campaña
        </Link>
      </Button>
    </div>
  )
}
