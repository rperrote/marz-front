import type { ComponentType } from 'react'
import type { BrandOnboardingState } from './store'
import {
  B1IdentityScreen,
  B2VerticalScreen,
  B3PrimingSocialProof,
  B4ObjectiveScreen,
  B5ExperienceScreen,
  B6BudgetScreen,
  B7PrimingMatchPreview,
  B8TimingScreen,
  B9ContactScreen,
  B10PrimingProjection,
  B11AttributionScreen,
  B12LoadingScreen,
  B13PaywallScreen,
  B14ConfirmationScreen,
} from './screens'

export interface BrandOnboardingStep {
  id: string
  component: ComponentType
  validate?: (state: BrandOnboardingState) => boolean
}

export const STEPS: BrandOnboardingStep[] = [
  {
    id: 'identity',
    component: B1IdentityScreen,
    validate: (s) => typeof s.name === 'string' && s.name.trim().length > 0,
  },
  {
    id: 'vertical',
    component: B2VerticalScreen,
    validate: (s) => typeof s.vertical === 'string' && s.vertical.length > 0,
  },
  {
    id: 'priming-social',
    component: B3PrimingSocialProof,
  },
  {
    id: 'objective',
    component: B4ObjectiveScreen,
    validate: (s) =>
      typeof s.marketing_objective === 'string' &&
      s.marketing_objective.length > 0,
  },
  {
    id: 'experience',
    component: B5ExperienceScreen,
    validate: (s) =>
      typeof s.creator_experience === 'string' &&
      s.creator_experience.length > 0 &&
      typeof s.creator_sourcing_history === 'string' &&
      s.creator_sourcing_history.length > 0,
  },
  {
    id: 'budget',
    component: B6BudgetScreen,
    validate: (s) =>
      typeof s.monthly_budget_range === 'string' &&
      s.monthly_budget_range.length > 0,
  },
  {
    id: 'priming-match',
    component: B7PrimingMatchPreview,
  },
  {
    id: 'timing',
    component: B8TimingScreen,
    validate: (s) => typeof s.timing === 'string' && s.timing.length > 0,
  },
  {
    id: 'contact',
    component: B9ContactScreen,
    validate: (s) =>
      typeof s.contact_name === 'string' &&
      s.contact_name.trim().length > 0 &&
      typeof s.contact_title === 'string' &&
      s.contact_title.trim().length > 0 &&
      typeof s.contact_whatsapp_e164 === 'string' &&
      /^\+[1-9]\d{7,14}$/.test(s.contact_whatsapp_e164),
  },
  {
    id: 'priming-projection',
    component: B10PrimingProjection,
  },
  {
    id: 'attribution',
    component: B11AttributionScreen,
    validate: (s) => {
      if (s.attribution == null || !('source' in s.attribution)) return false
      if (s.attribution.source === 'referral') {
        return (
          'referral_text' in s.attribution &&
          typeof s.attribution.referral_text === 'string' &&
          s.attribution.referral_text.trim().length > 0
        )
      }
      return true
    },
  },
  {
    id: 'loading',
    component: B12LoadingScreen,
  },
  {
    id: 'paywall',
    component: B13PaywallScreen,
  },
  {
    id: 'confirmation',
    component: B14ConfirmationScreen,
  },
]

export function getStepIndex(stepId: string): number {
  return STEPS.findIndex((s) => s.id === stepId)
}

export function getStepId(index: number): string {
  return STEPS[Math.min(Math.max(0, index), STEPS.length - 1)]!.id
}
