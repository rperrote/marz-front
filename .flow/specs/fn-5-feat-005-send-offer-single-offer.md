# FEAT-005: Send Offer (single) + Offer Lifecycle — Frontend

## Overview

Frontend de la feature **Offer (single)**: una `brand owner` envía una oferta desde un sidesheet montado sobre la `Conversation` activa, el `creator` la acepta/rechaza desde la timeline, y el sistema rinde estados de `sent | accepted | rejected | expired` como cards/bubbles in-place. El panel lateral del Workspace muestra `Current Offer` + `Offers archive`.

Toda la integración backend (endpoints, eventos, jobs) vive en `marz-api` (FEAT-005 backend). Este epic cubre **únicamente** el frontend en `marz-front`. La frontera dura está en el OpenAPI: una vez que B.5 está en dev, F.1 corre `pnpm api:sync` y a partir de ahí avanza en paralelo.

**Fuente de verdad**: `marz-docs/features/FEAT-005-offer-single/03-solution.md` §7 (plan de ejecución frontend), §4 (contratos), §4.4 (tipos compartidos), §4.2 (eventos WS).

## Scope

**In scope (frontend)**:

- Sidesheet `SendOfferSidesheet` con TanStack Form + Zod, integración con `useCreateSingleOffer`.
- Cards de la timeline: `OfferCardSent`, `OfferCardReceived`, `OfferAcceptedCardOut/In`, `OfferRejectedBubble`, `OfferExpiredBubble`.
- Acciones Accept/Reject del creator wireadas a mutations Orval con optimistic update + reconciliación vía WS.
- Panel lateral derecho del Workspace: `CurrentOfferBlock` + `OffersArchiveBlock`.
- Renderers de los 4 nuevos `event_type` (`OfferSent`, `OfferAccepted`, `OfferRejected`, `OfferExpired`) en `ChatTimeline` + invalidación de query del panel desde el subscriber WS.
- Botón "Send Offer" en `ConversationHeaderActions` con gating por `kind=brand` + `role=owner` + `hasActiveCampaign`.
- Analytics client-side (8 eventos) vía `POST /api/v1/analytics/events`.

**Out of scope**:

- Backend (lo cubre FEAT-005 en `marz-api`).
- Notifications projection (action item / waiting item) — diferido por producto.
- Drafts persistidos del sidesheet — descartar al cerrar es intencional.
- Endpoint `cancel`, edición post-envío, configurabilidad de TTL — fuera por spec.

## Approach

- **Espejo de bounded context**: todo nuevo bajo `src/features/offers/` (components, hooks, store, analytics). El switch de event_type vive en `src/features/chat/` (modificación local). Cero imports cross-context — si algo pinta cruzado, va a `shared/`.
- **Cliente API generado por Orval**: `pnpm api:sync` regenera hooks + Zod desde el OpenAPI de dev (committed). No se mockea con MSW (directiva: backend real desde el inicio).
- **Snapshot first**: las cards renderizan desde `payload.snapshot` del envelope `chat.message.created`, **nunca** re-fetcheando el aggregate. Patrón ya usado por FEAT-004.
- **TanStack Query + WS invalidation**: el panel lateral consume `useGetConversationOffers`; el subscriber WS llama `invalidateQueries(['conversations', conversationId, 'offers'])` cuando llega cualquiera de los 4 events.
- **TanStack Form + Zod**: el form del sidesheet usa el schema `createSingleOfferRequestSchema` generado, sin `react-hook-form`.
- **Pencil-driven UI**: cada componente nuevo referencia un nodeId de `marzv2.pen` (listados en spec §7.2). Validación visual ≥95% como criterio de aceptación.
- **Estado UI efímero en Zustand**: `sendOfferSheetStore` solo controla `isOpen` + `conversationId`. Sin persistencia.

## Quick commands

```bash
# Regenerar cliente API después de B.5 deployado en dev
pnpm api:sync

# Tipos + lint
pnpm typecheck
pnpm lint

# Tests
pnpm test src/features/offers
pnpm test:e2e -- offers

# Dev server
pnpm dev
```

## Acceptance

