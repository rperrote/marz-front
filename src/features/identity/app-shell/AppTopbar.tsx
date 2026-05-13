import { ChevronRight, Search } from 'lucide-react'

import { useTopbar } from './TopbarContext'
import type { TopbarBreadcrumbSegment } from './TopbarContext'

export function AppTopbar() {
  const { config } = useTopbar()
  const segments = config?.breadcrumb ?? []

  return (
    <header
      data-testid="app-topbar"
      data-height="56px"
      className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5"
    >
      {segments.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
          {segments.map((segment, index) => (
            <BreadcrumbSegment
              key={segment.label}
              segment={segment}
              isLast={index === segments.length - 1}
            />
          ))}
        </nav>
      ) : null}
      <div className="flex-1" />
      <div className="flex h-9 w-70 items-center gap-2 rounded-full bg-muted px-3.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Buscar…</span>
      </div>
    </header>
  )
}

function BreadcrumbSegment({
  segment,
  isLast,
}: {
  segment: TopbarBreadcrumbSegment
  isLast: boolean
}) {
  const Icon = segment.icon

  return (
    <>
      {Icon ? (
        <Icon
          aria-hidden="true"
          className="size-[18px] shrink-0 text-foreground"
        />
      ) : null}
      <span className="text-md font-medium text-foreground">
        {segment.label}
      </span>
      {!isLast ? (
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      ) : null}
    </>
  )
}
