import { t } from '@lingui/core/macro'

import type { InboxItem, InboxResponse } from './api/inbox'
import { InboxItemRow } from './InboxItemRow'

interface InboxSectionProps {
  accountKind: InboxResponse['account_kind']
  title: string
  description: string
  count: number
  items: InboxItem[]
  tone: 'action' | 'waiting'
}

export function InboxSection({
  accountKind,
  title,
  description,
  count,
  items,
  tone,
}: InboxSectionProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${tone}-title`}>
      <header className="flex items-center gap-2">
        <h2
          id={`${tone}-title`}
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <span
          className={
            tone === 'action'
              ? 'rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'
              : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground'
          }
        >
          {count}
        </span>
        <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
          {description}
        </p>
      </header>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2" role="list">
          {items.map((item) => (
            <InboxItemRow key={item.id} accountKind={accountKind} item={item} />
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">
          {t`No hay items visibles en esta sección.`}
        </div>
      )}
    </section>
  )
}
