import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import {
  getCreatorEarningsQueryKey,
  useCreatorEarningsQuery,
} from '../useCreatorEarnings'
import { Route } from '#/routes/_creator/earnings'

const { mockUseGetCreatorEarnings } = vi.hoisted(() => ({
  mockUseGetCreatorEarnings: vi.fn(),
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  useGetCreatorEarnings: mockUseGetCreatorEarnings,
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}))

interface SearchValidator {
  parse: (search: unknown) => unknown
}

function validateEarningsSearch(search: unknown) {
  const validateSearch = (Route.options as { validateSearch: SearchValidator })
    .validateSearch
  return validateSearch.parse(search)
}

describe('useCreatorEarningsQuery', () => {
  it('builds the expected query key shape', () => {
    expect(
      getCreatorEarningsQueryKey({
        period: '90d',
        q: 'invoice',
        cursor: 'cursor-1',
        limit: 50,
      }),
    ).toEqual(['creator-earnings', '90d', 'invoice', 'cursor-1', 50])
  })

  it('passes cursor through to the generated Orval hook', () => {
    useCreatorEarningsQuery({
      period: '30d',
      q: 'brand',
      cursor: 'next-page',
      limit: 25,
    })

    expect(mockUseGetCreatorEarnings).toHaveBeenCalledWith(
      {
        period: '30d',
        q: 'brand',
        cursor: 'next-page',
        limit: 25,
      },
      expect.objectContaining({
        query: expect.objectContaining({
          queryKey: ['creator-earnings', '30d', 'brand', 'next-page', 25],
        }),
      }),
    )
  })
})

describe('/earnings validateSearch', () => {
  it('normalizes invalid period to 30d', () => {
    expect(validateEarningsSearch({ period: 'bad-period' })).toEqual({
      period: '30d',
    })
  })

  it('rejects q longer than 120 chars', () => {
    expect(() =>
      validateEarningsSearch({ period: '30d', q: 'x'.repeat(121) }),
    ).toThrow()
  })
})
