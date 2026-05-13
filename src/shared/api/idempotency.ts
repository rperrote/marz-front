import { useRef } from 'react'

export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function withIdempotencyKey(
  key: string,
  init?: RequestInit,
): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      'Idempotency-Key': key,
    },
  }
}

/**
 * Stable idempotency key per fingerprint: regenera la key solo cuando cambia
 * el fingerprint de los inputs. Para mutaciones que pueden reintentarse
 * (mismo input → misma key; input distinto → key nueva).
 */
export function useIdempotencyKey<TVariables>(
  fingerprintFor: (variables: TVariables) => string,
) {
  const ref = useRef<{ fingerprint: string; key: string } | null>(null)

  return {
    get: (variables: TVariables) => {
      const fingerprint = fingerprintFor(variables)
      if (ref.current?.fingerprint !== fingerprint) {
        ref.current = { fingerprint, key: generateIdempotencyKey() }
      }
      return ref.current.key
    },
    reset: () => {
      ref.current = null
    },
  }
}
