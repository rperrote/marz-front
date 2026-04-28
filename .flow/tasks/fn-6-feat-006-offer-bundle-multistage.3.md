---
satisfies: [R2, R9]
---

## Description

`BundleEditor` (Pencil `TwbRP`): formulario para enviar offer tipo `bundle`. Repeater de `BundlePlatformRow` (Pencil `PrjJn`) con platform/format/quantity y amount opcional. Inputs comunes: `total_amount`, `deadline`, toggle `speed_bonus` con sub-form `SpeedBonusFields` (reusar de FEAT-005 si existe). Submit invoca `useCreateOffer` con body `type: 'bundle'`.

**Size:** M
**Files:**

- `src/features/offers/components/BundleEditor.tsx` (nuevo)
- `src/features/offers/components/BundlePlatformRow.tsx` (nuevo)
- `src/features/offers/components/BundleEditor.test.tsx` (nuevo)
- `src/features/offers/schemas/bundleEditor.ts` (validacion zod local sobre el schema generado)

## Approach

- Usar TanStack Form + zod para validar inline (regla del repo: TanStack Form, no react-hook-form).
- El schema base viene de `createBundleOfferRequestSchema` (Orval/Zod generado en F.1). Componer un schema local que agregue refinements del cliente:
  - `min(2)` deliverables
  - `amount > 0` cuando se declara
  - "todos o ninguno" en amounts (parcial bloquea submit)
  - suma matchea `total_amount` cuando se declaran todos
  - `deadline > today`
  - `speed_bonus.early_deadline < deadline`
- El submit handler convierte el form state al body del request y llama `useCreateOffer.mutate({ type: 'bundle', ... })`.
- A11y: cada row es un `<fieldset>` con `<legend>` (sr-only); errores en `aria-live="polite"`.

## Investigation targets

**Required:**

- `src/features/offers/components/SendOfferSidesheet.tsx` — patron de wiring del submit (FEAT-005)
- `src/shared/api/generated/zod/` — schemas Zod generados en F.1
- `src/shared/api/generated/endpoints.ts` — `useCreateOffer` hook
- `src/features/offers/components/SingleEditor.tsx` — reusar `SpeedBonusFields` si ya existe modular

**Optional:**

- Pencil `TwbRP`, `PrjJn` — referencia visual de bundle + row

## Design context

- Bordes redondeados generosos en inputs (`rounded-md` minimo).
- Botones primary con `--primary`, destructive (eliminar row) con `--destructive`.
- Estado de error: borde `--destructive` + helper text rojo.
- El boton "Add deliverable" es secondary al final del repeater.

## Acceptance

- [ ] `BundleEditor` renderiza con 1 row inicial + boton "Add deliverable".
- [ ] Submit disabled si `deliverables.length < 2`.
- [ ] Tests: `minTwoDeliverables_disablesSubmit`, `amountSumMismatch_blocksSubmit`, `amountPartialDeclaration_blocksSubmit`, `deadlineMustBeFuture`, `speedBonusEarlyDeadlineBeforeDeadline`.
- [ ] Submit exitoso (mock `useCreateOffer`) verifica que el body contiene `type: 'bundle'` y los campos correctos.
- [ ] Validacion visual Pencil ≥95% contra `TwbRP` y `PrjJn`.
- [ ] A11y: cada row con `<fieldset>`, errores en `aria-live`, labels asociados.

## Done summary

Implementación del BundleEditor completa y correcta. BundlePlatformRow rediseñado como fieldset composable con semántica ARIA apropiada. Validaciones de schema cubren los casos edge (mínimo 2 deliverables, suma de montos, declaración parcial, deadlines). Tests cubren happy path + 6 edge cases de validación + axe. Extracción de todayString a dateUtils correcta. Analytics actualizado con los 3 offer_type. Los casts as string sobre crypto.randomUUID() son el fix mínimo necesario para el mismatch de tipos template literal.

## Evidence

- Commits:
- Tests:
- PRs:
