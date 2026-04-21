# fn-1.5 F.3 — Token provider + mutator + retry-on-401


## Description

Conectar el mutator de Orval con el token de Clerk + implementar retry-on-401.

- `src/features/identity/hooks/useClerkTokenProvider.ts`:
  - Hook que en mount llama `setAuthTokenProvider(() => clerk.session?.getToken() ?? null)`.
  - Usar en `__root.tsx` una sola vez.
- `src/shared/api/mutator.ts`:
  - Inyecta `Authorization: Bearer <token>` desde el provider.
  - Deserializa JSON.
  - `ApiError` tipado `{ code, message, details? }` (matches schema `Error` del spec).
  - Retry-on-401 (**ver epic spec §D5**): si response es 401 y el `error.code ∈ {token_invalid, token_expired}` y no se ha reintentado aún:
    - `const newToken = await clerk.session?.getToken({ skipCache: true }).catch(() => null)`.
    - **Si `newToken == null`** (session murió, token revocado, provider caído): `clerk.signOut()` + `navigate('/auth')` + throw ApiError. **No** reintentar fetch sin token.
    - Si hay `newToken`: retry una vez con el nuevo token.
    - Si ese retry vuelve 401: `clerk.signOut()` + `navigate('/auth')` + throw ApiError.
  - 503 `auth_provider_unavailable`: propagar error sin cerrar session (UI muestra banner).
  - AbortSignal passthrough.

## Acceptance

- [ ] Unit test MSW (`src/shared/api/mutator.test.ts`):
  - 200 → payload deserializado.
  - 401 una vez + 200 segunda → retorna payload, refresh del token llamado una vez.
  - 401 + 401 → `signOut` invocado, redirect a `/auth`, throw ApiError.
  - **401 + refresh devuelve null token → `signOut` invocado sin segundo fetch; verificar con spy que `fetch` se llamó exactamente 1 vez** (§D5).
  - 503 auth_provider_unavailable → throw ApiError, signOut NO llamado.
  - 400/422 → throw ApiError con `details.field_errors` si aplica.
- [ ] Todos los hooks de Orval usan este mutator (verificar `orval.config.ts`).
- [ ] Typecheck OK.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs: