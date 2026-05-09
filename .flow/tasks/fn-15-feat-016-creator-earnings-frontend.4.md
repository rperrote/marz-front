---
satisfies: [R3, R8]
---

## Description

Aside "Bonos que podés alcanzar a tiempo": lista paginada de speed pending bonuses con countdown y CTA `Ver oferta`. Performance bonuses NO se renderizan (van en FEAT-020).

**Size:** M
**Files:**

- `src/features/earnings/components/PendingBonusPanel.tsx` (nuevo — wrapper aside)
- `src/features/earnings/components/PendingBonusCard.tsx` (nuevo — card individual)
- `src/features/earnings/components/__tests__/PendingBonusCard.test.tsx` (nuevo)

## Approach

- Consumir `pending_bonuses.items` de `useCreatorEarningsQuery`. Filter defensivo por `type === 'speed'` (aunque MVP solo emite speed).
- Card muestra: brand logo + name, campaign name, deliverable label, `bonus_pct`, `window_hours`, `estimated_bonus_amount`, countdown derivado de `seconds_remaining` o `expires_at`.
- Countdown se actualiza cada segundo SIN cambiar layout (texto reservado con `tabular-nums` o similar).
- CTA `Ver oferta` navega a `action.href` (`/workspace/conversations/{conversation_id}?offerId={offer_id}`).
- Paginación keyset usando `next_cursor` / `has_more`. Botón "Cargar más" o auto-fetch en intersection según UX existente.

## Investigation targets

**Required**:

- `src/features/earnings/hooks/useCreatorEarnings.ts`.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §4.1 (`CreatorPendingBonus`), §7.4 task F.4.
- Pencil frame `m63kj` — sección pending bonuses (aside derecho en desktop).

**Optional**:

- Patrones de countdown existentes en `src/features/*` si los hubiera (sino, hook simple `useCountdown`).

## Design context

- Aside derecho en desktop, full width arriba de payments en mobile.
- Cards rounded-2xl (radius generoso). Brand logo circular con fallback inicial.
- Countdown en color de acento cuando `seconds_remaining` baja de un umbral (ej. 24h). No bloquea click.
- CTA primaria con `--primary`, full width dentro del card.

## Acceptance

- [ ] Renderiza una card por cada bonus tipo `speed` en `pending_bonuses.items`.
- [ ] Countdown se actualiza segundo a segundo sin reflujo de layout.
- [ ] CTA `Ver oferta` navega exactamente a `action.href` del bonus.
- [ ] Paginación: cuando `has_more`, hay forma de cargar la siguiente página vía `next_cursor`.
- [ ] Performance bonus o cualquier `type` distinto de `speed` no se renderiza.
- [ ] Empty state cuando `pending_bonuses.items` está vacío.
- [ ] Tests cubren render speed, presencia de countdown, navegación CTA.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
Todos los fixes aplicados: Link de TanStack Router, dependencias escalares en countdown, inyección de now, isSpeedBonus como boolean, mock del router en tests.
## Evidence
- Commits:
- Tests:
- PRs: