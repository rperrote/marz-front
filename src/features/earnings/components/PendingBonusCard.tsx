import { useEffect, useMemo, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Timer, Zap } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { CreatorPendingBonus } from '#/shared/api/generated/model'
import { trackEarningsBonusOpened } from '../analytics'

export type PendingBonusCardBonus = Omit<CreatorPendingBonus, 'type'> & {
  type: string
}

interface PendingBonusCardProps {
  bonus: PendingBonusCardBonus
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const urgentCountdownThresholdSeconds = 24 * 60 * 60

export function PendingBonusCard({ bonus }: PendingBonusCardProps) {
  const secondsRemaining = useBonusSecondsRemaining(bonus)
  const countdownLabel = formatCountdown(secondsRemaining)
  const brandName = bonus.brand_name ?? t`Brand`
  const campaignName = bonus.campaign_name ?? t`Campaign`
  const deliverableLabel = bonus.deliverable_label ?? t`Deliverable`
  const windowHours = formatHours(bonus.window_hours)
  const bonusPercent = formatPercent(bonus.bonus_pct)
  const isUrgent = secondsRemaining <= urgentCountdownThresholdSeconds

  function handleOpenBonus() {
    trackEarningsBonusOpened({
      bonus_id: bonus.id,
      offer_id: bonus.offer_id,
      conversation_id: bonus.conversation_id,
    })
  }

  return (
    <article
      className={cn(
        'rounded-2xl border bg-muted/45 p-4 text-card-foreground',
        isUrgent ? 'border-warning' : 'border-border',
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          {bonus.brand_logo_url ? (
            <AvatarImage src={bonus.brand_logo_url} alt="" />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getBrandInitials(brandName)}
          </AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
          {brandName} · {campaignName} · {deliverableLabel}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/50 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
          <Zap className="size-3" aria-hidden="true" />
          <Trans>Speed bonus</Trans>
        </span>
        <p className="min-w-0 flex-1 text-right text-lg leading-tight font-bold tracking-normal text-foreground">
          +{formatMoney(bonus.estimated_bonus_amount)}
        </p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        <Trans>
          Publish in the next {windowHours} to earn a {bonusPercent} speed
          bonus.
        </Trans>
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex min-w-[12ch] flex-1 items-center gap-1 font-mono text-xs font-semibold tabular-nums',
            isUrgent ? 'text-warning' : 'text-muted-foreground',
          )}
          aria-label={t`Time remaining ${countdownLabel}`}
        >
          <Timer className="size-3 shrink-0" aria-hidden="true" />
          <span>{countdownLabel}</span>
        </div>
        <Button className="w-full rounded-full sm:w-auto" size="sm" asChild>
          <Link to={bonus.action.href} onClick={handleOpenBonus}>
            <Trans>Ver oferta</Trans>
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

function useBonusSecondsRemaining(bonus: PendingBonusCardBonus) {
  const initialSeconds = useMemo(
    () => getSecondsRemaining(bonus),
    [bonus.id, bonus.seconds_remaining, bonus.starts_at, bonus.expires_at],
  )
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds)

  useEffect(() => {
    setSecondsRemaining(getSecondsRemaining(bonus))

    const intervalId = window.setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(bonus))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [bonus.id, bonus.seconds_remaining, bonus.starts_at, bonus.expires_at])

  return secondsRemaining
}

function getSecondsRemaining(bonus: PendingBonusCardBonus, now = Date.now()) {
  if (bonus.seconds_remaining > 0) {
    const elapsedSeconds = Math.floor(
      (now - Date.parse(bonus.starts_at)) / 1000,
    )

    return Math.max(bonus.seconds_remaining - Math.max(elapsedSeconds, 0), 0)
  }

  return Math.max(Math.ceil((Date.parse(bonus.expires_at) - now) / 1000), 0)
}

function formatCountdown(seconds: number) {
  if (seconds <= 0) {
    return t`Expired`
  }

  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const secondsPart = seconds % 60

  if (days > 0) {
    const hoursLabel = hours.toString().padStart(2, '0')
    return t`${days}d ${hoursLabel}h`
  }

  const hoursLabel = hours.toString().padStart(2, '0')
  const minutesLabel = minutes.toString().padStart(2, '0')
  const secondsLabel = secondsPart.toString().padStart(2, '0')
  return t`${hoursLabel}h ${minutesLabel}m ${secondsLabel}s`
}

function formatMoney(amount: string) {
  return moneyFormatter.format(Number(amount))
}

function formatHours(hours: number) {
  return t`${hours}h`
}

function formatPercent(percent: string) {
  return `${Number(percent).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}%`
}

function getBrandInitials(brandName: string) {
  return brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
