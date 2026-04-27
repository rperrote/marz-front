---
satisfies: [R8]
---

## Description

Emitir 5 eventos analíticos al endpoint existente `POST /api/v1/analytics/events` (creado en FEAT-002): `conversation_opened`, `message_sent`, `message_received_live`, `history_page_loaded`, `presence_state_changed`. Fire-and-forget, no bloquea UX ni propaga errores.

**Size:** S
**Files:**

- `src/features/chat/analytics/track.ts`
- `src/features/chat/analytics/__tests__/track.test.ts`
- Hooks o calls integrados en F.3 (`conversation_opened`), F.4 (`history_page_loaded`), F.5 (`message_sent`), F.7 (`presence_state_changed`), y handler de F.2/F.5 (`message_received_live`).

## Approach

- Crear wrapper tipado `trackChatEvent(name, payload)` que delega al cliente analytics existente del repo (FEAT-002 lo dejó listo) o al endpoint REST directo.
- Definir el shape exacto de payloads de los 5 eventos en TypeScript:
  - `conversation_opened`: `{ conversation_id, counterpart_kind, has_unread }`
  - `message_sent`: `{ conversation_id, length_bucket, idempotent_replay }`
  - `message_received_live`: `{ conversation_id, latency_ms_estimate }` (delta entre `created_at` server y `Date.now()` cliente)
  - `history_page_loaded`: `{ conversation_id, page_index, items_count }`
  - `presence_state_changed`: `{ conversation_id, counterpart_account_id, state }`
- Fire-and-forget: catch + swallow errors silenciosos, NO romper la UX si el endpoint falla.
- Llamar desde los puntos de integración correspondientes (no inflar lógica del feature: helpers chiquitos).

## Investigation targets

**Required:**

- Cliente analytics de FEAT-002 — ubicación + API
- Solution doc §2 (Analytics fire-and-forget al sink existente)
- Spec `02-spec.md` §"5 eventos analíticos" para el shape canónico

## Key context

- `length_bucket` discretizado para no leakear contenido: `<50`, `50-200`, `200-500`, `500-2000`, `2000+`.
- NUNCA enviar `text_content` al sink (PII potential, alineado con backend logging).
- Evitar duplicados: `message_sent` solo en el primer envío exitoso (no en idempotent_replay sin escritura nueva — el flag distingue ambos casos).

## Acceptance

- [ ] Wrapper `trackChatEvent` con tipos exhaustivos para los 5 eventos.
- [ ] Unit tests: cada evento se dispara con shape esperado.
- [ ] Errores del endpoint NO propagan (test con fetch mock que falla).
- [ ] Eventos integrados en F.3/F.4/F.5/F.7/F.2 (calls añadidos sin alterar lógica de los componentes).
- [ ] `text_content` nunca aparece en payloads (test de regresión).

## Done summary
Race condition fix en conversation_opened es correcto: React 18+ garantiza orden de effects dentro del mismo flush, unreadCountRef se estabiliza antes del tracking. Los demás eventos (message_sent, message_received_live, history_page_loaded, presence_state_changed) están correctamente integrados sin side effects sobre UX. track.ts tipado y fire-and-forget bien documentado.
## Evidence
- Commits:
- Tests:
- PRs: