import { DollarSign } from 'lucide-react'

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
      ? `Payment of ${amount} received`
      : `Payment of ${amount} sent`
  const defaultNote =
    audience === 'received'
      ? 'Great job on the video!'
      : 'Funds are on the way.'

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted px-4 py-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <DollarSign className="size-6" />
      </span>
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground">{title}</div>
        <div className="truncate text-sm text-muted-foreground">
          {note ?? defaultNote}
        </div>
      </div>
    </div>
  )
}
