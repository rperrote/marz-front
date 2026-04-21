import { Pencil } from 'lucide-react'

import { SystemEventCard } from '#/shared/ui/SystemEventCard'

interface RequestChangesCardProps {
  intro: string
  changes: Array<string>
  closing?: string
}

export function RequestChangesCard({
  intro,
  changes,
  closing,
}: RequestChangesCardProps) {
  return (
    <SystemEventCard
      tone="destructive"
      kicker="Changes requested"
      icon={Pencil}
      headerVariant="solid"
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground">{intro}</p>

        <ol className="space-y-2">
          {changes.map((change, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-foreground"
            >
              <span className="font-mono text-sm font-semibold text-destructive">
                {i + 1}.
              </span>
              <span className="flex-1">{change}</span>
            </li>
          ))}
        </ol>

        {closing ? (
          <p className="text-sm text-muted-foreground">{closing}</p>
        ) : null}
      </div>
    </SystemEventCard>
  )
}
