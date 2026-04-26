---
satisfies: [R4, R5, R9]
---

## Description

Extender `ChatTimeline` (FEAT-004) con cases nuevos en el switch sobre `payload.event_type` + `payload.snapshot.type`:

- `OfferSent` con `snapshot.type='bundle'` → `OfferCardBundle`.
- `OfferSent` con `snapshot.type='multistage'` → `OfferCardMultiStage`.
- `OfferAccepted`/`OfferRejected`/`OfferExpired` idem por `type`.
- `StageOpened` → `StageOpenedBubble`.
- `StageApproved` → placeholder con `console.warn` (FEAT-009 lo materializa).

Extender `conversationSubscriber` (WS subscriber, FEAT-004) con casos `StageOpened` y `StageApproved`: insert en cache de mensajes + invalidacion de `['conversations', conversationId, 'offers']`. Las ramas existentes (`OfferSent`, `OfferAccepted`, etc.) ya invalidan; verificar que no requieren cambio.

Crear `StageOpenedBubble` que consume `StageOpenedSnap`. Texto:

- Si `prev_stage_position == null`: "Stage {position}/{total}: {name} is now open" (apertura por accept).
- Si `prev_stage_position != null`: "Previous stage approved — Stage {position}: {name} is now open".

**Size:** M
**Files:**

- `src/features/offers/components/StageOpenedBubble.tsx` (nuevo)
- `src/features/offers/components/StageOpenedBubble.test.tsx` (nuevo)
- `src/features/chat/components/ChatTimeline.tsx` (modificar)
- `src/features/chat/components/ChatTimeline.test.tsx` (modificar)
- `src/features/chat/ws/conversationSubscriber.ts` (modificar)
- `src/features/chat/ws/conversationSubscriber.test.ts` (modificar)
- `src/features/chat/ws/messageHandlers.ts` (extender union si existe)

## Approach

- `StageOpenedBubble` reusa `EventBubble/Success/Out` (Pencil `scFrQ`) o `In` (`vKTEk`) segun lado (derivar lado de `actor_kind` o de la conversation context — patron heredado de FEAT-005 system events).
- El switch en `ChatTimeline` se vuelve discriminated union: TS narrow sobre `payload.event_type` y luego sobre `payload.snapshot.type` para offers.
- En el subscriber, invalidacion de query es idempotente (React Query dedupe), asi que un `OfferAccepted` + `StageOpened` que llegan back-to-back invalidan la misma query y solo se hace 1 fetch.

## Investigation targets

**Required:**

- `src/features/chat/components/ChatTimeline.tsx` — switch actual (FEAT-004 + FEAT-005)
- `src/features/chat/ws/conversationSubscriber.ts` — patron de WS subscriber
- `src/shared/api/generated/model/stageOpenedSnap.ts` — typing del payload
- `src/features/chat/components/EventBubble*.tsx` (FEAT-005) si existen — reusar

**Optional:**

- Pencil `scFrQ`, `vKTEk` — referencia visual de bubble

## Design context

- Bubble centrado horizontalmente, `bg-success/10 text-success` o equivalente segun token.
- Tipografia `text-sm`, padding generoso, `rounded-full`.
- Icon a la izquierda (check o flag).

## Acceptance

- [ ] `StageOpenedBubble` renderiza ambos textos (con/sin `prev_stage_position`).
- [ ] `ChatTimeline` rutea bundle/multistage snapshots a las cards correspondientes y `StageOpened` al bubble.
- [ ] `StageApproved` cae al placeholder con warn (no rompe).
- [ ] WS subscriber: en `StageOpened` invalida `['conversations', id, 'offers']` e inserta en cache de mensajes.
- [ ] Tests unit: `subscriber StageOpened insert + invalidate`, `ChatTimeline.routesBundleSnapshotToOfferCardBundle`, `ChatTimeline.routesMultiStageSnapshotToOfferCardMultiStage`, `ChatTimeline.routesStageOpenedToBubble`.
- [ ] A11y: `StageOpenedBubble` con `role="status"`.
- [ ] Validacion visual Pencil ≥95% contra bubble refs.

## Done summary

_To be filled by the worker._

## Evidence

_Logs, screenshots, or test output go here._
