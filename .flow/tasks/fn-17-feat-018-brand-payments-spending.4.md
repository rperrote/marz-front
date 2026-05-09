---
satisfies: [R3, R4, R8, R10]
---

## Description

Construir la UI completa del dashboard desktop dark según frame Pencil `mLJAj`: 4 KPIs (USD), segmented control de periodo, barras mensuales, donut con bucket "Otros", filtros (campaign/creator/search), tabla paginada keyset, empty states.

**Size:** L → recomendado split solo si el implementador lo necesita; en lo posible mantener como M+ porque los componentes son cohesivos. Si se split, mantener empty states + filtros junto a la página.
**Files:**

- `src/features/payments/components/BrandPaymentsPage.tsx` (nuevo, layout)
- `src/features/payments/components/PaymentsPeriodSegmentedControl.tsx`
- `src/features/payments/components/PaymentKpiGrid.tsx`
- `src/features/payments/components/MonthlySpendBarChart.tsx`
- `src/features/payments/components/CampaignSpendDonut.tsx`
- `src/features/payments/components/BrandPaymentsFilters.tsx`
- `src/features/payments/components/BrandPaymentsTable.tsx`
- `src/features/payments/components/PaymentsEmptyState.tsx`
- `src/routes/_brand/payments.tsx` (montar la página real)
- Tests unit por componente clave + integración de la página

## Approach

- `BrandPaymentsPage` consume `useBrandPaymentsSpendingQuery` (de .3) usando los search params actuales.
- Filtros y periodo escriben en search params (no estado local), via `navigate` o helper de router.
- Charts: usar la lib que ya use el proyecto (revisar otros features antes de elegir; si no existe una, recharts es default razonable — confirmar antes de instalar).
- Donut bucket "Otros" ya viene resuelto por backend (no recalcular share ni redondeo en cliente).
- Formateo USD: helper consistente (`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` o helper existente).
- Tabla: keyset pagination usando `next_cursor` del response; botón "Cargar más" o paginación infinita simple.
- Empty states distintos para "workspace sin pagos" vs "filtros sin resultados".
- Refresh manual: botón visible en toolbar que invalida la query.

## Investigation targets

**Required:**

- Spec section 7.2 en `marz-docs/features/FEAT-018-brand-payments-and-spending/03-solution.md`.
- Pencil frame `mLJAj` — extraer con `mcp__pencil__get_screenshot` y `batch_get` a baja `readDepth`.
- Componentes shadcn ya usados en el repo (Button, Card, Table, Tabs, Select, Input).
- Patrón de tabla en otros features (ej. campaigns) si existe.
- `src/styles.css` — tokens shadcn dark/light.

**Optional:**

- Charts existentes en otros features para reusar lib.

## Design context

- Frame fuente: Pencil `mLJAj` (desktop dark). Validación visual ≥95% (R10).
- Tokens: usar exclusivamente vars shadcn (`--background`, `--foreground`, `--primary`, `--muted`, `--card`, `--radius`, etc.). Cero hex.
- UI redondeada siempre (CLAUDE.md design rule).
- Tipografía: Geist (`@fontsource/geist-sans` ya self-hosted).
- Dark theme nativo.
- Accesibilidad: tabla navegable por teclado, controles con labels, charts con descripción accesible (aria-label / sr-only summary).

## Acceptance

- [ ] Pantalla renderiza 4 KPIs USD: `Total spent`, `Period spend`, `Pending approval`, `Next debit` (formato `Intl USD`).
- [ ] Segmented control periodo: `30d` (default) / `90d` / `12m` / `All`. Cambio actualiza search param y dispara refetch.
- [ ] `MonthlySpendBarChart` renderiza array `monthly_spend` en USD.
- [ ] `CampaignSpendDonut` renderiza `campaign_breakdown` con leyenda y bucket "Otros" (sin recalcular en cliente).
- [ ] Filtros (campaign, creator, search) operan sobre search params; sin selector ni tabs de currency.
- [ ] Tabla muestra columnas según `BrandPaymentHistoryRow` y soporta keyset pagination con `next_cursor`.
- [ ] Empty state "sin pagos" vs "sin resultados" visualmente distintos.
- [ ] Validación visual contra Pencil `mLJAj` ≥ 95%.
- [ ] A11y: tabla navegable por teclado, controles con labels, charts con descripción.
- [ ] Botón refresh manual invalida la query.
- [ ] Sin emojis, sin currency UI, montos siempre USD.
- [ ] Tests unit cubren render USD-only y empty states.

## Done summary
Migración a useInfiniteQuery correcta: elimina los tres bugs del round anterior (flash empty state, server state duplicado en useState, cursor stale en closure). Tests actualizados con la estructura InfiniteData correcta. Typecheck limpio, 26 tests passing.
## Evidence
- Commits:
- Tests:
- PRs: