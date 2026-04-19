import { env } from '#/env'

export type FetcherOptions = {
  url: string
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
}

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

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = env.VITE_API_URL.replace(/\/$/, '')
  const url = new URL(`${base}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item))
      } else {
        url.searchParams.set(k, String(v))
      }
    }
  }
  return url.toString()
}

export async function customFetch<T>(options: FetcherOptions): Promise<T> {
  const { url, method, params, data, headers, signal, responseType = 'json' } = options

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }

  const token = tokenProvider()
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (data !== undefined && data !== null) {
    if (data instanceof FormData || data instanceof Blob || typeof data === 'string') {
      body = data as BodyInit
    } else {
      finalHeaders['Content-Type'] ??= 'application/json'
      body = JSON.stringify(data)
    }
  }

  const res = await fetch(buildUrl(url, params), {
    method: method.toUpperCase(),
    headers: finalHeaders,
    body,
    signal,
  })

  const parsed = await parseBody(res, responseType)

  if (!res.ok) throw new ApiError(res.status, res.statusText, parsed)
  return parsed as T
}

async function parseBody(res: Response, responseType: FetcherOptions['responseType']) {
  if (res.status === 204) return undefined
  switch (responseType) {
    case 'text':
      return res.text()
    case 'blob':
      return res.blob()
    case 'arraybuffer':
      return res.arrayBuffer()
    case 'json':
    default: {
      const text = await res.text()
      if (!text) return undefined
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    }
  }
}

export default customFetch
