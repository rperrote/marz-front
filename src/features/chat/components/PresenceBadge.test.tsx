import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { TooltipProvider } from '#/components/ui/tooltip'
import { usePresenceStore } from '#/features/chat/stores/presenceStore'
import { PresenceBadge } from './PresenceBadge'

function renderBadge(accountId: string) {
  return render(
    <TooltipProvider>
      <PresenceBadge accountId={accountId} />
    </TooltipProvider>,
  )
}

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

beforeEach(() => {
  usePresenceStore.setState({ entries: {} })
})

describe('PresenceBadge', () => {
  it('renders offline state by default for unknown account', () => {
    renderBadge('unknown')
    expect(screen.getByRole('status')).toHaveAccessibleName('Desconectado')
  })

  it('renders online state', () => {
    usePresenceStore.getState().setPresence('acc-1', 'online')
    renderBadge('acc-1')
    expect(screen.getByRole('status')).toHaveAccessibleName('En línea')
  })

  it('renders offline state', () => {
    usePresenceStore.getState().setPresence('acc-1', 'offline')
    renderBadge('acc-1')
    expect(screen.getByRole('status')).toHaveAccessibleName('Desconectado')
  })

  it('renders disconnected state', () => {
    usePresenceStore.getState().setPresence('acc-1', 'disconnected')
    renderBadge('acc-1')
    expect(screen.getByRole('status')).toHaveAccessibleName('Cuenta inactiva')
  })

  it('is axe-clean', async () => {
    usePresenceStore.getState().setPresence('acc-1', 'online')
    const { container } = renderBadge('acc-1')
    expect(await axe(container)).toHaveNoViolations()
  })
})
