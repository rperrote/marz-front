import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { getMeQueryKey, useMe } from '#/shared/api/generated/accounts/accounts'
import { useCompleteBrandOnboarding } from '#/shared/api/generated/onboarding/onboarding'
import { ApiError } from '#/shared/api/mutator'
import { track } from '#/shared/analytics/track'

import { CompleteBrandOnboardingBody } from '#/shared/api/generated/zod/onboarding/onboarding'

import type { FieldErrors } from './store'
import { useBrandOnboardingStore } from './store'
import { getStepIndex } from './steps'

const FIELD_TO_STEP: Record<string, string> = {
  name: 'identity',
  website_url: 'identity',
  vertical: 'vertical',
  marketing_objective: 'objective',
  creator_experience: 'experience',
  creator_sourcing_intent: 'experience',
  monthly_budget_range: 'budget',
  timing: 'timing',
  contact_name: 'contact',
  contact_title: 'contact',
  contact_whatsapp_e164: 'contact',
  attribution: 'attribution',
}

export function useSubmitBrandOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useCompleteBrandOnboarding()
  const meQuery = useMe({ query: { enabled: false } })

  const submit = () => {
    const state = useBrandOnboardingStore.getState()
    const {
      currentStepIndex: _,
      setField: _s,
      goTo: _g,
      reset,
      ...fields
    } = state

    const parsed = CompleteBrandOnboardingBody.safeParse(fields)
    if (!parsed.success) {
      const inlineErrors: FieldErrors = {}
      let firstStepId: string | undefined
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0] as keyof FieldErrors | undefined
        if (fieldName && !inlineErrors[fieldName]) {
          inlineErrors[fieldName] = issue.message
          if (!firstStepId) {
            firstStepId = FIELD_TO_STEP[fieldName]
          }
        }
      }
      const store = useBrandOnboardingStore.getState()
      store.setFieldErrors(inlineErrors)
      if (firstStepId) {
        const idx = getStepIndex(firstStepId)
        if (idx >= 0) {
          store.goTo(idx)
          void navigate({
            to: '/onboarding/brand/$step',
            params: { step: firstStepId },
          })
        }
      }
      return
    }

    mutation.mutate(
      { data: parsed.data },
      {
        onSuccess: () => {
          reset()
          void queryClient.invalidateQueries({ queryKey: getMeQueryKey() })
          track('onboarding_completed', { kind: 'brand' })
          void navigate({ to: '/campaigns' })
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            toast.error('Ocurrió un error inesperado. Intentá de nuevo.')
            return
          }

          if (error.status === 422) {
            const rawFieldErrors = error.details?.field_errors
            if (rawFieldErrors) {
              const inlineErrors: FieldErrors = {}
              let firstStepId: string | undefined
              for (const [field, messages] of Object.entries(rawFieldErrors)) {
                if (messages.length > 0) {
                  inlineErrors[field as keyof FieldErrors] = messages[0]
                  if (!firstStepId) {
                    firstStepId = FIELD_TO_STEP[field]
                  }
                }
              }
              const store = useBrandOnboardingStore.getState()
              store.setFieldErrors(inlineErrors)
              if (firstStepId) {
                const idx = getStepIndex(firstStepId)
                if (idx >= 0) {
                  store.goTo(idx)
                  void navigate({
                    to: '/onboarding/brand/$step',
                    params: { step: firstStepId },
                  })
                }
              }
            }
            return
          }

          if (error.status === 409) {
            void meQuery.refetch().then((result) => {
              const redirectTo =
                result.data?.status === 200
                  ? result.data.data.redirect_to
                  : null
              void navigate({ to: redirectTo ?? '/campaigns' })
            })
            return
          }

          toast.error('Ocurrió un error inesperado. Intentá de nuevo.')
        },
      },
    )
  }

  return { submit, isPending: mutation.isPending }
}
