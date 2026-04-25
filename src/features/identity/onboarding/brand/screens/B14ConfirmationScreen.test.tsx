import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '#/test/utils'
import { B14ConfirmationScreen } from './B14ConfirmationScreen'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    },
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/generated/onboarding/onboarding', () => ({
  useCompleteBrandOnboarding: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => ({ data: null, refetch: vi.fn() }),
  getMeQueryKey: () => ['/v1/me'],
}))

describe('B14ConfirmationScreen', () => {
  it('renders confirmation copy', async () => {
    renderWithProviders(<B14ConfirmationScreen />)
    await waitFor(() => {
      expect(screen.getByText(/^Listo\./i)).toBeInTheDocument()
    })
  })

  it('renders start button', async () => {
    renderWithProviders(<B14ConfirmationScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-start-btn')).toBeInTheDocument()
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<B14ConfirmationScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-start-btn')).toBeInTheDocument()
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})
