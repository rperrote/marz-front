import { createContext, use, useEffect, useRef, useCallback } from 'react'
import type { MutableRefObject } from 'react'

type ValidateFn = () => Promise<boolean>

interface WizardStepValidationContextValue {
  validatorRef: MutableRefObject<ValidateFn | null>
}

export const WizardStepValidationContext =
  createContext<WizardStepValidationContextValue | null>(null)

function useWizardStepValidation() {
  const ctx = use(WizardStepValidationContext)
  if (!ctx) {
    throw new Error(
      'useWizardStepValidation must be used within WizardStepValidationContext',
    )
  }
  return ctx
}

export function useRegisterStepValidator(validate: ValidateFn) {
  const { validatorRef } = useWizardStepValidation()
  useEffect(() => {
    validatorRef.current = validate
    return () => {
      validatorRef.current = null
    }
  }, [validate, validatorRef])
}

export function useStepValidatorRef() {
  return useRef<ValidateFn | null>(null)
}

export function useCallStepValidator(ref: MutableRefObject<ValidateFn | null>) {
  return useCallback(async () => {
    if (!ref.current) return true
    return ref.current()
  }, [ref])
}
