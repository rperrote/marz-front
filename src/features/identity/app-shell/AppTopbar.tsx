import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

import type { TopbarConfig } from './TopbarContext'
import { useTopbar } from './TopbarContext'

const BACK_LINK_LABEL = 'Volver'

export function AppTopbar() {
  const { config } = useTopbar()
  const hasContextualContent = Boolean(
    config?.back ?? config?.title ?? config?.progress ?? config?.actions,
  )

  return (
    <header
      data-testid="app-topbar"
      data-height="56px"
      className="sticky top-0 z-20 flex h-14 min-h-14 w-full shrink-0 items-center border-b border-border bg-background px-6"
    >
      {hasContextualContent && config ? (
        <ContextualTopbarContent config={config} />
      ) : (
        <BrandWordmark />
      )}
    </header>
  )
}

function BrandWordmark() {
  return (
    <div className="flex min-w-0 items-center gap-2.5" aria-label="Marz">
      <div
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-sm bg-gradient-to-br from-warning to-amber-700 text-xs font-semibold text-white"
      >
        M
      </div>
      <span className="truncate text-sm font-semibold text-foreground">
        Marz
      </span>
    </div>
  )
}

function ContextualTopbarContent({ config }: { config: TopbarConfig }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {config.back ? <TopbarBackAction back={config.back} /> : null}
        {config.title ? (
          <div className="min-w-0 truncate text-lg font-bold text-foreground">
            {config.title}
          </div>
        ) : null}
      </div>
      {config.progress ? (
        <div className="mx-4 flex shrink-0 items-center">{config.progress}</div>
      ) : null}
      {config.actions ? (
        <div className="flex shrink-0 items-center gap-2">{config.actions}</div>
      ) : null}
    </>
  )
}

function TopbarBackAction({
  back,
}: {
  back: NonNullable<TopbarConfig['back']>
}) {
  const className = cn(
    'text-foreground hover:bg-surface-hover focus-visible:ring-ring',
  )

  if ('onBack' in back) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={back.label}
        className={className}
        onClick={back.onBack}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Button>
    )
  }

  return (
    <Button asChild variant="ghost" size="icon-sm" className={className}>
      <Link to={back.to} aria-label={BACK_LINK_LABEL}>
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
    </Button>
  )
}