- **R1:** Una `brand owner` con campaign activa puede abrir `SendOfferSidesheet`, completar form (campaign, platform/format, amount, deadline, opcional speed bonus), enviar, y ver aparecer un `OfferCardSent` en la timeline + un `Pending` block en el panel lateral, en ≤2s post-201.
- **R2:** El creator destinatario ve el `OfferCardReceived` en su timeline (vía WS), puede clickear `Accept` o `Reject`, y la card transiciona a `OfferAcceptedCardIn` o `OfferRejectedBubble` con optimistic update + reconciliación cuando llega el WS event correspondiente.
- **R3:** El panel lateral del Workspace (brand y creator) muestra correctamente `Current Offer` + `Offers archive` (paginado, colapsado por defecto), con badge `Pending` para ofertas anteriores en `sent` y reactividad a cambios de status vía invalidación de query desde el WS subscriber.
- **R4:** Cuando llega un evento WS `chat.message.created` con `event_type ∈ {OfferSent, OfferAccepted, OfferRejected, OfferExpired}`, la timeline rinde el componente correcto (card o bubble) y el panel se actualiza in-place sin refresh.
- **R5:** El botón "Send Offer" en `ConversationHeaderActions` aparece solo para `kind=brand` + `role=owner`, y se muestra `disabled` con tooltip "No active campaigns" cuando no hay campaign activa en el workspace.
- **R6:** Validaciones del form del sidesheet bloquean envío cuando: deadline ≤ today, amount ≤ 0, early_deadline ≥ deadline, bonus_amount ≤ 0. Excederse del budget de la campaign muestra warning inline pero **no** bloquea.
- **R7:** Los 8 eventos de analytics listados en spec se emiten con payload spec-compliant (sin `amount` exacto ni `campaign_name` — usar `amount_bucket`).
- **R8:** Validación visual Pencil ≥95% de cada componente nuevo contra los nodeIds referenciados en spec §7.2 (light + dark). A11y: focus trap en sidesheet, ESC cierra, `aria-live` para errores, `role="article"` en cards, `role="status"` en bubbles.

## Early proof point

Task `fn-5-feat-005-send-offer-single-offer.2` (`SendOfferSidesheet` + form) valida la fundación: form generado por Orval/Zod, mutation funciona end-to-end contra el backend B.5 en dev, y aparece el primer `OfferCardSent` (placeholder en F.3) vía el WS event. Si esto falla, re-evaluar:

1. Si Orval generó los tipos correctamente (volver a F.1).
2. Si el envelope WS está poblando `payload.snapshot` con la shape esperada (es problema backend, no frontend — bloquear epic hasta que dev lo confirme).

Antes de seguir con cards/panel/bubbles, asegurarse que el envío + el evento `OfferSent` recorren el sistema completo.

## Requirement coverage

| Req | Description                                          | Task(s)                                             | Gap justification                       |
| --- | ---------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| R1  | Brand envía oferta y ve la card aparecer             | fn-5-feat-005-send-offer-single-offer.2, .3, .6     | —                                       |
| R2  | Creator acepta/rechaza con optimistic + reconcile WS | fn-5-feat-005-send-offer-single-offer.3, .5         | —                                       |
| R3  | Panel lateral con Current + Archive                  | fn-5-feat-005-send-offer-single-offer.4, .5         | —                                       |
| R4  | WS subscriber rinde 4 event types e invalida panel   | fn-5-feat-005-send-offer-single-offer.5             | —                                       |
| R5  | Botón Send Offer con gating                          | fn-5-feat-005-send-offer-single-offer.6             | —                                       |
| R6  | Validaciones del form (bloqueantes vs warnings)      | fn-5-feat-005-send-offer-single-offer.2             | —                                       |
| R7  | Analytics events (8) con payload spec-compliant      | fn-5-feat-005-send-offer-single-offer.7             | —                                       |
| R8  | Pencil ≥95% + a11y por componente                    | fn-5-feat-005-send-offer-single-offer.2, .3, .4, .5 | Cubierto distribuido en cada task de UI |

## References

- Solution doc: `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4 (contratos), §7 (plan frontend)
- Spec de producto: `../marz-docs/features/FEAT-005-offer-single/02-spec.md`
- Repo conventions: `marz-front/CLAUDE.md` §Cliente API, §WebSocket, §Tokens, §Path aliases
- Bounded contexts: `../marz-docs/architecture/bounded-contexts.md` §Offers, §Chat
- Event catalog: `../marz-docs/architecture/event-catalog.md` §Offers
- Componentes Pencil (referencia visual, abrir vía MCP `pencil`): nodeIds listados en spec §7.2
- Epic relacionado (frontend): `fn-3-feat-003-workspace-shell-conversation` (shell del Workspace donde se monta esto)
- Epic relacionado (frontend): `fn-4-feat-004-chat-messaging-text-frontend` (timeline + WS subscriber existente)
