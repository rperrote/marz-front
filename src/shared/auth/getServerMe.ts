import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

import { env } from '#/env'

export interface ServerMeBrandWorkspace {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  plan: string
}

export type BrandWorkspaceRole = 'owner' | 'admin' | 'member'

export interface ServerMeMembership {
  role?: BrandWorkspaceRole
}

export interface ServerMeBody {
  id: string
  email: string
  kind: string | null
  full_name: string
  verified_at: string | null
  created_at: string
  redirect_to: string | null
  onboarding_status: string
  brand_workspace: ServerMeBrandWorkspace | null
  membership?: ServerMeMembership | null
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

function parseBrandWorkspaceRole(
  value: unknown,
): BrandWorkspaceRole | undefined {
  return value === 'owner' || value === 'admin' || value === 'member'
    ? value
    : undefined
}

export const getServerMe = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ServerMeResult> => {
    const authObject = await auth()

    if (!authObject.userId) {
      return { ok: false, body: null }
    }

    const token = await authObject.getToken()
    if (!token) {
      return { ok: false, body: null }
    }

    const base = env.VITE_API_URL.replace(/\/$/, '')
    const res = await fetch(`${base}/v1/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      return { ok: false, body: null }
    }

    const raw = (await res.json()) as ServerMeBody
    const workspace = raw.brand_workspace
    const role = parseBrandWorkspaceRole(raw.membership?.role)
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
        brand_workspace: workspace
          ? {
              id: workspace.id,
              name: workspace.name,
              logo_url: workspace.logo_url ?? null,
              website_url: workspace.website_url ?? null,
              plan: workspace.plan,
            }
          : null,
        membership: role ? { role } : null,
      },
    }
  },
)
