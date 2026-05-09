import { t } from '@lingui/core/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import { createCampaignDiscoveryInvite } from '#/shared/api/generated/campaigns/campaigns'
import type { CreateCampaignInviteRequest } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export function useCreateCampaignInvite(campaignId: string) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<CreateCampaignInviteRequest>((data) =>
    JSON.stringify(data),
  )

  return useMutation({
    mutationFn: async (data: CreateCampaignInviteRequest) => {
      const response = await createCampaignDiscoveryInvite(campaignId, data, {
        headers: {
          'Idempotency-Key': idempotency.get(data),
        },
      })

      if (response.status !== 201) {
        throw new ApiError(
          response.status,
          'create_invite_error',
          'Create invite request failed',
        )
      }
      return response.data
    },
    onSuccess: async () => {
      idempotency.reset()
      toast.success(t`Invitación enviada`)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['campaign', campaignId, 'participants'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['campaign', campaignId, 'discovery'],
        }),
      ])
    },
    onError: handleInviteError,
  })
}

function useIdempotencyKey<TVariables>(
  fingerprintFor: (variables: TVariables) => string,
) {
  const idempotencyRef = useRef<{
    fingerprint: string
    key: string
  } | null>(null)

  return {
    get: (variables: TVariables) => {
      const fingerprint = fingerprintFor(variables)
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = {
          fingerprint,
          key: crypto.randomUUID(),
        }
      }
      return idempotencyRef.current.key
    },
    reset: () => {
      idempotencyRef.current = null
    },
  }
}

function handleInviteError(error: unknown) {
  if (!(error instanceof ApiError)) {
    toast.error(t`Algo salió mal. Intentá de nuevo.`)
    return
  }

  if (error.status === 409) {
    if (error.code === 'plan_does_not_allow_in_platform_invite') {
      toast.error(
        t`Tu plan no permite invitaciones in-platform. Usá email o actualizá el plan.`,
      )
      return
    }
    if (error.code === 'invite_duplicate') {
      toast.info(t`La invitación ya fue enviada.`)
      return
    }
    if (error.code === 'campaign_not_discoverable') {
      toast.error(t`Esta campaña no está disponible para Discovery.`)
      return
    }
  }

  toast.error(t`Algo salió mal. Intentá de nuevo.`)
}
