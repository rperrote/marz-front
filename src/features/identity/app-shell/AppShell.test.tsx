import { render, screen, within } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { AppShell } from './AppShell'
import { useAppShellContext } from './AppShellContext'

function ContextProbe() {
  const context = useAppShellContext()

  return (
    <output aria-label="shell context">
      {context.accountKind}:{context.accountId}
    </output>
  )
}

function renderShell({
  accountKind = 'brand',
  pathname = '/workspace',
}: {
  accountKind?: 'brand' | 'creator'
  pathname?: string
} = {}) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell
        accountKind={accountKind}
        accountId="acct_123"
        pathname={pathname}
      >
        <ContextProbe />
      </AppShell>
    ),
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

  return render(<RouterProvider router={router} />)
}

describe('AppShell', () => {
  it('renders the brand sidebar, base topbar, and content outlet', async () => {
    renderShell({ accountKind: 'brand', pathname: '/workspace' })

    const shell = await screen.findByTestId('app-shell')
    const sidebar = within(shell).getByTestId('app-sidebar')

    expect(
      within(sidebar).getByRole('link', { name: 'Workspace' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('app-topbar')).toHaveTextContent('Marz')
    expect(screen.getByLabelText('shell context')).toHaveTextContent(
      'brand:acct_123',
    )
  })

  it('renders creator navigation when accountKind is creator', async () => {
    renderShell({ accountKind: 'creator', pathname: '/inbox' })

    const sidebar = await screen.findByTestId('app-sidebar')

    expect(
      within(sidebar).getByRole('link', { name: 'Inbox' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('shell context')).toHaveTextContent(
      'creator:acct_123',
    )
  })

  it('keeps the shell dimensions required by the global layout', async () => {
    renderShell()

    expect(await screen.findByTestId('app-shell')).toHaveClass(
      'h-dvh',
      'overflow-hidden',
    )
    expect(screen.getByTestId('app-sidebar')).toHaveAttribute(
      'data-width',
      '72px',
    )
    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
  })

  it('does not keep legacy sidebar markup in compatibility shells', () => {
    const files = [
      'src/features/identity/components/BrandShell.tsx',
      'src/features/identity/components/CreatorShell.tsx',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      expect(source).not.toContain('<aside')
      expect(source).not.toContain('bg-sidebar')
      expect(source).not.toContain('border-sidebar')
      expect(source).not.toContain('text-sidebar')
    }
  })

  it('does not log sensitive session fields from the shell files', () => {
    const files = [
      'src/features/identity/app-shell/AppShell.tsx',
      'src/features/identity/app-shell/AppShellContext.tsx',
      'src/features/identity/components/BrandShell.tsx',
      'src/features/identity/components/CreatorShell.tsx',
    ]
    const forbidden = [
      'console.',
      'email',
      'full_name',
      'brand_workspace.name',
      'creator_profile.handle',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      for (const text of forbidden) {
        expect(source).not.toContain(text)
      }
    }
  })

  it('does not import or call analytics from shell files', () => {
    const files = [
      'src/features/identity/app-shell/AppShell.tsx',
      'src/features/identity/app-shell/AppSidebar.tsx',
      'src/features/identity/app-shell/AppSidebarItem.tsx',
      'src/features/identity/app-shell/AppTopbar.tsx',
      'src/features/identity/app-shell/TopbarContext.tsx',
      'src/features/identity/app-shell/useRouteTopbar.ts',
      'src/features/identity/app-shell/MissingWorkspaceFallback.tsx',
      'src/features/identity/components/BrandShell.tsx',
      'src/features/identity/components/CreatorShell.tsx',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      expect(source).not.toContain('shared/analytics')
      expect(source).not.toMatch(/\btrack\(/)
    }
  })

  it('is axe-clean', async () => {
    const { container } = renderShell()

    await screen.findByTestId('app-shell')
    expect(await axe(container)).toHaveNoViolations()
  })
})
