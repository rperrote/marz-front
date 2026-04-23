import { env } from '#/env'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
  ) {
    super(`API ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

let tokenProvider: () => string | null | undefined = () => null

export function setAuthTokenProvider(fn: () => string | null | undefined) {
  tokenProvider = fn
}

export async function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const base = env.VITE_API_URL.replace(/\/$/, '')
  const fullUrl = `${base}${url}`

  const token = tokenProvider()
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  })

  const parsed = await parseBody(res)

  if (!res.ok) throw new ApiError(res.status, res.statusText, parsed)
  return parsed as T
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
