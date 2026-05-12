import {
  useListLinks,
  getListLinksQueryKey,
} from '#/shared/api/generated/deliverables/deliverables'
import type {
  PublishedLinkDTO,
  PublishedLinkPreviewDTO,
} from '#/shared/api/generated/model'
import type {
  DeliverableLinksResponse,
  PublishedLink,
  PublishedLinkPreview,
  PublishedLinkStatus,
} from '#/features/deliverables/types'

interface UseDeliverableLinksOptions {
  enabled?: boolean
}

export function getDeliverableLinksQueryKey(deliverableId: string) {
  return getListLinksQueryKey({ deliverable_id: deliverableId })
}

// El backend devuelve PublishedLinkPreviewDTO con campos nullable. Lo mapeamos
// al discriminated union (PublishedLinkPreview) que consume la UI.
function mapPreview(preview: PublishedLinkPreviewDTO): PublishedLinkPreview {
  if (preview.error) return { outcome: 'failed' }
  if (preview.title && preview.image_url) {
    return {
      outcome: 'title_and_thumbnail',
      title: preview.title,
      thumbnail_url: preview.image_url,
    }
  }
  return { outcome: 'url_only' }
}

function mapLink(link: PublishedLinkDTO): PublishedLink {
  return {
    id: link.id,
    deliverable_id: link.deliverable_id,
    url: link.url,
    status: link.status as PublishedLinkStatus,
    preview: mapPreview(link.preview),
    submitted_at: link.submitted_at,
    submitted_by_account_id: link.submitted_by_account_id,
    approved_at: link.approved_at,
    approved_by_account_id: link.approved_by_account_id,
  }
}

export function useDeliverableLinks(
  deliverableId: string,
  options?: UseDeliverableLinksOptions,
) {
  return useListLinks(
    { deliverable_id: deliverableId },
    {
      query: {
        enabled: (options?.enabled ?? true) && !!deliverableId,
        staleTime: 5_000,
        select: (response): DeliverableLinksResponse => {
          if (response.status !== 200) {
            return { links: [], current_link_id: null }
          }
          return {
            links: response.data.links.map(mapLink),
            current_link_id: response.data.current_link_id,
          }
        },
      },
    },
  )
}
