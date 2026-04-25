import { describe, it, expect } from 'vitest'
import { firstErrorMessage } from './firstErrorMessage'

describe('firstErrorMessage', () => {
  it('returns undefined for empty array', () => {
    expect(firstErrorMessage([])).toBeUndefined()
  })

  it('returns string error directly', () => {
    expect(firstErrorMessage(['Inválido'])).toBe('Inválido')
  })

  it('extracts message from Standard Schema issue', () => {
    expect(
      firstErrorMessage([{ message: 'Email inválido', path: ['email'] }]),
    ).toBe('Email inválido')
  })

  it('skips null/undefined entries', () => {
    expect(firstErrorMessage([null, undefined, 'real'])).toBe('real')
  })

  it('skips entries without message', () => {
    expect(firstErrorMessage([{ code: 'x' }, 'fallback'])).toBe('fallback')
  })
})
