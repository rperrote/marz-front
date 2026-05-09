import { t } from '@lingui/core/macro'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCheck, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

import { inboxQueryKey } from './api/inbox'
import type { InboxResponse } from './api/inbox'
import {
  trackInboxFilterChanged,
  trackInboxMarkedReadBulk,
  trackInboxRefreshed,
} from './analytics'
import { useMarkInboxVisibleReadMutation } from './hooks/useMarkInboxVisibleReadMutation'

const ALL_CAMPAIGNS = '__all__'

interface InboxToolbarProps {
  accountKind: InboxResponse['account_kind']
  campaignId?: string
  campaignFilterOptions: InboxResponse['campaign_filter_options']
  counts: InboxResponse['counts']
}

export function InboxToolbar({
  accountKind,
  campaignId,
  campaignFilterOptions,
  counts,
}: InboxToolbarProps) {
  const navigate = useNavigate({ from: '/inbox' })
  const queryClient = useQueryClient()
  const markVisibleRead = useMarkInboxVisibleReadMutation()
  const hasPendingItems = counts.action + counts.waiting > 0
  const isRefreshing = useIsFetching({ queryKey: inboxQueryKey }) > 0

  function handleCampaignChange(nextValue: string) {
    const nextCampaignId = nextValue === ALL_CAMPAIGNS ? undefined : nextValue
    trackInboxFilterChanged({
      account_kind: accountKind,
      campaign_id: nextCampaignId ?? null,
      has_campaign_filter: nextCampaignId !== undefined,
    })

    void navigate({
      to: '/inbox',
      search: {
        campaign_id: nextCampaignId,
      },
      replace: true,
    })
  }

  function handleRefresh() {
    trackInboxRefreshed({
      account_kind: accountKind,
      campaign_id: campaignId ?? null,
    })
    void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
  }

  function handleMarkAllRead() {
    markVisibleRead.mutate(
      {
        campaign_id: campaignId,
        sections: undefined,
      },
      {
        onSuccess: () => {
          trackInboxMarkedReadBulk({
            account_kind: accountKind,
            campaign_id: campaignId ?? null,
          })
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={campaignId ?? ALL_CAMPAIGNS}
        onValueChange={handleCampaignChange}
      >
        <SelectTrigger
          aria-label={t`Filtrar por campaña`}
          className="h-8 w-full sm:w-[220px]"
          size="sm"
        >
          <SelectValue placeholder={t`All campaigns`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CAMPAIGNS}>{t`All campaigns`}</SelectItem>
          {campaignFilterOptions.map((campaign) => (
            <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
              {campaign.campaign_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={t`Refresh inbox`}
        >
          {isRefreshing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          <span>{t`Refresh`}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={!hasPendingItems || markVisibleRead.isPending}
        >
          {markVisibleRead.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <CheckCheck className="size-4" aria-hidden />
          )}
          <span>{t`Mark all as read`}</span>
        </Button>
      </div>
    </div>
  )
}
