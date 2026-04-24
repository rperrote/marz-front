import { useCallback, useMemo } from 'react'
import { t } from '@lingui/core/macro'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'
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
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`Tus canales`}
        subtitle={t`Agregá tus redes sociales y definí tus tarifas por formato.`}
      />
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
    </div>
  )
}
