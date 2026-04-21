# fn-1.3 F.1 — Instalar Clerk + ClerkProvider + env


## Description

Instalar `@clerk/tanstack-react-start` y configurar `ClerkProvider` en modo magic link.

- `pnpm add @clerk/tanstack-react-start`.
- `VITE_CLERK_PUBLISHABLE_KEY` en `.env.example`, `src/env.ts`, `docker-compose.yml`.
- Env schema (`@t3-oss/env-core`): agregar `VITE_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_')`.
- `ClerkProvider` montado en `__root.tsx` (o equivalente `getRootContext`) con:
  - `publishableKey` desde env.
  - `signInUrl="/auth"`.
  - `signUpUrl="/auth"` (sign-up y sign-in comparten la misma pantalla en magic link mode).
  - `afterSignInUrl="/auth/callback"`.
  - `afterSignUpUrl="/auth/callback"`.
- Apariencia mínima: pasar `appearance` vacío por ahora (override real en tasks siguientes si hace falta).
- `VITE_ENABLE_MSW=1` por default en `.env.example` para desarrollo local.

**Verificación previa (bloqueante)** — ver epic spec §D2:

Antes de committear esta task, hacer `WebFetch` a:
- `https://clerk.com/docs/references/tanstack-react-start` (ClerkProvider props + setup SSR).
- `https://clerk.com/docs/custom-flows/email-links` (API magic link).

Confirmar y documentar en `Done summary`:
- Nombre real del package (`@clerk/tanstack-react-start` o el que sea current).
- Props reales del `ClerkProvider` (puede no aceptar `afterSignInUrl` — puede ser `signInFallbackRedirectUrl`).
- Si requiere plugin de vite/TanStack Start además del provider.

Si difiere del asumido: actualizar esta task y las `fn-1.8`, `fn-1.9`, `fn-1.11` antes de seguir.

## Acceptance

- [ ] `pnpm dev` arranca sin errores.
- [ ] `window.Clerk` disponible en DevTools console.
- [ ] Typecheck OK.
- [ ] `.env.example` documenta las dos nuevas vars.
- [ ] Con env vars faltantes, `@t3-oss/env-core` falla loud al arranque (no silencioso).
- [ ] `Done summary` documenta la firma real verificada de Clerk SDK (§D2).

## Done summary

## Evidence
- Commits:
- Tests:
- PRs: