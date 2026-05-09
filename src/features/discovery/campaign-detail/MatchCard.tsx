import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Mail, Send } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type {
  CampaignMatchCard,
  CreatorCardListSummary,
  CreatorPlatformListItem,
} from '#/shared/api/generated/model'

import { formatPlatform, initials } from '#/shared/utils/format'

import { useContactMatch } from './mutations'

interface MatchCardProps {
  campaignId: string
  match: CampaignMatchCard
}

export function MatchCard({ campaignId, match }: MatchCardProps) {
  const navigate = useNavigate()
  const contactMatch = useContactMatch(campaignId, {
    onConversationReady: (conversationId) => {
      void navigate({
        to: '/workspace/conversations/$conversationId',
        params: { conversationId },
      })
    },
  })
  const creator = match.creator
  const primaryPlatform = getPrimaryPlatform(creator)
  const platforms = creator.platforms.slice(0, 3)
  const isContacting = contactMatch.isPending

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative min-h-[420px] overflow-hidden bg-muted">
        {creator.preview_url ? (
          <img
            src={creator.preview_url}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Avatar className="size-24">
              {creator.avatar_url ? (
                <AvatarImage src={creator.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="text-2xl">
                {initials(creator.display_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="absolute top-4 right-4 rounded-full border border-white/25 bg-primary/70 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-white shadow-sm backdrop-blur-md">
          {t`${match.score_pct}% match`}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/65 to-transparent p-4 pt-28 text-white">
          <h3 className="text-[22px] leading-tight font-semibold">
            {creator.display_name}
          </h3>
          <p className="mt-1 truncate font-mono text-[11px] text-white/70">
            @{creator.handle}
            {primaryPlatform
              ? ` · ${formatPlatform(primaryPlatform.platform)}`
              : ''}
          </p>
          {creator.niche ? (
            <p className="mt-2 line-clamp-2 text-xs text-white/75">
              {creator.niche}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1">
            {platforms.map((platform) => (
              <span
                key={`${platform.platform}-${platform.handle}`}
                className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[11px] text-white/85"
              >
                {formatPlatform(platform.platform)}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1">
            <Metric
              label={t`Followers`}
              value={formatFollowers(match.metrics.followers)}
            />
            <Metric
              label={t`Engagement`}
              value={match.metrics.engagement_pct ?? t`Sin dato`}
            />
            <Metric
              label={t`Fee`}
              value={match.metrics.fee_amount ?? t`Sin dato`}
            />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-3">
        <p className="line-clamp-2 min-h-10 text-sm text-foreground">
          {match.reason.summary}
        </p>
        {match.reason.signals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {match.reason.signals.slice(0, 3).map((signal) => (
              <Badge key={signal} variant="secondary" className="max-w-full">
                <span className="truncate">{signal}</span>
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              contactMatch.mutate({
                matchId: match.match_id,
                data: {
                  invite: {
                    mode: 'in_platform',
                    creator_account_id: creator.account_id,
                  },
                },
              })
            }
            disabled={!match.can_contact || isContacting}
          >
            {isContacting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
            {t`Invite`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              contactMatch.mutate({
                matchId: match.match_id,
                data: {},
              })
            }
            disabled={!match.can_contact || isContacting}
          >
            {isContacting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Mail className="size-3.5" aria-hidden />
            )}
            {t`Contact`}
          </Button>
        </div>
      </div>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 p-1.5">
      <p className="truncate font-mono text-[10px] text-white/60 uppercase">
        {label}
      </p>
      <p className="truncate text-xs font-semibold text-white">{value}</p>
    </div>
  )
}

function getPrimaryPlatform(
  creator: CreatorCardListSummary,
): CreatorPlatformListItem | undefined {
  return creator.platforms[0]
}

function formatFollowers(value: number | null) {
  if (value === null) return t`Sin dato`
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
