---
satisfies: [R3, R8]
---

## Description

Construir el bloque del panel lateral derecho del Workspace (brand y creator): `Current Offer` arriba + `Offers archive` colapsable abajo. Consume `useGetConversationOffers(conversationId)`. Reactividad: el WS subscriber (F.5) invalida la query — este task solo consume.

**Size:** M
**Files:**

- `src/features/offers/components/CurrentOfferBlock.tsx` (Pencil dentro de `wpat3` brand y `7pW7u` creator)
- `src/features/offers/components/OffersArchiveBlock.tsx` (Pencil `xKNIo` + items `fH0fw`)
- `src/features/offers/components/OfferArchiveItem.tsx` (Pencil `fH0fw`)
- `src/features/offers/hooks/useConversationOffers.ts` (wrapper sobre Orval `useGetConversationOffers` con tipos + paginación)
- `src/features/chat/components/ConversationContextPanel.tsx` (modificación: inyectar los dos bloques)

**Loader SSR**:

- Si el route loader de `_brand/workspace/conversations/$conversationId.tsx` y `_creator/...` ya hidrata datos, agregar prefetch de `getConversationOffersServerFn`. Si no, dejar SSR para una iteración futura — TanStack Query CSR es suficiente para shipping.

## Approach

- **CurrentOfferBlock**: hook `useConversationOffers(conversationId)` → `data.current`. Si `null`, render empty state "No active offer" (copy según Pencil). Si presente, render compact con badge de status + amount + currency + deadline + link/click → scroll a la card en timeline.
- **OffersArchiveBlock**: colapsable (`<details>` o radix `Accordion`). Default colapsado. Contenido: `data.archive.items.map(<OfferArchiveItem />)`. Items con `status='sent'` (no current) muestran badge "Pending". Empty state "No past offers" cuando `items.length === 0`.
- **Paginación**: `next_cursor` del response. Botón "Load more" al pie del archive cuando `next_cursor !== null`. `useGetConversationOffers` con `getNextPageParam` si la versión generada lo soporta; si no, manejar manualmente con `useState<cursor>`.
- **Inyección en `ConversationContextPanel`**: import + render de los dos bloques en el slot correspondiente. Verificar que el panel ya existe del shell FEAT-003; si no, coordinar con epic fn-3.
- **Loader SSR (opcional MVP)**: `getConversationOffersServerFn` en `src/features/offers/server/getConversationOffers.ts` usando `createServerFn`. Hidrata via `initialData`. Si el shell de FEAT-003 aún no expone hooks SSR, skipear y dejar TanStack Query CSR.

## Investigation targets

**Required**:

- `src/features/chat/components/ConversationContextPanel.tsx` o equivalente del shell FEAT-003 — verificar nombre exacto y slots disponibles
- `src/shared/api/generated/endpoints.ts` post-F.1 — firma exacta de `useGetConversationOffers` (paginated o no)
- `src/components/ui/accordion.tsx` o `collapsible.tsx` (shadcn primitive) — para el archive
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4.1.4 (response shape, derivación de `current`)
- `../marz-docs/features/FEAT-005-offer-single/02-spec.md` §Edge cases "Multiple offers coexisting" — pending badge

**Optional**:

- `src/integrations/tanstack-query/` — config de staleTime defaults
- `src/routes/_brand/workspace/conversations/$conversationId.tsx` — loader actual

## Design context

Pencil nodeIds:

- Panels: `wpat3` (BrandContextPanel/V2), `7pW7u` (CreatorContextPanel)
- Archive container: `xKNIo`
- Archive item: `fH0fw`
- Pantallas: `moaXA` (panel poblado), `HqiR6` (panel vacío)

Tokens: `bg-muted` para archive collapsed background, badges con `var(--primary)` para Active y `var(--warning)` o `var(--accent)` para Pending. `rounded-lg` en bloques, `rounded-md` en items.

## Key context

- **Derivación de current**: la hace el backend (§4.1.4). Frontend confía en `data.current`. NO recalcular client-side.
- **Pending vs Current**: un item con `status='sent'` que NO es `current` (porque hubo otra después) entra al archive con badge Pending. Ese filtro lo hace el backend; frontend solo render badge cuando aplica.
- **staleTime 30s** (per spec §9). Invalidación on WS event en F.5.

## Acceptance

- [ ] `CurrentOfferBlock` renderiza:
  - empty state "No active offer" cuando `data.current === null`
  - card compacta con status badge cuando hay current
- [ ] `OffersArchiveBlock`:
  - colapsado por defecto
  - empty state "No past offers" cuando vacío
  - items rinden con badge `Pending` cuando `status='sent'`
  - "Load more" funcional cuando hay `next_cursor`
- [ ] Hook `useConversationOffers` con `staleTime: 30s` y query key `['conversations', conversationId, 'offers']` (clave exacta para que F.5 invalide).
- [ ] `ConversationContextPanel` modificado para incluir los dos bloques en ambos shells (brand + creator).
- [ ] Unit tests: `renders empty state when current is null`, `renders accepted state with badge`, `archive collapsed by default`, `archive shows pending badge for past sent`, `paginates with next_cursor`.
- [ ] E2E "Multiple offers coexisting": brand envía A, después B → A en archive (Pending), B en current.
- [ ] Validación visual Pencil ≥95% contra `wpat3`, `7pW7u`, `xKNIo`, `fH0fw`, `moaXA`, `HqiR6` (light + dark).
- [ ] A11y: archive `<details>/<summary>` o `aria-expanded`; cada item con `aria-label` descriptivo.

## Done summary
Correcciones aplicadas correctamente. Dead code eliminado, ContextPanel movido a shared/ui con imports actualizados en todos los consumidores, labels i18n coherentes (Sent para oferta activa, Pending para archivo), queryKey simplificado. pnpm-lock consistente con package.json. Fix 5 (ruta creator) justificadamente diferido.
## Evidence
- Commits:
- Tests:
- PRs: