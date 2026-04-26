import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ApiError } from '#/shared/api/mutator'
import { BriefSummaryView } from '../brief-builder/components/BriefSummaryView'
import { useCampaignBrief } from '../hooks/useCampaignBrief'

function BriefPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function BriefNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p className="text-sm text-muted-foreground">
        No se encontró el brief de esta campaña.
      </p>
      <Button variant="outline" asChild>
        <Link to="/campaigns">Volver a campañas</Link>
      </Button>
    </div>
  )
}

interface CampaignBriefPageProps {
  campaignId: string
}

export function CampaignBriefPage({ campaignId }: CampaignBriefPageProps) {
  const { data, isPending, error } = useCampaignBrief(campaignId)

  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          {data
            ? `Resumen del brief — ${data.campaign_name}`
            : 'Resumen del brief'}
        </h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft />
            Volver a campañas
          </Link>
        </Button>
      </div>

      {isPending && <BriefPageSkeleton />}

      {isNotFound && <BriefNotFound />}

      {error && !isNotFound && (
        <p className="text-sm text-destructive">
          Error al cargar el brief. Intentá de nuevo más tarde.
        </p>
      )}

      {data && (
        <section>
          <h2 className="sr-only">Detalle</h2>
          <BriefSummaryView draft={data.draft} />
        </section>
      )}
    </div>
  )
}
