import { t } from '@lingui/core/macro'
import { MessageSquareQuote } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C8PrimingTestimonials() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquareQuote className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Lo que dicen los creators`}
        subtitle={t`Creators como vos ya monetizan su contenido con Marz.`}
      />
    </div>
  )
}
