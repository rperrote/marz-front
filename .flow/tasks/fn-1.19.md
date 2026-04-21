# fn-1.19 F.16 — Guards reales en _brand y _creator


## Description

Guards reales en `_brand.tsx` y `_creator.tsx` basados en `useMe`. Reemplazar cualquier stub previo de session.

- En `beforeLoad` de ambas pathless routes:
  - Fetch/read `useMe` (vía `queryClient.fetchQuery` para SSR+hydration).
  - Si no hay session Clerk → `throw redirect({ to: '/auth' })`.
  - Si session + `onboarding_status !== 'onboarded'` → `throw redirect({ to: redirect_to })`.
  - Si kind del account no matchea el shell (brand entrando a `_creator` o viceversa) → `throw redirect({ to: homeDelOtroKind })`.
- Eliminar `src/shared/auth/session.ts` stub si ya no se usa. Si otro código lo consume, migrar antes.

## Acceptance

- [ ] Sin session → redirect a `/auth` al entrar a `/_brand/*` o `/_creator/*`.
- [ ] Session pero onboarding incompleto → redirect a paso correcto.
- [ ] Brand intenta abrir `/_creator/offers` → redirect a home brand.
- [ ] Creator intenta abrir `/_brand/campaigns` → redirect a home creator.
- [ ] `useMe` cached 30s; subsecuentes cambios de ruta no re-fetchean.
- [ ] Analytics `onboarding_redirect_enforced` fire cada vez que un guard dispara navigate.
- [ ] Typecheck OK.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
