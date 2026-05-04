import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { useCreatorOnboardingStore } from '../store'

export function C16ReferralScreen() {
  const store = useCreatorOnboardingStore()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('referral_text', e.target.value || null)
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Quién te invitó?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Si alguien te pasó el link, dejalo. Los bonificamos.`}
        </p>
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-5">
        <FieldRow label={t`Handle o nombre (opcional)`}>
          {(aria) => (
            <Input
              {...aria}
              value={store.referral_text ?? ''}
              onChange={handleChange}
              placeholder="@valenzavacs"
              maxLength={2000}
            />
          )}
        </FieldRow>
      </div>
    </div>
  )
}
