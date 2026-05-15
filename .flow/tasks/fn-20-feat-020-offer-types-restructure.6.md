---
satisfies: [R7]
---

## Description

`CurrentOfferCard` y `OfferArchive` migrados a `OfferDetailDTO` v3. Nuevo `OfferCountdown` (creator-side) decrementa visualmente desde `expires_at`.

**Size:** M
**Files:**
- `src/features/offers/components/CurrentOfferCard.tsx`
- `src/features/offers/components/OfferArchive.tsx`
- `src/features/offers/components/OfferCountdown.tsx`
- `src/features/offers/hooks/useConversationOffersQuery.ts` (wrapper, si no existe)
- Tests.

## Approach

CurrentOfferCard:
- Consume el `current` de `GET /v1/conversations/:id/offers`. Muestra `offer_mode`, `amount`, `tentative_publish_date`, `offer_deadline`, `platforms`, `status`.
- Botones contextuales:
  - Brand + `status=sent`: "Cancelar" → abre `CancelOfferDialog`.
  - Brand + `status=accepted` + todos deliverables completados: "Mark as paid" → abre `MarkAsPaidDialog`.
  - Creator + `status=sent`: "Aceptar"/"Rechazar" + `OfferCountdown`.

OfferArchive:
- Consume el `archive.items` paginado. Cursor-based.
- Badges por estado: `accepted (paid)`, `accepted`, `rejected`, `expired`, `cancelled (pre)`, `cancelled (post)`.

OfferCountdown:
- Calcula tiempo restante client-side desde `expires_at` con `setInterval(1000)`.
- **Hidratación segura**: usar el patrón compartido del repo de "client-time hook" (ver CLAUDE.md §5 — buscar el hook existente, ej. `useClientTime`). NO usar `new Date()` directo en JSX/SSR.
- Cuando `expires_at < now()` y status sigue `sent`, mostrar "Expirando..." y esperar al WS push que invalide la query y refleje `expired`.

WS push: el `chat.message.created` con `OfferExpired` ya invalida la query relevante via el handler de chat existente; verificar que `['offers','current',conversationId]` se invalida (si no, agregarlo en el WS handler).

## Design context

Tarjeta lateral del workspace. Tokens: badges con colores semánticos (success, warning, destructive). Buscar variantes en `.pen`.

## Investigation targets

**Required:**
- `src/features/offers/components/CurrentOfferCard.tsx` — código actual.
- `src/features/offers/components/OfferArchive.tsx` — código actual.
- Buscar hook hidratación-safe para timestamps (regla CLAUDE.md §5). Si no existe en el repo, crearlo en `src/shared/hooks/useClientTime.ts` (mínimo, sin sobreingeniería).
- `src/shared/ws/useWebSocket.ts` — cómo se enruta `chat.message.created` con `event_type=OfferExpired` para invalidar queries.

**Optional:**
- Otros countdowns en el repo.

## Acceptance

- [ ] CurrentOfferCard renderiza ambos modos (`same_content`, `per_platform`) con datos v3.
- [ ] OfferArchive lista `accepted/rejected/expired/cancelled` con badges diferenciados.
- [ ] OfferCountdown decrementa cada segundo y no rompe hidratación SSR.
- [ ] Test: simular avance del tiempo (mock) → countdown llega a 0 → componente queda en "Expirando..." sin loop.
- [ ] WS push de `OfferExpired` invalida `['offers','current',conversationId]` y refresca a `status=expired`.
- [ ] Sin `new Date()` ni `Date.now()` en JSX.
- [ ] `font-semibold` para headings.
- [ ] Validación visual contra Pencil (light + dark).

## Done summary
Dead exports eliminados, comentarios de dominio agregados en los dos mapeos cancelled→expired, getOfferPlatforms corregido por tipo. Sin problemas pendientes.
## Evidence
- Commits:
- Tests:
- PRs: