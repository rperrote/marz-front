---
satisfies: [R6]
---

## Description

Eventos de analytics fire-and-forget para el dashboard Earnings. Conecta los componentes existentes (.3, .4, .5) al tracker compartido.

**Size:** S
**Files:**

- `src/features/earnings/analytics.ts` (nuevo — wrappers tipados)
- `src/shared/analytics/track.ts` (modificar — agregar event names)
- Modificaciones leves en `EarningsPage`, `EarningsPeriodControl`, `EarningsSearchExportBar`, `PendingBonusCard`, `EarningsPaymentsTable` para emitir eventos.
- `src/features/earnings/__tests__/analytics.test.ts` (nuevo)

## Approach

- Eventos:
  - `earnings_viewed` — dispara una vez por mount.
  - `earnings_period_changed` — payload `{ from, to }`.
  - `earnings_payment_search_used` — DEBOUNCED (300ms o más, no por keystroke).
  - `earnings_csv_exported` — payload `{ period, q, truncated, row_count? }`.
  - `earnings_bonus_opened` — payload `{ bonus_id, offer_id, conversation_id }`.
  - `earnings_payment_opened` — payload `{ payment_kind, conversation_id }`.
- Wrappers tipados en `analytics.ts` para no manchar componentes con strings.

## Investigation targets

**Required**:

- `src/shared/analytics/track.ts` — API existente del tracker.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §7.4 task F.6.

**Optional**:

- Otros features que ya usan analytics para imitar el patrón.

## Acceptance

- [ ] Los 6 eventos se emiten con payloads correctos.
- [ ] `earnings_payment_search_used` está debounced (no se dispara por keystroke).
- [ ] `earnings_csv_exported` incluye flag `truncated` y respeta filtros activos.
- [ ] Tests verifican payloads requeridos y debounce de search.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
Test movido a src/features/earnings/analytics.test.ts con imports relativos corregidos. 6 tests pasan. Sin issues pendientes.
## Evidence
- Commits:
- Tests:
- PRs: