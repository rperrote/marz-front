import { t } from '@lingui/core/macro'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { brandPaymentsSearchSchema } from '#/features/payments/api/brandPaymentsSchemas'
import { useBrandPaymentsSpendingQuery } from '#/features/payments/hooks/useBrandPaymentsSpendingQuery'

export const paymentsSearchSchema = brandPaymentsSearchSchema

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
  const filters = Route.useSearch()
  useBrandPaymentsSpendingQuery({ filters })

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
