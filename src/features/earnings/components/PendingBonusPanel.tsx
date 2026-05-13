import { useEffect, useReducer } from 'react'
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
  const [paginationState, dispatchPagination] = useReducer(
    pendingBonusPaginationReducer,
    initialPendingBonusPaginationState,
  )

  const paginatedQuery = useCreatorEarningsQuery({
    period,
    cursor: paginationState.cursorToLoad ?? undefined,
    limit: 25,
  })

  useEffect(() => {
    if (
      !paginationState.cursorToLoad ||
      paginationState.appendedCursors.has(paginationState.cursorToLoad)
    ) {
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
    dispatchPagination({
      type: 'pageLoaded',
      cursor: paginationState.cursorToLoad,
      page: nextPage,
    })
  }, [
    paginationState.appendedCursors,
    paginationState.cursorToLoad,
    paginatedQuery.data,
    paginatedQuery.isFetching,
    paginatedQuery.isPlaceholderData,
  ])

  const loadedBonuses = paginationState.pages.flatMap((page) =>
    page.items.filter(isSpeedBonus),
  )
  const bonuses = [
    ...pendingBonuses.items.filter(isSpeedBonus),
    ...loadedBonuses,
  ]
  const latestPage = paginationState.pages.at(-1)
  const nextCursor = latestPage?.next_cursor ?? pendingBonuses.next_cursor
  const hasMore = latestPage?.has_more ?? pendingBonuses.has_more

  function handleLoadMore() {
    if (!nextCursor) {
      return
    }

    dispatchPagination({ type: 'loadCursor', cursor: nextCursor })
  }

  const isLoadingMore =
    paginationState.cursorToLoad !== null &&
    !paginationState.appendedCursors.has(paginationState.cursorToLoad) &&
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

interface PendingBonusPaginationState {
  cursorToLoad: string | null
  pages: PendingBonusCollection[]
  appendedCursors: Set<string>
}

type PendingBonusPaginationAction =
  | { type: 'loadCursor'; cursor: string }
  | {
      type: 'pageLoaded'
      cursor: string
      page: PendingBonusCollection
    }

const initialPendingBonusPaginationState: PendingBonusPaginationState = {
  cursorToLoad: null,
  pages: [],
  appendedCursors: new Set(),
}

function pendingBonusPaginationReducer(
  state: PendingBonusPaginationState,
  action: PendingBonusPaginationAction,
): PendingBonusPaginationState {
  switch (action.type) {
    case 'loadCursor':
      return { ...state, cursorToLoad: action.cursor }
    case 'pageLoaded':
      if (state.appendedCursors.has(action.cursor)) {
        return state
      }
      return {
        cursorToLoad: null,
        pages: [...state.pages, action.page],
        appendedCursors: new Set(state.appendedCursors).add(action.cursor),
      }
  }
}

function isSpeedBonus(bonus: PendingBonusCardBonus): boolean {
  const bonusType: string = bonus.type
  return bonusType === 'speed'
}
