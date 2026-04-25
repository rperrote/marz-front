import { createRef } from 'react'
import { render } from '@testing-library/react'
import { WizardStepValidationContext } from './validation'

export function renderWithValidation(ui: React.ReactElement) {
  const validatorRef = createRef<
    (() => Promise<boolean>) | null
  >() as React.MutableRefObject<(() => Promise<boolean>) | null>
  validatorRef.current = null
  return render(
    <WizardStepValidationContext.Provider value={{ validatorRef }}>
      {ui}
    </WizardStepValidationContext.Provider>,
  )
}
