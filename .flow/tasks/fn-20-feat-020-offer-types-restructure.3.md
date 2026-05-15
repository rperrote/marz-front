---
satisfies: [R2, R3]
---

## Description

Wizard completo para enviar Offer: sidesheet alineado a Pencil `Component/Sidesheet/SendOffer/OfferModelV2` (`vzg1p`). Incluye switch de modo, inputs de monto/fechas/plataformas, sección de bonos colapsable (sólo `same_content`), summary con max payout.

**Size:** M
**Files:**
- `src/features/offers/components/SendOfferSidesheet.tsx`
- `src/features/offers/components/OfferBonusEditor.tsx`
- `src/features/offers/components/OfferSummary.tsx`
- `src/features/offers/hooks/useCreateOfferMutation.ts` (wrapper del hook Orval, invalida queries)
- Tests unit + visual.

## Approach

- Form con TanStack Form + schema Zod de F.2.
- Estado del wizard persistido en `useSendOfferWizard()` (F.2) mientras el sidesheet está abierto.
- Switch "Un contenido para todas las redes" mapea a `offer_mode`. Al togglear, el form se rehidrata desde el slot correspondiente del store.
- Sección bonos colapsable: visible solo si `offer_mode === 'same_content'`. Toggle global "Offer bonuses": al apagar guarda snapshot en `bonusesSnapshot` y resetea; al prender, rehidrata desde snapshot si existe.
- `OfferBonusEditor`: edita `speed_bonus_windows[]`. Cada window: `window_hours` (number) + `bonus_amount` (radio `percentage|fixed` + input).
- `OfferSummary`: muestra `amount` + cálculo del techo de bonos (sumando todos los windows si todos aplicaran). Usa `Intl.NumberFormat` hoisted a module scope (USD).
- Submit: llama a `useCreateOfferMutation()` que envuelve el hook Orval, inyecta `Idempotency-Key` (UUID v4) y on success invalida `['offers','list',conversationId]` y `['offers','current',conversationId]`.
- Errores tipados de la API (422 `bonus_not_supported_for_per_platform`, etc.) se mapean a copy en español inline en los fields correspondientes.

## Design context

Relevante de `marz-docs/DESIGN-DEV.md` y del .pen `vzg1p`:
- Sidesheet con focus trap, cierre por overlay + Esc.
- Inputs y selects redondeados (radius generoso, ver `--radius`).
- Toggle global de bonus = switch shadcn; secciones colapsables con animación.
- Fuente Geist via `@fontsource/geist-sans` ya cargada.
- Light + Dark obligatorios (validar ambos en visual check).

**Antes de implementar UI**: abrir `marzv2.pen` con el MCP de Pencil y correr `get_screenshot` del nodo `vzg1p` (light y dark). Implementar contra esa referencia. Tokens visuales se leen via Tailwind v4 (`@theme inline` en `src/styles.css`).

## Investigation targets

**Required:**
- `src/features/offers/components/` — qué hay del SendOffer actual; lo más probable: borrar/reescribir.
- `src/shared/api/mutator.ts` — confirmar inyección de `Idempotency-Key`.
- `src/components/ui/` (shadcn) — `Sheet`, `Switch`, `Form`, `Select`, `Input`, `Button`, `Collapsible`.
- `marz-docs/DESIGN-DEV.md` — antes de tocar UI.

**Optional:**
- Otros forms en el repo que usen TanStack Form + Zod para seguir convención.

## Acceptance

- [ ] Sidesheet abre/cierra con foco gestionado correctamente; trap funcional.
- [ ] Toggle de modo preserva snapshots (validado contra el store, no remount destructivo).
- [ ] Validación visual contra Pencil `vzg1p` ≥ 95% en light y dark (capturas adjuntas en el PR).
- [ ] Submit happy path `same_content`: POST con `Idempotency-Key`, response 201, sidesheet cierra, queries invalidadas.
- [ ] Submit happy path `per_platform`: POST con `Idempotency-Key`, response 201.
- [ ] Bonus en `per_platform`: el editor no es visible. Cualquier estado residual del slot se limpia/ignora.
- [ ] Error path: backend responde 422 `bonus_not_supported_for_per_platform` → mensaje inline en español al lado del field, no toast.
- [ ] Error path: backend 422 `validation_error` por fecha → field-level error.
- [ ] Accesibilidad: cada field con label asociado, `aria-invalid` cuando aplica.
- [ ] `Intl.NumberFormat` USD hoisted a module scope (no instanciar en render).
- [ ] Sin `new Date()` ni `Date.now()` en JSX renderizado.
- [ ] Mutación invalida `['offers','list',conversationId]` y `['offers','current',conversationId]`.

## Done summary

_To be filled at task completion._

## Evidence

_To be filled at task completion._
