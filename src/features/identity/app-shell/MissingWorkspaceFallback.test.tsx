import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MissingWorkspaceFallback } from './MissingWorkspaceFallback'

const mockNavigate = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue(undefined)
const mockClear = vi.fn()
const mockBrandReset = vi.fn()
const mockCreatorReset = vi.fn()

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@clerk/tanstack-react-start', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      clear: mockClear,
    }),
  }
})

vi.mock('#/features/identity/onboarding/brand/store', () => ({
  useBrandOnboardingStore: {
    getState: () => ({ reset: mockBrandReset }),
  },
}))

vi.mock('#/features/identity/onboarding/creator/store', () => ({
  useCreatorOnboardingStore: {
    getState: () => ({ reset: mockCreatorReset }),
  },
}))

describe('MissingWorkspaceFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders support copy and actions', () => {
    render(<MissingWorkspaceFallback />)

    expect(
      screen.getByRole('heading', {
        name: 'No tenés un workspace asociado.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Contactá soporte/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Contactar soporte' }),
    ).toHaveAttribute('href', 'mailto:soporte@marz.com')
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument()
  })

  it('signs out without exposing account data', async () => {
    const user = userEvent.setup()
    render(<MissingWorkspaceFallback />)

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(mockClear).toHaveBeenCalled()
    expect(mockBrandReset).toHaveBeenCalled()
    expect(mockCreatorReset).toHaveBeenCalled()
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth' })
  })

  it('does not reference sensitive session fields', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/features/identity/app-shell/MissingWorkspaceFallback.tsx',
      ),
      'utf8',
    )
    const forbidden = ['email', 'full_name', 'brand_workspace.name']

    for (const text of forbidden) {
      expect(source).not.toContain(text)
    }
  })

  it('is axe-clean', async () => {
    const { container } = render(<MissingWorkspaceFallback />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
