# fn-1.21 F.18 — Sign out desde shells

## Description

Sign out desde shells brand/creator.

- Componente `src/features/identity/components/SignOutButton.tsx`:
  - Llama `clerk.signOut()`.
  - `queryClient.clear()`.
  - Clear stores de onboarding.
  - Navigate `/auth`.
  - Analytics `sign_out`.
- Integrar en `BrandShell` y `CreatorShell` (en el perfil/menu del user). Si todavía son stubs, agregar botón mínimo en ambos.

## Acceptance

- [ ] Click en Sign out desde `_brand` → queda en `/auth` sin session.
- [ ] Idem desde `_creator`.
- [ ] Query cache vacío post-signout.
- [ ] Stores de onboarding limpios (sessionStorage keys eliminadas).
- [ ] Analytics fire.

## Done summary

SignOutButton con side effects completos, integrado en ambos shells, cubierto por 7 tests.

## Evidence

- Commits:
- Tests:
- PRs:
