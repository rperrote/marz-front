import { Plus, Trash2, X as XIcon, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { IconButton } from '#/shared/ui/IconButton'

import { BundlePlatformRow } from './BundlePlatformRow'
import { DeadlineField } from './DeadlineField'
import { OfferTypeChooser  } from './OfferTypeChooser'
import type {OfferType} from './OfferTypeChooser';
import { StageEditor } from './StageEditor'
import { SummaryTotalRow } from './SummaryTotalRow'

/**
 * Full send-offer form. Mode determines which body the form shows:
 *   - single: main platform + replica chips + budget/deadline + speed bonus
 *   - bundle: list of per-platform rows with total + deadline + speed bonus
 *   - multistage: list of StageEditors + campaign total
 *
 * The DS preview uses mock state; wiring to a real form/store lands with the
 * send-offer feature.
 */
interface SendOfferSidesheetProps {
  creatorName: string
  mode: OfferType
  onChangeMode?: (mode: OfferType) => void
  onCancel?: () => void
  onSubmit?: () => void
  children: ReactNode
}

export function SendOfferSidesheet({
  creatorName,
  mode,
  onChangeMode,
  onCancel,
  onSubmit,
  children,
}: SendOfferSidesheetProps) {
  return (
    <div className="flex max-w-xl flex-col rounded-2xl border border-border bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Send Offer</h2>
          <p className="text-sm text-muted-foreground">To {creatorName}</p>
        </div>
        <IconButton shape="circle" aria-label="Close" onClick={onCancel}>
          <XIcon />
        </IconButton>
      </header>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Offer Type</Label>
          <OfferTypeChooser value={mode} onChange={onChangeMode} />
        </div>

        {children}
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-border p-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Send Offer</Button>
      </footer>
    </div>
  )
}

export interface SpeedBonusTier {
  id: string
  /** Within N units. */
  value: number
  unit: 'hours' | 'days'
  /** Reward mode: percent of budget or absolute amount. */
  mode: 'percent' | 'amount'
  amount: number
}

export function SpeedBonusBlock({
  enabled,
  onToggle,
  tiers,
  onAddTier,
  onRemoveTier,
}: {
  enabled: boolean
  onToggle?: (enabled: boolean) => void
  tiers: Array<SpeedBonusTier>
  onAddTier?: () => void
  onRemoveTier?: (id: string) => void
}) {
  return (
    <section className="rounded-2xl bg-muted p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-warning" />
          <span className="text-base font-semibold text-foreground">Speed Bonus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Reward faster delivery</span>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </header>

      {enabled ? (
        <div className="mt-3 space-y-2">
          {tiers.map((tier) => (
            <TierRow key={tier.id} tier={tier} onRemove={() => onRemoveTier?.(tier.id)} />
          ))}
          <button
            type="button"
            onClick={onAddTier}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:bg-surface-hover"
          >
            <Plus className="size-4" />
            Add bonus tier
          </button>
        </div>
      ) : null}
    </section>
  )
}

function TierRow({ tier, onRemove }: { tier: SpeedBonusTier; onRemove?: () => void }) {
  const reward =
    tier.mode === 'percent' ? `+ ${tier.amount}%` : `+$ ${tier.amount}`
  return (
    <div className="flex items-center gap-3 rounded-full bg-background px-3 py-1.5">
      <span className="text-sm text-muted-foreground">Within</span>
      <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
        {tier.value}
      </span>
      <span className="text-sm text-muted-foreground">{tier.unit}</span>
      <div className="ml-auto flex items-center gap-1 rounded-full bg-muted p-1">
        <ModeToggle active={tier.mode === 'percent'} label="%" />
        <ModeToggle active={tier.mode === 'amount'} label="$" />
      </div>
      <span className="font-mono text-sm font-semibold text-success">{reward}</span>
      <IconButton size="sm" aria-label="Remove tier" onClick={onRemove}>
        <Trash2 />
      </IconButton>
    </div>
  )
}

function ModeToggle({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? 'flex size-6 items-center justify-center rounded-full bg-background font-mono text-xs font-semibold'
          : 'flex size-6 items-center justify-center rounded-full font-mono text-xs text-muted-foreground'
      }
    >
      {label}
    </span>
  )
}

/** Convenience exports of row primitives used to compose modes in /ds. */
export { BundlePlatformRow, DeadlineField, StageEditor, SummaryTotalRow }
