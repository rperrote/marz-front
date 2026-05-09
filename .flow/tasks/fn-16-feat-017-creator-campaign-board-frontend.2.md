---
satisfies: [R1, R6]
---

## Description

Implementar capa de datos: server functions con `createServerFn` para los 3 endpoints y hooks TanStack Query consumiéndolas. Sin UI todavía.

**Size:** M
**Files:**

- `src/features/discovery/campaign-board/api/listCreatorCampaignBoard.ts`
- `src/features/discovery/campaign-board/api/getCreatorCampaignBoardDetail.ts`
- `src/features/discovery/campaign-board/api/submitCampaignApplication.ts`
- `src/features/discovery/campaign-board/hooks/useCampaignBoardQuery.ts`
- `src/features/discovery/campaign-board/hooks/useCampaignBoardDetailQuery.ts`
- `src/features/discovery/campaign-board/hooks/useSubmitCampaignApplicationMutation.ts`
- `src/features/discovery/campaign-board/hooks/__tests__/*` (vitest)

## Approach

- Server functions usan el cliente generado (Orval) en `src/shared/api/generated/`. NO hardcodear paths — consumir el hook/fn generado y pasarle la query/headers.
- Query keys según §7.3:
  - List: `['discovery','campaign-board', search]`
  - Detail: `['discovery','campaign-board','detail', campaignId]`
- Mutation `useSubmitCampaignApplicationMutation`:
  - Genera `Idempotency-Key` (UUID v4) por intento de submit; key se pasa como argumento o se genera dentro y se devuelve para retry.
  - On success: aplica `card_patch` a las queries del board en cache (`queryClient.setQueriesData`) e invalida list + detail de esa campaign.
  - Errores tipados: surface `409 application_already_exists`, `409 idempotency_conflict`, `409 campaign_not_available`, `422 validation.*`.
- No usar MSW en runtime; tests mockean la server function directamente con `vi.mock`.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — manejo de auth/errores existente (CLAUDE.md raíz)
- `src/shared/api/generated/` — funciones generadas para los 3 endpoints
- Otras features con TanStack Query en `src/features/*/hooks/` — pattern de query keys e invalidación

**Optional:**

- TanStack Start docs sobre `createServerFn` (si dudas con SSR)

## Acceptance

- [ ] List/detail queries devuelven los tipos generados sin redefinir manualmente
- [ ] `useSubmitCampaignApplicationMutation` adjunta header `Idempotency-Key` UUID v4 y aplica `card_patch` en cache on success
- [ ] Tests de hooks con `QueryClientProvider` cubren: éxito list, éxito detail, success de submit con `card_patch`, error `409 application_already_exists`, error `409 idempotency_conflict` con regeneración de key
- [ ] `recommended_only=false` es el default cuando no se pasa
- [ ] `pnpm typecheck` limpio

## Done summary
Todos los issues del round anterior resueltos: helper compartido en _auth.ts, RAFITA:ANY en cada cast, Idempotency-Key vía extraHeaders, invalidación redundante eliminada.
## Evidence
- Commits:
- Tests:
- PRs: