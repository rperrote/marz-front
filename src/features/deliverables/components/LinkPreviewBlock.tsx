import { ExternalLink, Link as LinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'
import type { PublishedLinkPreview } from '#/features/deliverables/types'
import { trackLinkUrlClicked } from '#/features/deliverables/analytics'

export interface LinkPreviewAnalyticsContext {
  deliverableId: string
  linkId: string
  platform: string
  outcome?: PublishedLinkPreview['outcome']
}

interface LinkPreviewBlockProps {
  preview: PublishedLinkPreview
  url: string
  analytics?: LinkPreviewAnalyticsContext
  className?: string
}

export function LinkPreviewBlock({
  preview,
  url,
  analytics,
  className,
}: LinkPreviewBlockProps) {
  if (preview.outcome !== 'title_and_thumbnail') {
    return (
      <LinkPreviewAnchor
        url={url}
        analytics={analytics}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{url}</span>
        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
      </LinkPreviewAnchor>
    )
  }

  return (
    <LinkPreviewAnchor
      url={url}
      analytics={analytics}
      className={cn(
        'group flex overflow-hidden rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden bg-muted">
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <LinkIcon className="size-5 text-muted-foreground" />
        </div>
        <img
          src={preview.thumbnail_url}
          alt={preview.title}
          loading="lazy"
          className="relative h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      </div>

      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className="truncate text-sm font-medium">{preview.title}</p>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
          {url}
        </p>
      </div>

      <div className="flex items-center pr-3" aria-hidden="true">
        <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </LinkPreviewAnchor>
  )
}

function LinkPreviewAnchor({
  url,
  analytics,
  className,
  children,
}: {
  url: string
  analytics?: LinkPreviewAnalyticsContext
  className: string
  children: ReactNode
}) {
  const handleClick = () => {
    if (!analytics) return
    trackLinkUrlClicked({
      deliverable_id: analytics.deliverableId,
      link_id: analytics.linkId,
      platform: analytics.platform,
      ...(analytics.outcome === undefined
        ? {}
        : { outcome: analytics.outcome }),
    })
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}
