import { t } from '@lingui/core/macro'

import type { OfferEventSnapshotV3 } from './offerEventCardUtils'
import {
  formatOfferMode,
  formatPlatforms,
  formatSnapshotAmount,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface OfferEventDetailsProps {
  snapshot: OfferEventSnapshotV3
}

export function OfferEventDetails({ snapshot }: OfferEventDetailsProps) {
  return (
    <dl className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
      <div className="rounded-xl bg-muted px-3 py-2">
        <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t`Tipo`}
        </dt>
        <dd className="mt-0.5 font-semibold">
          {formatOfferMode(snapshot.offer_mode)}
        </dd>
      </div>
      <div className="rounded-xl bg-muted px-3 py-2">
        <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t`Monto`}
        </dt>
        <dd className="mt-0.5 font-semibold">
          {formatSnapshotAmount(snapshot.amount, snapshot.currency)}
        </dd>
      </div>
      <DateDetail label={t`Publicación`} iso={snapshot.tentativePublishDate} />
      <DateDetail label={t`Vencimiento`} iso={snapshot.deadline} />
      <div className="rounded-xl bg-muted px-3 py-2 sm:col-span-2">
        <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t`Plataformas`}
        </dt>
        <dd className="mt-0.5 font-semibold">
          {formatPlatforms(snapshot.platforms)}
        </dd>
      </div>
    </dl>
  )
}

function DateDetail({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">
        {iso ? (
          <time dateTime={iso}>{formatSnapshotDate(iso)}</time>
        ) : (
          t`Sin fecha`
        )}
      </dd>
    </div>
  )
}
