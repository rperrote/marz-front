import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

import { env } from '#/env'

export interface ServerMeBody {
  id: string
  email: string
  kind: string | null
  full_name: string
  verified_at: string | null
  created_at: string
  redirect_to: string | null
  onboarding_status: string
}

export interface ServerMeOk {
  ok: true
  body: ServerMeBody
}

export interface ServerMeFail {
  ok: false
  body: null
}

export type ServerMeResult = ServerMeOk | ServerMeFail

export const getServerMe = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ServerMeResult> => {
    const authObject = await auth()
    console.log('[getServerMe] userId:', authObject.userId)

    if (!authObject.userId) {
      console.log('[getServerMe] no userId → ok:false')
      return { ok: false, body: null }
    }

    const token = await authObject.getToken()
    console.log('[getServerMe] token present:', !!token)
    if (!token) {
      console.log('[getServerMe] no token → ok:false')
      return { ok: false, body: null }
    }

    const base = env.VITE_API_URL.replace(/\/$/, '')
    const res = await fetch(`${base}/v1/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    console.log('[getServerMe] /v1/me status:', res.status)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.log('[getServerMe] /v1/me error body:', body.slice(0, 300))
      return { ok: false, body: null }
    }

    const raw = (await res.json()) as ServerMeBody
    return {
      ok: true,
      body: {
        id: raw.id,
        email: raw.email,
        kind: raw.kind ?? null,
        full_name: raw.full_name,
        verified_at: raw.verified_at ?? null,
        created_at: raw.created_at,
        redirect_to: raw.redirect_to ?? null,
        onboarding_status: raw.onboarding_status,
      },
    }
  },
)
