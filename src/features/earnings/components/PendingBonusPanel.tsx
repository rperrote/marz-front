import { useEffect, useMemo, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Zap } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type {
  CreatorEarningsPeriod,
  CreatorPendingBonuses,
} from '#/shared/api/generated/model'
import { useCreatorEarningsQuery } from '../hooks/useCreatorEarnings'
import type { PendingBonusCardBonus } from './PendingBonusCard'
import { PendingBonusCard } from './PendingBonusCard'

export type PendingBonusCollection = Omit<CreatorPendingBonuses, 'items'> & {
  items: PendingBonusCardBonus[]
}

interface PendingBonusPanelProps {
  period: CreatorEarningsPeriod
  pendingBonuses: PendingBonusCollection
}

export function PendingBonusPanel({
  period,
  pendingBonuses,
}: PendingBonusPanelProps) {
  const initialSpeedBonuses = useMemo(
    () => pendingBonuses.items.filter(isSpeedBonus),
    [pendingBonuses.items],
  )
  const [bonuses, setBonuses] = useState(initialSpeedBonuses)
  const [nextCursor, setNextCursor] = useState(pendingBonuses.next_cursor)
  const [hasMore, setHasMore] = useState(pendingBonuses.has_more)
  const [cursorToLoad, setCursorToLoad] = useState<string | null>(null)
  const appendedCursorRef = useRef<string | null>(null)

  const paginatedQuery = useCreatorEarningsQuery({
    period,
    cursor: cursorToLoad ?? undefined,
    limit: 25,
  })

  useEffect(() => {
    setBonuses(initialSpeedBonuses)
    setNextCursor(pendingBonuses.next_cursor)
    setHasMore(pendingBonuses.has_more)
    setCursorToLoad(null)
    appendedCursorRef.current = null
  }, [initialSpeedBonuses, pendingBonuses.has_more, pendingBonuses.next_cursor])

  useEffect(() => {
    if (!cursorToLoad || appendedCursorRef.current === cursorToLoad) {
      return
    }

    if (
      !paginatedQuery.data ||
      paginatedQuery.isFetching ||
      paginatedQuery.isPlaceholderData
    ) {
      return
    }

    const nextPage = paginatedQuery.data.pending_bonuses
    setBonuses((currentBonuses) => [
      ...currentBonuses,
      ...nextPage.items.filter(isSpeedBonus),
    ])
    setNextCursor(nextPage.next_cursor)
    setHasMore(nextPage.has_more)
    appendedCursorRef.current = cursorToLoad
  }, [cursorToLoad, paginatedQuery.data])

  function handleLoadMore() {
    if (!nextCursor) {
      return
    }

    setCursorToLoad(nextCursor)
  }

  const isLoadingMore =
    Boolean(cursorToLoad) &&
    appendedCursorRef.current !== cursorToLoad &&
    paginatedQuery.isFetching

  return (
    <aside
      aria-labelledby="pending-bonus-panel-title"
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground xl:w-[420px] xl:shrink-0"
    >
      <div>
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-warning" aria-hidden="true" />
          <h2
            id="pending-bonus-panel-title"
            className="text-sm font-semibold text-foreground"
          >
            <Trans>Bonos que podés alcanzar a tiempo</Trans>
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          <Trans>Apurate para cobrarlos</Trans>
        </p>
      </div>

      {bonuses.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {bonuses.map((bonus) => (
            <PendingBonusCard key={bonus.id} bonus={bonus} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Trans>No tenés bonos pendientes por ahora.</Trans>
        </div>
      )}

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full rounded-full"
          onClick={handleLoadMore}
          disabled={!nextCursor || isLoadingMore}
        >
          {isLoadingMore ? t`Loading...` : t`Cargar más`}
        </Button>
      ) : null}
    </aside>
  )
}

function isSpeedBonus(bonus: PendingBonusCardBonus): boolean {
  const bonusType: string = bonus.type
  return bonusType === 'speed'
}
