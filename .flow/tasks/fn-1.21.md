# fn-1.21 F.18 — Sign out desde shells


## Description

Sign out desde shells brand/creator.

- Componente `src/features/identity/components/SignOutButton.tsx`:
  - Llama `clerk.signOut()`.
  - `queryClient.clear()`.
  - Clear stores de onboarding (por si quedaron data de alguna razón).
  - Navigate `/auth`.
  - Analytics `sign_out`.
- Integrar en `BrandShell` y `CreatorShell` (suele ir en el perfil/menu del user). Los shells existen en `src/features/identity/components/` según CLAUDE.md del repo — si todavía son stubs, agregar un botón mínimo en ambos.

## Acceptance

- [ ] Click en Sign out desde `_brand` → queda en `/auth` sin session.
- [ ] Idem desde `_creator`.
- [ ] Query cache vacío post-signout (verificable con devtools).
- [ ] Stores de onboarding limpios (sessionStorage keys eliminadas).
- [ ] Analytics fire.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs: