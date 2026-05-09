import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '#/shared/api/mutator'

import { exportBrandPaymentsCsv } from '../api/exportBrandPaymentsCsv'
import { useExportBrandPaymentsCsvMutation } from './useExportBrandPaymentsCsvMutation'

vi.mock('../api/exportBrandPaymentsCsv', () => ({
  exportBrandPaymentsCsv: vi.fn(),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'acct-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

const mockExportBrandPaymentsCsv = vi.mocked(exportBrandPaymentsCsv)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useExportBrandPaymentsCsvMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the CSV response on success so UI can trigger download', async () => {
    const response = new Response('id,amount\npmt-1,10\n', {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
    })
    mockExportBrandPaymentsCsv.mockResolvedValue(response)

    const { result } = renderHook(() => useExportBrandPaymentsCsvMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ filters: { period: '30d', q: 'ana' } })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toBe(response)
    expect(mockExportBrandPaymentsCsv).toHaveBeenCalledWith({
      data: {
        period: '30d',
        q: 'ana',
        workspaceId: 'workspace-1',
      },
    })
  })

  it('propagates export_exceeds_limit 409 without triggering a download', async () => {
    const createObjectUrlMock = vi.fn(() => 'blob:csv')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    })
    const error = new ApiError(
      409,
      'export_exceeds_limit',
      'El export supera el límite',
    )
    mockExportBrandPaymentsCsv.mockRejectedValue(error)

    const { result } = renderHook(() => useExportBrandPaymentsCsvMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ filters: { period: '90d' } })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBe(error)
    expect(result.current.error).toMatchObject({
      status: 409,
      code: 'export_exceeds_limit',
    })
    expect(createObjectUrlMock).not.toHaveBeenCalled()
  })

  it('propagates no_payments_to_export 409 without triggering a download', async () => {
    const createObjectUrlMock = vi.fn(() => 'blob:csv')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    })
    const error = new ApiError(
      409,
      'no_payments_to_export',
      'No hay pagos para exportar',
    )
    mockExportBrandPaymentsCsv.mockRejectedValue(error)

    const { result } = renderHook(() => useExportBrandPaymentsCsvMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ filters: { period: '12m' } })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toMatchObject({
      status: 409,
      code: 'no_payments_to_export',
    })
    expect(createObjectUrlMock).not.toHaveBeenCalled()
  })
})
