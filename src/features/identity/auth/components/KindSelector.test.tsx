import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { KindSelector } from './KindSelector'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

const mockNavigate = vi.fn()
const mockMutate = vi.fn()
const mockRefetchQueries = vi.fn()

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      refetchQueries: mockRefetchQueries,
    }),
  }
})

let mutationIsPending = false

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
  useSelectKind: () => ({
    mutate: mockMutate,
    isPending: mutationIsPending,
  }),
}))

function renderSelector() {
  return renderWithProviders(<KindSelector />)
}

describe('KindSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
    mutationIsPending = false
    mockRefetchQueries.mockResolvedValue(undefined)
  })

  it('renders 3 cards with agency disabled', async () => {
    renderSelector()

    expect(await screen.findByText('Soy una marca')).toBeInTheDocument()
    expect(screen.getByText('Soy creador')).toBeInTheDocument()
    expect(screen.getByText('Soy una agencia')).toBeInTheDocument()

    const agencyCard = screen.getByText('Soy una agencia').closest('button')!
    expect(agencyCard).toBeDisabled()
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })

  it('selects brand card and shows pressed state', async () => {
    const user = userEvent.setup()
    renderSelector()

    const brandCard = (await screen.findByText('Soy una marca')).closest(
      'button',
    )!
    await user.click(brandCard)

    expect(brandCard).toHaveAttribute('aria-pressed', 'true')
  })

  it('selects creator card and shows pressed state', async () => {
    const user = userEvent.setup()
    renderSelector()

    const creatorCard = (await screen.findByText('Soy creador')).closest(
      'button',
    )!
    await user.click(creatorCard)

    expect(creatorCard).toHaveAttribute('aria-pressed', 'true')
  })

  it('submit button is disabled when nothing is selected', async () => {
    renderSelector()

    const submitBtn = await screen.findByRole('button', {
      name: /continuar/i,
    })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is disabled when agency is selected', async () => {
    renderSelector()

    const submitBtn = await screen.findByRole('button', {
      name: /continuar/i,
    })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is disabled when mutation is pending', async () => {
    mutationIsPending = true
    renderSelector()

    const submitBtn = await screen.findByRole('button', {
      name: /continuar/i,
    })
    expect(submitBtn).toBeDisabled()
  })

  it('calls mutation with brand kind on submit', async () => {
    const user = userEvent.setup()
    renderSelector()

    const brandCard = (await screen.findByText('Soy una marca')).closest(
      'button',
    )!
    await user.click(brandCard)

    const submitBtn = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitBtn)

    expect(mockMutate).toHaveBeenCalledWith(
      { data: { kind: 'brand' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
  })

  it('calls mutation with creator kind on submit', async () => {
    const user = userEvent.setup()
    renderSelector()

    const creatorCard = (await screen.findByText('Soy creador')).closest(
      'button',
    )!
    await user.click(creatorCard)

    const submitBtn = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitBtn)

    expect(mockMutate).toHaveBeenCalledWith(
      { data: { kind: 'creator' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
  })

  describe('onSuccess', () => {
    async function submitBrand() {
      const user = userEvent.setup()
      renderSelector()

      const brandCard = (await screen.findByText('Soy una marca')).closest(
        'button',
      )!
      await user.click(brandCard)

      const submitBtn = screen.getByRole('button', { name: /continuar/i })
      await user.click(submitBtn)

      const { onSuccess } = mockMutate.mock.calls[0]![1] as {
        onSuccess: (response: {
          status: number
          data: { redirect_to: string | null }
        }) => Promise<void>
      }
      return onSuccess
    }

    it('navigates to server redirect_to on success', async () => {
      const onSuccess = await submitBrand()

      await onSuccess({
        status: 200,
        data: { redirect_to: '/onboarding/brand' },
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith({
        queryKey: ['/v1/me'],
      })
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/onboarding/brand',
      })
    })

    it('navigates to /onboarding/{kind} when server has no redirect_to', async () => {
      const onSuccess = await submitBrand()

      await onSuccess({
        status: 200,
        data: { redirect_to: null },
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/onboarding/brand',
      })
    })

    it('fires kind_selected analytics on success', async () => {
      const onSuccess = await submitBrand()

      await onSuccess({
        status: 200,
        data: { redirect_to: '/onboarding/brand' },
      })

      const events = getTrackedEvents()
      const kindEvent = events.find((e) => e.event === 'kind_selected')
      expect(kindEvent).toBeDefined()
      expect(kindEvent?.payload).toEqual({ kind: 'brand' })
    })
  })

  describe('onError', () => {
    async function submitCreatorAndGetOnError() {
      const user = userEvent.setup()
      renderSelector()

      const creatorCard = (await screen.findByText('Soy creador')).closest(
        'button',
      )!
      await user.click(creatorCard)

      const submitBtn = screen.getByRole('button', { name: /continuar/i })
      await user.click(submitBtn)

      const { onError } = mockMutate.mock.calls[0]![1] as {
        onError: (err: unknown) => Promise<void>
      }
      return onError
    }

    it('handles 409 kind_already_set: refetch + navigate without loop', async () => {
      const { ApiError } = await import('#/shared/api/mutator')
      const onError = await submitCreatorAndGetOnError()

      await onError(new ApiError(409, 'kind_already_set', 'Kind already set'))

      expect(mockRefetchQueries).toHaveBeenCalledWith({
        queryKey: ['/v1/me'],
      })
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/onboarding/creator',
      })
    })

    it('does not fire kind_selected analytics on 409', async () => {
      const { ApiError } = await import('#/shared/api/mutator')
      const onError = await submitCreatorAndGetOnError()

      await onError(new ApiError(409, 'kind_already_set', 'Kind already set'))

      const events = getTrackedEvents()
      expect(events.some((e) => e.event === 'kind_selected')).toBe(false)
    })

    it('shows inline error on 422 invalid_kind', async () => {
      const { ApiError } = await import('#/shared/api/mutator')
      const onError = await submitCreatorAndGetOnError()

      await onError(
        new ApiError(422, 'invalid_kind', 'El tipo de cuenta no es válido'),
      )

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(
        await screen.findByText('El tipo de cuenta no es válido'),
      ).toBeInTheDocument()
    })

    it('shows generic error on unexpected error', async () => {
      const onError = await submitCreatorAndGetOnError()

      await onError(new Error('Network error'))

      expect(
        await screen.findByText('Algo salió mal. Intentá de nuevo.'),
      ).toBeInTheDocument()
    })
  })

  it('is axe-clean', async () => {
    const { container } = renderSelector()
    await screen.findByText('Soy una marca')
    expect(await axe(container)).toHaveNoViolations()
  })
})
