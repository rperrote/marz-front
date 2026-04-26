import type { ComponentType } from 'react'
import { P1Input } from './screens/P1Input'
import { P2Progress } from './screens/P2Progress'
import { P3Review } from './screens/P3Review'
import { P4Confirm } from './screens/P4Confirm'

export type PhaseSlug = 'input' | 'progress' | 'review' | 'confirm'

export interface BriefBuilderPhase {
  id: number
  slug: PhaseSlug
  component: ComponentType
}

export const PHASES: BriefBuilderPhase[] = [
  { id: 1, slug: 'input', component: P1Input },
  { id: 2, slug: 'progress', component: P2Progress },
  { id: 3, slug: 'review', component: P3Review },
  { id: 4, slug: 'confirm', component: P4Confirm },
]

export function getPhaseIndex(slug: string): number {
  return PHASES.findIndex((p) => p.slug === slug)
}

export function getPhaseSlug(index: number): PhaseSlug {
  return PHASES[Math.min(Math.max(0, index), PHASES.length - 1)]!.slug
}
