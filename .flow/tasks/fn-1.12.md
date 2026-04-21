# fn-1.12 F.9 — Ruta /auth/kind + KindSelector


## Description

Ruta `/auth/kind` + componente `KindSelector` — selección de brand o creator.

- Archivo: `src/routes/auth/kind.tsx`.
- Componente: `src/features/identity/auth/components/KindSelector.tsx`.
- Visual: `P1 Role Selector v2` (dhlNI) del pencil.
- Tres tarjetas:
  - Marca (brand) — activa.
  - Creador (creator) — activa.
  - Agencia — disabled + copy "Próximamente" (agencies no soportadas en MVP).
- Submit dispara `useSetKind({ kind })` (hook de Orval).
  - On success: refetch `useMe`, navigate a `redirect_to` (debería ser `/onboarding/brand` o `/onboarding/creator`).
  - On `kind_already_set` (409): refetch `useMe`, navigate a `redirect_to`. (Indica bug del cliente — pero recuperamos.)
  - On `invalid_kind` (422): inline error (no debería suceder con UI actual).
- Guards:
  - Requiere session Clerk.
  - Requiere `onboarding_status === 'kind_pending'`. Otro estado → redirect a `redirect_to`.
- Analytics: `kind_selected` con kind en success.

## Acceptance

- [ ] Renderiza las 3 tarjetas; agencia deshabilitada con tooltip/copy.
- [ ] Click en brand → mutation → navega a `/onboarding/brand`.
- [ ] Click en creator → mutation → navega a `/onboarding/creator`.
- [ ] 409 kind_already_set maneja con refetch + navigate, sin loop.
- [ ] Guard redirect si `onboarding_status != kind_pending`.
- [ ] Analytics fire.
- [ ] Axe-core clean.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs: