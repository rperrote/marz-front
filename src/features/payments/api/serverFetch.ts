import { auth } from '@clerk/tanstack-react-start/server'

import { env } from '#/env'
import { ApiError } from '#/shared/api/mutator'

interface ApiErrorPayload {
  code?: string
  message?: string
  details?: { field_errors?: Record<string, string[]> }
  error?: {
    code?: string
    message?: string
    details?: { field_errors?: Record<string, string[]> }
  }
}

export async function brandPaymentsServerFetch(
  path: string,
  workspaceId: string,
  init?: RequestInit,
): Promise<Response> {
  const authObject = await auth()
  const token = await authObject.getToken()

  if (!authObject.userId || !token) {
    throw new ApiError(401, 'unauthorized', 'Unauthorized')
  }

  const base = env.VITE_API_URL.replace(/\/$/, '')
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Brand-Workspace-Id': workspaceId,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await parseApiError(res)
    throw new ApiError(
      res.status,
      body.error?.code ?? body.code ?? 'unknown',
      body.error?.message ?? body.message ?? res.statusText,
      body.error?.details ?? body.details,
    )
  }

  return res
}

async function parseApiError(res: Response): Promise<ApiErrorPayload> {
  try {
    const text = await res.text()
    if (!text) return {}
    return JSON.parse(text) as ApiErrorPayload
  } catch {
    return {}
  }
}
