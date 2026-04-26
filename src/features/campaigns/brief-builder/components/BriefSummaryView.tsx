import type { BriefDraft } from '../store'

const OBJECTIVE_LABELS: Record<string, string> = {
  brand_awareness: 'Brand Awareness',
  conversion: 'Conversión',
  engagement: 'Engagement',
  reach: 'Alcance',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  non_binary: 'No binario',
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

interface BriefSummaryViewProps {
  draft: BriefDraft
}

interface SummarySection {
  title: string
  items: { label: string; value: string }[]
}

function buildSections(draft: BriefDraft): SummarySection[] {
  const sections: SummarySection[] = []

  const campaignItems: { label: string; value: string }[] = []
  if (draft.campaign.name) {
    campaignItems.push({ label: 'Nombre', value: draft.campaign.name })
  }
  if (draft.campaign.objective) {
    campaignItems.push({
      label: 'Objetivo',
      value:
        OBJECTIVE_LABELS[draft.campaign.objective] ?? draft.campaign.objective,
    })
  }
  if (draft.campaign.budget_amount) {
    campaignItems.push({
      label: 'Presupuesto',
      value: `${draft.campaign.budget_currency} ${String(draft.campaign.budget_amount)}`,
    })
  }
  if (draft.campaign.deadline) {
    campaignItems.push({ label: 'Deadline', value: draft.campaign.deadline })
  }
  if (campaignItems.length > 0) {
    sections.push({ title: 'Campaña', items: campaignItems })
  }

  const icpItems: { label: string; value: string }[] = []
  if (draft.brief.icp_description) {
    icpItems.push({ label: 'Descripción', value: draft.brief.icp_description })
  }
  if (draft.brief.icp_age_min != null || draft.brief.icp_age_max != null) {
    const min = draft.brief.icp_age_min ?? '—'
    const max = draft.brief.icp_age_max ?? '—'
    icpItems.push({
      label: 'Rango de edad',
      value: `${String(min)} – ${String(max)}`,
    })
  }
  if (draft.brief.icp_genders.length > 0) {
    icpItems.push({
      label: 'Géneros',
      value: draft.brief.icp_genders
        .map((g) => GENDER_LABELS[g] ?? g)
        .join(', '),
    })
  }
  if (draft.brief.icp_countries.length > 0) {
    icpItems.push({
      label: 'Países',
      value: draft.brief.icp_countries.join(', '),
    })
  }
  if (draft.brief.icp_platforms.length > 0) {
    icpItems.push({
      label: 'Plataformas',
      value: draft.brief.icp_platforms
        .map((p) => PLATFORM_LABELS[p] ?? p)
        .join(', '),
    })
  }
  if (draft.brief.icp_interests.length > 0) {
    icpItems.push({
      label: 'Intereses',
      value: draft.brief.icp_interests.join(', '),
    })
  }
  if (icpItems.length > 0) {
    sections.push({ title: 'ICP', items: icpItems })
  }

  if (draft.brief.scoring_dimensions.length > 0) {
    sections.push({
      title: 'Scoring Dimensions',
      items: draft.brief.scoring_dimensions.map((d) => ({
        label: d.name,
        value: `${String(d.weight_pct)}% — ${d.description || '—'}`,
      })),
    })
  }

  if (draft.brief.hard_filters.length > 0) {
    sections.push({
      title: 'Hard Filters',
      items: draft.brief.hard_filters.map((f) => ({
        label: f.filter_type,
        value: f.filter_value,
      })),
    })
  }

  if (draft.brief.disqualifiers.length > 0) {
    sections.push({
      title: 'Disqualifiers',
      items: draft.brief.disqualifiers.map((d) => ({
        label: 'Disqualifier',
        value: d,
      })),
    })
  }

  return sections
}

export function BriefSummaryView({ draft }: BriefSummaryViewProps) {
  const sections = buildSections(draft)

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos disponibles en el brief.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {section.title}
          </h3>
          <div className="flex flex-col gap-2">
            {section.items.map((item, i) => (
              <div
                key={`${item.label}-${String(i)}`}
                className="flex flex-col gap-0.5"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
