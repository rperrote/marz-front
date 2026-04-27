---
satisfies: [R7]
---

## Description

Emitir los 8 analytics events client-side definidos en spec §Analítica vía `POST /api/v1/analytics/events` (endpoint genérico ya existente del Brief Builder). Cada evento con payload spec-compliant: SIN `amount` exacto, SIN `campaign_name`. Se usa `amount_bucket` (USD-equivalent) para montos.

**Size:** S
**Files:**

- `src/features/offers/analytics.ts` (nuevo: helper `trackOfferEvent` + bucket map)
- (modificaciones puntuales en componentes ya existentes para llamar `trackOfferEvent` en los hooks correspondientes)

## Approach

- **Helper `trackOfferEvent(name, payload)`**: wrapper sobre el client genérico de analytics existente (verificar nombre del módulo, ej. `src/shared/analytics/track.ts`). Adjunta tipado del payload.
- **Bucket de amount** (USD-equivalent):
  - `<500`, `500-1000`, `1000-2500`, `2500-5000`, `5000-10000`, `>10000`
  - Convertir: si `currency != USD`, asumir paridad 1:1 en MVP (TODO documentado para FX en futuro).
- **8 eventos** (alineados con spec §Analítica):
  1. `offer_sidesheet_opened` — open del sidesheet (F.2 → trigger en `sendOfferSheetStore.open`)
  2. `offer_sent` — onSuccess de `useCreateSingleOffer` (F.2)
  3. `offer_received_seen` — primera vez que `OfferCardReceived` entra en viewport (F.3 + IntersectionObserver)
  4. `offer_accepted` — onSuccess de `useAcceptOffer` (F.3)
  5. `offer_rejected` — onSuccess de `useRejectOffer` (F.3)
  6. `offer_panel_viewed` — primera vez que `CurrentOfferBlock` se monta con `current !== null` (F.4)
  7. `offer_archive_expanded` — onClick del trigger del archive (F.4)
  8. `offer_expired_seen` — primera vez que `OfferExpiredBubble` entra en viewport (F.5)
- **IntersectionObserver**: hook `useViewedOnce(ref, callback)` para los `*_seen` events. Verificar si ya existe en `shared/hooks/`; si no, crear.

## Investigation targets

**Required**:

- `src/shared/analytics/*` (verificar nombre real con grep) — cliente genérico de analytics usado por Brief Builder
- `../marz-docs/features/FEAT-005-offer-single/02-spec.md` §Analítica — lista exacta de eventos + payloads requeridos
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §7.6 F.7 — bucket map definitivo

**Optional**:

- `src/features/brief-builder/analytics.ts` (asumir; verificar) — patrón de referencia

## Key context

- **Privacidad**: `amount` exacto NO viaja. Usar `amount_bucket`. `campaign_name` NO viaja, solo `campaign_id`.
- **FX**: MVP asume paridad 1:1 — documentado como TODO en `analytics.ts`.
- **`*_seen` events**: solo emitir UNA VEZ por sesión por offer_id (deduplicar con Set en memoria del módulo).

## Acceptance

- [ ] `trackOfferEvent` exportado y tipado para los 8 eventos.
- [ ] Bucket map implementado y tested.
- [ ] Cada uno de los 8 eventos se emite en el momento correcto, con payload sin `amount` exacto y sin `campaign_name`.
- [ ] `*_seen` events emitidos solo una vez por offer_id (dedupe).
- [ ] Unit test por cada evento con su payload esperado.
- [ ] E2E de network intercept: navegar el flujo completo y verificar que los 8 eventos aparecen con shape correcta.

## Done summary

_To be filled by worker on completion._

Blocked:
reset manual

## Evidence

- Commits:
- Tests:
- PRs:
