---
satisfies: [R4, R8, R9]
---

## Description

Crear el renderer del system_event `PaymentMarked` para la timeline del chat. Renderea dos variantes según el viewer:

- `viewer.kind='brand'` → `Component/PaymentCard/Sent` (74e7n) — saliente.
- `viewer.kind='creator'` → `Component/PaymentCard` (RoLTd) — entrante.

Registrar el componente en el factory de system_events del chat (junto a `LinkApprovedCard`, `DraftApprovedCard`, etc.). Agregar el branch `event_type='PaymentMarked'` al handler de WS para invalidar las queries relevantes al recibir un frame `MessageSent`.

**Size:** M
**Files:**

- `src/features/chat/components/systemEvents/PaymentMarkedCard.tsx` (nuevo)
- `src/features/chat/components/systemEvents/PaymentMarkedCard.test.tsx` (nuevo)
- `src/features/chat/components/systemEvents/index.ts` o factory equivalente (registro)
- `src/shared/ws/useWebSocket.ts` o handler equivalente (invalidations)

## Approach

- Modelar el componente sobre `LinkApprovedCard.tsx` (FEAT-009) que ya implementa el patrón viewer-aware saliente/entrante.
- Renderear desde el `payload` del system_event (snapshot autocontenido — no hacer fetch del aggregate).
- Invalidations en el WS handler (TanStack Query):
  - `['deliverables', payload.deliverable_id]`
  - `['conversations', conversation_id, 'messages']`
  - `['conversations', conversation_id, 'context-panel']`
- No re-fetchear el message — el `MessageSent` ya viene con el payload.

## Investigation targets

**Required**:

- `src/features/chat/components/systemEvents/LinkApprovedCard.tsx` (FEAT-009) — patrón a seguir.
- `src/features/chat/components/systemEvents/index.ts` — factory de registro.
- `src/shared/ws/useWebSocket.ts` — handler WS y patrón de invalidations.
- `src/shared/api/generated/model/domainEventEnvelope.ts` — envelope tipado.

**Optional**:

- `marz-design/marzv2.pen` nodos `q3PPP`, `M5XU3` (saliente brand light/dark), `8gs3F`, `N5HOp` (entrante creator light/dark), `RoLTd`, `74e7n` (los organismos PaymentCard reusados) — Pencil MCP.

## Design context

- **Components:** Reusar las molecules/organisms ya diseñadas: `Component/PaymentCard` para entrante y `Component/PaymentCard/Sent` para saliente. No crear cards custom.
- **Colors:** Tokens `--primary` para destacar monto, neutrales para metadata. Sin hardcodear.
- **Layout:** Cards redondeadas (radius generoso del design system). Light + dark.

Full design system: `marz-design/marzv2.pen` (Pencil MCP) + `src/styles.css`.

## Acceptance

- [ ] Componente renderea variante saliente cuando `viewer.kind='brand'` (sin importar el actor — todos los brand members ven la saliente como define la spec).
- [ ] Variante entrante cuando `viewer.kind='creator'`.
- [ ] Datos del snapshot (amount, currency, deliverable_display_label, declared_at) se renderean directamente desde el payload, sin fetch.
- [ ] Registrado en el factory de system_events: un `Message` con `event_type='PaymentMarked'` se renderea como `PaymentMarkedCard`.
- [ ] WS handler: al recibir `MessageSent` con `payload.event_type='PaymentMarked'` y `conversation_id` matchea el activo, dispara las 3 invalidations enumeradas.
- [ ] Snapshot tests (Vitest) para regresión visual saliente/entrante.
- [ ] Validación visual Pencil MCP ≥95% match contra `q3PPP`/`M5XU3`/`8gs3F`/`N5HOp`, light + dark.
- [ ] Test unitario: invalidations no se disparan para frames de otra conversation.

## Done summary
Todos los issues del round anterior están resueltos: BC corregido (PaymentCard → shared/ui/, formatOfferAmount → shared/utils/), Lingui en todos los strings user-facing, font-sizes con utilities (text-xs), defaultNote revertido, lógica del handler corregida (cache append independiente de las invalidaciones), test axe y test de cache para conv-other agregados.
## Evidence
- Commits:
- Tests:
- PRs: