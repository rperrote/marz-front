import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Client-exposed env vars for marz-front.
 * All `VITE_*` values end up in the browser bundle — never put secrets here.
 * Backend endpoints (`API_URL`, `WS_URL`) and feature flags go here. Stripe
 * keys, JWT secrets, etc. live server-side only.
 */
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.string().url(),
    VITE_WS_URL: z.string().regex(/^wss?:\/\//, 'Must start with ws:// or wss://'),
    VITE_APP_TITLE: z.string().min(1).default('Marz'),
  },
  server: {},
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
