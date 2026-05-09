import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { useSendMessageMutation } from '#/features/chat/mutations/useSendMessageMutation'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { InboxInlineAction } from '#/shared/api/generated/model'
import { acceptOffer } from '#/shared/api/generated/offers/offers'
import { ApiError } from '#/shared/api/mutator'

import { inboxQueryKey } from './api/inbox'
import { InboxInlineActionPopover } from './InboxInlineActionPopover'
import type { InboxItemAnalyticsPayload } from './analytics'
import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('#/features/chat/mutations/useSendMessageMutation', () => ({
  useSendMessageMutation: vi.fn(),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: vi.fn(),
}))

vi.mock('#/shared/api/generated/offers/offers', () => ({
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
}))

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  acceptCampaignDiscoveryApplication: vi.fn(),
  rejectCampaignDiscoveryApplication: vi.fn(),
}))

const uuidV7Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const sendMessageMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  resetTrackedEvents()
  vi.mocked(useMe).mockReturnValue({
    data: {
      data: { id: 'account-1' },
      status: 200,
    },
  } as unknown as ReturnType<typeof useMe>)
  vi.mocked(useSendMessageMutation).mockReturnValue({
    isPending: false,
    mutate: sendMessageMutate,
  } as unknown as ReturnType<typeof useSendMessageMutation>)
})

describe('InboxInlineActionPopover', () => {
  it('sends reply text with client message id and idempotency key', async () => {
    const user = userEvent.setup()
    sendMessageMutate.mockImplementation((_variables, options) => {
      options.onSuccess()
    })

    renderPopover([makeReplyAction()])

    await user.click(screen.getByRole('button', { name: /responder/i }))
    await user.type(
      screen.getByRole('textbox', { name: /responder/i }),
      'Hola, seguimos por acá',
    )
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(useSendMessageMutation).toHaveBeenCalledWith('conv-1')
    expect(sendMessageMutate).toHaveBeenCalledWith(
      {
        clientMessageId: expect.stringMatching(uuidV7Pattern),
        currentAccountId: 'account-1',
        idempotencyKey: expect.stringMatching(uuidV7Pattern),
        text: 'Hola, seguimos por acá',
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    )
  })

  it('accepts an offer with a fresh idempotency key and invalidates inbox', async () => {
    const user = userEvent.setup()
    vi.mocked(acceptOffer).mockResolvedValue({
      data: {},
      headers: new Headers(),
      status: 200,
    } as Awaited<ReturnType<typeof acceptOffer>>)
    const { queryClient } = renderPopover([makeOfferAcceptAction()])
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: /acciones/i }))
    await user.click(screen.getByRole('button', { name: /aceptar oferta/i }))

    await waitFor(() => {
      expect(acceptOffer).toHaveBeenCalledWith('offer-1', {
        headers: { 'Idempotency-Key': expect.stringMatching(uuidV7Pattern) },
      })
    })
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: inboxQueryKey,
      })
    })

    expect(getTrackedEvents().map((event) => event.event)).toEqual([
      'inbox_inline_started',
      'inbox_inline_completed',
    ])
  })

  it('handles 409 as a neutral state refresh', async () => {
    const user = userEvent.setup()
    vi.mocked(acceptOffer).mockRejectedValue(
      new ApiError(409, 'offer_not_actionable', 'Offer changed'),
    )
    const { toast } = await import('sonner')
    const { queryClient } = renderPopover([makeOfferAcceptAction()])
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: /acciones/i }))
    await user.click(screen.getByRole('button', { name: /aceptar oferta/i }))

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('El estado cambió, refrescamos')
    })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: inboxQueryKey })
    expect(getTrackedEvents().map((event) => event.event)).toEqual([
      'inbox_inline_started',
      'inbox_inline_failed',
    ])
  })

  it('handles reply 409 as a neutral state refresh and closes the popover', async () => {
    const user = userEvent.setup()
    sendMessageMutate.mockImplementation((_variables, options) => {
      options.onError(
        new ApiError(409, 'message_conflict', 'Message state changed'),
      )
    })
    const { toast } = await import('sonner')
    const { queryClient } = renderPopover([makeReplyAction()])
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: /responder/i }))
    await user.type(
      screen.getByRole('textbox', { name: /responder/i }),
      'Hola, seguimos por acá',
    )
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('El estado cambió, refrescamos')
    })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: inboxQueryKey })
    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: /responder/i }),
      ).not.toBeInTheDocument()
    })
  })
})

function renderPopover(inlineActions: InboxInlineAction[]) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <InboxInlineActionPopover
        analyticsPayload={analyticsPayload}
        itemId="item-1"
        inlineActions={inlineActions}
      />
    </QueryClientProvider>,
  )

  return { queryClient }
}

const analyticsPayload: InboxItemAnalyticsPayload = {
  account_kind: 'brand',
  campaign_id: 'campaign-1',
  item_kind: 'message_reply',
  section: 'action',
}

function makeReplyAction(): InboxInlineAction {
  return {
    actor: 'brand',
    label: 'Reply',
    method: 'POST',
    path: '/v1/conversations/conv-1/messages',
    request_schema: {},
    requires_idempotency_key: true,
    type: 'brand_reply_message',
  }
}

function makeOfferAcceptAction(): InboxInlineAction {
  return {
    actor: 'creator',
    label: 'Accept',
    method: 'POST',
    path: '/v1/offers/offer-1/accept',
    request_schema: {},
    requires_idempotency_key: true,
    type: 'creator_accept_offer',
  }
}
