import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { AppSidebar } from './AppSidebar'

function renderSidebar(pathname = '/workspace') {
  const rootRoute = createRootRoute({
    component: () => <AppSidebar accountKind="brand" pathname={pathname} />,
  })

  const workspaceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspace',
    component: () => null,
  })

  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([workspaceRoute, inboxRoute]),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  })

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

describe('AppSidebar', () => {
  it('renders enabled items as links with the label as accessible name', async () => {
    renderSidebar('/workspace')

    const workspaceLink = await screen.findByRole('link', {
      name: 'Workspace',
    })

    expect(workspaceLink).toHaveAttribute('href', '/workspace')
  })

  it('renders disabled items as aria-disabled buttons without href and without navigation', async () => {
    const user = userEvent.setup()
    const { router } = renderSidebar('/workspace')

    const homeButton = await screen.findByRole('button', { name: 'Home' })
    await user.click(homeButton)

    expect(homeButton).toHaveAttribute('aria-disabled', 'true')
    expect(homeButton).not.toHaveAttribute('href')
    expect(router.state.location.pathname).toBe('/workspace')
  })

  it('marks only the item resolved by resolveActiveSidebarItem as active', async () => {
    renderSidebar('/workspace/conversations/123')

    await screen.findByRole('link', { name: 'Workspace' })
    const currentItems = screen.getAllByRole('link').filter((item) => {
      return item.getAttribute('aria-current') === 'page'
    })

    expect(currentItems).toHaveLength(1)
    expect(currentItems[0]).toHaveAccessibleName('Workspace')
  })

  it('shows the enabled item label tooltip on hover and focus', async () => {
    const user = userEvent.setup()
    const { unmount } = renderSidebar('/workspace')

    const workspaceLink = await screen.findByRole('link', {
      name: 'Workspace',
    })

    await user.hover(workspaceLink)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Workspace')

    unmount()
    renderSidebar('/workspace')

    await user.tab()
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Workspace')
  })

  it('shows Próximamente for disabled item tooltips', async () => {
    const user = userEvent.setup()
    renderSidebar('/workspace')

    const homeButton = await screen.findByRole('button', { name: 'Home' })

    await user.hover(homeButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Próximamente')
  })

  it('uses the 72px sidebar rail width', async () => {
    renderSidebar('/workspace')

    const sidebar = await screen.findByTestId('app-sidebar')

    expect(sidebar).toHaveAttribute('data-width', '72px')
    expect(sidebar).toHaveClass('w-[72px]')
  })

  it('is axe-clean', async () => {
    const { container } = renderSidebar('/workspace')
    const sidebar = await screen.findByTestId('app-sidebar')

    expect(
      within(sidebar).getByRole('link', { name: 'Workspace' }),
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
