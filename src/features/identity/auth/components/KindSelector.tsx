import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, User, Briefcase, Hourglass, ArrowRight } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import {
  getMeQueryKey,
  useSelectKind,
} from '#/shared/api/generated/accounts/accounts'
import type { AccountKind } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { track } from '#/shared/analytics/track'

type CardKind = 'brand' | 'creator' | 'agency'

const cards: Array<{
  kind: CardKind
  icon: typeof Building2
  title: () => string
  description: () => string
  disabled: boolean
}> = [
  {
    kind: 'brand',
    icon: Building2,
    title: () => t`Soy una marca`,
    description: () => t`Quiero correr campañas con creadores.`,
    disabled: false,
  },
  {
    kind: 'creator',
    icon: User,
    title: () => t`Soy creador`,
    description: () =>
      t`Quiero recibir ofertas de marcas afines y cobrar rápido.`,
    disabled: false,
  },
  {
    kind: 'agency',
    icon: Briefcase,
    title: () => t`Soy una agencia`,
    description: () => t`Manejo campañas para varias marcas.`,
    disabled: true,
  },
]

export function KindSelector() {
  const [selected, setSelected] = useState<CardKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useSelectKind()

  function handleSubmit() {
    if (!selected || selected === 'agency') return

    const kind: AccountKind = selected
    setError(null)

    mutation.mutate(
      { data: { kind } },
      {
        onSuccess: async (response) => {
          track('kind_selected', { kind })

          await queryClient.refetchQueries({
            queryKey: getMeQueryKey(),
          })

          const fallback = `/onboarding/${kind}`
          const destination =
            response.status === 200
              ? (response.data.redirect_to ?? fallback)
              : fallback

          void navigate({ to: destination })
        },
        onError: async (err) => {
          if (err instanceof ApiError && err.status === 409) {
            await queryClient.refetchQueries({
              queryKey: getMeQueryKey(),
            })

            void navigate({ to: `/onboarding/${kind}` })
            return
          }

          if (err instanceof ApiError && err.status === 422) {
            setError(err.message)
            return
          }

          setError(t`Algo salió mal. Intentá de nuevo.`)
        },
      },
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-12">
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          <Trans>¿Qué te trae por acá?</Trans>
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          <Trans>
            Elegí tu rol. Vamos a personalizar la experiencia desde acá.
          </Trans>
        </p>
      </div>

      <div
        className="flex flex-wrap justify-center gap-5"
        role="group"
        aria-label={t`Seleccioná tu rol`}
      >
        {cards.map((card) => {
          const isSelected = selected === card.kind
          const Icon = card.icon

          return (
            <button
              key={card.kind}
              type="button"
              aria-pressed={isSelected}
              aria-disabled={card.disabled}
              disabled={card.disabled || mutation.isPending}
              onClick={() => {
                if (!card.disabled) {
                  setSelected(card.kind)
                  setError(null)
                }
              }}
              className={[
                'flex h-[280px] w-[260px] flex-col gap-4 rounded-[20px] border p-6 text-left transition-colors',
                card.disabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer',
                isSelected
                  ? 'border-2 border-primary bg-card'
                  : 'border-border bg-card',
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-11 w-11 items-center justify-center rounded-xl',
                  isSelected ? 'bg-primary' : 'bg-muted',
                ].join(' ')}
              >
                <Icon
                  size={20}
                  className={
                    isSelected ? 'text-primary-foreground' : 'text-foreground'
                  }
                />
              </div>

              <div className="mt-auto flex flex-col gap-2">
                {card.disabled && (
                  <span className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    <Hourglass size={12} />
                    <Trans>Próximamente</Trans>
                  </span>
                )}
                <span className="text-[15px] font-semibold text-foreground">
                  {card.title()}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {card.description()}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!selected || selected === 'agency' || mutation.isPending}
        onClick={handleSubmit}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
      >
        <Trans>Continuar</Trans>
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
