import { ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { IconButton } from '#/shared/ui/IconButton'

export interface OfferTerm {
  label: string
  value: string
  /** `accent` = success-colored (for speed bonus etc). */
  tone?: 'default' | 'accent'
}

interface OfferBlockProps {
  /** Title on the left (e.g. "Current Offer"). */
  title: string
  offerId: string
  statusLabel: string
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  terms: Array<OfferTerm>
  /**
   * Section heading above the children — "DELIVERABLES" for single/bundle,
   * "STAGES" for multistage.
   */
  sectionLabel: string
  onToggle?: () => void
  children: ReactNode
}

export function OfferBlock({
  title,
  offerId,
  statusLabel,
  statusVariant = 'default',
  terms,
  sectionLabel,
  onToggle,
  children,
}: OfferBlockProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="font-mono text-xs text-muted-foreground">#{offerId}</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={statusVariant} className="rounded-full">
            {statusLabel}
          </Badge>
          {onToggle ? (
            <IconButton size="sm" shape="circle" aria-label="Collapse offer" onClick={onToggle}>
              <ChevronUp />
            </IconButton>
          ) : null}
        </div>
      </header>

      <dl className="mt-3 space-y-1.5 text-sm">
        {terms.map((term) => (
          <div key={term.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{term.label}</dt>
            <dd
              className={
                term.tone === 'accent'
                  ? 'font-mono font-semibold text-success'
                  : 'font-mono font-semibold text-foreground'
              }
            >
              {term.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {sectionLabel}
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  )
}
