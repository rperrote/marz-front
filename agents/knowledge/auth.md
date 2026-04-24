# auth

Clerk + getServerMe + onboarding flow. Cargar cuando trabajes con login, guards, callbacks o flujos de onboarding.

## Stack

- `@clerk/tanstack-react-start` — SSO + magic link.
- `setAuthTokenProvider()` en `mutator.ts` — Orval inyecta el token de Clerk en cada request.
- `getServerMe.ts` en `src/shared/auth/` — fetch SSR del `/me` endpoint.

## Flujo

```
1. Usuario va a /auth → MagicLinkRequestForm.
2. Clerk envía magic link → click → /auth/callback → CallbackScreen.
3. CallbackScreen completa la sesión Clerk + llama useMe.
4. /me devuelve { kind, onboarding_status, redirect_to }.
5. Router redirige según onboarding_status:
   - kind_pending → /auth/kind
   - onboarding_pending → /onboarding/<kind>
   - onboarded → /<kind-default-route>
```

## Hooks

- `useAuth()` de Clerk — `isLoaded`, `isSignedIn`, `userId`.
- `useMe()` de Orval — devuelve `{ status, data }`. Solo `status === 200` tiene `data` válido.

## Guards

`_brand.tsx` y `_creator.tsx` (pathless routes) tienen `beforeLoad` que chequea `kind`. Implementación actual hace el check en el componente con `useEffect` + `navigate` (no en `beforeLoad`). OK por ahora.

## Onboarding stores

- `features/identity/onboarding/brand/store.ts` — Zustand persist sessionStorage.
- `features/identity/onboarding/creator/store.ts` — idem.

`skipHydration: true` + rehidratar manualmente desde el layout en `useEffect`. Razones en `state.md`.

## Reglas

- **Nunca leer el token Clerk directamente**. Pasa por `mutator.ts` que ya lo maneja.
- **Nunca chequear `kind` desde sessionStorage**. La fuente es `useMe()`.
- **No hardcodear redirects de onboarding**. Usar `me.data.redirect_to` que viene del backend.
- **El kind se setea una sola vez** via `useSelectKind()`. Si ya está, el endpoint devuelve 409.

## Sign out

`useClerk().signOut()` + `queryClient.clear()` + reset de stores Zustand de onboarding. Implementado en shells (`BrandShell`, `CreatorShell`).
