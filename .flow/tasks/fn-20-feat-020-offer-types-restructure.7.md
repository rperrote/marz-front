---
satisfies: [R8]
---

## Description

Borrar archivos legacy y referencias muertas a Stages, `offer_type`, multistage, `OfferRevise`, mark-paid-por-deliverable. Verde de build + tsc + react-doctor ≥ 95.

**Size:** S
**Files:**
- Borrar:
  - `src/features/offers/components/StageList.tsx`
  - `src/features/chat/system-events/StageOpenedCard.tsx`
  - `src/features/chat/system-events/StageApprovedCard.tsx`
  - `src/features/offers/components/OfferTypeSelector.tsx`
  - `src/features/offers/components/OfferReviseDialog.tsx`
  - `src/features/deliverables/components/MarkAsPaidButton.tsx`
  - `src/features/deliverables/components/MarkAsPaidDialog.tsx` (si quedó)
- Buscar y limpiar exports/imports muertos, hooks/queries no usados (e.g. `useReviseOfferMutation`, `useMarkDeliverablePaidMutation`).

## Approach

- `grep -rn -E "Stage(Opened|Approved|List)|OfferType|offer_type|OfferRevise|multistage" marz-front/src` debe retornar 0 hits funcionales.
- Borrar archivos y luego corregir imports rotos (que NO deberían existir si F.3..F.6 migraron todo).
- Si aparece código de UI ligado a Stages que se olvidó migrar, anotar y consultar — NO improvisar lógica nueva acá.
- Limpiar entradas de `registry.ts`, rutas (si alguna referenciaba un componente borrado), barrels (`index.ts`).

## Investigation targets

**Required:**
- Resultado del grep arriba — punto de partida.
- `src/features/chat/system-events/registry.ts` — confirmar limpieza (ya hecha en F.5).
- `src/routeTree.gen.ts` / archivos de rutas — confirmar que no quedaron rutas huérfanas.

**Optional:**
- `pnpm tsc --noEmit` post-borrado para detectar imports rotos.

## Acceptance

- [ ] Archivos listados arriba eliminados.
- [ ] `grep -rn -E "Stage(Opened|Approved|List)|OfferType|offer_type|OfferRevise|multistage" marz-front/src` → 0 hits (excluyendo comentarios casuales legítimos en docs si los hubiera; en código: 0).
- [ ] `pnpm tsc --noEmit` verde.
- [ ] `pnpm build` verde.
- [ ] Tests verdes.
- [ ] `pnpm react-doctor` reporta ≥ 95.

## Done summary
F.7 pausada con RAFITA:BLOCKER documentado correctamente: precondición inválida en spec detectada, blocker escala a gate humano para decisión sobre soporte de multistage. No hay cambios funcionales incorrectos. El loop developer-reviewer no puede resolver esto — la decisión es externa.
## Evidence
- Commits:
- Tests:
- PRs: