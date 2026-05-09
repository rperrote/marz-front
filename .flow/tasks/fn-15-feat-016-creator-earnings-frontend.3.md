---
satisfies: [R1, R2, R8]
---

## Description

Layout principal `EarningsPage` con header, KPI grid, period selector y monthly chart. Esta task entrega la mitad superior del dashboard tal como lo muestra el frame Pencil `m63kj` (variante dark).

**Size:** M
**Files:**

- `src/features/earnings/components/EarningsPage.tsx` (nuevo)
- `src/features/earnings/components/EarningsKpiGrid.tsx` (nuevo — 4 KPI cards)
- `src/features/earnings/components/EarningsPeriodControl.tsx` (nuevo — segmented control)
- `src/features/earnings/components/MonthlyEarningsChart.tsx` (nuevo — bar chart accesible)
- `src/routes/_creator/earnings.tsx` (modificar — montar `EarningsPage`)

## Approach

- KPIs: `total_earned`, `earned_in_period`, `pending_payout`, `next_payout` (con `estimated_date` y flag `date_available`).
- Period selector: segmented `30d | 90d | 12m | All time`. Cambia search params via router; debe disparar refetch.
- Chart: leer `monthly_earnings`, render bar chart accesible (labels + summary). Fallback vacío con mensaje cuando no hay datos.
- Light theme: usar tokens existentes — no inventar paleta.
- Consumir `useCreatorEarningsQuery` de la task .2.

## Investigation targets

**Required**:

- `src/features/earnings/hooks/useCreatorEarnings.ts` (entregable de .2).
- `src/styles.css` — tokens shadcn mapeados desde `.pen`.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §7.2, §7.4 task F.3.
- Pencil frame `m63kj` (dark) — referencia visual.

**Optional**:

- Componentes shadcn existentes en `src/components/ui/*` para Card, Tabs, ToggleGroup.

## Design context

- Variante dark del frame `m63kj`. Layout: header full-width, KPI grid 4 columnas en desktop (responsive a 2/1 en mobile).
- Radii generosos (UI redondeada, nunca cuadrada).
- Tipografía Geist via `@fontsource/geist-sans`.
- KPI cards usan `--card`/`--card-foreground` tokens; números grandes con `--foreground`, labels en `--muted-foreground`.
- Period selector: variant pill con `--primary` para activo.

## Acceptance

- [ ] `EarningsPage` renderiza header, KPI grid, period control y monthly chart con data del hook.
- [ ] Cambio de período actualiza URL search param y dispara refetch.
- [ ] Chart muestra fallback accesible cuando `monthly_earnings` está vacío o todo en cero.
- [ ] Visual ≥95% match contra `m63kj` desktop dark (verificación manual con screenshot).
- [ ] Light theme usa solo tokens (no hex hardcoded en components nuevos).
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
Fixes aplicados correctamente: labels lazy en periodOptions y gridTemplateColumns dinámico en chart. Sin nuevos problemas.
## Evidence
- Commits:
- Tests:
- PRs: