import { t } from '@lingui/core/macro'
import { Check, ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { useSubmitCreatorOnboarding } from '../useSubmitCreatorOnboarding'
import { useCreatorOnboardingStore } from '../store'

export function C20ConfirmationScreen() {
  const { submit, isPending } = useSubmitCreatorOnboarding()
  const store = useCreatorOnboardingStore()

  const displayName = store.display_name?.trim() ?? ''
  const firstName = displayName.split(/\s+/)[0] ?? t`Creator`
  const handle = store.handle ? `@${store.handle}` : ''
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('') || firstName.slice(0, 2).toUpperCase()

  const tierLabels: Record<string, string> = {
    emergent: 'Emergente',
    growing: 'Creciendo',
    consolidated: 'Consolidado',
    reference: 'Referente',
    massive: 'Masivo',
    celebrity: 'Celebridad',
  }
  const tierLabel = store.tier ? tierLabels[store.tier] : undefined

  const niches = (store.niches ?? []).slice(0, 3)
  const city = store.city?.trim()

  const mainChannel = store.channels?.find((c) => c.is_primary)
  const followersK = mainChannel?.followers
    ? `${Math.round(mainChannel.followers / 1000)}K`
    : '—'

  return (
    <div className="relative flex w-full flex-col items-center gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-100px] h-[500px] w-[600px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex size-[72px] items-center justify-center rounded-full bg-primary/20">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary">
          <Check className="size-6 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>

      <div className="relative flex w-full max-w-[600px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground">
          {t`Listo, ${firstName}.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Tu perfil está activo. Te avisamos por WhatsApp cuando llegue una oferta.`}
        </p>
      </div>

      <div className="relative flex w-full max-w-[480px] flex-col gap-4 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              {initials}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {displayName || t`Tu nombre`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {[handle, tierLabel, city].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
        {niches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {niches.map((n) => (
              <span
                key={n}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
              >
                {n}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-6 border-t border-border pt-3">
          <Stat value={followersK} label={t`total followers`} />
          <Stat value="4/mes" label={t`disponibilidad`} />
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <button
          type="button"
          data-testid="onboarding-start-btn"
          disabled={isPending}
          onClick={submit}
          className="flex h-12 items-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {t`Ir a mi dashboard`}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
        <button
          type="button"
          disabled
          className="flex h-12 items-center gap-2.5 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground opacity-60"
        >
          <UserPlus className="size-4" />
          {t`Invitar a un amigo`}
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-base font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
