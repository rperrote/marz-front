import { t } from '@lingui/core/macro'
import { Check, DollarSign } from 'lucide-react'

interface PaymentCardProps {
  amount: string
  /**
   * `received` = creator POV ("Payment received"). `sent` = brand POV
   * ("Payment sent"). Visual is symmetric, title/subtitle differ.
   */
  audience: 'received' | 'sent'
  note?: string
}

export function PaymentCard({ amount, audience, note }: PaymentCardProps) {
  const title =
    audience === 'received'
      ? t`Payment of ${amount} received`
      : t`Payment of ${amount} sent`
  const defaultNote =
    audience === 'received'
      ? t`Great job on the video!`
      : t`Funds are on the way.`
  const Icon = audience === 'received' ? DollarSign : Check

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-success bg-muted p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-foreground">
          {title}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {note ?? defaultNote}
        </div>
      </div>
    </div>
  )
}
