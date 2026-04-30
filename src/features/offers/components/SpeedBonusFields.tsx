import { Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

interface SpeedBonusFieldsProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  children: ReactNode
}

export function SpeedBonusFields({
  enabled,
  onToggle,
  children,
}: SpeedBonusFieldsProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-muted p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-warning" />
          <span className="text-base font-semibold text-foreground">
            {t`Speed Bonus`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="speed-bonus-toggle"
            className="text-xs text-muted-foreground"
          >
            {t`Reward faster delivery`}
          </Label>
          <Switch
            id="speed-bonus-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </header>

      {enabled ? <div className="space-y-3">{children}</div> : null}
    </section>
  )
}
