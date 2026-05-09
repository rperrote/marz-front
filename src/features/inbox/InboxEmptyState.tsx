import { Link } from '@tanstack/react-router'
import { Inbox, Megaphone, Sparkles } from 'lucide-react'

import { Button } from '#/components/ui/button'

import type { InboxResponse } from './api/inbox'

interface InboxEmptyStateProps {
  emptyState: InboxResponse['empty_state']
}

export function InboxEmptyState({ emptyState }: InboxEmptyStateProps) {
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
            <Button asChild className="rounded-full">
              <Link to={emptyState.primary_cta.href}>
                <Sparkles className="size-4" />
                {emptyState.primary_cta.label}
              </Link>
            </Button>
          ) : null}
          {emptyState.secondary_cta ? (
            <Button asChild variant="secondary" className="rounded-full">
              <Link to={emptyState.secondary_cta.href}>
                <Megaphone className="size-4" />
                {emptyState.secondary_cta.label}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
