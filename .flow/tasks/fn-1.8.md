# fn-1.8 F.5 — Ruta /auth + MagicLinkRequestForm

## Description

Ruta pública `/auth` con `MagicLinkRequestForm` — pantalla única para sign-up y sign-in.

> **Pre-req**: la firma real de la API de magic link en `@clerk/tanstack-react-start` se confirma en `fn-1.3` (`Done summary`). Las llamadas abajo son suposición del React SDK clásico — no hardcodear sin confirmar.

- Archivo: `src/routes/auth/index.tsx`.
- Componente: `src/features/identity/auth/components/MagicLinkRequestForm.tsx`.
- Usa `useSignIn()` del SDK Clerk (o equivalente verificado):
  - `signIn.create({ strategy: 'email_link', identifier: email, redirectUrl: `${window.location.origin}/auth/callback` })`.
  - On success: navigate a `/auth/check-email` con email en state del router.
  - On error: mostrar error inline.
- Visual: `P0 Sign up` (`FhvET`) del pencil. Un input email + botón "Continuar con email".
- Analytics: emitir `magic_link_requested` en submit exitoso.

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

Ruta /auth con MagicLinkRequestForm, useAuthGuard, tests de cobertura completa, navegación con state tipado, API Clerk Future correctamente manejada, y accesibilidad verificada.

## Evidence

- Commits:
- Tests:
- PRs:
