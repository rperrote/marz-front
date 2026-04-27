import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { TooltipProvider } from '#/components/ui/tooltip'
import { ChatHeaderActions } from './ChatHeaderActions'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function renderWithProvider(ui: React.ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('ChatHeaderActions', () => {
  it('shows send offer button when visible and enabled', async () => {
    const onSendOffer = vi.fn()

    renderWithProvider(
      <ChatHeaderActions
        conversationId="conv-1"
        canSendOffer={{ visible: true, disabled: false }}
        onSendOffer={onSendOffer}
      />,
    )

    expect(
      screen.getByRole('button', { name: /send offer/i }),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /send offer/i }))

    expect(onSendOffer).toHaveBeenCalledTimes(1)
  })

  it('shows disabled send offer button with tooltip when no active campaigns', () => {
    renderWithProvider(
      <ChatHeaderActions
        conversationId="conv-1"
        canSendOffer={{
          visible: true,
          disabled: true,
          reason: 'no-active-campaigns',
        }}
      />,
    )

    const button = screen.getByRole('button', { name: /send offer/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('does not render send offer button when hidden', () => {
    renderWithProvider(
      <ChatHeaderActions
        conversationId="conv-1"
        canSendOffer={{ visible: false, disabled: false }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: /send offer/i }),
    ).not.toBeInTheDocument()
  })

  it('does not open sheet when disabled button is clicked', async () => {
    const onSendOffer = vi.fn()

    renderWithProvider(
      <ChatHeaderActions
        conversationId="conv-1"
        canSendOffer={{
          visible: true,
          disabled: true,
          reason: 'no-active-campaigns',
        }}
        onSendOffer={onSendOffer}
      />,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /send offer/i }))

    expect(onSendOffer).not.toHaveBeenCalled()
  })

  it('is axe-clean', async () => {
    const { container } = renderWithProvider(
      <ChatHeaderActions
        conversationId="conv-1"
        canSendOffer={{ visible: true, disabled: false }}
        onSendOffer={() => {}}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
