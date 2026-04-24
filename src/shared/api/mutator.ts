import { env } from '#/env'

export interface ApiErrorBody {
  code: string
  message: string
  details?: { field_errors?: Record<string, string[]> }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public override message: string,
    public details?: ApiErrorBody['details'],
  ) {
    super(`API ${status}: ${message}`)
    this.name = 'ApiError'
  }
}

interface AuthTokenProvider {
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<string | null>
  signOut: () => Promise<unknown>
  navigate: (to: string) => void
}

let authProvider: AuthTokenProvider | null = null

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  authProvider = provider
}

export async function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const base = env.VITE_API_URL.replace(/\/$/, '')
  const fullUrl = `${base}${url}`

  const token = await authProvider?.getToken()
  const res = await doFetch(fullUrl, token ?? null, options)

  if (res.status === 401) {
    return handleUnauthorized<T>(res, fullUrl, options)
  }

  return handleResponse<T>(res)
}

async function doFetch(
  url: string,
  token: string | null,
  options?: RequestInit,
): Promise<Response> {
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  })
}

async function handleUnauthorized<T>(
  res: Response,
  url: string,
  options?: RequestInit,
): Promise<T> {
  const body = await parseErrorBody(res)
  const code = body?.code ?? ''

  if (code !== 'token_invalid' && code !== 'token_expired') {
    throw new ApiError(
      401,
      body?.code ?? 'unauthorized',
      body?.message ?? res.statusText,
      body?.details,
    )
  }

  if (!authProvider) {
    throw new ApiError(
      401,
      code,
      body?.message ?? res.statusText,
      body?.details,
    )
  }

  const newToken = await authProvider.refreshToken().catch(() => null)

  if (!newToken) {
    await authProvider.signOut()
    authProvider.navigate('/auth')
    throw new ApiError(
      401,
      code,
      body?.message ?? res.statusText,
      body?.details,
    )
  }

  const retryRes = await doFetch(url, newToken, options)

  if (retryRes.status === 401) {
    await authProvider.signOut()
    authProvider.navigate('/auth')
    const retryBody = await parseErrorBody(retryRes)
    throw new ApiError(
      401,
      retryBody?.code ?? code,
      retryBody?.message ?? res.statusText,
      retryBody?.details,
    )
  }

  return handleResponse<T>(retryRes)
}

async function handleResponse<T>(res: Response): Promise<T> {
  const parsed = await parseBody(res)

  if (!res.ok) {
    const body = parsed as ApiErrorBody | undefined
    throw new ApiError(
      res.status,
      body?.code ?? 'unknown',
      body?.message ?? res.statusText,
      body?.details,
    )
  }

  return parsed as T
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  try {
    const text = await res.text()
    if (!text) return null
    return JSON.parse(text) as ApiErrorBody
  } catch {
    return null
  }
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  return text
}

export default customFetch
