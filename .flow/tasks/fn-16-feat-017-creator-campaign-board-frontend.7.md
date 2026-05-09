---
satisfies: [R5]
---

## Description

Empty states con textos exactos del spec y emisión de analytics events. Variantes: `no_campaigns`, `no_filters` (filtros aplicados sin resultados), `no_recommendations` (con `recommended_only=true` y sin resultados), `error`.

**Size:** S/M
**Files:**

- `src/features/discovery/campaign-board/CampaignBoardEmptyState.tsx`
- `src/features/discovery/campaign-board/utils/classifyEmptyState.ts`
- `src/features/discovery/campaign-board/utils/analytics.ts`
- `src/features/discovery/campaign-board/CampaignBoardPage.tsx` (modificar: wire empty state + analytics)
- Tests unitarios

## Approach

- `classifyEmptyState({data, search, error})` devuelve la variante:
  - `error` si query failed.
  - `no_campaigns` si `counts.total_visible === 0`.
  - `no_recommendations` si `search.recommended_only && counts.recommended === 0` y total_visible > 0.
  - `no_filters` si filtros aplicados (cualquiera distinto de defaults) y `counts.matching_filters === 0`.
  - `null` si hay datos.
- Textos exactos de los empty states tomados de `02-spec.md` US-2 / sección de empty states. Si la spec no los lista literal, copiar del 03-solution o levantar pregunta abierta.
- Analytics: helper `trackBoardEvent(name, payload)` que envía a la pipeline existente (verificar adapter actual; si no existe pipeline analytics frontend, dejar logger interno + TODO con referencia a feature de analytics).
- Eventos a emitir (solution §7.4 F.7):
  - `campaign_board_viewed` al montar la page con datos
  - `campaign_board_searched` al cambiar `q` (post-debounce)
  - `campaign_board_filtered` al cambiar cualquier filtro
  - `campaign_board_sorted` al cambiar sort
  - `campaign_board_brief_opened` al abrir sheet
  - `campaign_board_application_started` al abrir application dialog
  - `campaign_board_application_submitted` on mutation success
  - `campaign_board_empty_state_seen` cuando se muestra una variante de empty
- Wire eventos en F.4 (filters/sort/search) y F.5 (brief sheet) y F.6 (application) actualizando esos archivos para llamar `trackBoardEvent`. Esto justifica que F.7 dependa de F.4 y F.6.

## Investigation targets

**Required:**

- `marz-docs/features/FEAT-017-creator-campaigns-board/02-spec.md` (textos exactos de empty states)
- Adapter analytics existente en `src/shared/` (si lo hay)
- `src/features/discovery/campaign-board/CampaignBoardPage.tsx` (de F.3)

**Optional:**

- Otra feature con tracking events

## Acceptance

- [ ] `classifyEmptyState` cubre las 4 variantes con tests por borde
- [ ] Textos de empty states matchean spec literal (o referencian fuente si pendiente)
- [ ] Los 8 eventos analytics se emiten en los puntos correctos (test con spy del helper)
- [ ] `empty_state_seen` incluye la variante en payload
- [ ] No se emite `campaign_board_viewed` durante loading

## Done summary
Los tres fixes del round anterior aplicados correctamente. has_query usa Boolean(patch.q), no_campaigns tiene rama explícita con comentario de ticket, data-ticket acotado solo a no_campaigns. Sin nuevos problemas.
## Evidence
- Commits:
- Tests:
- PRs: