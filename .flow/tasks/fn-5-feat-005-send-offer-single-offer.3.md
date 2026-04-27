---
satisfies: [R1, R2, R8]
---

## Description

Construir las cards de la timeline para los 4 lifecycle events. Cada card consume un `OfferSnapshot` del payload WS — **nunca** re-fetchea el aggregate. Las acciones Accept/Reject del lado creator wired a las mutations Orval con optimistic update + reconciliación cuando llega el WS.

**Size:** M
**Files:**

- `src/features/offers/components/OfferCardSent.tsx` (Pencil `YBAWY`)
- `src/features/offers/components/OfferCardReceived.tsx` (Pencil `qH0b8`)
- `src/features/offers/components/OfferAcceptedCardOut.tsx` (Pencil `71YM8`)
- `src/features/offers/components/OfferAcceptedCardIn.tsx` (Pencil `uaYfa`)
- `src/features/offers/components/OfferRejectedBubble.tsx` (Pencil `2QjwK` / `DbrwV`)
- `src/features/offers/components/OfferExpiredBubble.tsx` (Pencil `RME6N` / `k44Up`)
- `src/features/offers/hooks/useOfferActions.ts` (wrapper sobre `useAcceptOffer` + `useRejectOffer` con optimistic update y manejo de 409)

## Approach

- **Discriminated union por `event_type`**: cada renderer recibe un `snapshot` tipado (`OfferSnapshot | OfferAcceptedSnap | OfferRejectedSnap | OfferExpiredSnap`).
- **Lado del actor**: el switch que decide `Sent` vs `Received` (y `Out` vs `In`) vive en F.5 (ChatTimeline). Estos componentes son tontos: reciben snapshot ya resuelto.
- **Acciones**: `OfferCardReceived` muestra dos botones (Accept primary, Reject secondary). Disabled cuando `status !== 'sent'` o `expires_at < now()` (con `setInterval(1000)` o `useNow()` para reactividad — verificar si shared/hooks tiene uno).
- **Optimistic update**: al click Accept → `setQueryData(['conversations', conversationId, 'offers'], …)` actualizando el `current` a `accepted` + cambiar el message en cache para mostrar `OfferAcceptedCardIn`. Si falla (409 expired), revertir + toast "Offer expired".
- **Reconciliación WS**: cuando llegue `OfferAccepted`/`OfferRejected` por WS (manejado en F.5), el cache se reescribe con el snapshot final — el optimistic queda absorbido sin parpadeo (mismo `message.id` + content idempotent).
- **Bubbles** (rejected/expired) son texto + ícono, NO cards. Pencil distingue `Out` (lado actor) vs `In` (lado contraparte) — el lado lo resuelve F.5.
- A11y: `role="article"` en cards, botones reales `<button>`, status anunciado con `aria-label="Offer sent, total $X, expires in 3 days"`. Bubbles `role="status"`.

## Investigation targets

**Required**:

- `src/features/chat/components/MessageBubble.tsx` (asumir; verificar con grep) — patrón existente de timeline component
- `src/features/chat/components/ChatTimeline.tsx` (asumir) — para entender cómo se inyectan los renderers
- `src/shared/api/generated/model/OfferSnapshot.ts` (post F.1)
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4.1.2, §4.1.3 (errores tipados accept/reject), §4.2 (snapshots)
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §11 riesgo "race Accept vs Expire" — manejo de 409

**Optional**:

- `src/features/offers/components/OfferCardSent.tsx` solo después de tener Pencil abierto

## Design context

Pencil nodeIds (acceso via MCP `pencil`):

- Cards: `YBAWY` (sent out), `qH0b8` (received), `71YM8` (accepted out), `uaYfa` (accepted in)
- Bubbles: `2QjwK` (rejected out), `DbrwV` (rejected in), `RME6N` (expired out), `k44Up` (expired in)
- Pantallas full: `mRJ63` (timeline brand), `moaXA` (timeline creator)

Tokens: `var(--primary)` para Accept CTA, `var(--destructive)` para Reject. Radios `rounded-lg`. NO hardcodear colores.

## Key context

- **El render decisión sent vs received** se hace upstream (F.5). Estos componentes solo reciben `snapshot` + flags `viewerSide: 'actor'|'recipient'`.
- **Idempotencia frontend**: si llega un WS con el mismo `message.id` que un optimistic, NO duplicar — match por `message.id` antes de insertar (patrón ya usado en chat existente).
- **Race Accept vs Expire**: backend devuelve `409 offer_not_actionable` con `details.current_status`. Manejo: revertir optimistic + toast con el current_status real.

## Acceptance

- [ ] `OfferCardSent` rinde correctamente cada uno de los 4 status: `sent`, `accepted`, `rejected`, `expired` (badge cambia, content estable).
- [ ] `OfferCardReceived` ídem; acciones visibles solo en `sent` y con `expires_at > now()`.
- [ ] Click Accept → mutation con optimistic; al éxito 200, transiciona a `OfferAcceptedCardIn`. Al 409 expired, revierte + toast.
- [ ] Click Reject → ídem, transiciona a `OfferRejectedBubble`.
- [ ] `OfferRejectedBubble` y `OfferExpiredBubble` rinden lado `Out`/`In` correcto según `viewerSide` prop.
- [ ] Unit tests: `renders all 4 statuses`, `actions disabled when expired`, `actions disabled when status != sent`, `optimistic accept rolls back on 409`, `idempotent against duplicate WS event`.
- [ ] E2E "Creator accepts offer": Accept → ve `OfferAcceptedCardIn`. (E2E completo requiere F.5; este task deja el componente listo + test unit.)
- [ ] E2E "Creator rejects offer": ídem.
- [ ] Validación visual Pencil ≥95% contra los 8 nodeIds listados (light + dark).
- [ ] A11y: cada card `role="article"` con `aria-label` descriptivo; botones reales; bubbles `role="status"`.

## Done summary

Dead code eliminado correctamente. EventBubble reubicado a shared/ui con re-export limpio desde el path anterior. Sin issues.

## Evidence

- Commits:
- Tests:
- PRs:
