import { createRef } from 'react'
import type { MutableRefObject } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandSessionContext } from '#/features/identity/session/BrandSessionContext'
import type { BrandSession } from '#/features/identity/session/BrandSessionContext'
import { WizardStepValidationContext } from './validation'

type ValidateFn = () => Promise<boolean>

export function renderWithValidation(ui: React.ReactElement) {
  const validatorRef =
    createRef<ValidateFn | null>() as MutableRefObject<ValidateFn | null>
  validatorRef.current = null

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const brandSession: BrandSession = {
    account: {
      id: 'account-1',
      email: 'brand@example.com',
      kind: 'brand',
      full_name: 'Test Brand',
      onboarding_status: 'onboarded',
      created_at: '2026-01-01T00:00:00.000Z',
      redirect_to: null,
      brand_workspace: {
        id: 'brand-workspace-1',
        name: 'Test Brand',
        plan: 'free',
      },
    },
    brandWorkspace: {
      id: 'brand-workspace-1',
      name: 'Test Brand',
      plan: 'free',
    },
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <BrandSessionContext.Provider value={brandSession}>
        <WizardStepValidationContext.Provider value={{ validatorRef }}>
          {ui}
        </WizardStepValidationContext.Provider>
      </BrandSessionContext.Provider>
    </QueryClientProvider>,
  )

  return { ...result, validatorRef }
}
