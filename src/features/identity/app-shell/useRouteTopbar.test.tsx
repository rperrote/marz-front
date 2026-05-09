import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { TopbarConfig } from './TopbarContext'
import { TopbarProvider, useTopbar } from './TopbarContext'
import { useRouteTopbar } from './useRouteTopbar'

function TopbarStateProbe() {
  const { config } = useTopbar()

  return (
    <output aria-label="topbar-state">
      {config?.title ? config.title : 'base'}
    </output>
  )
}

function RouteTopbarConsumer({ config }: { config: TopbarConfig }) {
  useRouteTopbar(config)

  return null
}

function ThrowingConsumer() {
  useTopbar()

  return null
}

describe('useRouteTopbar', () => {
  it('registers config on mount and resets it on unmount', async () => {
    const { unmount } = render(
      <TopbarProvider>
        <TopbarStateProbe />
        <RouteTopbarConsumer config={{ title: 'Brief' }} />
      </TopbarProvider>,
    )

    expect(await screen.findByLabelText('topbar-state')).toHaveTextContent(
      'Brief',
    )

    unmount()
  })

  it('cleans the config when the route component unmounts', async () => {
    const { rerender } = render(
      <TopbarProvider>
        <TopbarStateProbe />
        <RouteTopbarConsumer config={{ title: 'Brief' }} />
      </TopbarProvider>,
    )

    expect(await screen.findByLabelText('topbar-state')).toHaveTextContent(
      'Brief',
    )

    rerender(
      <TopbarProvider>
        <TopbarStateProbe />
      </TopbarProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('topbar-state')).toHaveTextContent('base')
    })
  })

  it('resets between route components with different configs', async () => {
    const firstConfig = { title: 'Primera ruta' }
    const secondConfig = { title: 'Segunda ruta' }
    const { rerender } = render(
      <TopbarProvider>
        <TopbarStateProbe />
        <RouteTopbarConsumer key="first" config={firstConfig} />
      </TopbarProvider>,
    )

    expect(await screen.findByLabelText('topbar-state')).toHaveTextContent(
      'Primera ruta',
    )

    rerender(
      <TopbarProvider>
        <TopbarStateProbe />
      </TopbarProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('topbar-state')).toHaveTextContent('base')
    })

    rerender(
      <TopbarProvider>
        <TopbarStateProbe />
        <RouteTopbarConsumer key="second" config={secondConfig} />
      </TopbarProvider>,
    )

    expect(await screen.findByLabelText('topbar-state')).toHaveTextContent(
      'Segunda ruta',
    )
  })

  it('throws a clear error outside TopbarProvider', () => {
    expect(() => render(<ThrowingConsumer />)).toThrow(
      'useTopbar must be used within a TopbarProvider',
    )
  })
})
