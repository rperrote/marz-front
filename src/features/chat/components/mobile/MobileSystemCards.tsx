import {
  DollarSign,
  FileText,
  Link as LinkIcon,
  MessageCircle,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

/**
 * Mobile system-event cards. Narrower layout, stacked actions, smaller chrome
 * than desktop. The intent of each card is identical to its desktop sibling —
 * see features/offers, features/deliverables, features/payments.
 */

type MobileCardTone = 'info' | 'success' | 'warning' | 'destructive'

const toneHeader: Record<MobileCardTone, { solid: string; tint: string }> = {
  info: { solid: 'bg-info text-info-foreground', tint: 'bg-muted text-info' },
  success: {
    solid: 'bg-success text-success-foreground',
    tint: 'bg-muted text-success',
  },
  warning: {
    solid: 'bg-warning text-warning-foreground',
    tint: 'bg-muted text-warning',
  },
  destructive: {
    solid: 'bg-destructive text-destructive-foreground',
    tint: 'bg-muted text-destructive',
  },
}

const toneBorder: Record<MobileCardTone, string> = {
  info: 'border-info/40',
  success: 'border-success/50',
  warning: 'border-warning/50',
  destructive: 'border-destructive/50',
}

function MobileCardFrame({
  tone,
  kicker,
  icon: Icon,
  headerVariant = 'tint',
  right,
  children,
}: {
  tone: MobileCardTone
  kicker: string
  icon: LucideIcon
  headerVariant?: 'tint' | 'solid'
  right?: React.ReactNode
  children: React.ReactNode
}) {
  const header =
    headerVariant === 'solid' ? toneHeader[tone].solid : toneHeader[tone].tint
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 bg-card',
        toneBorder[tone],
      )}
    >
      <div className={cn('flex items-center gap-2 px-4 py-2.5', header)}>
        <Icon className="size-4" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider">
          {kicker}
        </span>
        {right ? (
          <span className="ml-auto text-xs font-mono">{right}</span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ---- OfferCard (received / sent) ----

export interface MobileOfferRow {
  label: string
  value: string
}

interface MobileOfferCardProps {
  variant: 'received' | 'sent'
  title: string
  rows: Array<MobileOfferRow>
  statusLabel: string
  onAccept?: () => void
  onReject?: () => void
}

export function MobileOfferCard({
  variant,
  title,
  rows,
  statusLabel,
  onAccept,
  onReject,
}: MobileOfferCardProps) {
  const kicker = variant === 'received' ? 'Offer Received' : 'Offer Sent'
  return (
    <MobileCardFrame
      tone="success"
      kicker={kicker}
      icon={FileText}
      right={statusLabel}
    >
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <dl className="space-y-2 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-mono font-semibold text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        {variant === 'received' ? (
          <div className="space-y-2">
            <Button className="w-full" size="lg" onClick={onAccept}>
              Accept offer
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={onReject}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </div>
    </MobileCardFrame>
  )
}

// ---- DraftCard ----

interface MobileDraftCardProps {
  filename: string
  duration: string
  sizeLabel: string
  formatLabel?: string
  version: string
  onReview?: () => void
}

export function MobileDraftCard({
  filename,
  duration,
  sizeLabel,
  formatLabel,
  version,
  onReview,
}: MobileDraftCardProps) {
  return (
    <MobileCardFrame
      tone="info"
      kicker="Draft Submitted"
      icon={Video}
      headerVariant="solid"
      right={version}
    >
      <div className="space-y-3">
        <div className="aspect-[9/12] w-full rounded-xl bg-muted" />
        <div>
          <div className="truncate font-mono text-sm font-semibold text-foreground">
            {filename}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {duration} · {sizeLabel}
            {formatLabel ? ` · ${formatLabel}` : ''}
          </div>
        </div>
        <Button className="w-full" size="lg" onClick={onReview}>
          Review draft
        </Button>
      </div>
    </MobileCardFrame>
  )
}

// ---- PaymentCard ----

export interface MobilePaymentLine {
  label: string
  amount: string
}

interface MobilePaymentCardProps {
  amount: string
  subtitle: string
  lines?: Array<MobilePaymentLine>
}

export function MobilePaymentCard({
  amount,
  subtitle,
  lines,
}: MobilePaymentCardProps) {
  return (
    <MobileCardFrame
      tone="success"
      kicker="Payment"
      icon={DollarSign}
      headerVariant="solid"
    >
      <div className="space-y-3">
        <div className="text-4xl font-bold text-foreground">{amount}</div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {lines && lines.length > 0 ? (
          <dl className="space-y-1.5 rounded-xl bg-muted p-3 text-sm">
            {lines.map((line) => (
              <div
                key={line.label}
                className="flex items-baseline justify-between gap-3"
              >
                <dt className="text-muted-foreground">{line.label}</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {line.amount}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </MobileCardFrame>
  )
}

// ---- LinkCard ----

interface MobileLinkCardProps {
  url: string
  meta: string
}

export function MobileLinkCard({ url, meta }: MobileLinkCardProps) {
  return (
    <MobileCardFrame tone="success" kicker="Link Submitted" icon={LinkIcon}>
      <div className="space-y-1.5">
        <div className="truncate font-mono text-sm font-semibold text-foreground">
          {url}
        </div>
        <div className="text-xs text-muted-foreground">{meta}</div>
      </div>
    </MobileCardFrame>
  )
}

// ---- RequestChangesCard ----

interface MobileRequestChangesCardProps {
  notes: string
  signoff: string
}

export function MobileRequestChangesCard({
  notes,
  signoff,
}: MobileRequestChangesCardProps) {
  return (
    <MobileCardFrame
      tone="destructive"
      kicker="Changes Requested"
      icon={MessageCircle}
      headerVariant="solid"
    >
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-foreground">{notes}</p>
        <p className="text-xs text-muted-foreground">— {signoff}</p>
      </div>
    </MobileCardFrame>
  )
}
