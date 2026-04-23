# fn-1.12 F.9 — Ruta /auth/kind + KindSelector

## Description
Ruta `/auth/kind` + componente `KindSelector`.

- Archivo: `src/routes/auth/kind.tsx`.
- Componente: `src/features/identity/auth/components/KindSelector.tsx`.
- Visual: `P1 Role Selector v2` (dhlNI) del pencil.
- Tres tarjetas:
  - Marca (brand) — activa.
  - Creador (creator) — activa.
  - Agencia — disabled + copy "Próximamente".
- Submit dispara `useSetKind({ kind })`:
  - On success: refetch `useMe`, navigate a `redirect_to`.
  - On `kind_already_set` (409): refetch `useMe`, navigate a `redirect_to`.
  - On `invalid_kind` (422): inline error.
- Guards:
  - Requiere session Clerk.
  - Requiere `onboarding_status === 'kind_pending'`. Otro estado → redirect a `redirect_to`.
- Analytics: `kind_selected` con kind en success.
## Acceptance
- [ ] Renderiza las 3 tarjetas; agencia deshabilitada.
- [ ] Click en brand → mutation → navega a `/onboarding/brand`.
- [ ] Click en creator → mutation → navega a `/onboarding/creator`.
- [ ] 409 kind_already_set → refetch + navigate sin loop.
- [ ] Guard redirect si `onboarding_status != kind_pending`.
- [ ] Analytics fire.
- [ ] Axe-core clean.
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
