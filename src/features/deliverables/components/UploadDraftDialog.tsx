import { useRef, useState, useEffect, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { t } from '@lingui/core/macro'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { useDraftUploadFlow } from '#/features/deliverables/hooks/useDraftUploadFlow'
import type { Draft } from '#/features/deliverables/api/draftUpload'
import { UploadProgressOverlay } from './UploadProgressOverlay'
import { UploadErrorBanner } from './UploadErrorBanner'

interface UploadDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliverableId: string
  onSuccess: (draft: Draft) => void
  title?: string
}

export function UploadDraftDialog({
  open,
  onOpenChange,
  deliverableId,
  onSuccess,
  title,
}: UploadDraftDialogProps) {
  const { status, progress, error, draft, start, cancel, reset } =
    useDraftUploadFlow(deliverableId)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      reset()
      setSelectedFile(null)
    }
  }, [open, reset])

  useEffect(() => {
    if (status === 'done' && draft) {
      onSuccess(draft)
    }
  }, [status, draft, onSuccess])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (
        !nextOpen &&
        (status === 'uploading' ||
          status === 'completing' ||
          status === 'requesting')
      ) {
        const confirmed = window.confirm(t`Upload in progress. Cancel?`)
        if (!confirmed) return
        cancel()
      }
      if (!nextOpen) {
        reset()
        setSelectedFile(null)
      }
      onOpenChange(nextOpen)
    },
    [cancel, onOpenChange, reset, status],
  )

  const handleFile = useCallback(
    (file: File) => {
      setSelectedFile(file)
      start(file)
    },
    [start],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      e.target.value = ''
    },
    [handleFile],
  )

  const handleDropZoneClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" aria-labelledby="upload-draft-title">
        <DialogTitle id="upload-draft-title" className="sr-only">
          {title ?? t`Upload draft`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t`Upload a video draft for review`}
        </DialogDescription>

        {status === 'requesting' ||
        status === 'uploading' ||
        status === 'completing' ? (
          <UploadProgressOverlay
            filename={selectedFile?.name ?? ''}
            progress={status === 'requesting' ? 0 : progress}
            onCancel={cancel}
          />
        ) : status === 'error' && error ? (
          <UploadErrorBanner kind={error.kind} onRetry={reset} />
        ) : (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              aria-label={t`Drop zone`}
              onClick={handleDropZoneClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleDropZoneClick()
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary hover:bg-primary/5'
              }`}
            >
              <Upload className="size-8 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {t`Drag and drop your video here, or click to browse`}
              </p>
              <p className="text-xs text-muted-foreground">
                {t`MP4, MOV, or WebM up to 2 GB`}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              aria-label={t`Select video file`}
              onChange={handleInputChange}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
