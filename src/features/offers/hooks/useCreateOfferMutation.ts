import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  CreateOfferRequest,
  OfferBonusTerms,
  OfferDeliverableDTO,
} from '#/shared/api/generated/model'
import { createOffer } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import type {
  CreateOfferFormValues,
  OfferBonusTermsFormValues,
  OfferBonusWindowFormValues,
} from '../schemas/createOffer'

export type CreateOfferMutationVariables = CreateOfferFormValues & {
  conversation_id: string
}

function toDecimalString(value: number): string {
  return value.toFixed(2)
}

function toBonusPct(
  bonusAmount: OfferBonusWindowFormValues['bonus_amount'],
  baseAmount: number,
): string {
  if (bonusAmount.type === 'percentage') {
    return toDecimalString(bonusAmount.value)
  }
  const pct = baseAmount > 0 ? (bonusAmount.amount_usd / baseAmount) * 100 : 0
  return toDecimalString(pct)
}

function toBonusTerms(
  bonusTerms: OfferBonusTermsFormValues | undefined,
  baseAmount: number,
): OfferBonusTerms | null {
  if (!bonusTerms?.enabled) return null

  return {
    speed_bonus_windows: bonusTerms.speed_bonus_windows.map((window) => ({
      window_hours: window.window_hours,
      bonus_pct: toBonusPct(window.bonus_amount, baseAmount),
    })),
  }
}

function toDeliverables(
  platforms: CreateOfferFormValues['platforms'],
): OfferDeliverableDTO[] {
  return platforms.map((platform, index) => ({
    position: index + 1,
    platform,
    format: '',
    quantity: 1,
  }))
}

function toCreateOfferRequest(
  variables: CreateOfferMutationVariables,
): CreateOfferRequest {
  return {
    campaign_id: variables.campaign_id,
    conversation_id: variables.conversation_id,
    offer_mode: variables.offer_mode,
    amount: toDecimalString(variables.amount),
    tentative_publish_date: variables.tentative_publish_date,
    offer_deadline: variables.offer_deadline,
    description: '',
    bonus_terms: toBonusTerms(variables.bonus_terms, variables.amount),
    platforms: variables.platforms,
    deliverables: toDeliverables(variables.platforms),
  }
}

export function useCreateOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: CreateOfferMutationVariables) =>
      createOffer(toCreateOfferRequest(variables), {
        headers: {
          'Idempotency-Key': generateIdempotencyKey(),
        },
      }),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getConversationOffersQueryKey(variables.conversation_id),
        }),
        queryClient.invalidateQueries({
          queryKey: getMessagesQueryKey(variables.conversation_id),
        }),
      ])
    },
  })
}
