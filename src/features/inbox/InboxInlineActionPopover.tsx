import { t } from '@lingui/core/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, MessageSquare, Send, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { useSendMessageMutation } from '#/features/chat/mutations/useSendMessageMutation'
import { generateClientMessageId } from '#/features/chat/utils/clientMessageId'
import {
  acceptCampaignDiscoveryApplication,
  rejectCampaignDiscoveryApplication,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  acceptCampaignDiscoveryApplicationResponse,
  rejectCampaignDiscoveryApplicationResponse,
} from '#/shared/api/generated/campaigns/campaigns'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { InboxInlineAction } from '#/shared/api/generated/model'
import { acceptOffer, rejectOffer } from '#/shared/api/generated/offers/offers'
import type {
  acceptOfferResponse,
  rejectOfferResponse,
} from '#/shared/api/generated/offers/offers'
import { ApiError } from '#/shared/api/mutator'
import { cn } from '#/lib/utils'

import { inboxQueryKey } from './api/inbox'
import {
  trackInboxInlineCompleted,
  trackInboxInlineFailed,
  trackInboxInlineStarted,
} from './analytics'
import type { InboxItemAnalyticsPayload } from './analytics'

const MAX_REPLY_LENGTH = 4096
const MAX_REASON_LENGTH = 500

interface InboxInlineActionPopoverProps {
  analyticsPayload: InboxItemAnalyticsPayload
  inlineActions: InboxInlineAction[]
  itemId: string
}

type OfferMutationVariables = {
  action: InboxInlineAction
  reason?: string
}

type ApplicationMutationVariables = {
  action: InboxInlineAction
}

