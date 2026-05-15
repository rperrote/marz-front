import { useEffect, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import {
  Check,
  ArrowRight,
  Loader2,
  Instagram,
  Youtube,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useSubmitCreatorOnboarding } from '../useSubmitCreatorOnboarding'
import { useCreatorOnboardingStore } from '../store'
import { COUNTRIES } from '../countries'

/* eslint-disable lingui/no-unlocalized-strings */
const AVATAR_PREVIEW_KEY = 'marz-creator-onboarding-avatar-preview'

const PLATFORM_LABELS: Record<string, () => string> = {
  instagram: () => 'Instagram',
  tiktok: () => 'TikTok',
  youtube: () => 'YouTube',
}

const FORMAT_LABELS: Record<string, () => string> = {
  ig_reel: () => 'Reel',
  ig_story: () => 'Story',
  ig_post: () => 'Post',
  tiktok_post: () => 'Post',
  yt_short: () => 'Short',
  yt_long: () => t`Video largo`,
  yt_podcast: () => 'Podcast',
}
/* eslint-enable lingui/no-unlocalized-strings */

const TIER_LABELS: Record<string, () => string> = {
  emergent: () => t`Emergente`,
  growing: () => t`Creciendo`,
  consolidated: () => t`Consolidado`,
  reference: () => t`Referente`,
  massive: () => t`Masivo`,
  celebrity: () => t`Celebridad`,
}

/* eslint-disable lingui/no-unlocalized-strings */
const NICHE_LABELS: Record<string, () => string> = {
  fintech: () => 'Fintech',
  tech: () => 'Tech',
  productivity: () => t`Productividad`,
  fitness: () => 'Fitness',
  beauty: () => t`Belleza`,
  fashion: () => t`Moda`,
  food: () => t`Comida`,
  travel: () => t`Viajes`,
  gaming: () => 'Gaming',
  music: () => t`Música`,
  lifestyle: () => 'Lifestyle',
  business: () => t`Negocios`,
  education: () => t`Educación`,
  parenting: () => t`Maternidad`,
  health: () => t`Salud`,
}

const CONTENT_TYPE_LABELS: Record<string, () => string> = {
  unboxing: () => 'Unboxing',
  reviews: () => 'Reviews',
  video_ads: () => t`Video ads`,
  humor_sketches: () => t`Humor / sketches`,
  tutorials: () => t`Tutoriales`,
  vlogs: () => 'Vlogs',
  testimonials: () => t`Testimoniales`,
  podcasts: () => 'Podcasts',
  live: () => t`En vivo`,
}
/* eslint-enable lingui/no-unlocalized-strings */

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'size-4 text-foreground' // eslint-disable-line lingui/no-unlocalized-strings
  if (platform === 'instagram') return <Instagram className={cls} />
  if (platform === 'youtube') return <Youtube className={cls} />
  if (platform === 'tiktok')
    return (
      <span
        aria-hidden
        className="text-[14px] font-bold leading-none text-foreground"
      >
        ♪
      </span>
    )
  return <span className="size-2 rounded-full bg-foreground" aria-hidden />
}

function flagFromCountryCode(code: string): string {
  if (!code || code.length !== 2) return ''
  const A = 0x1f1e6
  return (
    String.fromCodePoint(A + (code.charCodeAt(0) - 65)) +
    String.fromCodePoint(A + (code.charCodeAt(1) - 65))
  )
}

export function C20ConfirmationScreen() {
  const { submit, isPending } = useSubmitCreatorOnboarding()
  const store = useCreatorOnboardingStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (store.avatar_s3_key) {
      setAvatarPreview(sessionStorage.getItem(AVATAR_PREVIEW_KEY))
    }
  }, [store.avatar_s3_key])

  const displayName = store.display_name?.trim() ?? ''
  const firstName = displayName.split(/\s+/)[0] ?? t`Creador`
  const handle = store.handle ? `@${store.handle}` : ''
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('') || firstName.slice(0, 2).toUpperCase()

  const tierLabel = store.tier
    ? (TIER_LABELS[store.tier]?.() ?? store.tier)
    : undefined
  const niches = store.niches ?? []
  const contentTypes = store.content_types ?? []
  const channels = store.channels ?? []
  const city = store.city?.trim()
  const countryCode = store.country ?? ''
  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name
  const flag = flagFromCountryCode(countryCode)

  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[560px] w-[680px] -translate-x-1/2 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.28) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="flex size-[72px] items-center justify-center rounded-full bg-primary/20">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary">
            <Check className="size-6 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className="relative flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center gap-4 p-5">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={displayName || t`Avatar del creador`}
              className="size-16 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary ring-2 ring-primary/30">
              <span className="text-base font-bold text-primary-foreground">
                {initials}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-bold text-foreground">
                {displayName || <Trans>Tu nombre</Trans>}
              </span>
              {tierLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="size-3" />
                  {tierLabel}
                </span>
              )}
            </div>
            {handle && (
              <span className="truncate text-[13px] text-muted-foreground">
                {handle}
              </span>
            )}
            {(city || countryName) && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="size-3" />
                {flag && <span aria-hidden>{flag}</span>}
                {[city, countryName].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {(niches.length > 0 || contentTypes.length > 0) && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
            {niches.length > 0 && (
              <Section title={t`Nichos`}>
                {niches.map((n) => (
                  <Chip key={n}>{NICHE_LABELS[n]?.() ?? n}</Chip>
                ))}
              </Section>
            )}
            {contentTypes.length > 0 && (
              <Section title={t`Formatos`}>
                {contentTypes.map((c) => (
                  <Chip key={c}>{CONTENT_TYPE_LABELS[c]?.() ?? c}</Chip>
                ))}
              </Section>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t`Canales`}
            </p>
            <div className="flex flex-col gap-3">
              {channels.map((c) => (
                <div key={c.platform} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} />
                      <span className="text-[13px] font-medium text-foreground">
                        {PLATFORM_LABELS[c.platform]?.() ?? c.platform}
                      </span>
                      {c.is_primary && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t`Principal`}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[12px] text-muted-foreground">
                      @{c.external_handle}
                    </span>
                  </div>
                  {c.rate_cards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {c.rate_cards.map((rc) => {
                        const amount = Number(rc.rate_amount)
                        const valid = Number.isFinite(amount) && amount > 0
                        return (
                          <span
                            key={rc.format}
                            className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                          >
                            <span className="text-muted-foreground">
                              {FORMAT_LABELS[rc.format]?.() ?? rc.format}
                            </span>
                            {valid && (
                              <span className="ml-1.5 font-semibold">
                                {amount.toLocaleString('es-AR')}{' '}
                                {rc.rate_currency}
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
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
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
      {children}
    </span>
  )
}
