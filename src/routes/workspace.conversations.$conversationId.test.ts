import { describe, expect, it, vi } from 'vitest'

import { conversationSearchSchema } from './workspace.conversations.$conversationId'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

describe('/workspace/conversations/$conversationId route', () => {
  it('accepts an optional highlightPaymentId uuid search param', () => {
    expect(conversationSearchSchema.parse({})).toEqual({})
    expect(
      conversationSearchSchema.parse({
        highlightPaymentId: '33333333-3333-4333-8333-333333333333',
      }),
    ).toEqual({
      highlightPaymentId: '33333333-3333-4333-8333-333333333333',
    })
  })

  it('rejects invalid highlightPaymentId values', () => {
    expect(() =>
      conversationSearchSchema.parse({ highlightPaymentId: 'payment-1' }),
    ).toThrow()
  })
})
