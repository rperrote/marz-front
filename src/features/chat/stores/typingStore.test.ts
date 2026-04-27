import { describe, it, expect, beforeEach } from 'vitest'

import { useTypingStore } from './typingStore'

beforeEach(() => {
  useTypingStore.setState({ entries: {} })
})

describe('typingStore', () => {
  it('adds a typing actor to a conversation', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')

    const actors = useTypingStore.getState().entries['conv-1']
    expect(actors?.has('acc-1')).toBe(true)
  })

  it('does not duplicate an actor already typing', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    const before = useTypingStore.getState().entries['conv-1']

    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    const after = useTypingStore.getState().entries['conv-1']

    expect(before).toBe(after)
  })

  it('clears a typing actor', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    useTypingStore.getState().clearTyping('conv-1', 'acc-1')

    const actors = useTypingStore.getState().entries['conv-1']
    expect(actors?.has('acc-1')).toBe(false)
  })

  it('handles clearing an actor that was not typing', () => {
    useTypingStore.getState().clearTyping('conv-1', 'acc-unknown')

    const actors = useTypingStore.getState().entries['conv-1']
    expect(actors).toBeUndefined()
  })

  it('tracks multiple actors in the same conversation', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    useTypingStore.getState().setTyping('conv-1', 'acc-2')

    const actors = useTypingStore.getState().entries['conv-1']
    expect(actors?.size).toBe(2)
    expect(actors?.has('acc-1')).toBe(true)
    expect(actors?.has('acc-2')).toBe(true)
  })

  it('tracks actors across different conversations', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    useTypingStore.getState().setTyping('conv-2', 'acc-2')

    expect(useTypingStore.getState().entries['conv-1']?.has('acc-1')).toBe(true)
    expect(useTypingStore.getState().entries['conv-2']?.has('acc-2')).toBe(true)
  })

  it('returns empty set for conversation with no typing actors', () => {
    const actors = useTypingStore.getState().entries['conv-nonexistent']
    expect(actors).toBeUndefined()
  })

  it('clears all entries', () => {
    useTypingStore.getState().setTyping('conv-1', 'acc-1')
    useTypingStore.getState().setTyping('conv-2', 'acc-2')
    useTypingStore.getState().clearAll()

    expect(useTypingStore.getState().entries).toEqual({})
  })
})
