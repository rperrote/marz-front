import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { RequestChangesModal } from '../RequestChangesModal'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutate = vi.fn()
const mockRequestLinkChangesSubmit = vi.fn()
const mockTrackRequestChangesModalOpened = vi.fn()
const mockTrackRequestChangesModalDismissed = vi.fn()

vi.mock('#/features/deliverables/api/requestChanges', () => ({
  useRequestChangesMutation: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutate,
    isPending: false,
  }),
}))

vi.mock('#/features/deliverables/hooks/useRequestLinkChanges', () => ({
  useRequestLinkChanges: () => ({
    categories: new Set(['audio']),
    notes: '',
    canSubmit: true,
    submitStatus: 'idle',
    error: null,
    toggleCategory: vi.fn(),
    setNotes: vi.fn(),
    submit: mockRequestLinkChangesSubmit,
    reset: vi.fn(),
  }),
}))

vi.mock('../../analytics', () => ({
  trackRequestChangesModalOpened: (...args: unknown[]) =>
    mockTrackRequestChangesModalOpened(...args),
  trackRequestChangesModalDismissed: (...args: unknown[]) =>
    mockTrackRequestChangesModalDismissed(...args),
  trackChangeRequestSubmitted: vi.fn(),
}))

vi.mock('../InlineVideoPlayer', () => ({
  InlineVideoPlayer: vi.fn(() => <div data-testid="video-player" />),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderModal(
  props?: Partial<Parameters<typeof RequestChangesModal>[0]>,
) {
  return render(
    <RequestChangesModal
      title="Test Video"
      deliverableId="del-1"
      draftId="draft-1"
      playbackUrl="https://example.com/video.mp4"
      {...props}
    />,
    { wrapper: createWrapper() },
  )
}

describe('RequestChangesModal', () => {
  beforeEach(() => {
    vi.useRealTimers()
    mockMutate.mockReset()
    mockMutate.mockResolvedValue({ data: {}, status: 200 })
    mockRequestLinkChangesSubmit.mockClear()
    mockTrackRequestChangesModalOpened.mockClear()
    mockTrackRequestChangesModalDismissed.mockClear()
  })

  it('renders trigger button', () => {
    renderModal()
    expect(
      screen.getByRole('button', { name: /solicitar cambios/i }),
    ).toBeInTheDocument()
  })

  it('opens dialog on trigger click', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('Test Video').length).toBeGreaterThanOrEqual(1)
  })

  it('tracks opened and dismissed when closed without submit', async () => {
    const dateNowSpy = vi
      .spyOn(Date, 'now')
      .mockReturnValueOnce(Date.parse('2026-04-27T12:00:00Z'))
      .mockReturnValueOnce(Date.parse('2026-04-27T12:00:02Z'))
    const user = userEvent.setup()
    renderModal({
      analytics: {
        offerMode: 'same_content',
        deliverableIndex: 0,
        draftVersion: 1,
        roundIndex: 1,
      },
    })

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockTrackRequestChangesModalOpened).toHaveBeenCalledWith({
      actor_kind: 'brand',
      offer_mode: 'same_content',
      deliverable_index: 0,
      draft_version: 1,
    })
    expect(mockTrackRequestChangesModalDismissed).toHaveBeenCalledOnce()
    const dismissedPayload =
      mockTrackRequestChangesModalDismissed.mock.calls[0]![0]
    expect(dismissedPayload.actor_kind).toBe('brand')
    expect(dismissedPayload.time_in_modal_seconds).toBeGreaterThanOrEqual(0)
    expect(dismissedPayload).not.toHaveProperty('notes')
    dateNowSpy.mockRestore()
  })

  it('does not track dismissed after successful submit', async () => {
    mockMutate.mockResolvedValue({ data: {}, status: 200 })
    const user = userEvent.setup()
    renderModal({
      analytics: {
        offerMode: 'same_content',
        deliverableIndex: 0,
        draftVersion: 1,
        roundIndex: 1,
      },
    })

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /audio/i }))
    await user.click(
      screen.getByRole('button', { name: /solicitar cambios en el draft/i }),
    )

    expect(mockTrackRequestChangesModalDismissed).not.toHaveBeenCalled()
  })

  it('closes dialog on cancel click', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes dialog on Escape key', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders all 5 category chips', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))

    expect(
      screen.getByRole('button', { name: /ubicación del producto/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ritmo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /código de descuento/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /otro/i })).toBeInTheDocument()
  })

  it('toggles chip selection', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    const chip = screen.getByRole('button', { name: /ritmo/i })

    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables submit when no category is selected', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    const submitButton = screen.getByRole('button', {
      name: /solicitar cambios en el draft/i,
    })

    expect(submitButton).toHaveAttribute('disabled')
  })

  it('enables submit with a non-other category and empty notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /ritmo/i }))

    const submitButton = screen.getByRole('button', {
      name: /solicitar cambios en el draft/i,
    })
    expect(submitButton).not.toHaveAttribute('disabled')
  })

  it('disables submit when Other is selected and notes are empty', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /otro/i }))

    const submitButton = screen.getByRole('button', {
      name: /solicitar cambios en el draft/i,
    })
    expect(submitButton).toHaveAttribute('disabled')
  })

  it('enables submit when Other is selected with non-empty notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /otro/i }))
    await user.type(
      screen.getByLabelText(/notas adicionales/i),
      'Fix the intro please',
    )

    const submitButton = screen.getByRole('button', {
      name: /solicitar cambios en el draft/i,
    })
    expect(submitButton).not.toHaveAttribute('disabled')
  })

  it('shows character counter for notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.type(screen.getByLabelText(/notas adicionales/i), 'hello')

    expect(screen.getByText('5/4000')).toBeInTheDocument()
  })

  it('calls mutate on submit with selected categories and notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    await user.click(screen.getByRole('button', { name: /audio/i }))
    await user.type(screen.getByLabelText(/notas adicionales/i), 'Too loud')
    await user.click(
      screen.getByRole('button', { name: /solicitar cambios en el draft/i }),
    )

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const { body } = mockMutate.mock.calls[0]![0]
    expect(body.categories).toContain('audio')
    expect(body.notes).toBe('Too loud')
  })

  it('renders inline variant without dialog', () => {
    renderModal({ inline: true })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText('Test Video').length).toBeGreaterThanOrEqual(1)
  })

  it('renders video player when playbackUrl is provided', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /solicitar cambios/i }))
    expect(screen.getByTestId('video-player')).toBeInTheDocument()
  })

  it('renders placeholder when playbackUrl is missing', () => {
    renderModal({ playbackUrl: undefined, inline: true })
    expect(
      screen.getByRole('button', { name: /solicitar cambios en el draft/i }),
    ).toBeInTheDocument()
  })

  it('renders link target copy and submits through link changes flow', async () => {
    const user = userEvent.setup()
    renderModal({
      target: 'link',
      linkId: 'link-1',
      draftId: undefined,
      title: 'Solicitar cambios en el link',
      triggerLabel: 'Solicitar cambios en el link',
    })

    await user.click(
      screen.getByRole('button', { name: /solicitar cambios en el link/i }),
    )

    expect(
      screen.getAllByText('Solicitar cambios en el link').length,
    ).toBeGreaterThanOrEqual(1)

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /solicitar cambios en el link/i,
      }),
    )

    expect(mockRequestLinkChangesSubmit).toHaveBeenCalledTimes(1)
  })

  it('is axe-clean', async () => {
    const { container } = renderModal({ inline: true })
    const { axe } = await import('vitest-axe')
    expect(await axe(container)).toHaveNoViolations()
  })
})
