import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { customFetch, ApiError } from '#/shared/api/mutator'
import { getMessagesQueryKey } from '#/features/chat/queries'
import type { MessageItem, MessagesResponse } from '#/features/chat/types'
import { trackChatEvent, toLengthBucket } from '#/features/chat/analytics/track'

const MAX_RETRIES = 3
const RETRY_BASE_MS = 1000
const WS_CONFIRMATION_TIMEOUT_MS = 5000

export interface SendMessageVariables {
  clientMessageId: string
  text: string
  currentAccountId: string
}

interface SendMessageResponse {
  data: {
    data: MessageItem
    idempotent_replay: boolean
  }
  status: number
}

type MessagesInfiniteData = InfiniteData<
  { data: MessagesResponse; status: number },
  string | undefined
>

export function createPendingMessage(
  clientMessageId: string,
  conversationId: string,
  text: string,
  currentAccountId: string,
  nowIso: string = new Date().toISOString(),
): MessageItem {
  return {
    id: clientMessageId,
    conversation_id: conversationId,
    author_account_id: currentAccountId,
    type: 'text',
    text_content: text,
    event_type: null,
    payload: null,
    created_at: nowIso,
    read_by_self: true,
  }
}

function appendMessageToCache(
  cache: MessagesInfiniteData | undefined,
  message: MessageItem,
): MessagesInfiniteData | undefined {
  if (!cache || cache.pages.length === 0) return cache

  const pages = [...cache.pages]
  const firstPage = pages[0]!
  pages[0] = {
    ...firstPage,
    data: {
      ...firstPage.data,
      data: [message, ...firstPage.data.data],
    },
  }

  return { ...cache, pages }
}

export function useSendMessageMutation(conversationId: string) {
  const queryClient = useQueryClient()
  const messagesKey = getMessagesQueryKey(conversationId)

  return useMutation({
    mutationFn: async ({ clientMessageId, text }: SendMessageVariables) => {
      const response = await customFetch<SendMessageResponse>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            client_message_id: clientMessageId,
            text_content: text,
          }),
        },
      )

      return {
        message: response.data.data,
        clientMessageId,
        idempotentReplay: response.data.idempotent_replay,
      }
    },

    onMutate: async ({ clientMessageId, text, currentAccountId }) => {
      await queryClient.cancelQueries({ queryKey: messagesKey })

      const previousMessages =
        queryClient.getQueryData<MessagesInfiniteData>(messagesKey)

      const pendingMessage = createPendingMessage(
        clientMessageId,
        conversationId,
        text,
        currentAccountId,
      )

      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) =>
        appendMessageToCache(old, pendingMessage),
      )

      const confirmationTimeout = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: messagesKey })
      }, WS_CONFIRMATION_TIMEOUT_MS)

      return { previousMessages, clientMessageId, confirmationTimeout }
    },

    onSuccess: (data, variables, context) => {
      clearTimeout(context.confirmationTimeout)

      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
        if (!old) return old
        return reconcileMessage(old, context.clientMessageId, data.message)
      })

      trackChatEvent('message_sent', {
        conversation_id: conversationId,
        length_bucket: toLengthBucket(variables.text.length),
        idempotent_replay: data.idempotentReplay,
      })
    },

    onError: (error, _variables, context) => {
      if (context?.confirmationTimeout) {
        clearTimeout(context.confirmationTimeout)
      }

      if (error instanceof ApiError && error.status === 422) {
        toast.error(t`No se pudo enviar el mensaje: ${error.message}`)
        queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
          if (!old || !context?.clientMessageId)
            return context?.previousMessages ?? old
          return markMessageFailed(old, context.clientMessageId)
        })
        return
      }

      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
        if (!old || !context?.clientMessageId)
          return context?.previousMessages ?? old
        return markMessageFailed(old, context.clientMessageId)
      })
      toast.error(t`Error al enviar el mensaje. Intenta nuevamente.`)
    },

    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 422) return false
      return failureCount < MAX_RETRIES
    },

    retryDelay: (attemptIndex) => {
      return RETRY_BASE_MS * 2 ** attemptIndex
    },
  })
}

export function reconcileMessage(
  cache: MessagesInfiniteData,
  clientMessageId: string,
  confirmedMessage: MessageItem,
): MessagesInfiniteData {
  const pages = cache.pages.map((page) => ({
    ...page,
    data: {
      ...page.data,
      data: page.data.data.map((msg) =>
        msg.id === clientMessageId ? confirmedMessage : msg,
      ),
    },
  }))
  return { ...cache, pages }
}

export function markMessageFailed(
  cache: MessagesInfiniteData,
  clientMessageId: string,
): MessagesInfiniteData {
  const pages = cache.pages.map((page) => ({
    ...page,
    data: {
      ...page.data,
      data: page.data.data.map((msg) =>
        msg.id === clientMessageId
          ? { ...msg, id: `failed:${clientMessageId}` }
          : msg,
      ),
    },
  }))
  return { ...cache, pages }
}

export { appendMessageToCache }
