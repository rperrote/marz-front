import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, customFetch, setAuthTokenProvider } from './mutator'

vi.mock('#/env', () => ({
  env: { VITE_API_URL: 'https://api.test' },
}))

const mockSignOut = vi.fn().mockResolvedValue(undefined)
const mockNavigate = vi.fn()
const mockGetToken = vi.fn<() => Promise<string | null>>()
const mockRefreshToken = vi.fn<() => Promise<string | null>>()

function jsonResponse(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json', ...headers },
  })
}

beforeEach(() => {
  mockGetToken.mockResolvedValue('valid-token')
  mockRefreshToken.mockResolvedValue('refreshed-token')
  mockSignOut.mockResolvedValue(undefined)

  setAuthTokenProvider({
    getToken: mockGetToken,
    refreshToken: mockRefreshToken,
    signOut: mockSignOut,
    navigate: mockNavigate,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockNavigate.mockClear()
  mockSignOut.mockClear()
  mockGetToken.mockClear()
  mockRefreshToken.mockClear()
})

describe('customFetch', () => {
  it('200 → deserializes JSON payload', async () => {
    const payload = { id: 1, name: 'test' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, payload))

    const result = await customFetch<{
      data: typeof payload
      status: number
    }>('/users/1')

    expect(result.status).toBe(200)
    expect(result.data).toEqual(payload)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('401 once + 200 on retry → returns payload, refresh called once', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(401, { code: 'token_expired', message: 'Token expired' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const result = await customFetch<{
      data: { ok: boolean }
      status: number
    }>('/protected')

    expect(result.status).toBe(200)
    expect(result.data).toEqual({ ok: true })
    expect(mockRefreshToken).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('401 + 401 on retry → signOut, throw ApiError', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(401, {
          code: 'token_invalid',
          message: 'Token invalid',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(401, {
          code: 'token_invalid',
          message: 'Still invalid',
        }),
      )

    await expect(customFetch('/protected')).rejects.toThrow(ApiError)
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('401 + refresh returns null → signOut without second fetch', async () => {
    mockRefreshToken.mockResolvedValue(null)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(401, { code: 'token_expired', message: 'Token expired' }),
    )

    await expect(customFetch('/protected')).rejects.toThrow(ApiError)
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('503 auth_provider_unavailable → throw ApiError, signOut NOT called', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(503, {
        code: 'auth_provider_unavailable',
        message: 'Provider down',
      }),
    )

    const error = await customFetch('/protected').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('auth_provider_unavailable')
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('400 → throw ApiError with details.field_errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, {
        code: 'validation_error',
        message: 'Validation failed',
        details: { field_errors: { email: ['invalid format'] } },
      }),
    )

    const error = await customFetch('/users').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(400)
    expect(apiError.code).toBe('validation_error')
    expect(apiError.details?.field_errors?.email).toEqual(['invalid format'])
  })

  it('422 → throw ApiError with details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(422, {
        code: 'unprocessable',
        message: 'Cannot process',
        details: { field_errors: { name: ['too short'] } },
      }),
    )

    const error = await customFetch('/users').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(422)
    expect(apiError.details?.field_errors?.name).toEqual(['too short'])
  })
})
