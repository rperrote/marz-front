import { t } from '@lingui/core/macro'
import { useId, useRef } from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { cn } from '#/lib/utils'
import { generateClientMessageId } from '#/features/chat/utils/clientMessageId'
import { useSendMessageMutation } from '#/features/chat/mutations/useSendMessageMutation'

const MAX_LENGTH = 4096
const COUNTER_VISIBLE_THRESHOLD = 3500
const WARNING_THRESHOLD = 3900

const messageSchema = z.object({
  text: z.string().min(1).max(MAX_LENGTH),
})

interface MessageComposerProps {
  conversationId: string
  currentAccountId: string
  canSend: boolean
}

export function MessageComposer({
  conversationId,
  currentAccountId,
  canSend,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labelId = useId()
  const textareaId = useId()
  const counterId = useId()

  const mutation = useSendMessageMutation(conversationId)

  const form = useForm({
    defaultValues: { text: '' },
    validators: { onSubmit: messageSchema },
    onSubmit: ({ value }) => {
      const clientMessageId = generateClientMessageId()
      mutation.mutate({
        clientMessageId,
        text: value.text.trim(),
        currentAccountId,
      })
      form.reset()

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    },
  })

  const text = useStore(form.store, (s) => s.values.text)
  const trimmedLength = text.trim().length
  const isSubmitDisabled = !canSend || trimmedLength === 0 || mutation.isPending

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    if (value.length <= MAX_LENGTH) {
      form.setFieldValue('text', value)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = e.clipboardData.getData('text/plain')
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = text.slice(0, start)
    const after = text.slice(end)
    const combined = before + pastedText + after

    if (combined.length > MAX_LENGTH) {
      e.preventDefault()
      const allowedLength = MAX_LENGTH - before.length - after.length
      if (allowedLength <= 0) return
      const truncated = pastedText.slice(0, allowedLength)
      form.setFieldValue('text', before + truncated + after)
      toast.info(t`Texto recortado al límite de ${MAX_LENGTH} caracteres`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isSubmitDisabled) {
        void form.handleSubmit()
      }
      return
    }

    if (
      text.length >= MAX_LENGTH &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault()
    }
  }

  function handleAutoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const showCounter = text.length > COUNTER_VISIBLE_THRESHOLD
  const isNearLimit = text.length > WARNING_THRESHOLD
  const remaining = MAX_LENGTH - text.length

  return (
    <div className="flex shrink-0 flex-col border-t border-border px-4 py-3">
      <div className="relative flex items-end gap-2">
        <label id={labelId} htmlFor={textareaId} className="sr-only">
          {t`Mensaje`}
        </label>
        <div className="flex flex-1 flex-col">
          <textarea
            ref={textareaRef}
            id={textareaId}
            value={text}
            onChange={(e) => {
              handleInput(e)
              handleAutoResize(e)
            }}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={!canSend}
            aria-labelledby={labelId}
            aria-describedby={showCounter ? counterId : undefined}
            placeholder={
              canSend
                ? t`Escribí un mensaje...`
                : t`No se puede enviar mensajes`
            }
            rows={1}
            className={cn(
              'max-h-40 min-h-10 w-full resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors',
              'placeholder:text-muted-foreground',
              'focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
          {showCounter && (
            <span
              id={counterId}
              className={cn(
                'mt-1 self-end text-xs transition-colors',
                isNearLimit ? 'text-warning' : 'text-muted-foreground',
              )}
              aria-live="polite"
            >
              {remaining}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void form.handleSubmit()}
          disabled={isSubmitDisabled}
          aria-label={t`Enviar mensaje`}
          title={!canSend ? t`No se puede enviar mensajes` : undefined}
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9z" />
    </svg>
  )
}
