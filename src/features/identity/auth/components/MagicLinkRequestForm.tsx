import { useState } from 'react'
import { z } from 'zod'
import { useSignIn } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { track } from '#/shared/analytics/track'

const emailSchema = z.string().email('Ingresá un email válido')

export function MagicLinkRequestForm() {
  const { signIn } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = emailSchema.safeParse(email.trim())
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Email inválido')
      return
    }

    setSubmitting(true)

    try {
      const createResult = await signIn.create({ identifier: result.data })
      if (createResult.error) {
        setError(createResult.error.longMessage ?? createResult.error.message)
        setSubmitting(false)
        return
      }

      const linkResult = await signIn.emailLink.sendLink({
        emailAddress: result.data,
        verificationUrl: `${window.location.origin}/auth/callback`,
      })
      if (linkResult.error) {
        setError(linkResult.error.longMessage ?? linkResult.error.message)
        setSubmitting(false)
        return
      }

      track('magic_link_requested', { email: result.data })

      void router.navigate({
        to: '/auth/check-email' as string,
        state: { email: result.data },
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error inesperado. Intentá de nuevo.'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="auth-email" className="text-xs text-muted-foreground">
          Email
        </Label>
        <Input
          id="auth-email"
          type="email"
          placeholder="tu@empresa.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={error != null}
          aria-describedby={error ? 'auth-email-error' : undefined}
          autoComplete="email"
          className="h-11 rounded-xl border-border bg-input px-3.5 text-sm"
        />
        {error ? (
          <p
            id="auth-email-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-xl text-sm font-semibold"
      >
        {submitting ? 'Enviando…' : 'Continuar con email'}
      </Button>
    </form>
  )
}
