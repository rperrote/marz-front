import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  listInbox,
  markInboxItemRead as generatedMarkInboxItemRead,
  markInboxRead as generatedMarkInboxVisibleRead,
} from '#/shared/api/generated/notifications/notifications'
import type {
  InboxInlineAction,
  InboxItem,
  InboxItemKind,
  InboxNavigationAction,
  InboxResponse,
  MarkInboxItemReadRequest,
  MarkInboxItemReadResponse,
  MarkInboxReadRequest,
  MarkInboxReadResponse,
} from '#/shared/api/generated/model'

export type {
  InboxInlineAction,
  InboxItem,
  InboxItemKind,
  InboxNavigationAction,
  InboxResponse,
  MarkInboxItemReadRequest,
  MarkInboxItemReadResponse,
}

export type MarkInboxVisibleReadRequest = MarkInboxReadRequest
export type MarkInboxVisibleReadResponse = MarkInboxReadResponse
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type SerializableInboxInlineAction = Omit<
  InboxInlineAction,
  'request_schema'
> & {
  request_schema: { [key: string]: JsonValue }
}

type SerializableInboxItem = Omit<InboxItem, 'inline_actions'> & {
  inline_actions: SerializableInboxInlineAction[]
}

export type SerializableInboxResponse = Omit<
  InboxResponse,
  'action_items' | 'waiting_items'
> & {
  action_items: SerializableInboxItem[]
  waiting_items: SerializableInboxItem[]
}

export const inboxQueryKey = ['inbox'] as const

export function getInboxQueryKey(campaignId?: string | null) {
  return [...inboxQueryKey, campaignId ?? null] as const
}

export const getInboxInputSchema = z.object({
  campaign_id: z.string().uuid().optional(),
})

export const markInboxItemReadInputSchema = z.object({
  item_id: z.string().uuid(),
  read_reason: z.enum(['manual', 'resolved_elsewhere']).optional(),
})

export const markInboxVisibleReadInputSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  sections: z.array(z.enum(['action', 'waiting'])).optional(),
})

export type GetInboxInput = z.infer<typeof getInboxInputSchema>
export type MarkInboxItemReadInput = z.infer<
  typeof markInboxItemReadInputSchema
>
export type MarkInboxVisibleReadInput = z.infer<
  typeof markInboxVisibleReadInputSchema
>

export function createInboxIdempotencyKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let timestamp = BigInt(Date.now())

  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn)
    timestamp >>= 8n
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function fetchInbox(
  input: GetInboxInput = {},
): Promise<InboxResponse> {
  const response = await listInbox(input)
  return response.data as InboxResponse
}

export async function markInboxItemRead(
  input: MarkInboxItemReadInput,
): Promise<MarkInboxItemReadResponse> {
  const response = await generatedMarkInboxItemRead(
    input.item_id,
    { read_reason: input.read_reason },
    { headers: { 'Idempotency-Key': createInboxIdempotencyKey() } },
  )
  return response.data as MarkInboxItemReadResponse
}

export async function markInboxVisibleRead(
  input: MarkInboxVisibleReadInput,
): Promise<MarkInboxVisibleReadResponse> {
  const response = await generatedMarkInboxVisibleRead(
    {
      campaign_id: input.campaign_id,
      sections: input.sections,
    },
    { headers: { 'Idempotency-Key': createInboxIdempotencyKey() } },
  )
  return response.data as MarkInboxVisibleReadResponse
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue)
  }

  if (typeof value === 'object') {
    return toJsonObject(value)
  }

  return null
}

function toJsonObject(value: object): { [key: string]: JsonValue } {
  const jsonObject: { [key: string]: JsonValue } = {}

  for (const [key, child] of Object.entries(value)) {
    jsonObject[key] = toJsonValue(child)
  }

  return jsonObject
}

function serializeInboxItem(item: InboxItem): SerializableInboxItem {
  return {
    ...item,
    inline_actions: item.inline_actions.map((action) => ({
      ...action,
      request_schema: toJsonObject(action.request_schema),
    })),
  }
}

function serializeInboxResponse(
  response: InboxResponse,
): SerializableInboxResponse {
  return {
    ...response,
    action_items: response.action_items.map(serializeInboxItem),
    waiting_items: response.waiting_items.map(serializeInboxItem),
  }
}

export const getInbox = createServerFn({ method: 'GET' })
  .inputValidator(getInboxInputSchema)
  .handler(async ({ data }) => serializeInboxResponse(await fetchInbox(data)))

export const markInboxItemReadServerFn = createServerFn({ method: 'POST' })
  .inputValidator(markInboxItemReadInputSchema)
  .handler(({ data }) => markInboxItemRead(data))

export const markInboxVisibleReadServerFn = createServerFn({ method: 'POST' })
  .inputValidator(markInboxVisibleReadInputSchema)
  .handler(({ data }) => markInboxVisibleRead(data))
