import { useEffect } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'

import {
  PHASES,
  getPhaseIndex,
} from '#/features/campaigns/brief-builder/phases'
import { useBriefBuilderStore } from '#/features/campaigns/brief-builder/store'
import type { Phase } from '#/features/campaigns/brief-builder/store'

const phaseParamSchema = z.object({
  phase: z.enum(['input', 'progress', 'review', 'confirm']),
})

export const Route = createFileRoute('/_brand/campaigns/new/$phase')({
  params: {
    parse: (raw) => phaseParamSchema.parse(raw),
    stringify: (params) => params,
  },
  beforeLoad: ({ params }) => {
    const idx = getPhaseIndex(params.phase)
    if (idx === -1) {
      throw notFound()
    }
    return { phaseIndex: idx }
  },
  component: BriefBuilderPhaseRoute,
})

function BriefBuilderPhaseRoute() {
  const { phaseIndex } = Route.useRouteContext()

  useEffect(() => {
    useBriefBuilderStore.setState({
      currentPhase: (phaseIndex + 1) as Phase,
    })
  }, [phaseIndex])

  const currentPhase = PHASES[phaseIndex]!
  const PhaseComponent = currentPhase.component

  return <PhaseComponent />
}
