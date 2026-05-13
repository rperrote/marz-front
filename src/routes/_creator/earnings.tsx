import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { EarningsPage } from '#/features/earnings/components/EarningsPage'
import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'

export const earningsSearchSchema = z.object({
  period: z.enum(['30d', '90d', '12m', 'all']).catch('30d'),
  q: z.string().max(120).optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_creator/earnings')({
  validateSearch: earningsSearchSchema,
  component: EarningsRoute,
})

function EarningsRoute() {
  const search = Route.useSearch()
  const router = useRouter()

  function handlePeriodChange(period: CreatorEarningsPeriod) {
    void router.navigate({
      to: '/earnings',
      search: (previous) => ({
        ...previous,
        period,
        cursor: undefined,
      }),
    })
  }

  return (
    <EarningsPage
      period={search.period}
      q={search.q}
      cursor={search.cursor}
      onPeriodChange={handlePeriodChange}
    />
  )
}
