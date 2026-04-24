import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreatorOnboardingStore } from './store'
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
  useCompleteCreatorOnboarding: () => ({
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
  handle: 'test_creator',
  display_name: 'Test Creator',
  niches: ['fashion', 'beauty'],
  content_types: ['short_video'],
  country: 'AR',
  avatar_s3_key: 'avatars/abc.jpg',
  birthday: '1995-06-15',
  whatsapp_e164: '+5491155555555',
  experience_level: 'none' as const,
  tier: 'growing' as const,
  channels: [
    {
      platform: 'instagram',
      external_handle: '@test',
      verified: false,
      is_primary: true,
      rate_cards: [
        { format: 'ig_reel', rate_amount: '100.00', rate_currency: 'USD' },
      ],
    },
  ],
  best_videos: [
    { url: 'https://example.com/1', kind: 'organic' },
    { url: 'https://example.com/2', kind: 'branded' },
    { url: 'https://example.com/3', kind: 'organic' },
  ],
}

describe('useSubmitCreatorOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCreatorOnboardingStore.getState().reset()
  })

  async function loadAndRender() {
    const mod = await import('./useSubmitCreatorOnboarding')
    return renderHook(() => mod.useSubmitCreatorOnboarding(), {
      wrapper: createWrapper(),
    })
  }

  it('happy path: submit → success → reset → invalidate → navigate → track', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
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
      { data: expect.objectContaining({ handle: 'test_creator' }) },
      expect.any(Object),
    )
    expect(mockTrack).toHaveBeenCalledWith('onboarding_completed', {
      kind: 'creator',
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/offers' })

    const state = useCreatorOnboardingStore.getState()
    expect(state.handle).toBeUndefined()
    expect(state.currentStepIndex).toBe(0)
  })

  it('Zod parse fail: navigates to step with missing field', async () => {
    useCreatorOnboardingStore.setState({ handle: 'test' })

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockMutate).not.toHaveBeenCalled()

    const state = useCreatorOnboardingStore.getState()
    expect(Object.keys(state.fieldErrors).length).toBeGreaterThan(0)
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('409 handle_taken: sets handle error and navigates to name-handle step', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(
      409,
      'handle_taken',
      'Este handle ya está en uso',
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

    const state = useCreatorOnboardingStore.getState()
    expect(state.fieldErrors.handle).toBe('Este handle ya está en uso')
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/onboarding/creator/$step',
        params: { step: 'name-handle' },
      }),
    )
  })

  it('422 avatar_not_found: sets avatar error and navigates to avatar step', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(422, 'avatar_not_found', 'Avatar not found')
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

    const state = useCreatorOnboardingStore.getState()
    expect(state.fieldErrors.avatar_s3_key).toBe('Subí la foto de nuevo')
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/onboarding/creator/$step',
        params: { step: 'avatar' },
      }),
    )
  })

  it('422 validation_failed: sets field errors and navigates to first error step', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
    }

    const apiError = new ApiError(
      422,
      'validation_failed',
      'Validation failed',
      {
        field_errors: { niches: ['Niches inválidos'] },
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

    const state = useCreatorOnboardingStore.getState()
    expect(state.fieldErrors.niches).toBe('Niches inválidos')
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/onboarding/creator/$step',
        params: { step: 'niches' },
      }),
    )
  })

  it('409 invalid_state: refetches useMe and navigates to redirect_to', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
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
      useCreatorOnboardingStore.setState({ [key]: value })
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

  it('non-ApiError: shows generic toast error', async () => {
    for (const [key, value] of Object.entries(VALID_STATE)) {
      useCreatorOnboardingStore.setState({ [key]: value })
    }

    mockMutate.mockImplementation(
      (
        _data: unknown,
        opts: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        opts.onError?.(new Error('Network failure'))
      },
    )

    const { result } = await loadAndRender()
    act(() => result.current.submit())

    expect(mockToastError).toHaveBeenCalledWith(
      'Ocurrió un error inesperado. Intentá de nuevo.',
    )
  })
})
