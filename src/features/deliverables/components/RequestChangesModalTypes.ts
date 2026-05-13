import type { ReactNode } from 'react'

import type { RequestChangesModalAnalyticsPayload } from './RequestChangesModalAnalytics'

export interface RequestChangesModalProps {
  title: string
  triggerLabel?: string
  target?: 'draft' | 'link'
  /** Required for real usage; optional for design-system showcase. */
  deliverableId?: string
  draftId?: string
  linkId?: string
  playbackUrl?: string
  thumbnailUrl?: string
  durationSec?: number
  aspect?: 'landscape' | 'portrait'
  inline?: boolean
  onClose?: () => void
  onSubmitted?: () => void
  trigger?: ReactNode
  analytics?: RequestChangesModalAnalyticsPayload
}
