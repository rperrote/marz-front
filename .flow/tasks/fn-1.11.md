# fn-1.11 F.8 — Ruta /auth/callback (verify + navigate)

## Description

Ruta `/auth/callback` — pantalla transitoria que ejecuta la verificación del magic link.

- Archivo: `src/routes/auth/callback.tsx`.
- Componente: `src/features/identity/auth/components/CallbackScreen.tsx`.
- Flow:
  1. On mount: llamar el método de verificación del SDK. **El nombre real depende de `@clerk/tanstack-react-start`** — ver `fn-1.3` (`Done summary`). Candidatos: `clerk.handleEmailLinkVerification()`, `useSignIn().attemptFirstFactor({ strategy: 'email_link', ... })`. **No hardcodear sin confirmar**.
  2. On success: invalidate `useMe`, fetch forzado, navigate según `redirect_to`.
  3. On error: navigate a `/auth/link-invalid`.
- UI: spinner + copy "Verificando tu link..." por ~1-2s.
- Analytics:
  - `magic_link_succeeded` en éxito.
  - `sign_in_succeeded` con payload `{ onboarding_status, kind }` inmediatamente después.

## Acceptance

- [ ] Mount dispara el método de verificación (confirmado en fn-1.3).
- [ ] Success → fetch `/v1/me` → navegar a `redirect_to`.
- [ ] Error → navegar a `/auth/link-invalid`.
- [ ] Analytics eventos disparados en los momentos correctos.
- [ ] Loading state visible mientras procesa.

## Done summary

Ruta, componente y tests implementan correctamente el flujo de verificación de magic link con navegación, analytics, loading state y accesibilidad.

## Evidence

- Commits:
- Tests:
- PRs:
