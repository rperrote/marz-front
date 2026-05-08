// Analytics soft-disabled: backend endpoint not yet defined in OpenAPI.
// Re-enable by routing through the Orval-generated client once the endpoint exists.

type LengthBucket = '<50' | '50-200' | '200-500' | '500-2000' | '2000+'

type PresenceState = 'online' | 'offline' | 'disconnected'

interface ConversationOpenedPayload {
  conversation_id: string
  counterpart_kind: 'brand_workspace' | 'creator_profile'
  has_unread: boolean
}

interface MessageSentPayload {
  conversation_id: string
  length_bucket: LengthBucket
  idempotent_replay: boolean
}

interface MessageReceivedLivePayload {
  conversation_id: string
  latency_ms_estimate: number
}

interface HistoryPageLoadedPayload {
  conversation_id: string
  page_index: number
  items_count: number
}

interface PresenceStateChangedPayload {
  conversation_id: string
  counterpart_account_id: string
  state: PresenceState
}

interface ChatEventMap {
  conversation_opened: ConversationOpenedPayload
  message_sent: MessageSentPayload
  message_received_live: MessageReceivedLivePayload
  history_page_loaded: HistoryPageLoadedPayload
  presence_state_changed: PresenceStateChangedPayload
}

export type ChatEventName = keyof ChatEventMap

export function trackChatEvent<TEvent extends ChatEventName>(
  _name: TEvent,
  _payload: ChatEventMap[TEvent],
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}

export function toLengthBucket(length: number): LengthBucket {
  if (length < 50) return '<50'
  if (length <= 200) return '50-200'
  if (length <= 500) return '200-500'
  if (length <= 2000) return '500-2000'
  return '2000+'
}

export function estimateLatencyMs(serverCreatedAt: string): number {
  return Math.max(0, Date.now() - new Date(serverCreatedAt).getTime())
}
