---
satisfies: [R10]
---

## Description

Optimizaciones de perf bundle reportadas por react-doctor: hoist Intl constructors (15), Promise.all en awaits independientes (11+9+8), `toSorted` en lugar de `[...].sort()` (6), Set/Map lookups (3), batch DOM (1), Math.max sobre sort (1), combine iterations (13), async-defer-await (1), no-usememo-simple-expression (1), client-localstorage-no-version (2).

**Size:** M
**Files:**
- `js-hoist-intl` ×15: múltiples archivos con `new Intl.NumberFormat(...)` / `DateTimeFormat` en render — listado en `/tmp/rd-verbose.txt`.
- `async-await-in-loop` ×11 + `async-parallel` ×9: concentrados en `src/test/e2e/fixtures.ts:271,303,320,338,394,423,432,445,460`.
- `server-sequential-independent-await` ×8: `src/routes/topbar-routes.test.tsx:50,138`, `src/features/campaigns/configuration/campaign-configuration-routes.test.ts:185` (EXCLUIR — fn-18), `src/test/e2e/fixtures.ts:296,298`, `src/features/identity/auth/components/KindSelector.test.tsx:257,271,281`.
- `js-tosorted-immutable` ×6: `src/features/offers/analytics.ts:148`, `src/features/campaigns/configuration/BonusStep.tsx:129,152` (EXCLUIR — fn-18), `src/features/offers/utils/bonusTerms.ts:5`, `src/features/inbox/InboxPage.tsx:179`, `src/features/campaigns/detail/overview/RecentActivity.tsx:39`.
- `js-set-map-lookups` ×3: `src/test/e2e/global-setup.ts:12`, `scripts/check-direct-api-calls.ts:109,125`.
- `js-batch-dom-css` ×1: `src/features/chat/components/MessageComposer.tsx:118`.
- `js-min-max-loop` ×1: `src/features/campaigns/configuration/BonusStep.tsx:129` (EXCLUIR — fn-18).
- `js-combine-iterations` ×13: lista en `/tmp/rd-verbose.txt`.
- `async-defer-await` ×1: `src/shared/ws/useWebSocket.ts:71`.
- `no-usememo-simple-expression` ×1: `src/features/chat/components/MessageTimeline.tsx:101`.
- `client-localstorage-no-version` ×2: `src/features/identity/onboarding/creator/store.test.ts:93`, `.../brand/store.test.ts:75`.

## Approach

- **hoist-intl**: mover `new Intl.NumberFormat(...)` / `Intl.DateTimeFormat(...)` al module scope (top del archivo) si la config es estática. Si depende del locale del usuario, usar `useMemo` con deps `[locale]`.
- **async-await-in-loop / async-parallel / server-sequential-independent-await**: detectar awaits independientes (no se referencian entre sí) y combinar con `Promise.all([...])`. Tests en `fixtures.ts` son seguros para paralelizar.
- **tosorted-immutable**: reemplazar `[...arr].sort(cmp)` por `arr.toSorted(cmp)` (ES2023, soportado en Node 20+, target del proyecto).
- **set-map-lookups**: en `check-direct-api-calls.ts` y `global-setup.ts`, convertir array a `Set` antes del loop, usar `.has()` en lugar de `.indexOf()`/`.includes()`.
- **batch-dom-css** en `MessageComposer.tsx:118`: si hay `element.style.X = ...` + `element.style.Y = ...` secuenciales en un loop, separar reads de writes o usar `cssText`/`classList`.
- **combine-iterations**: `.map().filter().map()` en chains pesadas → un `for` o `reduce`. Aplicar solo donde mejora claridad (no churn).
- **async-defer-await** `useWebSocket.ts:71`: mover el `await` después del early-return guard.
- **no-usememo-simple-expression** `MessageTimeline.tsx:101`: eliminar el `useMemo` (property access / ternary es trivial).
- **client-localstorage-no-version**: agregar version suffix a las keys en los stores de onboarding (`"marz-creator-onboarding"` → `"marz-creator-onboarding:v1"`). Migration: si key vieja existe, ignorar (purgar). Hacerlo en `store.ts` real, no solo en tests.

## Investigation targets

**Required**:
- `/tmp/rd-verbose.txt` (listados exactos)
- `src/test/e2e/fixtures.ts:260-470` (la mayoría de async issues)
- `src/features/identity/onboarding/creator/store.ts` y `.../brand/store.ts` (versioning de keys)
- `src/features/chat/components/MessageComposer.tsx:100-140`

**Optional**:
- Node 20 ES2023 array methods support

## Acceptance

- [ ] `react-doctor` reporta 0 en: `js-hoist-intl`, `async-await-in-loop`, `async-parallel`, `server-sequential-independent-await`, `js-tosorted-immutable`, `js-set-map-lookups`, `js-batch-dom-css`, `js-min-max-loop` (excepto el que está en `configuration/`), `js-combine-iterations`, `async-defer-await`, `no-usememo-simple-expression`, `client-localstorage-no-version`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green (especial atención a tests Playwright tras paralelizar fixtures).
- [ ] Onboarding stores: migration de key vieja → nueva no rompe sesiones existentes en local. Verificar manualmente.
- [ ] Ningún archivo bajo `src/features/campaigns/configuration/**` tocado.

## Done summary
Todos los fixes del round anterior aplicados correctamente: handleAutoResize revertido al patrón style.height, non-USD formatting preserva separadores de miles con toLocaleString+opciones, LEGACY_STORAGE_KEY como string literal en ambos store.test.ts
## Evidence
- Commits:
- Tests:
- PRs: