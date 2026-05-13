import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { DeliverableListItem } from './DeliverableListItem'
import type { DeliverableDTO } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeDeliverable(overrides?: Partial<DeliverableDTO>): DeliverableDTO {
  return {
    id: 'del-1',
    offer_id: 'offer-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'Video',
    status: 'completed',
    deadline: '2026-05-01',
    current_version: null,
    current_draft: null,
    drafts_count: 0,
    change_requests_count: 0,

    latest_change_request: null,
    change_requests: [],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function renderItem(
  props?: Partial<Parameters<typeof DeliverableListItem>[0]>,
) {
  const onUploadDraft = vi.fn()
  const onMarkAsPaid = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <DeliverableListItem
        deliverable={makeDeliverable()}
        sessionKind="brand"
        viewerRole="owner"
        onUploadDraft={onUploadDraft}
        onMarkAsPaid={onMarkAsPaid}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { onUploadDraft, onMarkAsPaid }
}

describe('DeliverableListItem', () => {
  it.each([
    ['brand owner', 'brand' as const, 'owner' as const, true],
    ['brand member', 'brand' as const, 'member' as const, false],
    ['brand admin', 'brand' as const, 'admin' as const, false],
    ['creator', 'creator' as const, undefined, false],
  ])(
    'shows Mark as paid for %s only when allowed',
    (_label, sessionKind, viewerRole, visible) => {
      renderItem({ sessionKind, viewerRole })

      const button = screen.queryByRole('button', {
        name: /marcar como pagado/i,
      })
      expect(Boolean(button)).toBe(visible)
    },
  )

  it('renders Paid badge without the action when status is paid', () => {
    renderItem({ deliverable: makeDeliverable({ status: 'paid' }) })

    expect(screen.getByText('Pagado')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /marcar como pagado/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onMarkAsPaid with the deliverable id', async () => {
    const user = userEvent.setup()
    const { onMarkAsPaid } = renderItem()

    await user.click(
      screen.getByRole('button', { name: /marcar como pagado/i }),
    )

    expect(onMarkAsPaid).toHaveBeenCalledWith('del-1')
  })
})
