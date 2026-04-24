import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useSignIn } from '@clerk/tanstack-react-start'
import { MailCheck, RefreshCw, ArrowLeft, Clock3 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { track } from '#/shared/analytics/track'

const COOLDOWN_SECONDS = 60

export function MagicSentScreen({ email }: { email: string }) {
  const { signIn } = useSignIn()
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1_000)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function handleResend() {
    if (cooldown > 0 || resending) return
    setResending(true)

    try {
      await signIn.create({ identifier: email })
      await signIn.emailLink.sendLink({
        emailAddress: email,
        verificationUrl: `${window.location.origin}/auth/callback`,
      })
      track('magic_link_requested', { email })
      startCooldown()
    } catch {
      // Clerk error — silent for now, user can retry
    } finally {
      setResending(false)
    }
  }

  const isDisabled = cooldown > 0 || resending

  return (
    <div className="flex w-full max-w-[480px] flex-col items-center gap-7 rounded-2xl border border-border bg-card p-10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-foreground">
          <svg width={24} height={24} viewBox="0 0 40 40" fill="none">
            <circle cx={8} cy={10} r={2.5} fill="var(--background)" />
            <circle cx={17.5} cy={10} r={2.5} fill="var(--background)" />
            <circle cx={27} cy={10} r={2.5} fill="var(--background)" />
            <rect
              x={9.5}
              y={15}
              width={2}
              height={10}
              fill="var(--background)"
            />
            <rect
              x={19}
              y={15}
              width={2}
              height={10}
              fill="var(--background)"
            />
            <rect
              x={28.5}
              y={15}
              width={2}
              height={10}
              fill="var(--background)"
            />
            <circle cx={8} cy={25} r={2.5} fill="var(--background)" />
            <circle cx={17.5} cy={25} r={2.5} fill="var(--background)" />
            <circle cx={27} cy={25} r={2.5} fill="var(--background)" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          Marz
        </span>
      </div>

      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/12">
        <MailCheck size={32} className="text-primary" aria-hidden="true" />
      </div>

      <div className="flex w-full flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-tight text-foreground">
          Revisá tu email
        </h1>
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Te mandamos un link a{' '}
          <span className="font-medium text-foreground">{email}</span>. Clické
          el link para entrar a Marz.
        </p>
      </div>

      <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-muted px-4 py-3.5">
        <Clock3
          size={16}
          className="text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground">
          El link expira en 15 minutos.
        </span>
      </div>

      <Button
        onClick={handleResend}
        aria-disabled={isDisabled}
        className="h-12 w-full gap-2 rounded-xl text-sm font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        <RefreshCw size={16} aria-hidden="true" />
        <span aria-live="polite" aria-atomic="true">
          {cooldown > 0
            ? `Reenviar link (${cooldown}s)`
            : resending
              ? 'Reenviando…'
              : 'Reenviar link'}
        </span>
      </Button>

      <Link
        to="/auth"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Usar otro email
      </Link>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        ¿No lo encontrás? Chequeá en spam o promociones.
      </p>
    </div>
  )
}
