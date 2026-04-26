---
satisfies: [R2, R3, R4]
---

## Description

Wirear los 4 nuevos `event_type` (`OfferSent`, `OfferAccepted`, `OfferRejected`, `OfferExpired`) al `ChatTimeline` y al WS subscriber. El subscriber existente (FEAT-004) ya maneja `chat.message.created`; este task extiende el switch para:

1. Renderizar el componente correcto de F.3 según `event_type` + `viewerSide`.
2. Llamar `queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'offers'] })` para refrescar el panel lateral (F.4).

**Size:** M
**Files:**

- `src/features/chat/components/ChatTimeline.tsx` (modificación: extender switch de event_type)
- `src/features/chat/ws/conversationSubscriber.ts` (modificación: agregar invalidación de query offers)
- `src/features/chat/ws/messageHandlers.ts` (modificación: discriminated union sobre `payload.event_type`)
- `src/features/offers/components/OfferTimelineEntry.tsx` (nuevo: dispatcher que decide sent/received/out/in según viewer)

## Approach

- **Discriminated union**: definir tipo `OfferLifecycleEvent` que abarque los 4 `event_type` con sus snapshots correspondientes (importados de Orval).
- **OfferTimelineEntry**: recibe `message: ChatMessage`, resuelve `viewerSide` mirando `currentAccount.id` vs `conversation.creator_account_id`, y dispatcha a `OfferCardSent | OfferCardReceived | OfferAcceptedCardOut | OfferAcceptedCardIn | OfferRejectedBubble | OfferExpiredBubble`. Pasa `snapshot = message.payload.snapshot`.
- **ChatTimeline switch**: el switch existente sobre `event_type` agrega los 4 cases delegando a `OfferTimelineEntry`. Cero lógica adicional inline.
- **WS subscriber**: en el handler de `chat.message.created`, después del INSERT al cache de mensajes, si `event_type ∈ {OfferSent, OfferAccepted, OfferRejected, OfferExpired}` → `queryClient.invalidateQueries({ queryKey: ['conversations', payload.conversation_id, 'offers'] })`.
- **Idempotencia**: el subscriber existente ya deduplica por `message.id`. NO re-implementar.
- **Race POST 201 vs WS push**: el handler de `useCreateSingleOffer.onSuccess` NO inserta el message en cache (lo deja al WS). Si el response llega antes que el WS, el cache se popula igual cuando llegue el WS (con mismo `message.id`, no se duplica). Documentar este flujo en comentario JSDoc del hook si hace falta.

## Investigation targets

**Required**:

- `src/features/chat/ws/conversationSubscriber.ts` (o equivalente existente de FEAT-004) — entender estructura del switch
- `src/features/chat/components/ChatTimeline.tsx` — switch existente sobre `event_type`
- `src/features/offers/components/Offer*.tsx` (creados en F.3) — props esperadas
- `src/shared/ws/useWebSocket.ts` — `DomainEventEnvelope<T>` typing
- `src/features/auth/store/authStore.ts` (asumir; verificar) — para resolver `currentAccount.id`

**Optional**:

- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4.2 (envelope + payloads)
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §11 riesgo "WS antes del POST"

## Key context

- **Single source of truth**: el snapshot del WS es lo único que rinde. NO hacer `useGetOffer(id)` desde la timeline.
- **Test helper para expire**: para el E2E "expire while viewing" se necesita o bien (a) un endpoint interno de test del backend que dispare `OfferExpired` manualmente, o (b) mockear el WS en Playwright para inyectar el evento. Coordinar con backend/QA. Si no hay (a), implementar (b) en este task.
- **Query key exacto**: `['conversations', conversationId, 'offers']` — debe matchear bit-a-bit con F.4. Si F.4 cambia el shape, sincronizar.

## Acceptance

- [ ] Switch de `ChatTimeline` rinde el componente correcto para cada uno de los 4 `event_type`, en ambos lados (brand y creator).
- [ ] WS subscriber invalida `['conversations', conversationId, 'offers']` cuando llega cualquiera de los 4 events.
- [ ] Mismo `message.id` llegando dos veces NO duplica entradas en la timeline (regresión del existing dedupe).
- [ ] Unit test del subscriber con cada `event_type` llamando al handler correcto.
- [ ] Unit test que verifica `queryClient.invalidateQueries` se llama con la key correcta.
- [ ] E2E "Offer lifecycle live update": brand envía oferta → ambos ven `OfferCardSent/Received` aparecer vía WS sin refresh.
- [ ] E2E "Offer expires while creator viewing": triggerear `OfferExpired` (vía test helper o WS mock) → `OfferExpiredBubble` aparece in-place + `CurrentOfferBlock` se vacía.
- [ ] A11y: bubbles `role="status"` para anunciar a screen readers cambios de estado.

## Done summary

_To be filled by worker on completion._

## Evidence

_Links to commits, test runs, screenshots, etc._
