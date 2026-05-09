---
satisfies: [R8]
---

## Description

Emitir 4 eventos analytics frontend al endpoint genérico `POST /api/v1/analytics/events` (existente, FEAT-002): `link_submit_opened`, `link_preview_resolved`, `link_card_seen`, `link_url_clicked`. Sin URLs concretas, nombres ni montos en el payload.

**Size:** S
**Files:**

- `src/features/deliverables/analytics.ts` (nuevo, helper)
- `src/features/deliverables/components/SubmitLinkSidesheet.tsx` (instrumentar `link_submit_opened`, `link_preview_resolved`)
- `src/features/deliverables/components/LinkSubmittedCard.tsx`, `LinkApprovedCard.tsx`, `LinkChangesRequestedCard.tsx` (instrumentar `link_card_seen`)
- `src/features/deliverables/components/LinkPreviewBlock.tsx` (instrumentar `link_url_clicked` en el `<a>`)

## Approach

- `src/features/deliverables/analytics.ts`: helpers `trackLinkSubmitOpened(ctx)`, `trackLinkPreviewResolved(ctx)`, `trackLinkCardSeen(ctx)`, `trackLinkUrlClicked(ctx)`. Cada uno llama a `postAnalyticsEvent(name, payload)` de `src/shared/analytics/postEvent.ts` (existente).
- Payload incluye solo: `deliverable_id`, `link_id`, `platform`, `outcome` (cuando aplica), `is_resubmission` (cuando aplica). NO URL, NO títulos, NO account info.
- `link_card_seen`: hook reusable `useTrackOnceVisible(ref, threshold=0.5, key)` con `IntersectionObserver`. `key` evita re-emit por re-mount; persiste en `sessionStorage` con clave `link_card_seen:{link_id}`.
- `link_submit_opened`: emit al montar el sidesheet.
- `link_preview_resolved`: emit en el `onSuccess` del submit cuando `link.preview` viene en el response.
- `link_url_clicked`: handler `onClick` del `<a>` en `LinkPreviewBlock`; no preventDefault.

## Investigation targets

**Required:**

- `src/shared/analytics/postEvent.ts` — helper genérico FEAT-002

**Optional:**

- Otros features que ya emiten analytics como referencia de payload

## Acceptance

- [ ] Unit tests por evento: mock `fetch`, dispara la acción, verifica payload exacto y nombre del evento.
- [ ] `link_card_seen` usa `IntersectionObserver` con threshold 0.5; emite una sola vez por sesión por `link_id` (test con doble mount).
- [ ] Payload no contiene URLs, títulos ni info de cuenta — verificable por test snapshot del payload.
- [ ] `link_submit_opened` se emite al abrir el sidesheet, no al cerrar.
- [ ] `link_preview_resolved` se emite solo cuando el response trae `preview.outcome` (los 3 outcomes).
- [ ] `link_url_clicked` no rompe la navegación al link.

## Done summary
Implementación completa de 4 eventos analytics (link_submit_opened, link_preview_resolved, link_card_seen, link_url_clicked) con tests, typecheck limpio y todos los 138 tests pasando
## Evidence
- Commits:
- Tests:
- PRs: