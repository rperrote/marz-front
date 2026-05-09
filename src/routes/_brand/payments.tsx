import { t } from '@lingui/core/macro'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

export const paymentsSearchSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  campaignId: z.string().optional(),
  creatorId: z.string().optional(),
  q: z.string().optional(),
})

export const Route = createFileRoute('/_brand/payments')({
  validateSearch: paymentsSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.brandWorkspaceRole !== 'admin') {
      throw redirect({ to: '/workspace' })
    }
  },
  component: BrandPaymentsRoute,
})

function BrandPaymentsRoute() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto bg-background p-6">
      <h1 className="text-xl font-semibold text-foreground">
        {t`Payments & Spending`}
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        {t`El dashboard de pagos y spending va a estar disponible pronto.`}
      </p>
    </div>
  )
}
