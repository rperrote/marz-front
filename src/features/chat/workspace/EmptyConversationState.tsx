import { t } from '@lingui/core/macro'

export function EmptyConversationState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <h2 className="text-lg font-medium text-muted-foreground">
        {t`Select a conversation`}
      </h2>
    </div>
  )
}
