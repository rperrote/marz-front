import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useClerk } from '@clerk/tanstack-react-start'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { getMeQueryKey, me } from '#/shared/api/generated/accounts/accounts'
import { track } from '#/shared/analytics/track'

export function CallbackScreen() {
  const clerk = useClerk()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const verifyingRef = useRef(false)

  useEffect(() => {
    if (verifyingRef.current) return
    verifyingRef.current = true

    async function verify() {
      try {
        await clerk.handleEmailLinkVerification({})

        track('magic_link_succeeded')

        const meResponse = await queryClient.fetchQuery({
          queryKey: getMeQueryKey(),
          queryFn: () => me(),
          staleTime: 0,
        })

        if (meResponse.status === 200) {
          const { onboarding_status, kind, redirect_to } = meResponse.data
          track('sign_in_succeeded', { onboarding_status, kind })

          const destination =
            redirect_to ?? (kind === 'brand' ? '/campaigns' : '/offers')

          void navigate({ to: destination })
        } else {
          void navigate({ to: '/auth/link-invalid' })
        }
      } catch {
        void navigate({ to: '/auth/link-invalid' })
      }
    }

    void verify()
  }, [clerk, navigate, queryClient])

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
        <Loader2
          size={32}
          className="animate-spin text-primary"
          aria-hidden="true"
        />
      </div>

      <p
        className="text-center text-sm leading-relaxed text-muted-foreground"
        aria-live="polite"
      >
        Verificando tu link...
      </p>
    </div>
  )
}
