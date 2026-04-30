import { describe, expect, it } from 'vitest'

import type { MessageItem } from '../types'

import { groupByDay } from './groupByDay'

function buildMessage(overrides: Partial<MessageItem> = {}): MessageItem {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    author_account_id: 'acc-1',
    type: 'text',
    text_content: 'hello',
    event_type: null,
    payload: null,
    created_at: '2026-04-27T15:00:00Z',
    read_by_self: false,
    ...overrides,
  }
}

describe('groupByDay', () => {
  const today = new Date('2026-04-27T18:00:00Z')

  it('returns empty array for no messages', () => {
    expect(groupByDay([], today)).toEqual([])
  })

  it('labels today messages as "Hoy"', () => {
    const messages = [buildMessage({ created_at: '2026-04-27T10:00:00Z' })]
    const items = groupByDay(messages, today)

    expect(items[0]).toEqual({
      kind: 'day-separator',
      label: 'Hoy',
      date: expect.any(String),
    })
    expect(items[1]).toEqual({ kind: 'message', message: messages[0] })
  })

  it('labels yesterday messages as "Ayer"', () => {
    const messages = [buildMessage({ created_at: '2026-04-26T22:00:00Z' })]
    const items = groupByDay(messages, today)

    expect(items[0]).toMatchObject({ kind: 'day-separator', label: 'Ayer' })
  })

  it('labels older messages as "DD mon"', () => {
    const messages = [buildMessage({ created_at: '2026-03-15T12:00:00Z' })]
    const items = groupByDay(messages, today)

    expect(items[0]).toMatchObject({ kind: 'day-separator', label: '15 mar' })
  })

  it('groups consecutive same-day messages under one separator', () => {
    const messages = [
      buildMessage({ id: 'msg-1', created_at: '2026-04-27T10:00:00Z' }),
      buildMessage({ id: 'msg-2', created_at: '2026-04-27T11:00:00Z' }),
      buildMessage({ id: 'msg-3', created_at: '2026-04-27T14:00:00Z' }),
    ]
    const items = groupByDay(messages, today)

    expect(items).toHaveLength(4)
    expect(items[0]).toMatchObject({ kind: 'day-separator', label: 'Hoy' })
    expect(items[1]).toMatchObject({ kind: 'message' })
    expect(items[2]).toMatchObject({ kind: 'message' })
    expect(items[3]).toMatchObject({ kind: 'message' })
  })

  it('inserts separator on day change', () => {
    const messages = [
      buildMessage({ id: 'msg-1', created_at: '2026-04-26T12:00:00Z' }),
      buildMessage({ id: 'msg-2', created_at: '2026-04-27T12:00:00Z' }),
    ]
    const items = groupByDay(messages, today)

    expect(items).toHaveLength(4)
    expect(items[0]).toMatchObject({ kind: 'day-separator', label: 'Ayer' })
    expect(items[1]).toMatchObject({ kind: 'message' })
    expect(items[2]).toMatchObject({ kind: 'day-separator', label: 'Hoy' })
    expect(items[3]).toMatchObject({ kind: 'message' })
  })
})
