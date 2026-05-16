import { t } from '@lingui/core/macro'

import type { OfferBonusTermsFormValues } from '../schemas/createOffer'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

interface OfferSummaryProps {
  offerMode: 'same_content' | 'per_platform'
  amount: number
  bonusTerms?: OfferBonusTermsFormValues
}

export function getMaxPayout(
  amount: number,
  bonusTerms?: OfferBonusTermsFormValues,
) {
  if (!bonusTerms?.enabled) return amount

  return bonusTerms.speed_bonus_windows.reduce((total, window) => {
    if (window.bonus_amount.type === 'fixed') {
      return total + window.bonus_amount.amount_usd
    }

    return total + amount * (window.bonus_amount.value / 100)
  }, amount)
}

export function formatUsd(amount: number) {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function OfferSummary({
  offerMode,
  amount,
  bonusTerms,
}: OfferSummaryProps) {
  const baseAmount = Number.isFinite(amount) ? amount : 0
  const maxPayout = getMaxPayout(baseAmount, bonusTerms)
  const bonusCeiling = Math.max(maxPayout - baseAmount, 0)
  const bonusRatio = baseAmount > 0 ? bonusCeiling / baseAmount : 0
  const modeLabel =
    offerMode === 'same_content' ? t`mismo contenido` : t`por plataforma`

  return (
    <section className="rounded-2xl bg-accent p-4 text-accent-foreground">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[length:var(--font-size-sm)] font-semibold">
          {t`Resumen de la oferta`}
        </h3>
        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-[length:var(--font-size-xs)] font-medium text-primary-foreground">
          {modeLabel}
        </span>
      </header>

      <dl className="mt-4 space-y-2 text-[length:var(--font-size-sm)]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-accent-foreground/70">{t`Monto base`}</dt>
          <dd className="font-mono font-medium">{formatUsd(baseAmount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-accent-foreground/70">{t`Bonos máximos`}</dt>
          <dd className="font-mono font-medium">
            {bonusCeiling > 0
              ? `+${percentFormatter.format(bonusRatio)} · ${formatUsd(bonusCeiling)}`
              : formatUsd(0)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <dt className="font-semibold">
            {t`Payout máximo si aplican todos los bonos`}
          </dt>
          <dd className="font-mono text-[length:var(--font-size-xl)] font-bold text-primary">
            {formatUsd(maxPayout)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
