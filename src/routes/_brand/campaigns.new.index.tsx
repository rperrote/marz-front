import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPhaseSlug } from '#/features/campaigns/brief-builder/phases'

export const Route = createFileRoute('/_brand/campaigns/new/')({
  beforeLoad: () => {
    throw redirect({
      to: '/campaigns/new/$phase',
      params: { phase: getPhaseSlug(0) },
    })
  },
})
