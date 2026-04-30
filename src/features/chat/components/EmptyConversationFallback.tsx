import { t } from '@lingui/core/macro'

export function EmptyConversationFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-lg font-medium text-muted-foreground">
          {t`Conversación no disponible`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t`Esta conversación no existe o no tenés acceso.`}
        </p>
      </div>
    </div>
  )
}
