import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { ConversationRailEmpty } from './ConversationRailEmpty'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('ConversationRailEmpty', () => {
  it('shows collaboration message for no_conversations variant', () => {
    render(<ConversationRailEmpty variant="no_conversations" />)

    expect(
      screen.getByText(
        'Las conversaciones aparecen cuando se inicia una colaboración (vía Match, Application, Invite u Offer)',
      ),
    ).toBeInTheDocument()
  })

  it('shows no match message for no_search_results variant', () => {
    render(<ConversationRailEmpty variant="no_search_results" />)

    expect(
      screen.getByText('No hay conversaciones que coincidan'),
    ).toBeInTheDocument()
  })

  it('shows unread message for no_filter_results with unread filter', () => {
    render(
      <ConversationRailEmpty
        variant="no_filter_results"
        activeFilter="unread"
      />,
    )

    expect(
      screen.getByText('No hay conversaciones no leídas'),
    ).toBeInTheDocument()
  })

  it('shows needs_reply message for no_filter_results with needs_reply filter', () => {
    render(
      <ConversationRailEmpty
        variant="no_filter_results"
        activeFilter="needs_reply"
      />,
    )

    expect(
      screen.getByText('No hay conversaciones con respuesta pendiente'),
    ).toBeInTheDocument()
  })

  it('shows campaign message for no_filter_results with all filter', () => {
    render(
      <ConversationRailEmpty variant="no_filter_results" activeFilter="all" />,
    )

    expect(
      screen.getByText('No hay conversaciones para esta campaña'),
    ).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <ConversationRailEmpty variant="no_conversations" />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
