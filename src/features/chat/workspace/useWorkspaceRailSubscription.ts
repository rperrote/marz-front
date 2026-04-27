import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'

import { useWebSocket } from '#/shared/ws/useWebSocket'
import type { DomainEventEnvelope, EventHandler } from '#/shared/ws/events'

import type { ConversationListResponse } from './types'
import type { ConversationActivityPayload } from './conversationRailPatcher'
import { applyActivityUpdate } from './conversationRailPatcher'

const CONVERSATIONS_BASE_KEY = 'conversations'

interface UseWorkspaceRailSubscriptionOptions {
  enabled?: boolean
}

export function useWorkspaceRailSubscription({
  enabled = false,
}: UseWorkspaceRailSubscriptionOptions = {}) {
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient

  const previousStatusRef = useRef<string>('idle')

  const { status, send } = useWebSocket({
    handlers: {
      'conversation.activity_updated': ((envelope) => {
        const typed =
          envelope as DomainEventEnvelope<ConversationActivityPayload>
        if (typeof typed.payload.conversation_id !== 'string') return
        queryClientRef.current.setQueriesData<
          InfiniteData<{ data: ConversationListResponse }, string | undefined>
        >({ queryKey: [CONVERSATIONS_BASE_KEY] }, (old) => {
          if (!old) return old
          return applyActivityUpdate(old, typed.payload)
        })
      }) satisfies EventHandler,
    },
    enabled,
  })

  useEffect(() => {
    if (status === 'open') {
      send({ type: 'subscribe', topic: 'workspace_rail' })
    }
  }, [status, send])

  useEffect(() => {
    if (previousStatusRef.current === 'closed' && status === 'open') {
      queryClientRef.current.invalidateQueries({
        queryKey: [CONVERSATIONS_BASE_KEY],
      })
    }
    previousStatusRef.current = status
  }, [status])

  useEffect(() => {
    if (!enabled) return

    function handleFocus() {
      queryClientRef.current.invalidateQueries({
        queryKey: [CONVERSATIONS_BASE_KEY],
      })
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled])

  return { status }
}
