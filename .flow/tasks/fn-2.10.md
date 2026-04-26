# fn-2.10 F.7 — Ruta /campaigns/$campaignId/brief (resumen standalone)

## Description

# F.7 — Ruta `/_brand/campaigns/$campaignId/brief` (resumen standalone)

## Por qué

Acceso directo al resumen del Brief de una Campaign confirmada. Lo usa "Ver resumen del brief" desde otras pantallas + URLs compartibles.

## Scope

### Ruta

`src/routes/_brand/campaigns/$campaignId/brief.tsx`:

- Loader/queryClient ensure data: `useCampaignBrief(campaignId)` (Orval, depende de B.10).
- 404 si la campaign no existe o no pertenece al workspace del actor (backend devuelve 404, mapear a una página de "no encontrado").
- Loading skeleton.
- Onsuccess: renderiza `BriefSummaryView` (de F.6).

### Header de la ruta

Título "Resumen del brief — {campaign.name}". Botón "Volver a campañas" → `/campaigns`.

### Tests

- `brief.test.tsx`:
  - Loading state.
  - Success → render con todas las secciones.
  - 404 → mensaje de error.

## Notas

- Bloqueada por B.9 (endpoint `GET /api/v1/campaigns/{id}/brief` en dev) y B.10 (Orval regen).
- Mientras no esté el backend, el test puede correr con MSW.

## Acceptance

- Ruta `/_brand/campaigns/$campaignId/brief` registrada y type-safe.
- Loading + error + success states.
- Reusa `BriefSummaryView` de F.6.
- 404 muestra "No encontrado" con CTA volver.
- 3 tests verdes (loading/success/404).

## Done summary

Ruta standalone /campaigns/$campaignId/brief implementada correctamente: hook manual justificado (RAFITA:BLOCKER:), tipos explícitos, manejo de estados loading/error/404/success, separación de BC respetada, 4 tests incluyendo axe.

## Evidence

- Commits:
- Tests:
- PRs:
