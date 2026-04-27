import { cn } from '#/lib/utils'

interface DeliverableSummaryRowProps {
  label: string
  amount: string
  currency: string
  emphasis?: 'default' | 'strong'
}

export function DeliverableSummaryRow({
  label,
  amount,
  currency,
  emphasis = 'default',
}: DeliverableSummaryRowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 rounded-2xl px-4 py-3',
        emphasis === 'strong' ? 'bg-accent' : 'bg-muted',
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-lg font-semibold text-foreground">
        {currency} {amount}
      </span>
    </div>
  )
}
