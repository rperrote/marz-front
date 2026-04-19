export type AccountKind = 'brand' | 'creator'

export interface Session {
  accountId: string
  email: string
  kind: AccountKind
}

/**
 * Placeholder until identity context is wired.
 * Returns null to simulate "no session" — routes redirect to /login.
 */
export function getSession(): Session | null {
  return null
}
