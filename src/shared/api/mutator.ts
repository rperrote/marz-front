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

type BrandWorkspaceIdProvider = () => string | null

let brandWorkspaceIdProvider: BrandWorkspaceIdProvider = () => null

// Sets the resolver for the active brand workspace ID. The mutator injects
// the value as `X-Brand-Workspace-Id` on every request — backend requires it
// for brand accounts (422 brand_workspace_required) and ignores it for creator.
export function setBrandWorkspaceIdProvider(
  provider: BrandWorkspaceIdProvider,
) {
  brandWorkspaceIdProvider = provider
}

export async function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const base = env.VITE_API_URL.replace(/\/$/, '')
  const fullUrl = `${base}${url}`

  const token = await authProvider?.getToken()
  const idempotencyKey = getConfigurationMutationIdempotencyKey(url, options)
  const res = await doFetch(fullUrl, token ?? null, options, idempotencyKey)

  if (res.status === 401) {
    return handleUnauthorized<T>(res, fullUrl, options, idempotencyKey)
  }

  return handleResponse<T>(res)
}

function getConfigurationMutationIdempotencyKey(
  url: string,
  options?: RequestInit,
): string | null {
  const method = options?.method?.toUpperCase() ?? 'GET'
  const isPatchConfigurationStep =
    method === 'PATCH' &&
    /^\/v1\/campaigns\/[^/]+\/configuration\/(content_type|pricing_model|targeting|bonus)(?:[?#].*)?$/.test(
      url,
    )
  const isActivateConfiguration =
    method === 'POST' &&
    /^\/v1\/campaigns\/[^/]+\/configuration\/activate(?:[?#].*)?$/.test(url)

  if (!isPatchConfigurationStep && !isActivateConfiguration) return null

  // Configuration mutations must use retry: 0 at the TanStack Query layer.
  // The mutator can only keep this key stable for fetch-level retries, such as
  // the 401 refresh path; a new customFetch invocation is a new logical request.
  return crypto.randomUUID()
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

async function doFetch(
  url: string,
  token: string | null,
  options?: RequestInit,
  idempotencyKey?: string | null,
): Promise<Response> {
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const contentHeaders: Record<string, string> = isFormData(options?.body)
    ? {}
    : { 'Content-Type': 'application/json' }

  const workspaceId = brandWorkspaceIdProvider()
  const workspaceHeaders: Record<string, string> = workspaceId
    ? { 'X-Brand-Workspace-Id': workspaceId }
    : {}

  const idempotencyHeaders: Record<string, string> = idempotencyKey
    ? { 'Idempotency-Key': idempotencyKey }
    : {}

  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...contentHeaders,
      ...authHeaders,
      ...workspaceHeaders,
      ...options?.headers,
      ...idempotencyHeaders,
    },
  })
}

async function handleUnauthorized<T>(
  res: Response,
  url: string,
  options?: RequestInit,
  idempotencyKey?: string | null,
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

  const retryRes = await doFetch(url, newToken, options, idempotencyKey)

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

  return {
    data: parsed,
    status: res.status,
    headers: res.headers,
  } as T
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
