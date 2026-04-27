import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { ApproveDraftButton } from '../ApproveDraftButton'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutate = vi.fn()

vi.mock('../../hooks/useApproveDraft', () => ({
  useApproveDraft: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

const mockUseGetConversationDeliverablesQuery = vi.fn()

vi.mock('../../api/draftUpload', () => ({
  useGetConversationDeliverablesQuery: (...args: unknown[]) =>
    mockUseGetConversationDeliverablesQuery(...args),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderButton(
  props?: Partial<Parameters<typeof ApproveDraftButton>[0]>,
) {
  return render(
    <ApproveDraftButton
      deliverableId="del-1"
      conversationId="conv-1"
      version={1}
      {...props}
    />,
    { wrapper: createWrapper() },
  )
}

describe('ApproveDraftButton', () => {
  beforeEach(() => {
    mockMutate.mockClear()
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: { data: { data: [{ id: 'del-1', current_version: 1 }] } },
    })
  })

  it('renders enabled when version matches current', () => {
    renderButton()

    const button = screen.getByRole('button', { name: /approve draft/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toHaveAttribute('disabled')
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('is disabled when version is stale', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: { data: { data: [{ id: 'del-1', current_version: 2 }] } },
    })

    renderButton()

    const button = screen.getByRole('button', { name: /approve draft/i })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute(
      'aria-describedby',
      'approve-draft-tooltip-del-1',
    )
    expect(
      screen.getByText(/a newer version was submitted/i),
    ).toBeInTheDocument()
  })

  it('invokes mutate on click', async () => {
    const user = userEvent.setup()
    renderButton()

    const button = screen.getByRole('button', { name: /approve draft/i })
    await user.click(button)

    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('does not invoke mutate when disabled (stale version)', async () => {
    const user = userEvent.setup()
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: { data: { data: [{ id: 'del-1', current_version: 2 }] } },
    })

    renderButton()

    const button = screen.getByRole('button', { name: /approve draft/i })
    await user.click(button)

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('defaults to enabled when deliverables cache is empty', () => {
    mockUseGetConversationDeliverablesQuery.mockReturnValue({
      data: undefined,
    })

    renderButton()

    const button = screen.getByRole('button', { name: /approve draft/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toHaveAttribute('aria-disabled')
  })
})
