import { Check } from 'lucide-react'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'

const OBJECTIVE_LABELS: Record<string, string> = {
  brand_awareness: 'Brand Awareness',
  conversion: 'Conversión',
  engagement: 'Engagement',
  reach: 'Alcance',
}

export function P4Confirm() {
  const store = useBriefBuilderStore()
  const draft = store.briefDraft

  if (!draft) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <WizardSectionTitle
          title="Sin brief disponible"
          subtitle="Volvé al paso anterior para completar la información."
        />
      </div>
    )
  }

  const summaryItems = [
    { label: 'Nombre', value: draft.campaign.name },
    {
      label: 'Objetivo',
      value:
        OBJECTIVE_LABELS[draft.campaign.objective] ?? draft.campaign.objective,
    },
    {
      label: 'Presupuesto',
      value: draft.campaign.budget_amount
        ? `${draft.campaign.budget_currency} ${String(draft.campaign.budget_amount)}`
        : '',
    },
    { label: 'Deadline', value: draft.campaign.deadline },
    { label: 'ICP', value: draft.brief.icp_description ?? '' },
    {
      label: 'Plataformas',
      value: draft.brief.icp_platforms.join(', '),
    },
    {
      label: 'Scoring Dimensions',
      value: draft.brief.scoring_dimensions
        .map((d) => `${d.name} (${String(d.weight_pct)}%)`)
        .join(', '),
    },
  ].filter((item) => item.value.length > 0)

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title="Confirmá tu campaña"
        subtitle="Revisá el resumen antes de crear la campaña."
      />
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="size-4 text-primary" />
        <span>Al confirmar se creará la campaña como borrador.</span>
      </div>
    </div>
  )
}
