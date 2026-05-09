---
satisfies: [R2, R4, R5, R8]
---

## Description

Payments table con search bar + export CSV. Tabla paginable (keyset), search actualiza URL, rows navegan a la conversación y export descarga blob CSV con manejo de error `409` y banner `X-Truncated` (CF-14).

**Size:** M
**Files:**

- `src/features/earnings/components/EarningsPaymentsTable.tsx` (nuevo)
- `src/features/earnings/components/EarningsSearchExportBar.tsx` (nuevo)
- `src/features/earnings/utils/exportCsv.ts` (nuevo — helper de descarga blob)
- `src/features/earnings/components/__tests__/EarningsPaymentsTable.test.tsx` (nuevo)

## Approach

- Tabla con columns: brand+campaign, deliverable label, occurred_at, amount, status badge (`Pagado`/`Por cobrar`).
- Search input debounced (300ms). Cambio escribe `q` en URL search params; vacío lo borra.
- Export: llama `useExportCreatorEarningsMutation` con period+q actuales. Descarga blob con filename `marz-earnings-{period}-{YYYYMMDD}.csv`.
- Manejar `409 no_payments_to_export` con toast/inline message claro.
- Si la mutation indica `truncated === true`, mostrar banner: "Se exportaron las 10k filas más recientes. Para el export completo, contactá al administrador (Marz)".
- Row click: navegar a `payments[i].href` (ya viene armado del backend).
- Pagination keyset estandar usando `next_cursor` / `has_more`.

## Investigation targets

**Required**:

- `src/features/earnings/hooks/useCreatorEarnings.ts` y `useExportCreatorEarnings.ts` (.2).
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §4.1 (`payments` shape), §4.1 export endpoint, §7.4 task F.5.
- `src/components/ui/table.tsx` o equivalente shadcn.

**Optional**:

- Patrón de toast/notify existente en el repo.

## Design context

- Tabla con header sticky en desktop; mobile cae a lista de cards stacked.
- Status badges con tokens semánticos (`--success`/`--muted`).
- Search bar a la izquierda del export button. Export es secondary button con icon download.
- Truncated banner: fila full-width arriba de la tabla, color `--warning` o token equivalente, dismissible.

## Acceptance

- [ ] Tabla renderiza rows desde `payments.items` con todas las columnas requeridas.
- [ ] Search escribe `q` en URL search param con debounce 300ms; vacío lo borra.
- [ ] Click en row navega a `href` del row exacto (`paymentId` o `deliverableId`).
- [ ] Botón export descarga blob CSV con filename correcto.
- [ ] Error `409 no_payments_to_export` se muestra con mensaje claro al usuario.
- [ ] Cuando response trae `X-Truncated: true`, banner CF-14 visible con copy exacta.
- [ ] Paginación funciona con `next_cursor` / `has_more`.
- [ ] A11y: table headers semánticos, row buttons con labels útiles, tab order correcto.
- [ ] Tests cubren: search update URL, export success, export error 409, render truncated banner.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
Tabla semántica corregida con td por columna y tr clickeable, useNavigate unificado a una instancia tipada, mock de tests actualizado. Sin issues bloqueantes.
## Evidence
- Commits:
- Tests:
- PRs: