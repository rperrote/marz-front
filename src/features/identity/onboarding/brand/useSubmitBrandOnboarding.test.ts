import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBrandOnboardingStore } from './store'
import { ApiError } from '#/shared/api/mutator'

const mockMutate = vi.fn()
const mockRefetch = vi.fn()
const mockNavigate = vi.fn()
const mockTrack = vi.fn()
const mockToastError = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('#/shared/api/generated/onboarding/onboarding', () => ({
  useCompleteBrandOnboarding: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => ({ data: null, refetch: mockRefetch }),
  getMeQueryKey: () => ['/v1/me'],
}))

vi.mock('#/shared/analytics/track', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const VALID_STATE = {
  name: 'Test Brand',
  website_url: null,
  primary_color_hex: null,
  secondary_color_hex: null,
  brandfetch_snapshot: null,
  vertical: 'tech' as const,
  marketing_objective: 'awareness' as const,
  creator_experience: 'never' as const,
  creator_sourcing_intent: 'already_have' as const,
  monthly_budget_range: 'under_10k' as const,
  timing: 'exploring' as const,
  attribution: { source: 'search' as const },
  contact_name: 'John Doe',
  contact_title: 'CEO',
  contact_whatsapp_e164: '+5491155551234',
}

describe('useSubmitBrandOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBrandOnboardingStore.getState().reset()
  })

  async function loadAndRender() {
    const mod = await import('./useSubmitBrandOnboarding')
    return renderHook(() => mod.useSubmitBrandOnboarding(), {
      wrapper: createWrapper(),
    })
  }

  it('happy path: submit → success → reset → invalidate → navigate → track', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useBrandOnboardingStore.setState({ [key]: value })
    }

    mockMutate.mockImplementation(
      (
        _data: unknown,
        opts: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        opts.onSuccess?.()
      },
    )

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockMutate).toHaveBeenCalledWith(
      { data: expect.objectContaining({ name: 'Test Brand' }) },
      expect.any(Object),
    )
    expect(mockTrack).toHaveBeenCalledWith('onboarding_completed', {
      kind: 'brand',
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/campaigns' })

    const state = useBrandOnboardingStore.getState()
    expect(state.name).toBeUndefined()
    expect(state.currentStepIndex).toBe(0)
  })

  it('Zod parse fail: navigates to step with missing field', async () => {
    useBrandOnboardingStore.setState({ name: 'Brand' })

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockMutate).not.toHaveBeenCalled()

    const state = useBrandOnboardingStore.getState()
    expect(Object.keys(state.fieldErrors).length).toBeGreaterThan(0)
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('422: sets field errors inline and navigates to first error step', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useBrandOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(
      422,
      'validation_failed',
      'Validation failed',
      {
        field_errors: { vertical: ['Vertical inválido'] },
      },
    )
    mockMutate.mockImplementation(
      (
        _data: unknown,
        opts: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        opts.onError?.(apiError)
      },
    )

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    const state = useBrandOnboardingStore.getState()
    expect(state.fieldErrors.vertical).toBe('Vertical inválido')
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/onboarding/brand/$step',
        params: { step: 'vertical' },
      }),
    )
  })

  it('409: refetches useMe and navigates to redirect_to', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useBrandOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(409, 'invalid_state', 'Already onboarded')
    mockMutate.mockImplementation(
      (
        _data: unknown,
        opts: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        opts.onError?.(apiError)
      },
    )
    mockRefetch.mockResolvedValue({
      data: { status: 200, data: { redirect_to: '/dashboard' } },
    })

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockRefetch).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
    })
  })

  it('500: shows generic toast error', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useBrandOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(500, 'internal', 'Server error')
    mockMutate.mockImplementation(
      (
        _data: unknown,
        opts: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        opts.onError?.(apiError)
      },
    )

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockToastError).toHaveBeenCalledWith(
      'Ocurrió un error inesperado. Intentá de nuevo.',
    )
  })
})
