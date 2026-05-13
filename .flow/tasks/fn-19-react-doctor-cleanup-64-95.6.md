---
satisfies: [R4]
---

## Description

Agregar `invalidateQueries` (o `setQueryData` optimista) en las 22 mutations sin invalidación reportadas por react-doctor. Cada caso requiere identificar la queryKey correcta a invalidar — no bulk-fix mecánico.

**Size:** M
**Files:**
- 22 sitios distribuidos. Listado completo en `/tmp/rd-verbose.txt` bajo `react-doctor/query-mutation-missing-invalidation`.
- Probablemente concentrados en: `src/features/offers/hooks/*`, `src/features/deliverables/hooks/*`, `src/features/campaigns/**/hooks/*` (excluir configuration), `src/features/payments/hooks/*`, `src/features/earnings/hooks/*`, `src/features/identity/auth/hooks/*`, `src/features/chat/hooks/*`.

## Approach

Para cada mutation:
1. Identificar la queryKey afectada (qué data lee este endpoint actualiza).
2. Default: `onSuccess: () => queryClient.invalidateQueries({ queryKey: [...] })` con prefix matching cuando aplique (e.g., `['campaigns']` invalida `['campaigns', id]`, `['campaigns', id, 'offers']`, etc).
3. Si UX requiere update inmediato (e.g., toggle, mark read), considerar `setQueryData` optimista con `onMutate` (cancel + snapshot + setQueryData) + `onError` rollback + `onSettled` invalidate. NUNCA optimista sin rollback.
4. Si la mutation ya tiene `onSuccess` con otra lógica (toast, navigate), agregar invalidate dentro del mismo handler (mantener orden: invalidate primero, navigate después).

**Patrón canónico a replicar** (`src/features/inbox/hooks/useMarkInboxItemReadMutation.ts:11-27`):
- `useMutation` + `useQueryClient` + `onSuccess` que invalida + `onError` para 409 si aplica.

**Pitfalls**:
- queryKey demasiado específico no refetchea hermanos (listas filtradas, paginación). Usar prefix matching cuando el endpoint afecta múltiples vistas.
- Algunas mutations son fire-and-forget (analytics, logs) — esas pueden no necesitar invalidate. Si react-doctor las reporta, suprimir con justificación inline.

## Investigation targets

**Required**:
- `src/features/inbox/hooks/useMarkInboxItemReadMutation.ts:1-40` (patrón canónico)
- `src/features/offers/hooks/useOfferActions.ts` (otro ejemplo bueno)
- Listado exacto de los 22 sitios: `grep -A3 query-mutation-missing-invalidation /tmp/rd-verbose.txt`
- Convenciones de queryKey en cada feature: buscar exports `xxxQueryKey` en `src/features/*/api/*.ts`

**Optional**:
- https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
- https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses
- https://tkdodo.eu/blog/mastering-mutations-in-react-query

## Acceptance

- [ ] `react-doctor` reporta 0 `query-mutation-missing-invalidation`.
- [ ] Cada mutation: invalidate cubre todas las queries que muestran data afectada. Verificar manualmente al menos 5 flows (offer accept, offer reject, draft submit, mark inbox read, payment release).
- [ ] No mutation usa optimistic update sin rollback en `onError`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] Ninguna mutation bajo `src/features/campaigns/configuration/**` tocada (fn-18).

## Done summary
invalidaciones de queries correctas en todos los archivos; test del caso null corregido con aserción real y helper preservando null
## Evidence
- Commits:
- Tests:
- PRs: