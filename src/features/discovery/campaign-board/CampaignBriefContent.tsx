import { t } from '@lingui/core/macro'
import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import type {
  CampaignBoardBriefSnapshot,
  CampaignBoardCommercialSnapshot,
  CampaignBoardTargetingSnapshot,
  CreatorCampaignBoardCard,
} from '#/shared/api/generated/model'

type SnapshotRecord = Record<string, unknown>

interface CampaignBriefContentProps {
  card: CreatorCampaignBoardCard
  brief: CampaignBoardBriefSnapshot
  targeting: CampaignBoardTargetingSnapshot
  commercial: CampaignBoardCommercialSnapshot
}

interface IcpSnapshot {
  description: string | null
  age_min: number | null
  age_max: number | null
  genders: string[]
  countries: string[]
  platforms: string[]
  interests: string[]
}

interface ScoringDimensionSnapshot {
  name: string
  description: string | null
  weight_pct: number
  positive_signals: string[]
  negative_signals: string[]
}

interface DeliverableSnapshot {
  platform: string
  format: string
  quantity: number
  description: string | null
}

function asRecord(value: unknown): SnapshotRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return value as SnapshotRecord
}

function stringValue(record: SnapshotRecord, key: string): string | null {
  const value = record[key]
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function numberValue(record: SnapshotRecord, key: string): number | null {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringList(record: SnapshotRecord, key: string): string[] {
  const value = record[key]
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item !== 'string') return []
    const trimmed = item.trim()
    return trimmed.length > 0 ? [trimmed] : []
  })
}

function objectList(record: SnapshotRecord, key: string): SnapshotRecord[] {
  const value = record[key]
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return []
    }

    return [item as SnapshotRecord]
  })
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatAmount(value: string | null) {
  if (!value) return null
  return value.startsWith('USD') ? value : `USD ${value}`
}

function formatFee(commercial: SnapshotRecord) {
  const label = stringValue(commercial, 'fee_label')
  if (label) return label

  const min = formatAmount(stringValue(commercial, 'fee_min_amount'))
  const max = formatAmount(stringValue(commercial, 'fee_max_amount'))
  if (min && max) return `${min} - ${max}`
  return min ?? max ?? t`Fee a definir`
}

function formatAgeRange(icp: IcpSnapshot, targeting: SnapshotRecord) {
  const min = icp.age_min ?? numberValue(targeting, 'age_min')
  const max = icp.age_max ?? numberValue(targeting, 'age_max')

  if (min && max) return t`${min} a ${max} años`
  if (min) return t`Desde ${min} años`
  if (max) return t`Hasta ${max} años`
  return null
}

function normalizeIcp(brief: SnapshotRecord): IcpSnapshot {
  const icp = asRecord(brief.icp)

  return {
    description: stringValue(icp, 'description'),
    age_min: numberValue(icp, 'age_min'),
    age_max: numberValue(icp, 'age_max'),
    genders: stringList(icp, 'genders'),
    countries: stringList(icp, 'countries'),
    platforms: stringList(icp, 'platforms'),
    interests: stringList(icp, 'interests'),
  }
}

function normalizeScoringDimensions(
  brief: SnapshotRecord,
): ScoringDimensionSnapshot[] {
  return objectList(brief, 'scoring_dimensions').flatMap((dimension) => {
    const name = stringValue(dimension, 'name')
    const weight = numberValue(dimension, 'weight_pct')
    if (!name || weight === null) return []

    return [
      {
        name,
        description: stringValue(dimension, 'description'),
        weight_pct: weight,
        positive_signals: stringList(dimension, 'positive_signals'),
        negative_signals: stringList(dimension, 'negative_signals'),
      },
    ]
  })
}

function normalizeDeliverables(card: CreatorCampaignBoardCard) {
  return objectList(asRecord(card.campaign), 'deliverables').flatMap(
    (deliverable): DeliverableSnapshot[] => {
      const platform = stringValue(deliverable, 'platform')
      const format = stringValue(deliverable, 'format')
      const quantity = numberValue(deliverable, 'quantity')

      if (!platform || !format || quantity === null) return []

      return [
        {
          platform,
          format,
          quantity,
          description: stringValue(deliverable, 'description'),
        },
      ]
    },
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function EmptyText() {
  return <p className="text-sm text-muted-foreground">{t`Sin información.`}</p>
}

function TextBlock({ value }: { value: string | null }) {
  if (!value) return <EmptyText />

  return <p className="text-sm leading-6 text-muted-foreground">{value}</p>
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyText />

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2 leading-6">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyText />

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className="rounded-full px-2.5 py-1"
        >
          {formatLabel(item)}
        </Badge>
      ))}
    </div>
  )
}

function DoDontLists({
  doList,
  dontList,
}: {
  doList: string[]
  dontList: string[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          {t`Do`}
        </p>
        <BulletList items={doList} />
      </div>
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          {t`Don't`}
        </p>
        <BulletList items={dontList} />
      </div>
    </div>
  )
}

function DeliverablesList({
  deliverables,
}: {
  deliverables: DeliverableSnapshot[]
}) {
  if (deliverables.length === 0) return <EmptyText />

  return (
    <div className="space-y-3">
      {deliverables.map((deliverable, index) => (
        <div
          key={`${deliverable.platform}-${deliverable.format}-${deliverable.quantity}-${index}`}
          className="rounded-2xl border border-border p-4"
        >
          <p className="text-sm font-semibold text-foreground">
            {t`${deliverable.quantity}x ${formatLabel(deliverable.platform)} · ${formatLabel(deliverable.format)}`}
          </p>
          {deliverable.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {deliverable.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ScoringDimensionsList({
  dimensions,
}: {
  dimensions: ScoringDimensionSnapshot[]
}) {
  if (dimensions.length === 0) return <EmptyText />

  return (
    <div className="space-y-3">
      {dimensions.map((dimension) => (
        <div
          key={dimension.name}
          className="space-y-3 rounded-2xl border border-border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {dimension.name}
              </p>
              {dimension.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {dimension.description}
                </p>
              ) : null}
            </div>
            <Badge variant="secondary" className="rounded-full">
              {t`${dimension.weight_pct}%`}
            </Badge>
          </div>
          {dimension.positive_signals.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t`Señales positivas`}
              </p>
              <BulletList items={dimension.positive_signals} />
            </div>
          ) : null}
          {dimension.negative_signals.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t`Señales negativas`}
              </p>
              <BulletList items={dimension.negative_signals} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function MatchTransparency({ card }: { card: CreatorCampaignBoardCard }) {
  if (card.match.recommended || card.match.mismatch_reasons.length === 0) {
    return null
  }

  return (
    <Section title={t`Por qué no aparece como recomendada`}>
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <BulletList items={card.match.mismatch_reasons} />
      </div>
    </Section>
  )
}

export function CampaignBriefContent({
  card,
  brief,
  targeting,
  commercial,
}: CampaignBriefContentProps) {
  const briefRecord = asRecord(brief)
  const targetingRecord = asRecord(targeting)
  const commercialRecord = asRecord(commercial)
  const icp = normalizeIcp(briefRecord)
  const deliverables = normalizeDeliverables(card)
  const scoringDimensions = normalizeScoringDimensions(briefRecord)
  const ageRange = formatAgeRange(icp, targetingRecord)
  const targetingCountries = stringList(targetingRecord, 'countries')
  const targetingInterests = stringList(targetingRecord, 'interests')
  const targetingLanguages = stringList(targetingRecord, 'content_languages')
  const targetingPlatforms = stringList(targetingRecord, 'platforms')
  const pricingNotes = stringValue(commercialRecord, 'pricing_notes')
  const disqualifiers = stringList(briefRecord, 'disqualifiers')

  return (
    <div className="space-y-6">
      <Section title={t`Descripción`}>
        <TextBlock value={stringValue(briefRecord, 'description')} />
      </Section>

      <Section title={t`Tono`}>
        <TextBlock value={stringValue(briefRecord, 'tone')} />
      </Section>

      <Section title={t`Mensajes clave`}>
        <BulletList items={stringList(briefRecord, 'key_messages')} />
      </Section>

      <Section title={t`Do / Don't`}>
        <DoDontLists
          doList={stringList(briefRecord, 'do_list')}
          dontList={stringList(briefRecord, 'dont_list')}
        />
      </Section>

      <Section title={t`ICP`}>
        <div className="space-y-4 rounded-2xl border border-border p-4">
          <TextBlock value={icp.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {t`Edad`}
              </p>
              <TextBlock value={ageRange} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {t`Géneros`}
              </p>
              <ChipList items={icp.genders} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t`Países`}
            </p>
            <ChipList
              items={
                icp.countries.length > 0 ? icp.countries : targetingCountries
              }
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t`Plataformas`}
            </p>
            <ChipList
              items={
                icp.platforms.length > 0 ? icp.platforms : targetingPlatforms
              }
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t`Intereses`}
            </p>
            <ChipList
              items={
                icp.interests.length > 0 ? icp.interests : targetingInterests
              }
            />
          </div>
          {targetingLanguages.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {t`Idiomas del contenido`}
              </p>
              <ChipList items={targetingLanguages} />
            </div>
          ) : null}
        </div>
      </Section>

      <Section title={t`Dimensiones de scoring`}>
        <ScoringDimensionsList dimensions={scoringDimensions} />
      </Section>

      {disqualifiers.length > 0 ? (
        <Section title={t`Descalificadores`}>
          <BulletList items={disqualifiers} />
        </Section>
      ) : null}

      <MatchTransparency card={card} />

      <Section title={t`Deliverables`}>
        <DeliverablesList deliverables={deliverables} />
      </Section>

      <Section title={t`Comercial`}>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">
            {formatFee(commercialRecord)}
          </p>
          {pricingNotes ? (
            <>
              <Separator className="my-3" />
              <p className="text-sm leading-6 text-muted-foreground">
                {pricingNotes}
              </p>
            </>
          ) : null}
        </div>
      </Section>
    </div>
  )
}
