import { t } from '@lingui/core/macro'
import {
  OnboardingSectionTitle,
  OnboardingOptionChip,
} from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { Timing } from '#/shared/api/generated/model/timing'

const TIMING_OPTIONS: { value: Timing; label: () => string }[] = [
  { value: Timing.launch_now, label: () => t`Lanzar ahora` },
  { value: Timing.one_to_two_weeks, label: () => t`En 1–2 semanas` },
  { value: Timing.this_month, label: () => t`Este mes` },
  { value: Timing.exploring, label: () => t`Solo estoy explorando` },
]

export function B8TimingScreen() {
  const store = useBrandOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuándo querés lanzar tu primera campaña?`}
        subtitle={t`Nos ayuda a priorizar tu setup.`}
      />
      <div className="flex flex-wrap justify-center gap-3">
        {TIMING_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            role="radio"
            selected={store.timing === o.value}
            onToggle={() => store.setField('timing', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
