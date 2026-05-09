import { t } from '@lingui/core/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import {
  acceptCampaignDiscoveryApplication,
  contactCampaignDiscoveryMatch,
  createCampaignDiscoveryInvite,
  getListCampaignParticipantsQueryKey,
  rejectCampaignDiscoveryApplication,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  ContactCampaignMatchRequest,
  CreateCampaignInviteRequest,
  DiscoveryApplicationDecisionResponse,
} from '#/shared/api/generated/model'
import {
  trackDiscoveryApplicationDecided,
  trackDiscoveryInviteCreated,
  trackDiscoveryMatchContacted,
} from '#/shared/analytics/discoveryTracking'
import { ApiError } from '#/shared/api/mutator'

import { getCampaignDiscoveryQueryKey } from './queries'

type NavigateToConversation = (conversationId: string) => void

interface MutationOptions {
  onConversationReady?: NavigateToConversation
}

export function useContactMatch(
  campaignId: string,
  options: MutationOptions = {},
) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<ContactMatchVariables>(
    ({ matchId, data }) => JSON.stringify({ matchId, data }),
  )

  return useMutation({
    mutationFn: async (variables: ContactMatchVariables) => {
      const response = await contactCampaignDiscoveryMatch(
        campaignId,
        variables.matchId,
        variables.data,
        {
          headers: {
            'Idempotency-Key': idempotency.get(variables),
          },
        },
      )

      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'contact_match_error',
          'Contact match request failed',
        )
      }
      return response.data
    },
    onSuccess: async (_data, variables) => {
      idempotency.reset()
      trackDiscoveryMatchContacted({
        campaignId,
        mode: variables.data.invite?.mode,
      })
      await invalidateDiscovery(queryClient, campaignId)
    },
    onError: (error) => {
      const existingConversationId = handleDiscoveryMutationError(error)
      if (existingConversationId) {
        options.onConversationReady?.(existingConversationId)
      }
    },
  })
}

export function useAcceptApplication(
  campaignId: string,
  options: MutationOptions = {},
) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<ApplicationVariables>(
    ({ applicationId }) => applicationId,
  )

  return useMutation({
    mutationFn: async (variables: ApplicationVariables) => {
      const response = await acceptCampaignDiscoveryApplication(
        campaignId,
        variables.applicationId,
        {
          headers: {
            'Idempotency-Key': idempotency.get(variables),
          },
        },
      )

      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'accept_application_error',
          'Accept application request failed',
        )
      }
      return response.data
    },
    onSuccess: async (data: DiscoveryApplicationDecisionResponse) => {
      idempotency.reset()
      trackDiscoveryApplicationDecided({
        campaignId,
        decision: 'accept',
      })
      await invalidateDiscovery(queryClient, campaignId, { participants: true })
      if (data.conversation?.id) {
        options.onConversationReady?.(data.conversation.id)
      }
    },
    onError: (error) => {
      const existingConversationId = handleDiscoveryMutationError(error)
      if (existingConversationId) {
        options.onConversationReady?.(existingConversationId)
      }
    },
  })
}

export function useRejectApplication(campaignId: string) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<ApplicationVariables>(
    ({ applicationId }) => applicationId,
  )

  return useMutation({
    mutationFn: async (variables: ApplicationVariables) => {
      const response = await rejectCampaignDiscoveryApplication(
        campaignId,
        variables.applicationId,
        {
          headers: {
            'Idempotency-Key': idempotency.get(variables),
          },
        },
      )

      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'reject_application_error',
          'Reject application request failed',
        )
      }
      return response.data
    },
    onSuccess: async () => {
      idempotency.reset()
      trackDiscoveryApplicationDecided({
        campaignId,
        decision: 'reject',
      })
      await invalidateDiscovery(queryClient, campaignId)
    },
    onError: handleDiscoveryMutationError,
  })
}

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
    onSuccess: async (_data, variables) => {
      idempotency.reset()
      trackDiscoveryInviteCreated({
        campaignId,
        mode: variables.mode,
      })
      toast.success(t`Invitación enviada`)
      await invalidateDiscovery(queryClient, campaignId)
    },
    onError: handleDiscoveryMutationError,
  })
}

interface ContactMatchVariables {
  matchId: string
  data: ContactCampaignMatchRequest
}

interface ApplicationVariables {
  applicationId: string
}

export function useIdempotencyKey<TVariables>(
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

async function invalidateDiscovery(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignId: string,
  options: { participants?: boolean } = {},
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getCampaignDiscoveryQueryKey(campaignId, 'summary'),
    }),
    queryClient.invalidateQueries({
      queryKey: ['campaign', campaignId, 'discovery'],
    }),
    options.participants
      ? queryClient.invalidateQueries({
          queryKey: getListCampaignParticipantsQueryKey(campaignId),
        })
      : Promise.resolve(),
  ])
}

export function handleDiscoveryMutationError(error: unknown) {
  if (!(error instanceof ApiError)) {
    toast.error(t`Algo salió mal. Intentá de nuevo.`)
    return undefined
  }

  if (error.status === 409) {
    if (error.code === 'plan_does_not_allow_in_platform_invite') {
      toast.error(
        t`Tu plan no permite invitaciones in-platform. Usá email o actualizá el plan.`,
      )
      return undefined
    }
    if (error.code === 'conversation_already_exists') {
      const conversationId = getConversationId(error)
      if (conversationId) {
        toast.info(t`Ya existe una conversación con este creator.`)
        return conversationId
      }
      toast.info(t`Ya existe una conversación con este creator.`)
      return undefined
    }
    if (error.code === 'invite_duplicate') {
      toast.info(t`La invitación ya fue enviada.`)
      return undefined
    }
    if (error.code === 'campaign_not_discoverable') {
      toast.error(t`Esta campaña no está disponible para Discovery.`)
      return undefined
    }
    if (error.code === 'application_not_actionable') {
      toast.error(t`Esta aplicación ya no se puede modificar.`)
      return undefined
    }
    if (error.code === 'match_not_actionable') {
      toast.error(t`Este match ya no se puede contactar.`)
      return undefined
    }
  }

  toast.error(t`Algo salió mal. Intentá de nuevo.`)
  return undefined
}

function getConversationId(error: ApiError) {
  const details: unknown = error.details
  if (!details || typeof details !== 'object') return undefined
  if (!('conversation_id' in details)) return undefined

  const conversationId = details.conversation_id
  return typeof conversationId === 'string' ? conversationId : undefined
}
