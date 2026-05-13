import { t } from '@lingui/core/macro'
import { Play, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { IconButton } from '#/shared/ui/IconButton'
import type { ChangeCategory } from '#/features/deliverables/api/requestChanges'
import type { RequestChangesFlowError } from '#/features/deliverables/hooks/useRequestChangesFlow'
import { ChangeCategoryChip } from './ChangeCategoryChip'
import { InlineVideoPlayer } from './InlineVideoPlayer'

const CHANGE_CATEGORIES: { value: ChangeCategory; label: () => string }[] = [
  { value: 'product_placement', label: () => t`Ubicación del producto` },
  { value: 'pacing', label: () => t`Ritmo` },
  { value: 'audio', label: () => t`Audio` },
  { value: 'discount_code', label: () => t`Código de descuento` },
  { value: 'other', label: () => t`Otro` },
]

const NOTES_MAX_LENGTH = 4000

interface RequestChangesModalBodyProps {
  actionLabel: string
  title: string
  inline: boolean
  showMedia: boolean
  playbackUrl?: string
  thumbnailUrl?: string
  durationSec?: number
  aspect: 'landscape' | 'portrait'
  deliverableId?: string
  draftId?: string
  categories: Set<ChangeCategory>
  notes: string
  notesId: string
  notesHintId: string
  notesErrorId: string
  notesDescribedBy: string
  error: RequestChangesFlowError | null
  canSubmit: boolean
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: () => void
  onToggleCategory: (category: ChangeCategory) => void
  onNotesChange: (value: string) => void
}

export function RequestChangesModalBody({
  actionLabel,
  title,
  inline,
  showMedia,
  playbackUrl,
  thumbnailUrl,
  durationSec,
  aspect,
  deliverableId,
  draftId,
  categories,
  notes,
  notesId,
  notesHintId,
  notesErrorId,
  notesDescribedBy,
  error,
  canSubmit,
  isSubmitting,
  onCancel,
  onSubmit,
  onToggleCategory,
  onNotesChange,
}: RequestChangesModalBodyProps) {
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            {actionLabel}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {!inline ? (
          <IconButton aria-label={t`Cerrar`} shape="circle" onClick={onCancel}>
            <X />
          </IconButton>
        ) : null}
      </header>

      {showMedia ? (
        playbackUrl ? (
          <InlineVideoPlayer
            playbackUrl={playbackUrl}
            thumbnailUrl={thumbnailUrl}
            durationSec={durationSec}
            aspect={aspect}
            deliverableId={deliverableId}
            draftId={draftId}
          />
        ) : (
          <div className="aspect-video w-full rounded-lg bg-muted">
            <div className="flex h-full items-center justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-foreground/70 text-background">
                <Play className="size-7" />
              </div>
            </div>
          </div>
        )
      ) : null}

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">
          {t`¿Qué hay que cambiar?`}
        </Label>
        <div className="flex flex-wrap gap-2">
          {CHANGE_CATEGORIES.map((cat) => (
            <ChangeCategoryChip
              key={cat.value}
              label={cat.label()}
              selected={categories.has(cat.value)}
              onToggle={() => onToggleCategory(cat.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={notesId}
            className="text-sm font-semibold text-foreground"
          >
            {t`Notas adicionales`}
          </Label>
          <span
            id={notesHintId}
            className={cn(
              'text-xs tabular-nums',
              notes.length > NOTES_MAX_LENGTH
                ? 'text-destructive'
                : 'text-muted-foreground',
            )}
          >
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t`Sé específico — mencioná timestamps si es posible (ej: 'en 0:42 el logo del producto está cortado')`}
          rows={4}
          aria-describedby={notesDescribedBy}
          aria-invalid={
            error?.kind === 'field' && error.field === 'notes'
              ? 'true'
              : undefined
          }
        />
        {error?.kind === 'field' && error.field === 'notes' ? (
          <p
            id={notesErrorId}
            className="text-sm text-destructive"
            role="alert"
          >
            {error.message}
          </p>
        ) : null}
      </div>

      {error?.kind === 'fatal' ? (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error.message}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t`Cancelar`}
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? t`Enviando…` : actionLabel}
        </Button>
      </div>
    </div>
  )
}
