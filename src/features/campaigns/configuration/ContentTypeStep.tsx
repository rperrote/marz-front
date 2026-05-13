import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Megaphone, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { cn } from '#/lib/utils'
import { ApiError } from '#/shared/api/mutator'
import { ConfigurationFooter } from './ConfigurationFooter'
import { trackCampaignConfigurationStepCompleted } from './analytics'
import {
  campaignConfigurationQueryKey,
  campaignDetailSearchDefaults,
  useUpdateContentTypeMutation,
} from './hooks'
import type { CampaignConfiguration, CampaignContentType } from './hooks'

const contentTypeOptions: Array<{
  value: CampaignContentType
  title: string
  description: string
  Icon: LucideIcon
}> = [
  {
    value: 'influencer_posts',
    title: t`Influencer Posts`,
    description: t`Creators publican contenido en sus redes para amplificar tu marca.`,
    Icon: Megaphone,
  },
  {
    value: 'ugc_videos',
    title: t`UGC Videos`,
    description: t`Creators producen videos para que tu marca use en ads y canales propios.`,
    Icon: Video,
  },
]

interface ContentTypeStepProps {
  campaignId: string
  config: CampaignConfiguration
}

export function ContentTypeStep({ campaignId, config }: ContentTypeStepProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useUpdateContentTypeMutation()
  const initialContentType = useRef(config.content_type).current
  const [selected, setSelected] =
    useState<CampaignContentType | null>(initialContentType)

  const handleContinue = () => {
    if (!selected) return

    mutation.mutate(
      {
        campaignId,
        content_type: selected,
        configuration_version: config.configuration_version,
      },
      {
        onSuccess: (response) => {
          trackCampaignConfigurationStepCompleted({
            campaignId,
            step: 'content_type',
            previousConfig: config,
            nextConfig: response,
          })
          queryClient.setQueryData(
            campaignConfigurationQueryKey(campaignId),
            response,
          )
          void navigate({
            to: '/campaigns/$campaignId/configuration/$step',
            params: { campaignId, step: response.current_step },
            search: campaignDetailSearchDefaults,
          })
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'configuration_version_conflict'
          ) {
            void queryClient.invalidateQueries({
              queryKey: campaignConfigurationQueryKey(campaignId),
            })
            toast.error(
              t`La configuración fue modificada en otra sesión, recargando.`,
            )
          }
        },
      },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {contentTypeOptions.map((option) => (
          <SelectionCard
            key={option.value}
            title={option.title}
            description={option.description}
            Icon={option.Icon}
            selected={selected === option.value}
            onSelect={() => setSelected(option.value)}
          />
        ))}
      </div>
      <ConfigurationFooter
        onBack={() => undefined}
        onContinue={handleContinue}
        backDisabled
        continueDisabled={!selected}
        isPending={mutation.isPending}
      />
    </div>
  )
}

interface SelectionCardProps {
  title: string
  description: string
  Icon: LucideIcon
  selected: boolean
  onSelect: () => void
}

function SelectionCard({
  title,
  description,
  Icon,
  selected,
  onSelect,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-44 flex-col items-start gap-4 rounded-3xl border bg-card p-5 text-left transition-colors',
        'hover:border-primary/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:bg-muted/50',
      )}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="flex w-full items-start gap-3">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-2xl',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="flex-1" />
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full border',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted',
          )}
          aria-hidden="true"
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
      </div>
      <span className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  )
}