export function InboxInlineActionPopover({
  analyticsPayload,
  inlineActions,
  itemId,
}: InboxInlineActionPopoverProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const supportedActions = useMemo(
    () => getSupportedActions(inlineActions),
    [inlineActions],
  )

  if (supportedActions.length === 0) return null

  function handleActionSuccess() {
    setOpen(false)
    void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
  }

  function handleActionError(error: Error) {
    if (error instanceof ApiError && error.status === 409) {
      setOpen(false)
      toast.info(t`El estado cambió, refrescamos`)
      void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
      return
    }

    toast.error(t`No se pudo completar la acción. Intentá de nuevo.`)
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
        >
          <MessageSquare className="size-4" aria-hidden />
          <span className="hidden sm:inline">
            {getTriggerLabel(supportedActions)}
          </span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-80 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
          )}
        >
          <div className="flex flex-col gap-3">
            {supportedActions.map((action) => (
              <InlineActionControl
                key={`${itemId}-${action.type}-${action.path}`}
                action={action}
                analyticsPayload={analyticsPayload}
                onError={handleActionError}
                onSuccess={handleActionSuccess}
              />
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function InlineActionControl({
  action,
  analyticsPayload,
  onError,
  onSuccess,
}: {
  action: InboxInlineAction
  analyticsPayload: InboxItemAnalyticsPayload
  onError: (error: Error) => void
  onSuccess: () => void
}) {
  if (isReplyAction(action)) {
    return (
      <ReplyActionControl
        action={action}
        analyticsPayload={analyticsPayload}
        onError={onError}
        onSuccess={onSuccess}
      />
    )
  }

  if (isOfferAction(action)) {
    return (
      <OfferActionControl
        action={action}
        analyticsPayload={analyticsPayload}
        onError={onError}
        onSuccess={onSuccess}
      />
    )
  }

  return (
    <ApplicationActionControl
      action={action}
      analyticsPayload={analyticsPayload}
      onError={onError}
      onSuccess={onSuccess}
    />
  )
}

function ReplyActionControl({
  action,
  analyticsPayload,
  onError,
  onSuccess,
}: {
  action: InboxInlineAction
  analyticsPayload: InboxItemAnalyticsPayload
  onError: (error: Error) => void
  onSuccess: () => void
}) {
  const labelId = useId()
  const errorId = useId()
  const conversationId = getConversationId(action.path)
  const [text, setText] = useState('')
  const meQuery = useMe()
  const currentAccountId =
    meQuery.data?.status === 200 ? meQuery.data.data.id : ''
  const sendMessage = useSendMessageMutation(conversationId)
  const trimmedText = text.trim()
  const hasLengthError = text.length > MAX_REPLY_LENGTH
  const isSubmitDisabled =
    trimmedText.length === 0 ||
    hasLengthError ||
    sendMessage.isPending ||
    currentAccountId.length === 0

  function handleSend() {
    if (isSubmitDisabled) return

    trackInboxInlineStarted({
      ...analyticsPayload,
      action_type: action.type,
    })

    sendMessage.mutate(
      {
        clientMessageId: generateClientMessageId(),
        currentAccountId,
        idempotencyKey: generateClientMessageId(),
        text: trimmedText,
      },
      {
        onError: (error) => {
          trackInlineFailed(analyticsPayload, action, error)
          onError(error)
        },
        onSuccess: () => {
          trackInboxInlineCompleted({
            ...analyticsPayload,
            action_type: action.type,
          })
          onSuccess()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label id={labelId} className="text-sm font-medium text-foreground">
        {t`Responder`}
      </label>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-labelledby={labelId}
        aria-describedby={hasLengthError ? errorId : undefined}
        aria-invalid={hasLengthError}
        placeholder={t`Escribí una respuesta...`}
        className="max-h-36 min-h-24 resize-y text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        {hasLengthError ? (
          <p id={errorId} className="text-xs text-destructive">
            {t`El mensaje no puede superar ${MAX_REPLY_LENGTH} caracteres.`}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">
            {text.length}/{MAX_REPLY_LENGTH}
          </span>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={isSubmitDisabled}
        >
          {sendMessage.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {t`Enviar`}
        </Button>
      </div>
    </div>
  )
}

function OfferActionControl({
  action,
  analyticsPayload,
  onError,
  onSuccess,
}: {
  action: InboxInlineAction
  analyticsPayload: InboxItemAnalyticsPayload
  onError: (error: Error) => void
  onSuccess: () => void
}) {
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState('')
  const acceptMutation = useMutation<
    acceptOfferResponse,
    Error,
    OfferMutationVariables
  >({
    mutationFn: ({ action: mutationAction }) =>
      acceptOffer(getOfferId(mutationAction.path), {
        headers: { 'Idempotency-Key': generateClientMessageId() },
      }),
    onError: (error, variables) => {
      trackInlineFailed(analyticsPayload, variables.action, error)
      onError(error)
    },
    onSuccess: (_data, variables) => {
      trackInboxInlineCompleted({
        ...analyticsPayload,
        action_type: variables.action.type,
      })
      onSuccess()
    },
  })
  const rejectMutation = useMutation<
    rejectOfferResponse,
    Error,
    OfferMutationVariables
  >({
    mutationFn: ({ action: mutationAction, reason: mutationReason }) =>
      rejectOffer(
        getOfferId(mutationAction.path),
        mutationReason ? { reason: mutationReason } : {},
        { headers: { 'Idempotency-Key': generateClientMessageId() } },
      ),
    onError: (error, variables) => {
      trackInlineFailed(analyticsPayload, variables.action, error)
      onError(error)
    },
    onSuccess: (_data, variables) => {
      trackInboxInlineCompleted({
        ...analyticsPayload,
        action_type: variables.action.type,
      })
      onSuccess()
    },
  })
  const isPending = acceptMutation.isPending || rejectMutation.isPending

  function handleAccept() {
    trackInboxInlineStarted({
      ...analyticsPayload,
      action_type: action.type,
    })
    acceptMutation.mutate({ action })
  }

  function handleReject() {
    trackInboxInlineStarted({
      ...analyticsPayload,
      action_type: action.type,
    })
    rejectMutation.mutate({ action, reason: reason.trim() || undefined })
  }

  if (action.type === 'creator_accept_offer') {
    return (
      <Button
        type="button"
        size="sm"
        onClick={handleAccept}
        disabled={isPending}
      >
        {acceptMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        {t`Aceptar oferta`}
      </Button>
    )
  }

  return (
    <RejectActionControl
      label={t`Rechazar oferta`}
      pending={rejectMutation.isPending}
      reason={reason}
      reasonOpen={reasonOpen}
      setReason={setReason}
      setReasonOpen={setReasonOpen}
      onSubmit={handleReject}
    />
  )
}

function ApplicationActionControl({
  action,
  analyticsPayload,
  onError,
  onSuccess,
}: {
  action: InboxInlineAction
  analyticsPayload: InboxItemAnalyticsPayload
  onError: (error: Error) => void
  onSuccess: () => void
}) {
  const acceptMutation = useMutation<
    acceptCampaignDiscoveryApplicationResponse,
    Error,
    ApplicationMutationVariables
  >({
    mutationFn: ({ action: mutationAction }) => {
      const params = getApplicationPathParams(mutationAction.path)
      return acceptCampaignDiscoveryApplication(
        params.campaignId,
        params.applicationId,
        {
          headers: { 'Idempotency-Key': generateClientMessageId() },
        },
      )
    },
    onError: (error, variables) => {
      trackInlineFailed(analyticsPayload, variables.action, error)
      onError(error)
    },
    onSuccess: (_data, variables) => {
      trackInboxInlineCompleted({
        ...analyticsPayload,
        action_type: variables.action.type,
      })
      onSuccess()
    },
  })
  const rejectMutation = useMutation<
    rejectCampaignDiscoveryApplicationResponse,
    Error,
    ApplicationMutationVariables
  >({
    mutationFn: ({ action: mutationAction }) => {
      const params = getApplicationPathParams(mutationAction.path)
      return rejectCampaignDiscoveryApplication(
        params.campaignId,
        params.applicationId,
        {
          headers: { 'Idempotency-Key': generateClientMessageId() },
        },
      )
    },
    onError: (error, variables) => {
      trackInlineFailed(analyticsPayload, variables.action, error)
      onError(error)
    },
    onSuccess: (_data, variables) => {
      trackInboxInlineCompleted({
        ...analyticsPayload,
        action_type: variables.action.type,
      })
      onSuccess()
    },
  })
  const isPending = acceptMutation.isPending || rejectMutation.isPending

  function handleAccept() {
    trackInboxInlineStarted({
      ...analyticsPayload,
      action_type: action.type,
    })
    acceptMutation.mutate({ action })
  }

  function handleReject() {
    trackInboxInlineStarted({
      ...analyticsPayload,
      action_type: action.type,
    })
    rejectMutation.mutate({ action })
  }

  if (action.type === 'brand_accept_application') {
    return (
      <Button
        type="button"
        size="sm"
        onClick={handleAccept}
        disabled={isPending}
      >
        {acceptMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        {t`Aceptar aplicación`}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleReject}
      disabled={isPending}
    >
      {rejectMutation.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <X className="size-4" aria-hidden />
      )}
      {t`Rechazar aplicación`}
    </Button>
  )
}

function RejectActionControl({
  label,
  onSubmit,
  pending,
  reason,
  reasonOpen,
  setReason,
  setReasonOpen,
}: {
  label: string
  onSubmit: () => void
  pending: boolean
  reason: string
  reasonOpen: boolean
  setReason: (reason: string) => void
  setReasonOpen: (open: boolean) => void
}) {
  const textareaId = useId()
  const remaining = MAX_REASON_LENGTH - reason.length
  const isOverLimit = remaining < 0

  if (!reasonOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setReasonOpen(true)}
        disabled={pending}
      >
        <X className="size-4" aria-hidden />
        {label}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-2">
      <label
        htmlFor={textareaId}
        className="text-sm font-medium text-foreground"
      >
        {t`Motivo opcional`}
      </label>
      <Textarea
        id={textareaId}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={MAX_REASON_LENGTH + 1}
        aria-invalid={isOverLimit}
        placeholder={t`Podés agregar contexto...`}
        className="min-h-20 resize-y text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'text-xs',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {remaining}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReasonOpen(false)}
            disabled={pending}
          >
            {t`Cancelar`}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onSubmit}
            disabled={pending || isOverLimit}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <X className="size-4" aria-hidden />
            )}
            {label}
          </Button>
        </div>
      </div>
    </div>
  )
}

function getSupportedActions(actions: InboxInlineAction[]) {
  return actions.filter((action) => {
    if (isReplyAction(action)) return getConversationId(action.path).length > 0
    if (isOfferAction(action)) return getOfferId(action.path).length > 0
    if (isApplicationAction(action)) {
      const params = getApplicationPathParams(action.path)
      return params.campaignId.length > 0 && params.applicationId.length > 0
    }
    return false
  })
}

function getTriggerLabel(actions: InboxInlineAction[]) {
  if (actions.length === 1 && isReplyAction(actions[0])) return t`Responder`
  return t`Acciones`
}

function isReplyAction(action: InboxInlineAction) {
  return (
    action.type === 'brand_reply_message' ||
    action.type === 'creator_reply_message'
  )
}

function isOfferAction(action: InboxInlineAction) {
  return (
    action.type === 'creator_accept_offer' ||
    action.type === 'creator_reject_offer'
  )
}

function isApplicationAction(action: InboxInlineAction) {
  return (
    action.type === 'brand_accept_application' ||
    action.type === 'brand_reject_application'
  )
}

function trackInlineFailed(
  analyticsPayload: InboxItemAnalyticsPayload,
  action: InboxInlineAction,
  error: Error,
) {
  trackInboxInlineFailed({
    ...analyticsPayload,
    action_type: action.type,
    ...(error instanceof ApiError
      ? { error_code: error.code, error_status: error.status }
      : {}),
  })
}

function getConversationId(path: string) {
  return path.match(/^\/v1\/conversations\/([^/]+)\/messages$/)?.[1] ?? ''
}

function getOfferId(path: string) {
  return path.match(/^\/v1\/offers\/([^/]+)\/(?:accept|reject)$/)?.[1] ?? ''
}

function getApplicationPathParams(path: string) {
  const match = path.match(
    /^\/v1\/campaigns\/([^/]+)\/applications\/([^/:]+):(?:accept|reject)$/,
  )

  return {
    applicationId: match?.[2] ?? '',
    campaignId: match?.[1] ?? '',
  }
}
