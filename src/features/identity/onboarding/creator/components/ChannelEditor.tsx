import { useCallback, useEffect, useState } from 'react'
import { t, plural } from '@lingui/core/macro'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { FieldRow } from '#/shared/ui/form'
import type { CreatorChannel, CreatorRateCard } from '../types'

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

function hasAmount(rc: CreatorRateCard): boolean {
  return rc.rate_amount.trim() !== ''
}

function buildSummary(
  channel: CreatorChannel,
  formats: { value: string; label: string }[],
): { text: string; missing: boolean } {
  const cards = channel.rate_cards
  if (cards.length === 0) return { text: '', missing: false }

  const labelOf = (fmt: string) =>
    formats.find((f) => f.value === fmt)?.label ?? fmt

  if (cards.length === 1) {
    const rc = cards[0]!
    if (!hasAmount(rc)) {
      return {
        text: t`A la tarifa ${labelOf(rc.format)} le falta monto`,
        missing: true,
      }
    }
    return {
      text: `${labelOf(rc.format)} · ${rc.rate_amount} ${rc.rate_currency}`,
      missing: false,
    }
  }

  const missingCount = cards.filter(
    (rc: CreatorRateCard) => !hasAmount(rc),
  ).length
  if (missingCount > 0) {
    return {
      text: plural(missingCount, {
        one: 'A una tarifa le falta monto',
        other: 'A # tarifas les falta monto',
      }),
      missing: true,
    }
  }
  return { text: t`${cards.length} tarifas`, missing: false }
}

interface ChannelEditorProps {
  channels: CreatorChannel[]
  onChange: (channels: CreatorChannel[]) => void
}

export function ChannelEditor({ channels, onChange }: ChannelEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number>(() =>
    channels.length > 0 ? channels.length - 1 : 0,
  )

  useEffect(() => {
    if (expandedIndex >= channels.length && channels.length > 0) {
      setExpandedIndex(channels.length - 1)
    }
  }, [channels.length, expandedIndex])

  // One channel per platform. UI prevents duplicates entirely.
  const usedPlatforms = new Set(channels.map((c) => c.platform))
  const canAddChannel = usedPlatforms.size < PLATFORMS.length

  const addChannel = useCallback(() => {
    const used = new Set(channels.map((c) => c.platform))
    const available = PLATFORMS.find((p) => !used.has(p.value))
    if (!available) return
    const next = [...channels, emptyChannel(available.value)]
    if (next.filter((c) => c.is_primary).length === 0 && next.length > 0) {
      next[next.length - 1]!.is_primary = true
    }
    onChange(next)
    setExpandedIndex(next.length - 1)
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
      const next = channel.rate_cards.filter(
        (_: CreatorRateCard, i: number) => i !== cardIndex,
      )
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
      const next = channel.rate_cards.map((rc: CreatorRateCard, i: number) =>
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
        const usedFormats = new Set(
          channel.rate_cards.map((rc: CreatorRateCard) => rc.format),
        )
        const availableFormats = formats.filter(
          (f) => !usedFormats.has(f.value),
        )
        const platformLabel =
          PLATFORMS.find((p) => p.value === channel.platform)?.label ??
          channel.platform
        const isExpanded = expandedIndex === ci
        const summary = buildSummary(channel, formats)

        return (
          <div
            key={ci}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? -1 : ci)}
                className="flex flex-1 items-center gap-3 text-left"
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    isExpanded ? '' : '-rotate-90'
                  }`}
                />
                <span className="font-medium">{platformLabel}</span>
                {channel.is_primary && (
                  <span className="text-[length:var(--font-size-xs)] text-muted-foreground">
                    {t`Principal`}
                  </span>
                )}
                {!isExpanded && summary.text && (
                  <span
                    className={`ml-auto truncate text-[length:var(--font-size-sm)] ${
                      summary.missing
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {summary.text}
                  </span>
                )}
              </button>
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

            {isExpanded && (
              <>
                <div className="flex items-center gap-3">
                  <Select
                    value={channel.platform}
                    onValueChange={(v) => changePlatform(ci, v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.filter(
                        (p) =>
                          p.value === channel.platform ||
                          !usedPlatforms.has(p.value),
                      ).map((p) => (
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

                <FieldRow label={t`Handle`}>
                  {(aria) => (
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        @
                      </span>
                      <Input
                        {...aria}
                        value={channel.external_handle}
                        onChange={(e) =>
                          updateChannel(ci, {
                            external_handle: e.target.value.replace(/@/g, ''),
                          })
                        }
                        placeholder="tu_handle"
                        maxLength={200}
                        className="pl-7"
                        aria-invalid={
                          channel.external_handle.trim() === '' || undefined
                        }
                      />
                    </div>
                  )}
                </FieldRow>

                {channel.rate_cards.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[length:var(--font-size-sm)] font-medium text-muted-foreground">
                      {t`Tarifas`}
                    </p>
                    {channel.rate_cards.map(
                      (rc: CreatorRateCard, ri: number) => {
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
                                aria-invalid={!hasAmount(rc) || undefined}
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
                      },
                    )}
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
              </>
            )}
          </div>
        )
      })}

      <Button
        variant="outline"
        onClick={addChannel}
        disabled={!canAddChannel}
        className="self-center"
      >
        <Plus className="mr-2 size-4" />
        {t`Agregar canal`}
      </Button>

      <p className="text-center text-[length:var(--font-size-sm)] text-muted-foreground">
        {t`Los creadores con tarifas reciben más ofertas de las marcas.`}
      </p>
    </div>
  )
}
