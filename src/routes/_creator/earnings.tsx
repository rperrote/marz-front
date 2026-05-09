import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  const navigate = useNavigate({ from: '/earnings' })

  function handlePeriodChange(period: CreatorEarningsPeriod) {
    void navigate({
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
