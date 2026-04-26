# fn-2.11 F.8 — Analytics client-side + leave-guard + beforeunload

## Description

# F.8 — Analytics client-side + leave-guard + beforeunload

## Por qué

Necesario para tracking del funnel (`brief_builder_started`, `brief_builder_abandoned`) y para evitar pérdida accidental del wizard.

## Scope

### Analytics

`src/features/campaigns/brief-builder/analytics/brief-builder-analytics.ts`:

```ts
trackBriefBuilderStarted({ workspace_id, processing_token }) // al entrar a P2
trackBriefBuilderAbandoned({ phase, processing_token }) // en pagehide / navegación fuera sin confirmar
```

Implementación:

- POST a `/api/v1/analytics/events` (endpoint genérico backend).
- En `pagehide` usar `navigator.sendBeacon` (no `fetch` — el browser puede cortar).
- En navegación in-app usar `customFetch` normal.

### Leave-guard (in-app)

En `BriefBuilderWizard`:

- `useBlocker({ shouldBlockFn: () => isDirty })` de TanStack Router.
- Modal de confirmación: "¿Salir? Vas a perder el progreso del brief". Si confirma → `trackBriefBuilderAbandoned` + `reset()` + navegar.
- `isDirty = currentPhase >= 1 && campaignId === null` (mientras no se confirmó).

### `beforeunload` / `pagehide`

```ts
useEffect(() => {
  if (!isDirty) return
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = '' // browser muestra prompt genérico (no se puede customizar)
  }
  const pagehide = () => {
    navigator.sendBeacon('/api/v1/analytics/events', JSON.stringify({
      event: 'brief_builder_abandoned',
      ...
    }))
  }
  window.addEventListener('beforeunload', handler)
  window.addEventListener('pagehide', pagehide)
  return () => {
    window.removeEventListener('beforeunload', handler)
    window.removeEventListener('pagehide', pagehide)
  }
}, [isDirty])
```

### Cleanup post-confirmación

En P4 onsuccess: marcar `campaignId` en store. `isDirty` pasa a `false`. Leave-guards se remueven (effect cleanup). Al navegar fuera, `reset()` del store en `useEffect cleanup` del `BriefBuilderWizard`.

### Tests

- `brief-builder-analytics.test.ts`:
  - `trackBriefBuilderStarted` → POST con payload.
  - `trackBriefBuilderAbandoned` con `sendBeacon` mockeado.
- Integration en `BriefBuilderWizard.test.tsx`:
  - Modal de confirmación al intentar navegar dirty.
  - Sin modal una vez `campaignId` está seteado.

## Notas

- `sendBeacon` no soporta JSON custom Content-Type — mandar `Blob` con `application/json`.
- `beforeunload` text es ignorado por browsers modernos; solo dispara prompt genérico.
- El backend del `/analytics/events` es fuera de scope de FEAT-002 frontend; asumir que existe (o stub).

## Acceptance

- `trackBriefBuilderStarted` se llama al entrar a P2 con workspace + token.
- `trackBriefBuilderAbandoned` se dispara en (a) navegación in-app sin confirmar, (b) `pagehide` via sendBeacon.
- `useBlocker` muestra modal de confirmación cuando dirty.
- Una vez `campaignId` seteado, leave-guards desactivados.
- `reset()` del store al unmount del wizard.
- Tests: analytics functions (2+), wizard leave-guard integration (2+).
- `sendBeacon` mockeado correctamente en tests.

## Done summary

useLeaveGuard sin enableBeforeUnload elimina el doble registro correctamente. Analytics con beacon/fetch separados es la implementación correcta. Tests cubren los casos relevantes con mocks apropiados. Sin issues funcionales.

## Evidence

- Commits:
- Tests:
- PRs:
