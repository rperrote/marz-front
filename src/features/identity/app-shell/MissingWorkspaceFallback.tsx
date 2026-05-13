import { useAuth } from '@clerk/tanstack-react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Mail } from 'lucide-react'
import { useCallback } from 'react'
import { Trans } from '@lingui/react/macro'

import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { useCreatorOnboardingStore } from '#/features/identity/onboarding/creator/store'

export function MissingWorkspaceFallback() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleSignOut = useCallback(async () => {
    queryClient.clear()
    useBrandOnboardingStore.getState().reset()
    useCreatorOnboardingStore.getState().reset()
    await signOut()
    navigate({ to: '/auth' })
  }, [signOut, queryClient, navigate])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            <Trans>Workspace no disponible</Trans>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            <Trans>No tenés un workspace asociado.</Trans>
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            <Trans>Contactá soporte para que podamos revisar tu cuenta.</Trans>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="mailto:soporte@marz.com"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="size-4" aria-hidden="true" />
            <Trans>Contactar soporte</Trans>
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <Trans>Cerrar sesión</Trans>
          </button>
        </div>
      </section>
    </main>
  )
}
