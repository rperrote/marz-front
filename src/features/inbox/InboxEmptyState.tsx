import { useRouter } from '@tanstack/react-router'
import { Inbox, Megaphone, Sparkles } from 'lucide-react'
import type { ComponentType, MouseEvent } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

import type { InboxResponse } from './api/inbox'
import { isKnownRouterHref } from './routerHref'

interface InboxEmptyStateProps {
  emptyState: InboxResponse['empty_state']
}

export function InboxEmptyState({ emptyState }: InboxEmptyStateProps) {
  const router = useRouter()

  return (
    <section
      className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-3xl border border-border bg-card px-8 py-12 text-center"
      aria-labelledby="inbox-empty-title"
    >
      <div
        className="flex size-20 items-center justify-center rounded-full bg-muted text-primary"
        aria-hidden
      >
        <Inbox className="size-8" />
      </div>

      <div className="flex max-w-xl flex-col items-center gap-2">
        <h2
          id="inbox-empty-title"
          className="text-2xl font-semibold text-foreground"
        >
          {emptyState.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {emptyState.description}
        </p>
      </div>

      {emptyState.primary_cta || emptyState.secondary_cta ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {emptyState.primary_cta ? (
            <InboxEmptyStateCta
              href={emptyState.primary_cta.href}
              icon={Sparkles}
              label={emptyState.primary_cta.label}
              router={router}
            />
          ) : null}
          {emptyState.secondary_cta ? (
            <InboxEmptyStateCta
              href={emptyState.secondary_cta.href}
              icon={Megaphone}
              label={emptyState.secondary_cta.label}
              router={router}
              variant="secondary"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function InboxEmptyStateCta({
  href,
  icon: Icon,
  label,
  router,
  variant,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  router: ReturnType<typeof useRouter>
  variant?: 'secondary'
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey) {
      return
    }

    event.preventDefault()

    if (!isKnownRouterHref(router, href)) {
      toast.info(t`Esta sección todavía no está disponible.`)
      return
    }

    void router.navigate({ to: href })
  }

  return (
    <Button asChild variant={variant} className="rounded-full">
      <a href={href} onClick={handleClick}>
        <Icon className="size-4" />
        {label}
      </a>
    </Button>
  )
}
