# fn-1.8 F.5 — Ruta /auth + MagicLinkRequestForm


## Description

Ruta pública `/auth` con `MagicLinkRequestForm` — pantalla única para sign-up y sign-in.

> **Pre-req**: la firma real de la API de magic link en `@clerk/tanstack-react-start` se confirma en `fn-1.3` (epic spec §D2). Las llamadas abajo (`signIn.create({strategy:'email_link',...})`) son **suposición** del React SDK clásico. Si difiere, actualizar antes de codear.

- Archivo: `src/routes/auth/index.tsx`.
- Componente: `src/features/identity/auth/components/MagicLinkRequestForm.tsx`.
- Usa `useSignIn()` del SDK Clerk (o equivalente verificado en §D2):
  - `signIn.create({ strategy: 'email_link', identifier: email, redirectUrl: `${window.location.origin}/auth/callback` })`.
  - On success: navigate a `/auth/check-email` con email en state del router (o search param).
  - On error (rate limit, email inválido por Clerk, etc.): mostrar error inline.
- Visual: `P0 Sign up` (`FhvET`) del pencil. Un input email + botón "Continuar con email".
- Analytics: emitir `magic_link_requested` via `src/shared/analytics/track.ts` en submit exitoso.

Guards:
- Si ya hay session Clerk y `onboarding_status === 'onboarded'`: redirect a home del kind.
- Si hay session pero onboarding incompleto: redirect a `redirect_to` de `useMe`.

## Acceptance

- [ ] Ruta renderiza form con validación Zod (email).
- [ ] Submit con email válido llama `signIn.create` con `strategy: 'email_link'`.
- [ ] Submit con email inválido muestra error inline; no llama Clerk.
- [ ] On success navigate a `/auth/check-email` con email disponible.
- [ ] Guard redirect si ya hay session onboarded.
- [ ] Analytics fire (verificado via spy de `track`).
- [ ] Axe-core clean.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs: