import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useCanSendOffer } from './useCanSendOffer'

let mockMeData: unknown = undefined
let mockCampaignsData: unknown = undefined

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => ({ data: mockMeData }),
}))

vi.mock('./useActiveCampaigns', () => ({
  useActiveCampaigns: () => ({ data: mockCampaignsData }),
}))

describe('useCanSendOffer', () => {
  beforeEach(() => {
    mockMeData = undefined
    mockCampaignsData = undefined
  })

  it('shows for brand owner only', () => {
    mockMeData = {
      status: 200,
      data: { kind: 'brand' },
    }
    mockCampaignsData = [
      {
        id: 'camp-1',
        name: 'Summer',
        status: 'active' as const,
        budget_currency: 'USD',
        budget_remaining: '1000',
      },
    ]

    const { result } = renderHook(() =>
      useCanSendOffer({ conversationId: 'conv-1' }),
    )

    expect(result.current).toEqual({ visible: true, disabled: false })
  })

  it('disabled with tooltip when no active campaigns', () => {
    mockMeData = {
      status: 200,
      data: { kind: 'brand' },
    }
    mockCampaignsData = []

    const { result } = renderHook(() =>
      useCanSendOffer({ conversationId: 'conv-1' }),
    )

    expect(result.current).toEqual({
      visible: true,
      disabled: true,
      reason: 'no-active-campaigns',
    })
  })

  it('hidden for creators', () => {
    mockMeData = {
      status: 200,
      data: { kind: 'creator' },
    }
    mockCampaignsData = [
      {
        id: 'camp-1',
        name: 'Summer',
        status: 'active' as const,
        budget_currency: 'USD',
        budget_remaining: '1000',
      },
    ]

    const { result } = renderHook(() =>
      useCanSendOffer({ conversationId: 'conv-1' }),
    )

    expect(result.current).toEqual({ visible: false, disabled: false })
  })

  it('hidden when me is not loaded', () => {
    mockMeData = undefined
    mockCampaignsData = []

    const { result } = renderHook(() =>
      useCanSendOffer({ conversationId: 'conv-1' }),
    )

    expect(result.current).toEqual({ visible: false, disabled: false })
  })

  it.todo('hidden for non-owner roles')
})
