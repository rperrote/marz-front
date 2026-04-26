# ws

WebSocket + DomainEventEnvelope. Cargar cuando trabajes con eventos en tiempo real (chat, notificaciones, system events).

## Hook principal

`src/shared/ws/useWebSocket.ts`. Conecta a `VITE_WS_URL` y dispatchea eventos por `event_type`.

```ts
const { lastEvent, send, connected } = useWebSocket<MessageCreatedPayload>({
  eventType: 'message.created',
  enabled: workspaceId != null,
})
```

## Contrato del envelope

`DomainEventEnvelope<T>` matches `shared.domain_events` del backend. Ver `marz-docs/architecture/event-catalog.md` para la lista de eventos.

```ts
type DomainEventEnvelope<T> = {
  event_id: string
  event_type: string
  occurred_at: string
  payload: T
}
```

## System events son snapshots

Eventos `system_event` traen un snapshot **autocontenido** en `payload`. El frontend renderiza la card desde el payload, **nunca re-fetchea el aggregate original**.

Esto es importante: si el aggregate cambia después, se emite **otro evento** con un nuevo snapshot. El primer evento queda inmutable.

## Estado actual

El hook existe pero `enabled: false` por default. Cuando se enchufe al backend, se prende desde el provider raíz (`__root.tsx` o un nivel debajo).

Si necesitás reconexión con backoff, cambiar a `partysocket` manteniendo la misma API del hook (no romper el contrato).

## Reglas

- **No re-fetchear** después de recibir un evento `system_event`. Renderizar el snapshot.
- **Sí refetchear** queries de React Query relacionadas (ej. `invalidateQueries` para el feed) tras un evento de aggregate changed.
- **No mantener estado del WS en Zustand**. El hook es la fuente. Si necesitás dispatch a múltiples consumidores, agregar un emitter dentro del hook.
