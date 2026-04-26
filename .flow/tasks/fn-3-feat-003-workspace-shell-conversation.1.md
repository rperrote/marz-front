---
satisfies: [R1, R8]
---

## Description

Crear las dos rutas TanStack Router de workspace y el layout 2-columnas compartido. Sin data fetching real todavía — `<EmptyConversationState/>` en el outlet, `<WorkspaceLayout/>` con un placeholder a la izquierda donde irá el rail.

**Size:** M
**Files:**

- `src/routes/_brand/workspace.tsx` (nuevo)
- `src/routes/_creator/workspace.tsx` (nuevo)
- `src/features/chat/workspace/WorkspaceLayout.tsx` (nuevo)
- `src/features/chat/workspace/EmptyConversationState.tsx` (nuevo)
- Tests: co-located `*.test.tsx`

## Approach

- Rutas: pathless groups `_brand.tsx` / `_creator.tsx` ya viven en `src/routes/` con guards de onboarding y shells. Las dos rutas nuevas son hijas: `routes/_brand/workspace.tsx` y `routes/_creator/workspace.tsx`. Patrón análogo: `routes/_brand/campaigns.tsx`.
- `validateSearch` con Zod: brand `{ filter?: 'all'|'unread'|'needs_reply', search?: string, campaign_id?: string }`, creator igual sin `campaign_id`. Default `filter='all'`.
- Layout grid 2 columnas: rail 320px fixed + outlet flex. Rail por ahora un `<aside>` vacío; F.3 mete `<ConversationRail/>` adentro.
- `<EmptyConversationState/>` con `<h2>` "Select a conversation" (texto exacto del spec § edge cases).

## Investigation targets

**Required:**

- `src/routes/_brand.tsx`, `src/routes/_creator.tsx` — guards y shell
- `src/routes/_brand/campaigns.tsx` — patrón de ruta hija con `validateSearch`
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §7.1, §7.2

**Optional:**

- `src/routes/_brand.test.ts` — patrón de test de guard

## Design context

Pencil refs: `XSdsQ` (brand workspace), `2xWvk` (creator workspace). Rail 320px, layout claro/oscuro, radios redondeados. Tokens: `bg-background`, `border-border`, `text-foreground`. Nada hardcodeado de color/spacing — usar utilities Tailwind v4 / variables CSS.

## Acceptance

- [ ] `routes/_brand/workspace.tsx` y `routes/_creator/workspace.tsx` existen y compilan.
- [ ] `validateSearch` con Zod aplica defaults y rechaza valores fuera del enum.
- [ ] `<WorkspaceLayout/>` renderiza dos columnas (rail 320px + outlet).
- [ ] Sin sub-ruta, outlet renderiza `<EmptyConversationState/>` con `<h2>` y texto del spec.
- [ ] Rail tiene `role="region" aria-label="Conversations"`.
- [ ] Tests Vitest: layout renderiza columnas; rutas con search params inválidos caen al default.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary

_To be filled by the worker on completion._

## Evidence

_To be filled by the worker on completion (commands run, test output, screenshots, etc.)._
