import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'

import { AppTopbar } from './AppTopbar'
import type { TopbarConfig } from './TopbarContext'
import { TopbarProvider, useTopbar } from './TopbarContext'

function TopbarSetter({ config }: { config: TopbarConfig }) {
  const { setTopbar } = useTopbar()

  useEffect(() => {
    setTopbar(config)
  }, [config, setTopbar])

  return null
}

function renderTopbar(config?: TopbarConfig) {
  return render(
    <TopbarProvider>
      <AppTopbar />
      {config ? <TopbarSetter config={config} /> : null}
    </TopbarProvider>,
  )
}

function renderTopbarWithRouter(config: TopbarConfig, pathname = '/workspace') {
  const rootRoute = createRootRoute({
    component: () => (
      <TopbarProvider>
        <AppTopbar />
        <TopbarSetter config={config} />
      </TopbarProvider>
    ),
  })

  const workspaceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspace',
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([workspaceRoute]),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('AppTopbar', () => {
  it('renders the base wordmark without contextual slots', () => {
    renderTopbar()

    const topbar = screen.getByTestId('app-topbar')

    expect(screen.getByText('Marz')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(topbar).toHaveAttribute('data-height', '56px')
    expect(topbar).toHaveClass('h-14')
  })

  it('renders back and title without changing the 56px height', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    renderTopbar({
      back: { label: 'Volver al listado', onBack },
      title: 'Revisión del Brief',
    })

    const backButton = await screen.findByRole('button', {
      name: 'Volver al listado',
    })

    expect(screen.getByText('Revisión del Brief')).toBeInTheDocument()
    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
    expect(screen.getByTestId('app-topbar')).toHaveClass('h-14')

    await user.click(backButton)
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('renders link back actions with an accessible name', async () => {
    renderTopbarWithRouter({
      back: { to: '/workspace' },
      title: 'Detalle',
    })

    const backLink = await screen.findByRole('link', { name: 'Volver' })

    expect(backLink).toHaveAttribute('href', '/workspace')
  })

  it('keeps back actions keyboard focusable with visible focus styles', async () => {
    const user = userEvent.setup()

    renderTopbar({
      back: { label: 'Volver al listado', onBack: () => {} },
      title: 'Detalle',
    })

    const backButton = await screen.findByRole('button', {
      name: 'Volver al listado',
    })

    await user.tab()

    expect(backButton).toHaveFocus()
    expect(backButton).toHaveClass('focus-visible:ring-ring')
  })

  it('renders progress and actions only when the slots are provided', async () => {
    renderTopbar({
      title: 'Campaña',
      progress: <span>75%</span>,
      actions: <button type="button">Guardar</button>,
    })

    expect(await screen.findByText('75%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.queryByText('Marz')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = renderTopbar({
      back: { label: 'Volver al listado', onBack: () => {} },
      title: 'Revisión del Brief',
      actions: <button type="button">Guardar</button>,
    })

    await waitFor(() => {
      expect(screen.getByText('Revisión del Brief')).toBeInTheDocument()
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})
