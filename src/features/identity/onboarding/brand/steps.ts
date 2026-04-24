import type { ComponentType } from 'react'
import type { BrandOnboardingState } from './store'

export interface BrandOnboardingStep {
  id: string
  component: ComponentType
  validate?: (state: BrandOnboardingState) => boolean
}

function Placeholder() {
  return null
}

export const STEPS: BrandOnboardingStep[] = [
  {
    id: 'name',
    component: Placeholder,
    validate: (s) => typeof s.name === 'string' && s.name.trim().length > 0,
  },
  { id: 'website', component: Placeholder },
  { id: 'colors', component: Placeholder },
  {
    id: 'vertical',
    component: Placeholder,
    validate: (s) => typeof s.vertical === 'string' && s.vertical.length > 0,
  },
  {
    id: 'marketing-objective',
    component: Placeholder,
    validate: (s) =>
      typeof s.marketing_objective === 'string' &&
      s.marketing_objective.length > 0,
  },
  {
    id: 'creator-experience',
    component: Placeholder,
    validate: (s) =>
      typeof s.creator_experience === 'string' &&
      s.creator_experience.length > 0,
  },
  {
    id: 'creator-sourcing',
    component: Placeholder,
    validate: (s) =>
      typeof s.creator_sourcing_history === 'string' &&
      s.creator_sourcing_history.length > 0,
  },
  {
    id: 'budget',
    component: Placeholder,
    validate: (s) =>
      typeof s.monthly_budget_range === 'string' &&
      s.monthly_budget_range.length > 0,
  },
  {
    id: 'timing',
    component: Placeholder,
    validate: (s) => typeof s.timing === 'string' && s.timing.length > 0,
  },
  {
    id: 'attribution',
    component: Placeholder,
    validate: (s) => s.attribution != null && 'source' in s.attribution,
  },
  {
    id: 'contact-name',
    component: Placeholder,
    validate: (s) =>
      typeof s.contact_name === 'string' && s.contact_name.trim().length > 0,
  },
  {
    id: 'contact-title',
    component: Placeholder,
    validate: (s) =>
      typeof s.contact_title === 'string' && s.contact_title.trim().length > 0,
  },
  {
    id: 'contact-whatsapp',
    component: Placeholder,
    validate: (s) =>
      typeof s.contact_whatsapp_e164 === 'string' &&
      /^\+[1-9]\d{1,14}$/.test(s.contact_whatsapp_e164),
  },
  { id: 'review', component: Placeholder },
]

export function getStepIndex(stepId: string): number {
  return STEPS.findIndex((s) => s.id === stepId)
}

export function getStepId(index: number): string {
  return STEPS[Math.min(Math.max(0, index), STEPS.length - 1)]!.id
}
