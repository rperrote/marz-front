import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '@tanstack/react-form'
import { useAppForm } from '#/shared/ui/form'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'
import { formInputSchema, websiteUrlFieldSchema } from '../schemas'
import { useRegisterStepValidator } from '../validation'

export function P1Input() {
  const store = useBriefBuilderStore()

  const form = useAppForm({
    defaultValues: {
      websiteUrl: store.formInput.websiteUrl,
      descriptionText: store.formInput.descriptionText,
    },
    validators: {
      onSubmit: formInputSchema,
    },
    onSubmit: () => {},
  })

  const values = useStore(form.store, (s) => s.values)
  const prevRef = useRef(values)

  useEffect(() => {
    if (prevRef.current === values) return
    prevRef.current = values
    useBriefBuilderStore.setState((prev) => ({
      formInput: { ...prev.formInput, ...values },
    }))
  }, [values])

  useRegisterStepValidator(
    useCallback(async () => {
      await form.handleSubmit()
      return form.state.isValid
    }, [form]),
  )

  const hasInput =
    values.websiteUrl.trim().length > 0 ||
    values.descriptionText.trim().length > 0

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title="Contanos sobre tu marca"
        subtitle="Ingresá la web de tu marca o describí tu producto para generar el brief."
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <form.AppField
          name="websiteUrl"
          validators={{ onBlur: websiteUrlFieldSchema }}
        >
          {(field) => (
            <field.TextField
              label="Sitio web de la marca"
              hint="Opcional si completás la descripción."
              placeholder="https://mimarca.com"
              maxLength={500}
            />
          )}
        </form.AppField>
        <form.AppField name="descriptionText">
          {(field) => (
            <field.TextareaField
              label="Descripción del producto o servicio"
              hint="Opcional si completás la URL."
              placeholder="Describí brevemente qué hace tu marca, a quién le vende y qué tipo de campaña necesitás."
              maxLength={2000}
              rows={4}
            />
          )}
        </form.AppField>
      </div>
      {!hasInput && (
        <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
          Completá al menos uno de los campos para continuar.
        </p>
      )}
    </div>
  )
}
