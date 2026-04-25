import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { useAppForm } from '#/shared/ui/form'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'
import { formInputSchema, websiteUrlFieldSchema } from '../schemas'
import { useRegisterStepValidator } from '../validation'
import { PDFUploadField } from '../components/PDFUploadField'
import {
  useInitBriefBuilder,
  getInitErrorMessage,
} from '../hooks/useInitBriefBuilder'
import { useProcessBrief, isProcessConflict } from '../hooks/useProcessBrief'

export function P1Input() {
  const store = useBriefBuilderStore()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const initMutation = useInitBriefBuilder()
  const processMutation = useProcessBrief()

  const form = useAppForm({
    defaultValues: {
      websiteUrl: store.formInput.websiteUrl,
      descriptionText: store.formInput.descriptionText,
      pdfFile: store.pdfFile,
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
      formInput: {
        ...prev.formInput,
        websiteUrl: values.websiteUrl,
        descriptionText: values.descriptionText,
      },
    }))
  }, [values])

  const handlePdfChange = useCallback(
    (file: File | null) => {
      form.setFieldValue('pdfFile', file)
      useBriefBuilderStore.getState().setPdfFile(file)
      setSubmitError(null)
    },
    [form],
  )

  useRegisterStepValidator(
    useCallback(async () => {
      setSubmitError(null)

      await form.handleSubmit()
      if (!form.state.isValid) return false

      const { websiteUrl, descriptionText } = form.state.values
      const pdfFile = useBriefBuilderStore.getState().pdfFile

      try {
        const result = await initMutation.mutateAsync({
          // TODO(fn-B.x): obtener brandWorkspaceId del auth context / sesión activa
          brandWorkspaceId: 'default' as string,
          websiteUrl,
          descriptionText,
          pdfFile,
        })

        useBriefBuilderStore
          .getState()
          .setField('processingToken', result.processing_token)

        try {
          await processMutation.mutateAsync(result.processing_token)
        } catch (processError) {
          if (isProcessConflict(processError)) {
            setSubmitError(
              'El análisis ya fue procesado, reintentá desde el inicio.',
            )
            useBriefBuilderStore.getState().reset()
            return false
          }
          throw processError
        }

        return true
      } catch (error) {
        const { message } = getInitErrorMessage(error)
        setSubmitError(message)
        return false
      }
    }, [form, initMutation, processMutation]),
  )

  const hasInput =
    values.websiteUrl.trim().length > 0 ||
    values.descriptionText.trim().length > 0 ||
    values.pdfFile !== null

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title="Contanos sobre tu marca"
        subtitle="Ingresá la web de tu marca, describí tu producto o subí un PDF para generar el brief."
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <form.AppField
          name="websiteUrl"
          validators={{ onBlur: websiteUrlFieldSchema }}
        >
          {(field) => (
            <field.TextField
              label="Sitio web de la marca"
              hint="Opcional si completás la descripción o subís un PDF."
              placeholder="https://mimarca.com"
              maxLength={500}
            />
          )}
        </form.AppField>
        <form.AppField name="descriptionText">
          {(field) => (
            <field.TextareaField
              label="Descripción del producto o servicio"
              hint="Opcional si subís un PDF."
              placeholder="Describí brevemente qué hace tu marca, a quién le vende y qué tipo de campaña necesitás."
              maxLength={2000}
              rows={4}
            />
          )}
        </form.AppField>
        <PDFUploadField file={values.pdfFile} onFileChange={handlePdfChange} />
      </div>
      {submitError && (
        <p
          role="alert"
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {submitError}
        </p>
      )}
      {!hasInput && (
        <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
          Completa al menos uno de los campos para continuar.
        </p>
      )}
    </div>
  )
}
