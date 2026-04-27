---
satisfies: [R5, R6, R10]
---

## Description

`<TypingIndicator/>` debajo de la timeline (animado, oculto por default) y `<PresenceBadge/>` en el header. Stores Zustand efímeros `typingStore` y `presenceStore`. Composer envía `typing.ping` debounced 1s mientras el usuario escribe. Counterpart con `is_active=false` se muestra como `disconnected` (estado permanente) y deshabilita el composer.

**Size:** M
**Files:**

- `src/features/chat/components/TypingIndicator.tsx`
- `src/features/chat/components/PresenceBadge.tsx`
- `src/features/chat/stores/presenceStore.ts`
- `src/features/chat/stores/typingStore.ts`
- `src/features/chat/hooks/useTypingPing.ts`
- `src/features/chat/components/__tests__/PresenceBadge.test.tsx`
- `src/features/chat/components/__tests__/TypingIndicator.test.tsx`
- `src/features/chat/stores/__tests__/typingStore.test.ts`
- E2E `chat-presence-typing.spec.ts`

## Approach

- `presenceStore`: `Record<accountId, { state: 'online'|'offline'|'disconnected'; updated_at: number }>`. Setter `setPresence(id, state)`. Selector `usePresence(id)`. Inicializar al montar `<ConversationView/>` con `conversationDetail.presence.state` y luego reaccionar al WS `presence.updated` (cableado en F.2 listeners).
- `typingStore`: `Record<conversationId, Set<accountId>>`. Setters `setTyping(conv, account)`, `clearTyping(conv, account)`. Reacciona a `typing.started`/`typing.stopped` del WS.
- `<PresenceBadge/>` lee `usePresence(counterpartAccountId)` y pinta dot:
  - `online` → token `--success`
  - `offline` → token `--muted-foreground`
  - `disconnected` → token `--destructive` (o equivalente "permanent off"), permanente, no reacciona a updates posteriores.
- `<TypingIndicator/>` lee del `typingStore` filtrado por `conversationId` y renderiza animación si hay >0 actores. Debe ocultarse al recibir `message.created` del mismo actor (handled del lado server, pero el cliente también puede limpiar inmediatamente al insertar el bubble).
- `useTypingPing()` se invoca desde `<MessageComposer/>` (F.5 expone hook de "actividad de escritura"): cada cambio del input dispara el ping debounced 1s con `{type:'typing.ping', conversation_id}`. NO se envía mientras el usuario está quieto. `typing.stop` explícito es opcional (TTL Redis cubre el caso).
- Composer disabled cuando counterpart `is_active=false`: tooltip "no se puede enviar". Esta task expone el flag desde `presenceStore` o lee directo de `useConversationDetailQuery`.

## Investigation targets

**Required:**

- Solution doc §4.1.4 (`presence.state`, `is_active`, `can_send`)
- Solution doc §4.2.4 (typing) y §4.2.5 (presence.updated)
- Solution doc §7.6 (estado cliente Zustand)
- `src/features/chat/ws/useChatWsListeners.ts` (F.2) — donde se cablean los handlers; este task implementa los efectos
- `src/features/chat/components/MessageComposer.tsx` (F.5) — para integrar `useTypingPing`

## Design context

Frame del header con dot junto al avatar (frames `moaXA`/`mRJ63`). Animación typing: 3 dots con bounce, fill `--muted-foreground`, corner radius pill.

`disconnected` tiene tratamiento visual distinto (tooltip explicativo "cuenta inactiva"); no es solo "offline".

## Key context

- "Is typing" del solution doc: el server YA filtra para que solo se entregue al counterpart suscripto al topic. El cliente NO debe filtrar de nuevo por sí mismo.
- Presence brand-side: el server consolida `IsBrandOnline(workspace_id)` (R-6 en solution doc); el cliente solo recibe el evento agregado, no necesita lógica especial.
- Stores efímeros: NO persistir en localStorage. Se reinicializan al recargar.

## Acceptance

- [ ] A escribe → B ve `<TypingIndicator/>` en <1s; A para → desaparece en <6s (TTL Redis backend).
- [ ] A envía mensaje → typing del A se limpia inmediatamente en B (sin esperar TTL).
- [ ] A se conecta → B ve `<PresenceBadge state="online"/>` en <30s (R-6 spec).
- [ ] Counterpart `is_active=false` → badge `disconnected` permanente + composer disabled con tooltip.
- [ ] `useTypingPing` debounced 1s mientras escribe; sin pings cuando está quieto.
- [ ] Validación visual ≥95% del header con dot contra frames del `.pen`.
- [ ] Stores Zustand: tests unit cubren setters/selectors + edge case (clear de actor que no estaba).

## Done summary
Los tres cambios del dev son correctos. presenceStore elimina la guardia que impedía transiciones desde disconnected — semánticamente correcto porque disconnected es estado de conexión, no de cuenta. useTypingPing implementa throttle leading limpio: dispara en primer keystroke, bloquea durante DEBOUNCE_MS, sendRef evita stale closure. Test de presenceStore actualizado coherentemente. El resto de la implementación (PresenceBadge, TypingIndicator, typingStore, wiring en ConversationView) no presenta issues: tipos WS inline son subset correcto de los tipos reales, canSend combina can_send && is_active correctamente, clearTyping sobre author_account_id es type-safe (string no nullable en MessageCreatedPayload), TooltipProvider en ConversationHeader scope correcto.
## Evidence
- Commits:
- Tests:
- PRs: