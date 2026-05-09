---
satisfies: [R5]
---

## Description

Renderizar inline actions desde `inline_actions[]` del response. El frontend NO conoce qué actions existen — solo despacha cada `inline_actions[i]` al endpoint dueño según su `type`/`actor`/`path`. Tres flujos: reply (textarea + send), offer accept/reject (botones + reason opcional para reject), application accept/reject (idem). Todas usan mutations existentes; success cierra popover y invalida `['inbox']`.

**Size:** M
**Files:**

- `src/features/inbox/InboxInlineActionPopover.tsx` (nuevo)
- `src/features/inbox/InboxItemRow.tsx` (modificado: monta popover según `inline_actions`)

## Approach

- `InboxInlineActionPopover` recibe `inline_actions: InboxInlineAction[]` y un `itemId`. Renderiza UI según los `type` presentes:
  - `brand_reply_message` / `creator_reply_message`: textarea (1..4096 chars) + botón Send. Genera `client_message_id` UUID v7. Llama a `useSendMessageMutation` ya existente con `conversation_id` extraído del `path` del action.
  - `creator_accept_offer` / `creator_reject_offer`: botones Accept/Decline. Reject opcionalmente abre input de `reason`. Llama a la mutation generada de offer accept/reject.
  - `brand_accept_application` / `brand_reject_application`: idem con application accept/reject.
- Un `Idempotency-Key` (UUID v7) por click. No reusar entre clicks.
- 409 (race con otra pantalla): cerrar popover, invalidar `['inbox']`, mostrar toast neutro "El estado cambió, refrescamos".
- Validación inline: reply 1..4096 chars; submit disabled si vacío; spinner en botón mientras pendiente.
- Cerrar popover en success.
- No renderizar acciones que no estén en `inline_actions[]` (no hay genéricas).

## Investigation targets

**Required:**

- `src/features/chat/hooks/useSendMessageMutation.ts` (o equivalente) — patrón de send message + `client_message_id`
- `src/features/offers/hooks/` — mutation generada de accept/reject
- `src/features/discovery/` o equivalente para applications accept/reject
- `src/components/ui/popover.tsx` (shadcn) — base del popover
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §4.1 (tipos `InboxInlineAction`) y §7.4 task F.5

## Acceptance

- [ ] Reply: textarea valida 1..4096 chars; success cierra popover y refetcha Inbox.
- [ ] Offer accept/reject: ambos botones funcionan; reject permite reason opcional.
- [ ] Application accept/reject (admin brand): ambos botones funcionan.
- [ ] Cada click genera nuevo `Idempotency-Key` UUID v7.
- [ ] 409 cierra popover + invalida query + toast neutro; sin error rojo.
- [ ] Mutations en flight muestran spinner en botón; resto del UI no se bloquea.
- [ ] Frontend NO renderiza actions que no estén en `inline_actions[]`.
- [ ] Unit tests: reply send, offer accept, race 409 handling.

## Done summary
Correcciones aplicadas: ApplicationActionControl sin dead state de reason, test de reply 409 con cobertura completa.
## Evidence
- Commits:
- Tests:
- PRs: