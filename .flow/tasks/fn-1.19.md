# fn-1.19 F.16 — Guards reales en \_brand y \_creator

## Description

Guards reales en `_brand.tsx` y `_creator.tsx` basados en `useMe`. Reemplazar stubs previos.

- En `beforeLoad` de ambas pathless routes:
  - Fetch/read `useMe` (vía `queryClient.fetchQuery` para SSR+hydration).
  - Si no hay session Clerk → `throw redirect({ to: '/auth' })`.
  - Si session + `onboarding_status !== 'onboarded'` → `throw redirect({ to: redirect_to })`.
  - Si kind del account no matchea el shell (brand en `_creator` o viceversa) → `throw redirect({ to: homeDelOtroKind })`.
- Eliminar `src/shared/auth/session.ts` stub si ya nadie lo importa. Si otro código lo consume, migrar antes.
- `src/routes/index.tsx`: reescribir fan-out. Sin session → `/auth`. Con session + onboarded → home según kind. Con session + no onboarded → `redirect_to`.
- Analytics: `onboarding_redirect_enforced` fire cada vez que un guard dispara navigate.

## Acceptance

- [ ] Sin session → redirect a `/auth` al entrar a `/_brand/*` o `/_creator/*`.
- [ ] Session pero onboarding incompleto → redirect a paso correcto.
- [ ] Brand intenta abrir `/_creator/offers` → redirect a home brand.
- [ ] Creator intenta abrir `/_brand/campaigns` → redirect a home creator.
- [ ] `useMe` cached 30s; cambios de ruta no re-fetchean.
- [ ] Analytics `onboarding_redirect_enforced` fire.
- [ ] `index.tsx` redirige correcto en los 3 casos.
- [ ] Typecheck OK.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
