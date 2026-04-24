import { useCallback, useMemo } from 'react'
import { t } from '@lingui/core/macro'
import { Info } from 'lucide-react'
import type { CreatorChannel } from '#/shared/api/generated/model/creatorChannel'
import { validateChannels } from '../schema'
import { useCreatorOnboardingStore } from '../store'
import { ChannelEditor } from '../components/ChannelEditor'

export function C7ChannelsScreen() {
  const store = useCreatorOnboardingStore()
  const channels = store.channels ?? []

  const handleChange = useCallback(
    (next: CreatorChannel[]) => {
      store.setField('channels', next)
    },
    [store],
  )

  const errors = useMemo(
    () => (channels.length > 0 ? validateChannels(channels) : []),
    [channels],
  )

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-[720px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`Conectá tus cuentas y qué publicás`}
        </h1>
        <p className="text-center text-sm leading-[1.5] text-muted-foreground">
          {t`Verificamos followers y engagement. Cargá tu tarifa por formato — las marcas ven rango, no tu precio directo.`}
        </p>
      </div>
      <ChannelEditor channels={channels} onChange={handleChange} />
      {errors.length > 0 && (
        <p
          className="text-[length:var(--font-size-sm)] text-destructive"
          role="alert"
        >
          {errors.includes('exactly_one_primary_required')
            ? t`Seleccioná exactamente un canal como principal.`
            : errors.includes('duplicate_format_in_channel')
              ? t`No se puede repetir un formato dentro del mismo canal.`
              : errors.includes('format_not_valid_for_platform')
                ? t`Hay formatos inválidos para la plataforma seleccionada.`
                : null}
        </p>
      )}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="size-3" />
        <span>
          {t`Tus tarifas son privadas. Las marcas ven rango, nunca tu número exacto.`}
        </span>
      </div>
    </div>
  )
}
