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
      full_name: 'Test Brand',
      kind: 'brand',
      onboarding_status: 'onboarded',
      redirect_to: null,
      created_at: '2026-05-08T00:00:00.000Z',
      brand_workspace: {
        id: 'brand-workspace-1',
        name: 'Test Brand',
        plan: 'test',
      },
    },
    brandWorkspace: {
      id: 'brand-workspace-1',
      name: 'Test Brand',
      plan: 'test',
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
