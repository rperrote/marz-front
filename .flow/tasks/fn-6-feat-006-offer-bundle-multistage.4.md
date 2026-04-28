---
satisfies: [R3, R9]
---

## Description

`MultiStageEditor` (Pencil `1TkFi`): repeater de `StageEditor` (Pencil `SOlSR`). Inputs por stage: `name`, `description` (textarea), `deadline`, `amount`. Total derivado en runtime y mostrado read-only en el footer. Sin speed_bonus. Submit invoca `useCreateOffer` con body `type: 'multistage'`. Las deadlines deben ser estrictamente ascendentes (igualdad bloquea).

**Size:** M
**Files:**

- `src/features/offers/components/MultiStageEditor.tsx` (nuevo)
- `src/features/offers/components/StageEditor.tsx` (nuevo)
- `src/features/offers/components/MultiStageEditor.test.tsx` (nuevo)
- `src/features/offers/schemas/multiStageEditor.ts` (validacion zod local con refinement)

## Approach

- Schema base: `createMultiStageOfferRequestSchema` (generado en F.1).
- Refinements locales:
  - `min(2)` stages.
  - `amount > 0` por stage.
  - deadlines strictly ascending (loop en refine; reportar el indice especifico que falla para resaltar la row).
  - `total_amount` NO va al body (server lo calcula); el footer lo computa solo para display.
- TanStack Form: si TanStack Form expone field-level errors, mapear al StageEditor que corresponde para resaltarlo.
- A11y: textarea con label asociado, errores en `aria-live="polite"`.

## Investigation targets

**Required:**

- `src/features/offers/components/BundleEditor.tsx` (paralelo F.3) — copiar patrones consistentes
- `src/shared/api/generated/zod/` — schema generado de multistage
- `src/components/ui/textarea.tsx` — primitive
- `src/components/ui/input.tsx` — date input

**Optional:**

- Pencil `1TkFi`, `SOlSR` — referencia visual

## Design context

- Stages numerados visualmente ("Stage 1", "Stage 2", ...) en el header de cada row.
- Footer con label "Total" y valor derivado en `font-semibold`.
- Estado de error de deadline: la row con conflicto recibe borde `--destructive` y helper text "Debe ser posterior al stage anterior".

## Acceptance

- [ ] `MultiStageEditor` renderiza con 1 stage inicial + boton "Add stage".
- [ ] Submit disabled si `stages.length < 2`.
- [ ] Total derivado se actualiza en tiempo real al cambiar amounts.
- [ ] Tests: `minTwoStages_disablesSubmit`, `equalConsecutiveDeadlines_blocksSubmit_andHighlightsRow`, `descendingDeadlines_blocksSubmit`, `amountPerStageMustBePositive`, `totalAmountIsSumOfStages`, `noSpeedBonusBlock` (verifica que no existe el toggle).
- [ ] Submit exitoso (mock) verifica body con `type: 'multistage'`, stages array, sin `total_amount` ni `speed_bonus`.
- [ ] Validacion visual Pencil ≥95% contra `1TkFi` y `SOlSR`.
- [ ] A11y: textarea labels, errores en `aria-live`, navegacion con teclado.

## Done summary

Implementación completa y correcta. El parsing de form.state.errors vía prefixSchemaToErrors de TanStack Form 1.29 produce el Record<string, Issue[]> que el regex consume — validado por los tests. Accesibilidad sólida en StageEditor. Integración en SendOfferSidesheet limpia con key={offerType} garantizando unmount. Tests cubren todos los casos críticos de negocio.

## Evidence

- Commits:
- Tests:
- PRs:
