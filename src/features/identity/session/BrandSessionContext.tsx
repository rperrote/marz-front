import { createContext, use, useMemo } from 'react'
import type { ReactNode } from 'react'

import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { BrandWorkspaceSummary } from '#/shared/api/generated/model/brandWorkspaceSummary'
import type { MeResponse } from '#/shared/api/generated/model/meResponse'

export interface BrandSession {
  account: MeResponse
  brandWorkspace: BrandWorkspaceSummary
}

export const BrandSessionContext = createContext<BrandSession | null>(null)

export function BrandSessionProvider({ children }: { children: ReactNode }) {
  const meQuery = useMe()

  const value = useMemo<BrandSession | null>(() => {
    if (meQuery.data?.status !== 200) return null
    const account = meQuery.data.data
    if (account.kind !== 'brand' || !account.brand_workspace) return null
    return { account, brandWorkspace: account.brand_workspace }
  }, [meQuery.data])

  if (!value) return null

  return <BrandSessionContext value={value}>{children}</BrandSessionContext>
}

export function useBrandSession(): BrandSession {
  const ctx = use(BrandSessionContext)
  if (!ctx) {
    throw new Error(
      'useBrandSession must be used within a BrandSessionProvider',
    )
  }
  return ctx
}
