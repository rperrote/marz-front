# fn-2.9 F.6 — Fase 4: confirmación + creación de Campaign + summary view

## Description

# F.6 — Fase 4: confirmación + creación de Campaign + summary view

## Por qué

Punto de no-retorno: aquí se persiste la Campaign + Brief en backend. Tras éxito, el wizard termina y el usuario navega al marketplace o ve el resumen.

## Scope

### Componentes

- `src/features/campaigns/brief-builder/screens/P4Confirm.tsx`.
- `src/features/campaigns/brief-builder/components/BriefSummaryView.tsx` — read-only de todas las secciones del Brief.

### Comportamiento

Al entrar a Phase 4 (transición desde P3): disparar `useCreateCampaign` (mutation Orval-generated cuando B.10 esté; manual mientras tanto):

```
POST /api/v1/campaigns
body: {
  brand_workspace_id,
  name, objective, budget_amount, budget_currency, deadline,
  brief: { ...del store }
}
headers: { 'Idempotency-Key': uuid-generado-una-vez-en-este-wizard }
```

Estados:

- `pending` — spinner + "Creando tu campaña…".
- `success` — pantalla de confirmación con CTAs:
  - "Ir al marketplace" → `navigate({ to: '/marketplace', search: { campaignId } })`. Si no existe la ruta (catch nav error), navegar a `/` con toast.
  - "Ver resumen del brief" → abre `<Dialog>` con `BriefSummaryView` (datos del store; no requiere fetch).
- `error` — toast + botón "Volver a intentar" (re-mutate). Botón "Volver al formulario" → `goTo(3)`.

### Doble-submit

- `mutation.isPending` deshabilita CTAs.
- Idempotency-Key generado **una vez** al montar P4 (no en cada render). Igual key para retries del mismo wizard.

### Cleanup

Onsuccess: `setField('campaignId', resp.campaign_id)`. **No** llamar `reset()` aún (el usuario puede querer ver el summary). El reset ocurre cuando navega fuera (cubierto en F.8 leave-guard).

### `BriefSummaryView`

Renderiza todas las secciones del Brief en formato read-only:

- Campaign metadata (name, objective, budget, deadline).
- ICP (description, age range, genders, countries, platforms, interests).
- Scoring Dimensions (lista con weight + signals).
- Hard Filters (lista).
- Disqualifiers (lista).

Reusable: lo importa F.7 (ruta standalone).

### Tests

- `P4Confirm.test.tsx`:
  - Mount → mutation invocada con body correcto + Idempotency-Key.
  - Pending → spinner.
  - Success → renderiza confirmación + CTAs.
  - Error → toast + botones de retry.
  - "Ver resumen del brief" abre dialog.
  - "Ir al marketplace" navega con campaignId.
  - Idempotency-Key estable across retries.
- `BriefSummaryView.test.tsx`: renderiza todas las secciones; secciones vacías muestran "—" o se ocultan.

## Notas

- Depende de F.5 (Phase 3 setea briefDraft) y F.0b (BriefSummaryView design).
- Si la mutación falla con 422, mostrar field_errors mapeados a la Phase 3 (volver con errores marcados). Edge case raro porque la validación local ya cubrió, pero defensa en profundidad.

## Acceptance

- Mount de P4 dispara `POST /api/v1/campaigns` una sola vez, con Idempotency-Key.
- Estados pending/success/error renderizados.
- Success: CTAs "Ir al marketplace" y "Ver resumen del brief" funcionan.
- Marketplace ausente → navegar a `/` con toast graceful.
- "Ver resumen del brief" abre Dialog con `BriefSummaryView` completo.
- 422 onerror → toast con errores mapeados; "Volver" → P3 con datos.
- 7+ tests verdes incluyendo idempotency stable across retries.
- Mutation `isPending` gate aplicado a botones.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
