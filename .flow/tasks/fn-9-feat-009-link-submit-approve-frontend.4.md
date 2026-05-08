---
satisfies: [R1, R2, R3, R4, R9, R10]
---

## Description

Tres cards de `system_event` para timeline del chat: `LinkSubmittedCard`, `LinkApprovedCard`, `LinkChangesRequestedCard`. Render condicional brand vs creator. Incluye registro en el router `SystemEventCard` (3 ramas nuevas en el switch por `event_type`).

`LinkApprovedCard` no tiene frame dedicado en el `.pen` todavía → fallback `EventBubble/Success` (`scFrQ`/`vKTEk`) inline; documentar el TODO en JSDoc del componente.

`LinkChangesRequestedCard` reusa `RequestChangesCard` (`BIuqZ`) con prop `target='link'` (la extensión de `RequestChangesCard` se hace en esta task si no es trivial; si requiere tocar muchos consumers, considerar dividir).

**Size:** M
**Files:**

- `src/features/deliverables/components/LinkSubmittedCard.tsx` (nuevo)
- `src/features/deliverables/components/LinkApprovedCard.tsx` (nuevo)
- `src/features/deliverables/components/LinkChangesRequestedCard.tsx` (nuevo, wrapper de `RequestChangesCard` con `target='link'`)
- `src/features/deliverables/components/RequestChangesCard.tsx` (modificar — agregar prop `target`)
- `src/features/chat/components/SystemEventCard.tsx` (modificar — 3 ramas nuevas)
- Tests RTL para cada card

## Approach

- Cada card recibe `payload` autocontenido del snapshot (no fetcha aggregate). Tipos vienen del router `SystemEventCard` con narrowing por `event_type`.
- `LinkSubmittedCard`:
  - Brand owner → render variant `CrEZH` con botones "Approve link" y "Request changes on link" visibles cuando `link.status='submitted'`.
  - Brand admin/member o creator → variant `M8nUn` (read-only).
  - Determinar rol: hook existente del feature `identity` (ej. `useCurrentAccount()` o equivalente) + comparar `account_id` y `brand_memberships.role`.
- `LinkApprovedCard`: fallback `EventBubble/Success` con copy "Link approved" + URL clickable. JSDoc con TODO referenciando frame pendiente.
- `LinkChangesRequestedCard`: pasa `target='link'` a `RequestChangesCard`; preview del link en lugar de thumbnail del draft.
- `RequestChangesCard`: nueva prop `target?: 'draft' | 'link'` (default `'draft'` para no romper FEAT-008). El render del thumb cambia: `target='draft'` → thumb del draft (existente); `target='link'` → `LinkPreviewBlock`.
- `SystemEventCard` router: agregar 3 `case` con type-narrowing exhaustivo.
- Acciones (botones) NO disparan mutation acá — sólo abren modal o llaman a callback. El wiring vive en task .5.

## Design context

- Frames Pencil:
  - Brand 09: `Lh0UU` (light), `F5oKK` (dark)
  - Brand 10: `iqvJx` (light), `olo8n` (dark)
  - Creator 10: `Vhl85` (light), `Gzfb7` (dark)
  - Component refs: `CrEZH` (brand variant), `M8nUn` (creator/read-only variant), `BIuqZ` (RequestChangesCard), `scFrQ`/`vKTEk` (EventBubble/Success fallback)
- Tokens shadcn redondeados, light + dark.

## Investigation targets

**Required:**

- `src/features/chat/components/SystemEventCard.tsx` — router actual + convención de switch
- `src/features/deliverables/components/RequestChangesCard.tsx` — estructura existente FEAT-008
- `src/features/deliverables/components/DraftSubmittedCard.tsx` (o equivalente FEAT-007) — convención de card brand vs creator
- `src/features/identity/hooks/` — hook para current account + rol

**Optional:**

- `src/features/chat/components/EventBubble*.tsx` — primitivo de fallback

## Acceptance

- [ ] `LinkSubmittedCard`: brand owner ve los 2 botones; brand admin/member NO; creator NO. Snapshot test por rol.
- [ ] `LinkSubmittedCard` cuando `link.status !== 'submitted'`: botones ocultos en todos los roles.
- [ ] `LinkChangesRequestedCard` reusa `RequestChangesCard` con `target='link'`; el render del thumb usa `LinkPreviewBlock`.
- [ ] `LinkApprovedCard` con fallback `EventBubble/Success` + URL clickable; JSDoc con TODO de organismo dedicado.
- [ ] `SystemEventCard` router maneja los 3 nuevos `event_type`; type-narrowing exhaustivo (assertNever en default).
- [ ] FEAT-008 (DraftRequestChanges) sigue funcionando: snapshot test de `RequestChangesCard` con `target='draft'` (default) sin cambios visuales.
- [ ] Snapshot visual ≥95% contra los 6 frames (light + dark).
- [ ] Tests unitarios por card cubriendo los modos de visibilidad de acciones.

## Done summary
Los tres bloques del round anterior resueltos: helpers centralizados, filtro owner por workspace correcto con test de regresión, rel corregido.
## Evidence
- Commits:
- Tests:
- PRs: