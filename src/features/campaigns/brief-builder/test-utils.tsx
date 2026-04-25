import { createRef } from 'react'
import type { MutableRefObject } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WizardStepValidationContext } from './validation'

type ValidateFn = () => Promise<boolean>

export function renderWithValidation(ui: React.ReactElement) {
  const validatorRef =
    createRef<ValidateFn | null>() as MutableRefObject<ValidateFn | null>
  validatorRef.current = null

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <WizardStepValidationContext.Provider value={{ validatorRef }}>
        {ui}
      </WizardStepValidationContext.Provider>
    </QueryClientProvider>,
  )

  return { ...result, validatorRef }
}
