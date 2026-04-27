import type { InfiniteData } from '@tanstack/react-query'

import type {
  ConversationLastMessagePreview,
  ConversationListItem,
  ConversationListResponse,
} from './types'

export interface ConversationActivityPayload {
  conversation_id: string
  last_activity_at: string
  last_message_id: string
  last_message_preview: ConversationLastMessagePreview
  unread_count_delta: number
}

type InfiniteConversations = InfiniteData<
  { data: ConversationListResponse },
  string | undefined
>

export function applyActivityUpdate(
  data: InfiniteConversations,
  payload: ConversationActivityPayload,
): InfiniteConversations {
  let found: ConversationListItem | undefined
  let foundPageIndex = -1
  let foundItemIndex = -1

  for (let pi = 0; pi < data.pages.length; pi++) {
    const page = data.pages[pi]!
    const items = page.data.data
    for (let ii = 0; ii < items.length; ii++) {
      if (items[ii]!.id === payload.conversation_id) {
        found = items[ii]!
        foundPageIndex = pi
        foundItemIndex = ii
        break
      }
    }
    if (found) break
  }

  if (!found) return data

  const updatedItem: ConversationListItem = {
    ...found,
    last_activity_at: payload.last_activity_at,
    last_message_preview: payload.last_message_preview,
    unread_count: payload.last_message_preview.author_is_self
      ? found.unread_count
      : found.unread_count + payload.unread_count_delta,
  }

  const newPages = data.pages.map((page, pi) => {
    if (pi === 0 && foundPageIndex === 0) {
      const newItems = [...page.data.data]
      newItems.splice(foundItemIndex, 1)
      newItems.unshift(updatedItem)
      return { ...page, data: { ...page.data, data: newItems } }
    }

    if (pi === 0 && foundPageIndex !== 0) {
      return {
        ...page,
        data: { ...page.data, data: [updatedItem, ...page.data.data] },
      }
    }

    if (pi === foundPageIndex && foundPageIndex !== 0) {
      const newItems = [...page.data.data]
      newItems.splice(foundItemIndex, 1)
      return { ...page, data: { ...page.data, data: newItems } }
    }

    return page
  })

  return { ...data, pages: newPages }
}
