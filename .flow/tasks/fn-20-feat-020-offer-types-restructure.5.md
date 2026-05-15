---
satisfies: [R6]
---

## Description

Re-mapeo de cards de chat system events a `OfferSnapshot v3`. Drop de `StageOpened`/`StageApproved` del `registry.ts`. `OfferCancelledCard` discrimina `phase` en copy. Agregar `PaymentMarkedCard` con shape v3.

**Size:** M
**Files:**
- `src/features/chat/system-events/OfferSentCard.tsx`
- `src/features/chat/system-events/OfferAcceptedCard.tsx`
- `src/features/chat/system-events/OfferRejectedCard.tsx`
- `src/features/chat/system-events/OfferExpiredCard.tsx`
- `src/features/chat/system-events/OfferCancelledCard.tsx`
- `src/features/chat/system-events/PaymentMarkedCard.tsx`
- `src/features/chat/system-events/registry.ts`
- Tests (cada card con fixture v3).

## Approach

- Tomar tipos `OfferSnapshotV3` y payload de `PaymentMarked v3` desde generated (o re-derivarlos si Orval no los expone — coordinar con backend si falta).
- Cada card renderiza desde el snapshot embebido en `Message.payload` — **no refetchear el agregado** (regla del CLAUDE.md: snapshots son autocontenidos).
- `OfferCancelledCard`: prop `phase: 'pre_accept' | 'post_accept'` discrimina copy:
  - `pre_accept`: "La marca canceló la oferta antes de la aceptación."
  - `post_accept`: "La marca canceló la oferta aceptada."
- `OfferAcceptedCard`, `OfferSentCard`: muestran `offer_mode`, `amount`, `tentative_publish_date`, `offer_deadline`, `platforms`.
- `PaymentMarkedCard`: monto + plataformas + count de deliverables.
- `registry.ts`: el discriminator de `payload.event_type` ahora acepta `{OfferSent, OfferAccepted, OfferRejected, OfferExpired, OfferCancelled, PaymentMarked}`. Borrar `StageOpened`, `StageApproved`.
- Timestamps con `<time dateTime={iso}>` formateados con `Intl.DateTimeFormat` hoisted a module scope.

## Design context

Cards inline en el chat, redondeadas, con badge de estado. Light + Dark. Copy en español. Buscar variante de "system event card" en el .pen si existe.

## Investigation targets

**Required:**
- `src/features/chat/system-events/registry.ts` — discriminator actual.
- Cards existentes con shape v2 — qué borrar/migrar.
- `src/shared/ws/useWebSocket.ts` — `DomainEventEnvelope<T>` (no debería cambiar shape; sólo el `payload.event_type` enum).

**Optional:**
- `src/features/chat/` componentes de mensaje genérico.

## Acceptance

- [ ] Cada card renderiza fixture v3 sin errores TS.
- [ ] Test unit por card con fixture v3 (al menos 1 happy path + 1 edge: missing optional field).
- [ ] `OfferCancelledCard` test: `phase='pre_accept'` muestra copy A; `phase='post_accept'` muestra copy B.
- [ ] `registry.ts`: `grep -E "StageOpened|StageApproved"` retorna 0.
- [ ] `Intl.DateTimeFormat` hoisted (module scope).
- [ ] A11y: `role="article"`, `<time dateTime>` con ISO.
- [ ] Sin `new Date()` ni `Date.now()` en JSX.
- [ ] Snapshots renderizan **sin refetchear** el agregado.

## Done summary

_To be filled at task completion._

## Evidence

_To be filled at task completion._
