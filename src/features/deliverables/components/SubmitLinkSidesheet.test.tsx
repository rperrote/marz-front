import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe } from 'vitest-axe'
import type { ReactNode } from 'react'

import { SubmitLinkSidesheet } from './SubmitLinkSidesheet'

const mockSubmitLinkFetch = vi.fn()

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderSidesheet(
  props?: Partial<Parameters<typeof SubmitLinkSidesheet>[0]>,
) {
  return render(
    <SubmitLinkSidesheet
      open
      onOpenChange={vi.fn()}
      deliverableId="del-1"
      platform="youtube"
      {...props}
    />,
    { wrapper: createWrapper() },
  )
}

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

async function submitValidLink() {
  const user = userEvent.setup()
  await user.type(
    screen.getByLabelText(/published url/i),
    'https://www.youtube.com/watch?v=abc123',
  )
  await user.click(screen.getByRole('button', { name: /send link/i }))
}

function analyticsRequests() {
  return vi
    .mocked(fetch)
    .mock.calls.filter((call) =>
      String(call[0]).endsWith('/v1/analytics/events'),
    )
    .map((call) => JSON.parse(String(call[1]?.body)) as unknown)
}

describe('SubmitLinkSidesheet', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSubmitLinkFetch.mockReset()
    mockSubmitLinkFetch.mockImplementation(() =>
      jsonResponse(201, {
        link: {
          id: 'link-1',
          deliverable_id: 'del-1',
          url: 'https://www.youtube.com/watch?v=abc123',
          status: 'submitted',
          preview: {
            outcome: 'title_and_thumbnail',
            title: 'Preview title',
            thumbnail_url: 'https://img.youtube.com/vi/abc123/0.jpg',
          },
          submitted_at: '2026-05-08T00:00:00.000Z',
          submitted_by_account_id: 'account-1',
        },
      }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith('/v1/analytics/events')) {
          return Promise.resolve(new Response(null, { status: 204 }))
        }
        return mockSubmitLinkFetch(input, init)
      }),
    )
  })

  it('keeps send button disabled until the URL is valid and uses http or https', async () => {
    const user = userEvent.setup()
    renderSidesheet()

    const button = screen.getByRole('button', { name: /send link/i })
    const input = screen.getByLabelText(/published url/i)
    expect(button).toBeDisabled()

    await user.type(input, 'ftp://youtube.com/watch?v=abc123')
    expect(button).toBeDisabled()

    await user.clear(input)
    await user.type(input, 'https://www.youtube.com/watch?v=abc123')
    expect(button).toBeEnabled()
  })

  it('tracks link_submit_opened only when the sidesheet opens', async () => {
    const { rerender } = renderSidesheet({
      open: false,
      isResubmission: true,
    })

    expect(analyticsRequests()).toHaveLength(0)

    rerender(
      <SubmitLinkSidesheet
        open
        onOpenChange={vi.fn()}
        deliverableId="del-1"
        platform="youtube"
        isResubmission
      />,
    )

    await waitFor(() => expect(analyticsRequests()).toHaveLength(1))
    expect(analyticsRequests()[0]).toMatchObject({
      event_name: 'link_submit_opened',
      properties: {
        deliverable_id: 'del-1',
        platform: 'youtube',
        is_resubmission: true,
      },
    })

    rerender(
      <SubmitLinkSidesheet
        open={false}
        onOpenChange={vi.fn()}
        deliverableId="del-1"
        platform="youtube"
        isResubmission
      />,
    )

    expect(analyticsRequests()).toHaveLength(1)
  })

  it.each(['title_and_thumbnail', 'url_only', 'failed'] as const)(
    'tracks link_preview_resolved for %s responses',
    async (outcome) => {
      mockSubmitLinkFetch.mockImplementationOnce(() =>
        jsonResponse(201, {
          link: {
            id: 'link-1',
            deliverable_id: 'del-1',
            url: 'https://www.youtube.com/watch?v=abc123',
            status: 'submitted',
            preview:
              outcome === 'title_and_thumbnail'
                ? {
                    outcome,
                    title: 'Preview title',
                    thumbnail_url: 'https://img.youtube.com/vi/abc123/0.jpg',
                  }
                : { outcome },
            submitted_at: '2026-05-08T00:00:00.000Z',
            submitted_by_account_id: 'account-1',
          },
        }),
      )

      renderSidesheet({ isResubmission: false })

      await submitValidLink()

      await waitFor(() =>
        expect(
          analyticsRequests().some(
            (request) =>
              typeof request === 'object' &&
              request !== null &&
              'event_name' in request &&
              request.event_name === 'link_preview_resolved',
          ),
        ).toBe(true),
      )
      const previewResolved = analyticsRequests().find(
        (request) =>
          typeof request === 'object' &&
          request !== null &&
          'event_name' in request &&
          request.event_name === 'link_preview_resolved',
      )
      expect(previewResolved).toMatchObject({
        event_name: 'link_preview_resolved',
        properties: {
          deliverable_id: 'del-1',
          link_id: 'link-1',
          platform: 'youtube',
          outcome,
          is_resubmission: false,
        },
      })
      expect(JSON.stringify(previewResolved)).not.toContain('https://')
      expect(JSON.stringify(previewResolved)).not.toContain('Preview title')
      expect(JSON.stringify(previewResolved)).not.toContain('account')
    },
  )

  it('does not track link_preview_resolved when preview is missing', async () => {
    mockSubmitLinkFetch.mockImplementationOnce(() =>
      jsonResponse(201, {
        link: {
          id: 'link-1',
          deliverable_id: 'del-1',
          url: 'https://www.youtube.com/watch?v=abc123',
          status: 'submitted',
          submitted_at: '2026-05-08T00:00:00.000Z',
          submitted_by_account_id: 'account-1',
        },
      }),
    )
    renderSidesheet()

    await submitValidLink()

    await waitFor(() => expect(mockSubmitLinkFetch).toHaveBeenCalledTimes(1))
    expect(
      analyticsRequests().some(
        (request) =>
          typeof request === 'object' &&
          request !== null &&
          'event_name' in request &&
          request.event_name === 'link_preview_resolved',
      ),
    ).toBe(false)
  })

  it('maps DOMAIN_NOT_ALLOWED to a domain message', async () => {
    mockSubmitLinkFetch.mockImplementationOnce(() =>
      jsonResponse(422, {
        code: 'DOMAIN_NOT_ALLOWED',
        message: 'Domain not allowed',
      }),
    )
    renderSidesheet()

    await submitValidLink()

    expect(await screen.findByText(/domain not allowed/i)).toBeInTheDocument()
  })

  it('maps INVALID_DELIVERABLE_STATUS to a contextual message', async () => {
    mockSubmitLinkFetch.mockImplementationOnce(() =>
      jsonResponse(409, {
        code: 'INVALID_DELIVERABLE_STATUS',
        message: 'Invalid status',
      }),
    )
    renderSidesheet()

    await submitValidLink()

    expect(
      await screen.findByText(/no longer accepting links/i),
    ).toBeInTheDocument()
  })

  it('maps STAGE_LOCKED to a locked-stage message', async () => {
    mockSubmitLinkFetch.mockImplementationOnce(() =>
      jsonResponse(409, {
        code: 'STAGE_LOCKED',
        message: 'Stage locked',
      }),
    )
    renderSidesheet()

    await submitValidLink()

    expect(await screen.findByText(/this stage is locked/i)).toBeInTheDocument()
  })

  it('maps FORBIDDEN to a permissions message', async () => {
    mockSubmitLinkFetch.mockImplementationOnce(() =>
      jsonResponse(403, {
        code: 'FORBIDDEN',
        message: 'Forbidden',
      }),
    )
    renderSidesheet()

    await submitValidLink()

    expect(await screen.findByText(/can't submit links/i)).toBeInTheDocument()
  })

  it('closes after the preview-resolved response arrives', async () => {
    const onOpenChange = vi.fn()
    renderSidesheet({ onOpenChange })

    await submitValidLink()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('regenerates the Idempotency-Key when reopened', async () => {
    const { rerender } = render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <SubmitLinkSidesheet
          open
          onOpenChange={vi.fn()}
          deliverableId="del-1"
          platform="youtube"
        />
      </QueryClientProvider>,
    )

    await submitValidLink()
    await waitFor(() => expect(mockSubmitLinkFetch).toHaveBeenCalledTimes(1))
    const firstHeaders = new Headers(
      mockSubmitLinkFetch.mock.calls[0]?.[1]?.headers,
    )
    const firstKey = firstHeaders.get('Idempotency-Key')

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <SubmitLinkSidesheet
          open={false}
          onOpenChange={vi.fn()}
          deliverableId="del-1"
          platform="youtube"
        />
      </QueryClientProvider>,
    )
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <SubmitLinkSidesheet
          open
          onOpenChange={vi.fn()}
          deliverableId="del-1"
          platform="youtube"
        />
      </QueryClientProvider>,
    )

    await submitValidLink()
    await waitFor(() => expect(mockSubmitLinkFetch).toHaveBeenCalledTimes(2))
    const secondHeaders = new Headers(
      mockSubmitLinkFetch.mock.calls[1]?.[1]?.headers,
    )
    const secondKey = secondHeaders.get('Idempotency-Key')

    expect(firstKey).toBeTruthy()
    expect(secondKey).toBeTruthy()
    expect(secondKey).not.toBe(firstKey)
  })

  it('has no axe violations when open', async () => {
    const { container } = renderSidesheet()
    expect(await axe(container)).toHaveNoViolations()
  })
})
