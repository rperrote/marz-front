import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Search, X } from 'lucide-react'

import { trackConversationRailSearch } from './analytics'
import { useDebounce } from './useDebounce'

const MAX_SEARCH_LENGTH = 80
const DEBOUNCE_MS = 200

interface ConversationSearchInputProps {
  value?: string
  hasResults?: boolean
}

export function ConversationSearchInput({
  value,
  hasResults,
}: ConversationSearchInputProps) {
  const navigate = useNavigate({ from: '/workspace' })
  const [localValue, setLocalValue] = useState(value ?? '')
  const debouncedValue = useDebounce(localValue, DEBOUNCE_MS)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const trimmed = debouncedValue.trim()
    const searchParam = trimmed || undefined
    if (trimmed.length > 0) {
      trackConversationRailSearch({
        has_results: hasResults ?? false,
        query_length: trimmed.length,
      })
    }
    // unsafeRelative: 'path' resolves the navigation against the current
    // location instead of `from: '/workspace'`. Without this, typing in the
    // rail's search box while inside /workspace/conversations/$id would
    // bounce the user back to /workspace.
    void navigate({
      to: '.',
      unsafeRelative: 'path',
      search: (prev) => ({
        ...prev,
        search: searchParam,
      }),
      replace: true,
    })
  }, [debouncedValue, hasResults, navigate])

  function updateSearchFromInput(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.slice(0, MAX_SEARCH_LENGTH)
    setLocalValue(next)
  }

  function clearSearch() {
    setLocalValue('')
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label={t`Buscar conversaciones`}
        placeholder={t`Buscar conversaciones…`}
        value={localValue}
        onChange={updateSearchFromInput}
        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {localValue.length > 0 ? (
        <button
          type="button"
          onClick={clearSearch}
          aria-label={t`Limpiar búsqueda`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
