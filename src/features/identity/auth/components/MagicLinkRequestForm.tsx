import { z } from 'zod'
import { useSignIn, useSignUp } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'

import { useAppForm } from '#/shared/ui/form'
import { track } from '#/shared/analytics/track'

const emailSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
})

function clerkErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err == null) return undefined
  const nested = (err as { errors?: Array<{ code?: string }> }).errors?.[0]
    ?.code
  if (nested) return nested
  return (err as { code?: string }).code
}

function isIdentifierNotFound(err: unknown): boolean {
  return clerkErrorCode(err) === 'form_identifier_not_found'
}

function clerkErrorMessage(err: unknown): string {
  const direct = err as { longMessage?: string; message?: string }
  const nested = (
    err as { errors?: Array<{ longMessage?: string; message?: string }> }
  ).errors?.[0]
  return (
    direct.longMessage ??
    nested?.longMessage ??
    nested?.message ??
    direct.message ??
    (err instanceof Error ? err.message : 'Error inesperado. Intentá de nuevo.')
  )
}

export function MagicLinkRequestForm() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onChange: emailSchema, onSubmit: emailSchema },
    onSubmit: async ({ value, formApi }) => {
      const email = value.email.trim()
      const verificationUrl = `${window.location.origin}/auth/callback`

      try {
        const signInCreate = await signIn.create({ identifier: email })
        let pendingError: unknown = signInCreate.error

        if (!pendingError) {
          const sendLink = await signIn.emailLink.sendLink({
            emailAddress: email,
            verificationUrl,
          })
          pendingError = sendLink.error
        }

        if (pendingError) {
          if (!isIdentifierNotFound(pendingError)) throw pendingError

          const signUpCreate = await signUp.create({ emailAddress: email })
          if (signUpCreate.error) throw signUpCreate.error

          const sendLink = await signUp.verifications.sendEmailLink({
            verificationUrl,
          })
          if (sendLink.error) throw sendLink.error
        }

        track('magic_link_requested', { email })

        void router.navigate({
          to: '/auth/check-email',
          search: { email },
        })
      } catch (err) {
        formApi.setFieldMeta('email', (prev) => ({
          ...prev,
          errorMap: { ...prev.errorMap, onServer: clerkErrorMessage(err) },
          isTouched: true,
          isBlurred: true,
          isDirty: true,
        }))
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      noValidate
      className="flex w-full flex-col gap-7"
    >
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            type="email"
            label="Email"
            placeholder="tu@empresa.com"
            autoComplete="email"
            className="h-11 rounded-xl border-border bg-input px-3.5 text-sm"
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton
          label="Continuar con email"
          loadingLabel="Enviando…"
          className="h-12 rounded-xl text-sm font-semibold"
        />
      </form.AppForm>
    </form>
  )
}
