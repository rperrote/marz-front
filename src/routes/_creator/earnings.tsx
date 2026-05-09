import { Trans } from '@lingui/react/macro'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const earningsSearchSchema = z.object({
  period: z.enum(['30d', '90d', '12m', 'all']).catch('30d'),
  q: z.string().max(120).optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_creator/earnings')({
  validateSearch: earningsSearchSchema,
  component: EarningsPlaceholder,
})

function EarningsPlaceholder() {
  return (
    <div className="min-h-full bg-background p-8 text-foreground">
      <div className="max-w-7xl">
        <h1 className="text-2xl font-semibold">
          <Trans>Earnings</Trans>
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  )
}
