import { useState, useCallback } from 'react'
import { Archive } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import type { ArchiveOfferItem } from '#/features/offers/hooks/useConversationOffers'
import { OfferArchiveItem } from './OfferArchiveItem'
import { trackOfferEvent, toArchiveSizeBucket } from '../analytics'
import type { ActorKind } from '../analytics'

interface OffersArchiveBlockProps {
  items: ArchiveOfferItem[]
  nextCursor: string | null
  onLoadMore?: () => void
  isLoadingMore?: boolean
  actorKind: ActorKind
}

export function OffersArchiveBlock({
  items,
  nextCursor,
  onLoadMore,
  isLoadingMore = false,
  actorKind,
}: OffersArchiveBlockProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        trackOfferEvent('offer_archive_expanded', {
          actor_kind: actorKind,
          archive_size_bucket: toArchiveSizeBucket(items.length),
        })
      }
      return next
    })
  }, [actorKind, items.length])

  if (items.length === 0) {
    return (
      <section>
        <header className="flex items-center gap-1.5 px-1 text-muted-foreground">
          <Archive className="size-3" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {t`Archived offers`}
          </span>
        </header>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t`No past offers`}
        </p>
      </section>
    )
  }

  return (
    <section>
      <button
        type="button"
        className="flex w-full items-center gap-1.5 px-1 text-muted-foreground"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <Archive className="size-3" />
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {t`Archived offers`}
        </span>
        <span className="ml-auto font-mono text-[11px]">{items.length}</span>
      </button>

      {open ? (
        <div className="mt-2">
          <ul className="space-y-1" role="list">
            {items.map((item) => (
              <OfferArchiveItem key={item.id} item={item} />
            ))}
          </ul>
          {nextCursor ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t`Loading...` : t`Load more`}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
