import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useIsMobile } from '#/features/identity/onboarding/hooks/useIsMobile'

const SESSION_KEY = 'marz:desktop-only:returnTo'

export function DesktopOnlyScreen() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isMobile) {
      const returnTo = sessionStorage.getItem(SESSION_KEY) || '/auth'
      sessionStorage.removeItem(SESSION_KEY)
      void navigate({ to: returnTo })
    }
  }, [isMobile, navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect x={2} y={3} width={20} height={14} rx={2} />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Abrí Marz desde tu computadora
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Marz todavía no está optimizado para mobile. Abrí Marz desde tu
            computadora para completar el onboarding.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Refrescar
        </button>
      </div>
    </main>
  )
}
