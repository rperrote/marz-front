---
satisfies: [R6, R9]
---

## Description

Cablear botón "Export CSV" a `useExportBrandPaymentsCsvMutation` (de .3), disparar download cuando hay éxito, mostrar errores 409 sin descargar, y emitir todos los eventos analytics `brand_payments_*`.

**Size:** S
**Files:**

- `src/features/payments/components/BrandPaymentsPage.tsx` (modificar: botón + analytics hooks)
- `src/features/payments/analytics.ts` (nuevo)
- Tests del flujo de export y de analytics

## Approach

- Botón export en toolbar pasa los filtros actuales (los mismos del query) a la mutation.
- Éxito: dispara descarga del blob/response como archivo `marz-payments-{workspaceId}-{YYYYMMDD}.csv` (filename viene en `Content-Disposition` del backend; usar ese si está disponible, fallback al patrón).
- Error 409 `no_payments_to_export`: toast/inline informativo, sin download, sin analytics de export.
- Error 409 `export_exceeds_limit`: mostrar exactamente el texto: "El export excede el límite. Contactá al administrador (Marz) para obtenerlo manualmente." (R6).
- Eventos analytics: emitir en los puntos correctos (`viewed` al montar página, `period_changed` en segmented control, `filter_changed` por cada filtro, `search_used` cuando search se ejecuta — no por cada keystroke, debounced; `csv_exported` solo al éxito; `payment_opened` desde row click cuando se navega; `refresh_clicked` en el botón refresh).

## Investigation targets

**Required:**

- Helper de analytics existente en otros features (si existe `src/shared/analytics` o similar). Si no, definir uno mínimo en `src/features/payments/analytics.ts`.
- `BrandPaymentsPage.tsx` (de .4) — puntos donde inyectar el botón y los hooks de analytics.

**Optional:**

- Toast existente en el repo (sonner/shadcn-toast) para errores.

## Acceptance

- [ ] Click export con datos: dispara download CSV.
- [ ] 409 `no_payments_to_export`: muestra mensaje, no descarga, no emite `csv_exported`.
- [ ] 409 `export_exceeds_limit`: muestra exactamente "El export excede el límite. Contactá al administrador (Marz) para obtenerlo manualmente.".
- [ ] Filename respeta `Content-Disposition` del backend cuando está presente.
- [ ] Analytics events emitidos: `brand_payments_viewed`, `brand_payments_period_changed`, `brand_payments_filter_changed`, `brand_payments_search_used` (debounced), `brand_payments_csv_exported`, `brand_payments_refresh_clicked`. (`brand_payment_opened` se emite desde .6 al hacer row click.)
- [ ] Tests cubren: success download, ambos 409s, eventos analytics correctos.

## Done summary
Los tres fixes aplicados: try/catch en onSuccess, getCsvFilename parametrizada con now, spread redundante eliminado. Tests cubren todos los paths incluyendo el nuevo caso de blob failure. Sin issues nuevos.
## Evidence
- Commits:
- Tests:
- PRs: