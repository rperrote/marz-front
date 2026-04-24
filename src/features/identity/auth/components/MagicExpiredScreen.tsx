import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { track } from '#/shared/analytics/track'

const reasons = [
  'Pasó más de 15 minutos desde que lo recibiste',
  'Ya usaste este link en otro dispositivo',
  'El link se cortó al copiarlo',
]

export function MagicExpiredScreen() {
  useEffect(() => {
    track('magic_link_failed')
  }, [])

  return (
    <div className="flex w-full max-w-[480px] flex-col items-center gap-7 rounded-2xl border border-border bg-card p-10">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-destructive/12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
          aria-hidden="true"
        >
          <path d="M9 17H7A5 5 0 0 1 7 7" />
          <path d="M15 7h2a5 5 0 0 1 4 8" />
          <line x1={8} y1={12} x2={12} y2={12} />
          <line x1={2} y1={2} x2={22} y2={22} />
        </svg>
      </div>

      <div className="flex w-full flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-tight text-foreground">
          Este link ya no sirve
        </h1>
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          El link para entrar a Marz venció o ya fue usado. Pedí uno nuevo con
          tu email y volvé a intentar.
        </p>
      </div>

      <ul className="flex w-full flex-col gap-2.5 rounded-xl border border-border bg-muted p-4">
        {reasons.map((reason) => (
          <li
            key={reason}
            className="flex items-center gap-2.5 text-xs text-foreground"
          >
            <span className="text-muted-foreground" aria-hidden="true">
              &bull;
            </span>
            {reason}
          </li>
        ))}
      </ul>

      <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
        <Link to="/auth">Pedir nuevo link</Link>
      </Button>

      <Link
        to="/auth"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Volver al inicio
      </Link>
    </div>
  )
}
