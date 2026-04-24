import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { getMeQueryKey, useMe } from '#/shared/api/generated/accounts/accounts'
import { useCompleteCreatorOnboarding } from '#/shared/api/generated/onboarding/onboarding'
import { ApiError } from '#/shared/api/mutator'
import { track } from '#/shared/analytics/track'

import { CreatorOnboardingPayloadSchema } from './schema'

import type { FieldErrors } from './store'
import { useCreatorOnboardingStore } from './store'
import { getStepIndex } from './steps'

const FIELD_TO_STEP: Record<string, string> = {
  display_name: 'name-handle',
  handle: 'name-handle',
  experience_level: 'experience',
  tier: 'tier',
  niches: 'niches',
  content_types: 'content-types',
  channels: 'channels',
  best_videos: 'best-videos',
  birthday: 'birthday',
  gender: 'gender',
  country: 'location',
  city: 'location',
  whatsapp_e164: 'whatsapp',
  referral_text: 'referral',
  avatar_s3_key: 'avatar',
}

export function useSubmitCreatorOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useCompleteCreatorOnboarding()
  const meQuery = useMe({ query: { enabled: false } })

  const submit = () => {
    const state = useCreatorOnboardingStore.getState()
    const {
      currentStepIndex: _,
      setField: _s,
      goTo: _g,
      reset,
      fieldErrors: _fe,
      setFieldErrors: _sfe,
      clearFieldErrors: _cfe,
      ...fields
    } = state

    const parsed = CreatorOnboardingPayloadSchema.safeParse(fields)
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
      const store = useCreatorOnboardingStore.getState()
      store.setFieldErrors(inlineErrors)
      if (firstStepId) {
        const idx = getStepIndex(firstStepId)
        if (idx >= 0) {
          store.goTo(idx)
          void navigate({
            to: '/onboarding/creator/$step',
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
          track('onboarding_completed', { kind: 'creator' })
          void navigate({ to: '/offers' })
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            toast.error('Ocurrió un error inesperado. Intentá de nuevo.')
            return
          }

          if (error.status === 422) {
            if (error.code === 'avatar_not_found') {
              const store = useCreatorOnboardingStore.getState()
              store.setFieldErrors({
                avatar_s3_key: 'Subí la foto de nuevo',
              })
              const idx = getStepIndex('avatar')
              if (idx >= 0) {
                store.goTo(idx)
                void navigate({
                  to: '/onboarding/creator/$step',
                  params: { step: 'avatar' },
                })
              }
              return
            }

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
              const store = useCreatorOnboardingStore.getState()
              store.setFieldErrors(inlineErrors)
              if (firstStepId) {
                const idx = getStepIndex(firstStepId)
                if (idx >= 0) {
                  store.goTo(idx)
                  void navigate({
                    to: '/onboarding/creator/$step',
                    params: { step: firstStepId },
                  })
                }
              }
            }
            return
          }

          if (error.status === 409) {
            if (error.code === 'handle_taken') {
              const store = useCreatorOnboardingStore.getState()
              store.setFieldErrors({
                handle: error.message || 'Este handle ya está en uso',
              })
              const idx = getStepIndex('name-handle')
              if (idx >= 0) {
                store.goTo(idx)
                void navigate({
                  to: '/onboarding/creator/$step',
                  params: { step: 'name-handle' },
                })
              }
              return
            }

            void meQuery.refetch().then((result) => {
              const redirectTo =
                result.data?.status === 200
                  ? result.data.data.redirect_to
                  : null
              void navigate({ to: redirectTo ?? '/offers' })
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
