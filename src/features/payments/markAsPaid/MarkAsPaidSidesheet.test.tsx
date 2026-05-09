import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ApiError, customFetch } from '#/shared/api/mutator'
import type * as MutatorModule from '#/shared/api/mutator'
import { MarkAsPaidSidesheet } from './MarkAsPaidSidesheet'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/mutator', async () => {
  const actual = await vi.importActual<typeof MutatorModule>(
    '#/shared/api/mutator',
  )
  return {
    ...actual,
    customFetch: vi.fn(),
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

type SpeedBonusReason =
  | 'included'
  | 'not_applied_deadline_missed'
  | 'not_applicable_multistage'
  | 'not_declared'
  | 'prorated_bundle'

const mockedCustomFetch = vi.mocked(customFetch)

const bonusNotes: Record<SpeedBonusReason, RegExp> = {
  included: /includes the speed bonus/i,
  not_applied_deadline_missed: /deadline was missed/i,
  not_applicable_multistage: /does not apply to multistage/i,
  not_declared: /no speed bonus was declared/i,
  prorated_bundle: /prorated across the bundle/i,
}

function mockSuggestion(reason: SpeedBonusReason = 'included') {
  mockedCustomFetch.mockImplementation(async (url, options) => {
    if (String(url).includes('/payment-suggestion')) {
      return {
        status: 200,
        data: {
          suggested_amount: '4575.00',
          currency: 'USD',
          speed_bonus_reason: reason,
        },
      }
    }

    if (String(url).includes('/analytics/events')) {
      return { status: 202, data: undefined }
    }

    if (options?.method === 'POST') {
      return { status: 201, data: { declared_payment_id: 'pay-1' } }
    }

    throw new Error(`Unhandled request: ${String(url)}`)
  })
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function renderSidesheet(props?: {
  open?: boolean
  deliverableId?: string | null
  onOpenChange?: (open: boolean) => void
}) {
  return render(
    <MarkAsPaidSidesheet
      open={props?.open ?? true}
      deliverableId={props?.deliverableId ?? 'del-1'}
      creatorName="Test Creator"
      onOpenChange={props?.onOpenChange ?? vi.fn()}
    />,
    { wrapper: createWrapper() },
  )
}

function getRequestBodies(eventName: string) {
  return mockedCustomFetch.mock.calls
    .filter(([url]) => String(url).includes('/analytics/events'))
    .map(([, options]) => JSON.parse(String(options?.body)) as unknown)
    .filter(
      (
        body,
      ): body is {
        event_name: string
        payload: Record<string, unknown>
      } =>
        typeof body === 'object' &&
        body !== null &&
        'event_name' in body &&
        body.event_name === eventName,
    )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSuggestion()
})

describe('MarkAsPaidSidesheet', () => {
  it('loads payment suggestion and prefills amount', async () => {
    renderSidesheet()

    expect(screen.getByRole('status')).toHaveAccessibleName(
      /loading payment suggestion/i,
    )

    const amount = await screen.findByLabelText(/amount paid/i)
    expect(amount).toHaveValue('4575.00')
    expect(screen.getByText(/includes the speed bonus/i)).toBeInTheDocument()

    expect(mockedCustomFetch).toHaveBeenCalledWith(
      '/v1/deliverables/del-1/payment-suggestion',
    )
    await waitFor(() => {
      expect(getRequestBodies('payment_mark_opened')).toHaveLength(1)
    })
  })

  it.each(Object.entries(bonusNotes) as Array<[SpeedBonusReason, RegExp]>)(
    'shows the bonus note for %s',
    async (reason, note) => {
      mockSuggestion(reason)

      renderSidesheet()

      expect(await screen.findByText(note)).toBeInTheDocument()
    },
  )

  it('disables confirm and announces invalid amount when amount is zero or has too many decimals', async () => {
    const user = userEvent.setup()
    renderSidesheet()

    const amount = await screen.findByLabelText(/amount paid/i)
    const confirm = screen.getByRole('button', { name: /^confirm$/i })

    await user.clear(amount)
    await user.type(amount, '0')

    expect(confirm).toBeDisabled()
    expect(screen.getByText(/greater than 0/i)).toHaveAttribute(
      'aria-live',
      'polite',
    )

    await user.clear(amount)
    await user.type(amount, '10.999')

    expect(confirm).toBeDisabled()
    expect(screen.getByText(/up to 2 decimal/i)).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('opens confirmation dialog, cancels without mutation, then confirms payment', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderSidesheet({ onOpenChange })

    await screen.findByDisplayValue('4575.00')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))

    const dialog = screen.getByRole('dialog', { name: /confirm payment/i })
    expect(
      within(dialog).getByText(
        /¿Confirmás que ya pagaste \$4,575.00 de la marca a Test Creator\?/i,
      ),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))
    expect(
      screen.queryByRole('dialog', { name: /confirm payment/i }),
    ).not.toBeInTheDocument()
    expect(
      mockedCustomFetch.mock.calls.some(([url]) =>
        String(url).includes('/mark-as-paid'),
      ),
    ).toBe(false)

    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    await user.click(
      within(
        screen.getByRole('dialog', { name: /confirm payment/i }),
      ).getByRole('button', {
        name: /confirm/i,
      }),
    )

    await waitFor(() => {
      expect(mockedCustomFetch).toHaveBeenCalledWith(
        '/v1/deliverables/del-1/mark-as-paid',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amount: '4575.00' }),
        }),
      )
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('tracks first amount override only once per opening', async () => {
    const user = userEvent.setup()
    renderSidesheet()

    const amount = await screen.findByLabelText(/amount paid/i)
    await user.clear(amount)
    await user.type(amount, '100.00')
    await user.clear(amount)
    await user.type(amount, '101.00')

    await waitFor(() => {
      expect(getRequestBodies('payment_mark_amount_overridden')).toHaveLength(1)
    })
  })

  it('tracks cancellation with current step', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <MarkAsPaidSidesheet
        open
        deliverableId="del-1"
        creatorName="Test Creator"
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    await screen.findByDisplayValue('4575.00')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    rerender(
      <MarkAsPaidSidesheet
        open={false}
        deliverableId="del-1"
        creatorName="Test Creator"
        onOpenChange={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(getRequestBodies('payment_mark_cancelled')).toEqual([
        expect.objectContaining({
          payload: expect.objectContaining({ step: 'final_confirmation' }),
        }),
      ])
    })
  })

  it('shows load errors with a close button', async () => {
    mockedCustomFetch.mockImplementation(async (url) => {
      if (String(url).includes('/analytics/events')) {
        return { status: 202, data: undefined }
      }
      throw new ApiError(403, 'not_brand_owner', 'Forbidden')
    })

    renderSidesheet()

    expect(
      await screen.findByText(/only the workspace owner can mark payments/i),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^close$/i })).toHaveLength(2)
  })

  it('maps typed backend errors to toast or inline field error', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockedCustomFetch.mockImplementation(async (url, options) => {
      if (String(url).includes('/payment-suggestion')) {
        return {
          status: 200,
          data: {
            suggested_amount: '4575.00',
            currency: 'USD',
            speed_bonus_reason: 'included',
          },
        }
      }
      if (String(url).includes('/analytics/events')) {
        return { status: 202, data: undefined }
      }
      if (options?.method === 'POST') {
        throw new ApiError(409, 'deliverable_not_completed', 'Not completed')
      }
      throw new Error(`Unhandled request: ${String(url)}`)
    })

    renderSidesheet()

    await screen.findByDisplayValue('4575.00')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    await user.click(
      within(
        screen.getByRole('dialog', { name: /confirm payment/i }),
      ).getByRole('button', {
        name: /confirm/i,
      }),
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This deliverable is not ready to be marked as paid',
      )
    })
  })

  it('maps invalid_amount to inline error', async () => {
    const user = userEvent.setup()
    mockedCustomFetch.mockImplementation(async (url, options) => {
      if (String(url).includes('/payment-suggestion')) {
        return {
          status: 200,
          data: {
            suggested_amount: '4575.00',
            currency: 'USD',
            speed_bonus_reason: 'included',
          },
        }
      }
      if (String(url).includes('/analytics/events')) {
        return { status: 202, data: undefined }
      }
      if (options?.method === 'POST') {
        throw new ApiError(422, 'invalid_amount', 'Amount is invalid')
      }
      throw new Error(`Unhandled request: ${String(url)}`)
    })

    renderSidesheet()

    await screen.findByDisplayValue('4575.00')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    await user.click(
      within(
        screen.getByRole('dialog', { name: /confirm payment/i }),
      ).getByRole('button', {
        name: /confirm/i,
      }),
    )

    expect(await screen.findByText(/amount is invalid/i)).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('has no axe violations when loaded', async () => {
    const { container } = renderSidesheet()

    await screen.findByDisplayValue('4575.00')

    expect(await axe(container)).toHaveNoViolations()
  })
})
