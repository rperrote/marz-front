import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import { Megaphone, MessageSquare } from 'lucide-react'

import { AppTopbar } from './AppTopbar'
import { TopbarProvider } from './TopbarContext'
import type { TopbarConfig } from './TopbarContext'

function renderTopbar(config?: TopbarConfig) {
  return render(
    <TopbarProvider initialConfig={config ?? null}>
      <AppTopbar />
    </TopbarProvider>,
  )
}

describe('AppTopbar', () => {
  it('renders the search bar without breadcrumb when config is null', () => {
    renderTopbar()

    const topbar = screen.getByTestId('app-topbar')

    expect(screen.getByText('Buscar…')).toBeInTheDocument()
    expect(topbar).toHaveAttribute('data-height', '56px')
    expect(topbar).toHaveClass('h-14')
  })

  it('renders breadcrumb segments with label and icon', async () => {
    renderTopbar({
      breadcrumb: [{ icon: Megaphone, label: 'Campañas' }],
    })

    expect(await screen.findByText('Campañas')).toBeInTheDocument()
  })

  it('renders multi-level breadcrumb with chevron separator', async () => {
    renderTopbar({
      breadcrumb: [
        { icon: Megaphone, label: 'Campañas' },
        { label: 'Detalle' },
      ],
    })

    expect(await screen.findByText('Campañas')).toBeInTheDocument()
    expect(screen.getByText('Detalle')).toBeInTheDocument()
  })

  it('renders no breadcrumb when breadcrumb array is empty', async () => {
    renderTopbar({ breadcrumb: [] })

    expect(screen.getByText('Buscar…')).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument()
  })

  it('renders no breadcrumb when breadcrumb has icon and no label', async () => {
    renderTopbar({
      breadcrumb: [{ icon: MessageSquare, label: 'Chat' }],
    })

    expect(await screen.findByText('Chat')).toBeInTheDocument()
  })

  it('keeps 56px height in all states', () => {
    renderTopbar({
      breadcrumb: [{ label: 'Inbox' }],
    })

    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
    expect(screen.getByTestId('app-topbar')).toHaveClass('h-14')
  })

  it('is axe-clean', async () => {
    const { container } = renderTopbar({
      breadcrumb: [
        { icon: Megaphone, label: 'Campañas' },
        { label: 'Detalle' },
      ],
    })

    expect(await screen.findByText('Campañas')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
