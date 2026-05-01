import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

interface UploadProgressOverlayProps {
  filename: string
  progress: number
  onCancel: () => void
}

export function UploadProgressOverlay({
  filename,
  progress,
  onCancel,
}: UploadProgressOverlayProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between text-sm text-foreground">
          <span className="truncate font-medium">{filename}</span>
          <span className="font-mono tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t`Upload progress`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Button variant="destructive" size="sm" onClick={onCancel}>
        {t`Cancel`}
      </Button>
    </div>
  )
}
