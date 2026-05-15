import { Flag } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { EventBubble } from '#/shared/ui/EventBubble'
import type { StageOpenedSnap } from '../types'

interface StageOpenedBubbleProps {
  snapshot: StageOpenedSnap
  side: 'out' | 'in'
}

export function StageOpenedBubble({ snapshot, side }: StageOpenedBubbleProps) {
  const position = snapshot.position
  const total = snapshot.total
  const name = snapshot.name
  const text =
    snapshot.prev_stage_position == null
      ? t`Stage ${position}/${total}: ${name} is now open`
      : t`Previous stage approved — Stage ${position}: ${name} is now open`

  return (
    <div role="status" data-testid="stage-opened-bubble">
      {}
      <EventBubble severity="success" direction={side} icon={Flag}>
        {text}
      </EventBubble>
    </div>
  )
}
