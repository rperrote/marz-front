import { cn } from '#/lib/utils'

interface SummaryTotalRowProps {
  label: string
  amount: string
  emphasis?: 'default' | 'strong'
}

export function SummaryTotalRow({
  label,
  amount,
  emphasis = 'default',
}: SummaryTotalRowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 rounded-2xl bg-muted px-4 py-3',
        emphasis === 'strong' && 'bg-accent',
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-lg font-semibold text-foreground">
        {amount}
      </span>
    </div>
  )
}
