import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { useAppForm } from '#/shared/ui/form'
import { useBriefBuilderStore } from '../store'
import { createFormInputSchema, createWebsiteUrlFieldSchema } from '../schemas'
import { useRegisterStepValidator } from '../validation'
import { PDFUploadField } from '../components/PDFUploadField'
import {
  useInitBriefBuilder,
  getInitErrorMessage,
} from '../hooks/useInitBriefBuilder'

export function P1Input() {
  const store = useBriefBuilderStore()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { brandWorkspace } = useBrandSession()

  const initMutation = useInitBriefBuilder()
  const formInputSchema = createFormInputSchema()
  const websiteUrlFieldSchema = createWebsiteUrlFieldSchema()

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
          brandWorkspaceId: brandWorkspace.id,
          websiteUrl,
          descriptionText,
          pdfFile,
        })

        useBriefBuilderStore
          .getState()
          .setField('processingToken', result.processing_token)

        return true
      } catch (error) {
        const { message } = getInitErrorMessage(error)
        setSubmitError(message)
        return false
      }
    }, [form, initMutation, brandWorkspace.id]),
  )

  const hasInput =
    values.websiteUrl.trim().length > 0 ||
    values.descriptionText.trim().length > 0 ||
    values.pdfFile !== null

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <form.AppField
          name="websiteUrl"
          validators={{ onBlur: websiteUrlFieldSchema }}
          listeners={{
            onBlur: ({ value, fieldApi }) => {
              const trimmed = value.trim()
              if (!trimmed) return
              if (/^https?:\/\//i.test(trimmed)) return
              fieldApi.setValue(`https://${trimmed}`)
              void fieldApi.validate('blur')
            },
          }}
        >
          {(field) => (
            <field.TextField
              label={t`URL de la campaña`}
              placeholder="https://ejemplo.com/campana"
              maxLength={500}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="descriptionText">
          {(field) => (
            <field.TextareaField
              label={t`Descripción del brief`}
              placeholder={t`Describí tu campaña, público objetivo, objetivos…`}
              maxLength={2000}
              rows={4}
            />
          )}
        </form.AppField>
        <div className="flex items-center gap-3 text-[length:var(--font-size-xs)] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>{t`o adjuntá un PDF en lugar de la descripción`}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
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
          {t`Necesitás texto o un PDF para continuar`}
        </p>
      )}
    </div>
  )
}
