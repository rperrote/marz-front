import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ApiError } from '#/shared/api/mutator'

import { ApplicationDialog } from './ApplicationDialog'
import { useSubmitCampaignApplicationMutation } from './hooks/useSubmitCampaignApplicationMutation'
import { generateIdempotencyKey } from './utils/idempotencyKey'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('./hooks/useSubmitCampaignApplicationMutation', () => ({
  useSubmitCampaignApplicationMutation: vi.fn(),
}))

vi.mock('./utils/idempotencyKey', () => ({
  generateIdempotencyKey: vi.fn(),
}))

const mockUseSubmitCampaignApplicationMutation = vi.mocked(
  useSubmitCampaignApplicationMutation,
)
const mockGenerateIdempotencyKey = vi.mocked(generateIdempotencyKey)
const mutateAsync = vi.fn()
const campaignId = '11111111-1111-4111-8111-111111111111'
const uuidA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const uuidB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const uuidC = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderDialog({
  open = true,
  onOpenChange = vi.fn(),
  onViewApplication = vi.fn(),
  onSubmitted = vi.fn(),
  queryClient = createQueryClient(),
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onViewApplication?: (campaignId: string) => void
  onSubmitted?: () => void
  queryClient?: QueryClient
} = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  const result = render(
    <ApplicationDialog
      open={open}
      campaignId={campaignId}
      campaignName="Lanzamiento auriculares M-Pro 2"
      onOpenChange={onOpenChange}
      onViewApplication={onViewApplication}
      onSubmitted={onSubmitted}
    />,
    { wrapper: Wrapper },
  )

  return {
    ...result,
    onOpenChange,
    onViewApplication,
    onSubmitted,
    queryClient,
  }
}

describe('ApplicationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSubmitCampaignApplicationMutation.mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useSubmitCampaignApplicationMutation>)
    mockGenerateIdempotencyKey
      .mockReturnValueOnce(uuidA)
      .mockReturnValueOnce(uuidB)
      .mockReturnValue(uuidC)
  })

  it('shows inline error for a blank message on change', async () => {
    renderDialog()

    const textarea = screen.getByLabelText('Mensaje')

    await userEvent.type(textarea, ' ')
    fireEvent.blur(textarea)

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Escribí un mensaje para postularte.',
    )
  })

  it('blocks messages longer than 2000 characters', async () => {
    renderDialog()
    const textarea = screen.getByLabelText('Mensaje')

    fireEvent.change(textarea, { target: { value: 'a'.repeat(2001) } })
    fireEvent.blur(textarea)

    expect(await screen.findByRole('status')).toHaveTextContent(
      'El mensaje no puede superar los 2000 caracteres.',
    )
    expect(
      screen.getByRole('button', { name: 'Enviar postulación' }),
    ).toBeDisabled()
  })

  it('submits with a UUID idempotency key and closes on success', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValueOnce({})
    const { onOpenChange, onSubmitted } = renderDialog()

    await user.type(screen.getByLabelText('Mensaje'), 'Quiero participar')
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        campaignId,
        data: { message: 'Quiero participar' },
        idempotencyKey: uuidB,
      })
    })
    expect(uuidB).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(onSubmitted).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('regenerates the key and retries once on idempotency conflict', async () => {
    const user = userEvent.setup()
    mutateAsync
      .mockRejectedValueOnce(
        new ApiError(409, 'idempotency_conflict', 'Conflict'),
      )
      .mockResolvedValueOnce({})
    const { onSubmitted } = renderDialog()

    await user.type(screen.getByLabelText('Mensaje'), 'Quiero participar')
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(2)
    })
    expect(mutateAsync).toHaveBeenNthCalledWith(1, {
      campaignId,
      data: { message: 'Quiero participar' },
      idempotencyKey: uuidB,
    })
    expect(mutateAsync).toHaveBeenNthCalledWith(2, {
      campaignId,
      data: { message: 'Quiero participar' },
      idempotencyKey: uuidC,
    })
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('closes and exposes a view action when the application already exists', async () => {
    const user = userEvent.setup()
    mutateAsync.mockRejectedValueOnce(
      new ApiError(409, 'application_already_exists', 'Already exists'),
    )
    const { onOpenChange, onViewApplication } = renderDialog()
    const { toast } = await import('sonner')

    await user.type(screen.getByLabelText('Mensaje'), 'Quiero participar')
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(toast.info).toHaveBeenCalledWith(
      'Ya enviaste una postulación para esta campaña.',
      {
        action: {
          label: 'Ver postulación',
          onClick: expect.any(Function) as () => void,
        },
      },
    )

    const toastOptions = vi.mocked(toast.info).mock.calls[0]?.[1] as
      | { action?: { onClick: () => void } }
      | undefined
    toastOptions?.action?.onClick()

    expect(onViewApplication).toHaveBeenCalledWith(campaignId)
  })

  it('invalidates campaign board queries and closes when the campaign is unavailable', async () => {
    const user = userEvent.setup()
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    mutateAsync.mockRejectedValueOnce(
      new ApiError(409, 'campaign_not_available', 'Unavailable'),
    )
    const { onOpenChange } = renderDialog({ queryClient })

    await user.type(screen.getByLabelText('Mensaje'), 'Quiero participar')
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['discovery', 'campaign-board'],
    })
  })

  it('maps backend validation errors to the textarea', async () => {
    const user = userEvent.setup()
    mutateAsync.mockRejectedValueOnce(
      new ApiError(422, 'validation.message', 'Mensaje inválido', {
        field_errors: { message: ['Mensaje inválido'] },
      }),
    )
    renderDialog()

    await user.type(screen.getByLabelText('Mensaje'), 'Quiero participar')
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Mensaje inválido',
    )
  })

  it('has no axe violations while open', async () => {
    const { container } = renderDialog()

    expect(await axe(container)).toHaveNoViolations()
  })
})
