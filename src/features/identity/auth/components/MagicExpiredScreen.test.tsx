import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'

import { MagicExpiredScreen } from './MagicExpiredScreen'
import { renderWithProviders } from '#/test/utils'
import { resetTrackedEvents, getTrackedEvents } from '#/shared/analytics/track'

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
}))

function renderScreen() {
  return renderWithProviders(<MagicExpiredScreen />)
}

describe('MagicExpiredScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTrackedEvents()
  })

  it('renders title and CTA', async () => {
    renderScreen()
    expect(await screen.findByText('Este link ya no sirve')).toBeInTheDocument()
    expect(
      await screen.findByRole('link', { name: /pedir nuevo link/i }),
    ).toBeInTheDocument()
  })

  it('fires magic_link_failed analytics on mount', async () => {
    renderScreen()
    await screen.findByText('Este link ya no sirve')

    const events = getTrackedEvents()
    expect(events.some((e) => e.event === 'magic_link_failed')).toBe(true)
  })

  it('CTA links to /auth', async () => {
    renderScreen()
    const cta = await screen.findByRole('link', { name: /pedir nuevo link/i })
    expect(cta).toHaveAttribute('href', '/auth')
  })

  it('back link navigates to /auth', async () => {
    renderScreen()
    const back = await screen.findByRole('link', {
      name: /volver al inicio/i,
    })
    expect(back).toHaveAttribute('href', '/auth')
  })

  it('renders all three reasons', async () => {
    renderScreen()
    expect(
      await screen.findByText(/pasó más de 15 minutos/i),
    ).toBeInTheDocument()
    expect(await screen.findByText(/ya usaste este link/i)).toBeInTheDocument()
    expect(await screen.findByText(/el link se cortó/i)).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = renderScreen()
    await screen.findByText('Este link ya no sirve')
    expect(await axe(container)).toHaveNoViolations()
  })
})
