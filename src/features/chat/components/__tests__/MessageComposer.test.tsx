import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { MessageComposer } from '../MessageComposer'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('#/features/chat/mutations/useSendMessageMutation', () => ({
  useSendMessageMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
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

describe('MessageComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea and send button', () => {
    render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={true}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    expect(
      screen.getByPlaceholderText('Escribí un mensaje...'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /enviar mensaje/i }),
    ).toBeInTheDocument()
  })

  it('disables submit when text is empty', () => {
    render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={true}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    expect(
      screen.getByRole('button', { name: /enviar mensaje/i }),
    ).toBeDisabled()
  })

  it('enables submit when text is non-empty', async () => {
    const user = userEvent.setup()
    render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={true}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    await user.type(
      screen.getByPlaceholderText('Escribí un mensaje...'),
      'hello',
    )

    expect(
      screen.getByRole('button', { name: /enviar mensaje/i }),
    ).not.toBeDisabled()
  })

  it('shows counter above 3500 characters', async () => {
    const user = userEvent.setup()
    render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={true}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    const textarea = screen.getByPlaceholderText('Escribí un mensaje...')
    const longText = 'a'.repeat(3501)
    await user.click(textarea)
    // Use fireEvent for performance with large text
    const nativeInput = textarea as HTMLTextAreaElement
    Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set?.call(nativeInput, longText)
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }))
    nativeInput.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(screen.getByText(String(4096 - 3501))).toBeInTheDocument()
    })
  })

  it('disables composer when canSend is false', () => {
    render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={false}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    expect(
      screen.getByPlaceholderText('No se puede enviar mensajes'),
    ).toBeDisabled()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <MessageComposer
        conversationId="conv-1"
        currentAccountId="acc-1"
        canSend={true}
        wsSend={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
