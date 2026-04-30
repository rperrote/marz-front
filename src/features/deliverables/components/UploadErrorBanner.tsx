import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import type { UploadErrorKind } from '#/features/deliverables/api/draftUpload'

interface UploadErrorBannerProps {
  kind: UploadErrorKind
  onRetry: () => void
}

function errorMessage(kind: UploadErrorKind): string {
  switch (kind) {
    case 'format':
      return t`This file format isn't supported. Use MP4, MOV, or WebM.`
    case 'size':
      return t`File too large (max 2 GB).`
    case 'network':
      return t`Upload failed. Check your connection and try again.`
    case 'cancelled':
      return ''
    default:
      return t`Something went wrong. Try again.`
  }
}

export function UploadErrorBanner({ kind, onRetry }: UploadErrorBannerProps) {
  const message = errorMessage(kind)
  if (!message) return null

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t`Try again`}
      </Button>
    </div>
  )
}
