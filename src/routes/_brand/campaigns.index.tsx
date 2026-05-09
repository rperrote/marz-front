import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
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

  return (
    <div className="p-6">
      <CampaignsEmptyState />
    </div>
  )
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
