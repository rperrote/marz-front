import { Plus, Trash2, Zap } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'

interface BonusTermsFieldsProps {
  children: ReactNode
  onAdd: () => void
}

export function BonusTermsFields({ children, onAdd }: BonusTermsFieldsProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-muted p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Zap className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {t`Speed Bonus`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t`Reward creators for delivering within a set number of hours.`}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-2 size-4" />
          {t`Add window`}
        </Button>
      </header>

      <div className="space-y-3">{children}</div>
    </section>
  )
}

interface BonusWindowRowProps {
  index: number
  onRemove: () => void
  children: ReactNode
}

export function BonusWindowRow({
  index,
  onRemove,
  children,
}: BonusWindowRowProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          {t`Window ${index + 1}`}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t`Remove window ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}
