import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
const mockTrackRequestChangesModalOpened = vi.fn()
const mockTrackRequestChangesModalDismissed = vi.fn()

vi.mock('#/features/deliverables/api/requestChanges', () => ({
  useRequestChangesMutation: () => ({
    mutate: mockMutate,
    isPending: false,
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
    mockTrackRequestChangesModalOpened.mockClear()
    mockTrackRequestChangesModalDismissed.mockClear()
  })

  it('renders trigger button', () => {
    renderModal()
    expect(
      screen.getByRole('button', { name: /request changes/i }),
    ).toBeInTheDocument()
  })

  it('opens dialog on trigger click', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
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
        offerType: 'single',
        deliverableIndex: 0,
        draftVersion: 1,
        roundIndex: 1,
      },
    })

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockTrackRequestChangesModalOpened).toHaveBeenCalledWith({
      actor_kind: 'brand',
      offer_type: 'single',
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
    mockMutate.mockImplementation((_vars, options) => {
      options.onSuccess()
    })
    const user = userEvent.setup()
    renderModal({
      analytics: {
        offerType: 'single',
        deliverableIndex: 0,
        draftVersion: 1,
        roundIndex: 1,
      },
    })

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /audio/i }))
    await user.click(screen.getByRole('button', { name: /send request/i }))

    expect(mockTrackRequestChangesModalDismissed).not.toHaveBeenCalled()
  })

  it('closes dialog on cancel click', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes dialog on Escape key', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders all 5 category chips', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))

    expect(
      screen.getByRole('button', { name: /product placement/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pacing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /discount code/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /other/i })).toBeInTheDocument()
  })

  it('toggles chip selection', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    const chip = screen.getByRole('button', { name: /pacing/i })

    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables submit when no category is selected', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    const submitButton = screen.getByRole('button', { name: /send request/i })

    expect(submitButton).toHaveAttribute('disabled')
  })

  it('enables submit with a non-other category and empty notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /pacing/i }))

    const submitButton = screen.getByRole('button', { name: /send request/i })
    expect(submitButton).not.toHaveAttribute('disabled')
  })

  it('disables submit when Other is selected and notes are empty', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /other/i }))

    const submitButton = screen.getByRole('button', { name: /send request/i })
    expect(submitButton).toHaveAttribute('disabled')
  })

  it('enables submit when Other is selected with non-empty notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /other/i }))
    await user.type(
      screen.getByLabelText(/additional notes/i),
      'Fix the intro please',
    )

    const submitButton = screen.getByRole('button', { name: /send request/i })
    expect(submitButton).not.toHaveAttribute('disabled')
  })

  it('shows character counter for notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.type(screen.getByLabelText(/additional notes/i), 'hello')

    expect(screen.getByText('5/4000')).toBeInTheDocument()
  })

  it('calls mutate on submit with selected categories and notes', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    await user.click(screen.getByRole('button', { name: /audio/i }))
    await user.type(screen.getByLabelText(/additional notes/i), 'Too loud')
    await user.click(screen.getByRole('button', { name: /send request/i }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const { body } = mockMutate.mock.calls[0]![0]
    expect(body.categories).toContain('audio')
    expect(body.notes).toBe('Too loud')
  })

  it('renders inline variant without dialog', () => {
    renderModal({ inline: true })

    expect(
      screen.queryByRole('button', { name: /request changes/i }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText('Test Video').length).toBeGreaterThanOrEqual(1)
  })

  it('renders video player when playbackUrl is provided', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /request changes/i }))
    expect(screen.getByTestId('video-player')).toBeInTheDocument()
  })

  it('renders placeholder when playbackUrl is missing', () => {
    renderModal({ playbackUrl: undefined, inline: true })
    expect(
      screen.getByRole('button', { name: /send request/i }),
    ).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = renderModal({ inline: true })
    const { axe } = await import('vitest-axe')
    expect(await axe(container)).toHaveNoViolations()
  })
})
