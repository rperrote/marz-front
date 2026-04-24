import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { OnboardingField } from '#/features/identity/onboarding/shared/components'
import type { CreatorChannel } from '#/shared/api/generated/model/creatorChannel'
import type { CreatorRateCard } from '#/shared/api/generated/model/creatorRateCard'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const

const FORMATS_BY_PLATFORM: Record<string, { value: string; label: string }[]> =
  {
    instagram: [
      { value: 'ig_reel', label: 'Reel' },
      { value: 'ig_story', label: 'Story' },
      { value: 'ig_post', label: 'Post' },
    ],
    tiktok: [{ value: 'tiktok_post', label: 'Post' }],
    youtube: [
      { value: 'yt_short', label: 'Short' },
      { value: 'yt_long', label: 'Video largo' },
      { value: 'yt_podcast', label: 'Podcast' },
    ],
  }

function emptyChannel(platform: string): CreatorChannel {
  return {
    platform,
    external_handle: '',
    external_url: null,
    followers: null,
    verified: false,
    is_primary: false,
    rate_cards: [],
  }
}

function emptyRateCard(format: string): CreatorRateCard {
  return { format, rate_amount: '', rate_currency: 'USD' }
}

interface ChannelEditorProps {
  channels: CreatorChannel[]
  onChange: (channels: CreatorChannel[]) => void
}

export function ChannelEditor({ channels, onChange }: ChannelEditorProps) {
  // Backend enforces UNIQUE(creator, platform, format) on rate_cards, not on channels.
  // UI auto-selects an unused platform to discourage duplicates but does not block them.
  const addChannel = useCallback(() => {
    const usedPlatforms = new Set(channels.map((c) => c.platform))
    const available = PLATFORMS.find((p) => !usedPlatforms.has(p.value))
    const platform = available?.value ?? 'instagram'
    const next = [...channels, emptyChannel(platform)]
    if (next.filter((c) => c.is_primary).length === 0 && next.length > 0) {
      next[next.length - 1]!.is_primary = true
    }
    onChange(next)
  }, [channels, onChange])

  const removeChannel = useCallback(
    (index: number) => {
      const next = channels.filter((_, i) => i !== index)
      if (next.length > 0 && next.filter((c) => c.is_primary).length === 0) {
        next[0]!.is_primary = true
      }
      onChange(next)
    },
    [channels, onChange],
  )

  const updateChannel = useCallback(
    (index: number, patch: Partial<CreatorChannel>) => {
      onChange(channels.map((c, i) => (i === index ? { ...c, ...patch } : c)))
    },
    [channels, onChange],
  )

  const setPrimary = useCallback(
    (index: number) => {
      onChange(channels.map((c, i) => ({ ...c, is_primary: i === index })))
    },
    [channels, onChange],
  )

  const changePlatform = useCallback(
    (index: number, platform: string) => {
      onChange(
        channels.map((c, i) =>
          i === index ? { ...c, platform, rate_cards: [] } : c,
        ),
      )
    },
    [channels, onChange],
  )

  const addRateCard = useCallback(
    (channelIndex: number, format: string) => {
      const channel = channels[channelIndex]!
      const next = [...channel.rate_cards, emptyRateCard(format)]
      updateChannel(channelIndex, { rate_cards: next })
    },
    [channels, updateChannel],
  )

  const removeRateCard = useCallback(
    (channelIndex: number, cardIndex: number) => {
      const channel = channels[channelIndex]!
      const next = channel.rate_cards.filter((_, i) => i !== cardIndex)
      updateChannel(channelIndex, { rate_cards: next })
    },
    [channels, updateChannel],
  )

  const updateRateCard = useCallback(
    (
      channelIndex: number,
      cardIndex: number,
      patch: Partial<CreatorRateCard>,
    ) => {
      const channel = channels[channelIndex]!
      const next = channel.rate_cards.map((rc, i) =>
        i === cardIndex ? { ...rc, ...patch } : rc,
      )
      updateChannel(channelIndex, { rate_cards: next })
    },
    [channels, updateChannel],
  )

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-6">
      {channels.map((channel, ci) => {
        const formats = FORMATS_BY_PLATFORM[channel.platform] ?? []
        const usedFormats = new Set(channel.rate_cards.map((rc) => rc.format))
        const availableFormats = formats.filter(
          (f) => !usedFormats.has(f.value),
        )

        return (
          <div
            key={ci}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <Select
                  value={channel.platform}
                  onValueChange={(v) => changePlatform(ci, v)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-[length:var(--font-size-sm)] text-muted-foreground">
                  <input
                    type="radio"
                    name="primary_channel"
                    checked={channel.is_primary}
                    onChange={() => setPrimary(ci)}
                    className="accent-primary"
                  />
                  {t`Principal`}
                </label>
              </div>
              {channels.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeChannel(ci)}
                  aria-label={t`Eliminar canal`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <OnboardingField label={t`Handle`}>
              <Input
                value={channel.external_handle}
                onChange={(e) =>
                  updateChannel(ci, { external_handle: e.target.value })
                }
                placeholder="@tu_handle"
                maxLength={200}
              />
            </OnboardingField>

            {channel.rate_cards.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground">
                  {t`Tarifas`}
                </p>
                {channel.rate_cards.map((rc, ri) => {
                  const formatLabel =
                    formats.find((f) => f.value === rc.format)?.label ??
                    rc.format
                  return (
                    <div key={ri} className="flex items-end gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
                          {formatLabel}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rc.rate_amount}
                          onChange={(e) =>
                            updateRateCard(ci, ri, {
                              rate_amount: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          maxLength={50}
                        />
                      </div>
                      <Select
                        value={rc.rate_currency}
                        onValueChange={(v) =>
                          updateRateCard(ci, ri, { rate_currency: v })
                        }
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="COP">COP</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRateCard(ci, ri)}
                        aria-label={t`Eliminar tarifa`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {availableFormats.length > 0 && (
              <Select value="" onValueChange={(v) => addRateCard(ci, v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t`Agregar tarifa...`} />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      })}

      <Button variant="outline" onClick={addChannel} className="self-center">
        <Plus className="mr-2 size-4" />
        {t`Agregar canal`}
      </Button>
    </div>
  )
}
