---
satisfies: [R2, R8]
---

## Description

Construir la UI principal del Inbox: layout con dos secciones independientes (action / waiting), counts por sección, item rows con avatar+meta+title+preview+timestamp, y empty state unificado. Sin filtros ni mark-read todavía (van en task .4) y sin inline actions (task .5). Usa la query `useInboxQuery({ campaignId })` ya existente; en esta task `campaignId` es siempre `undefined` (toolbar viene en .4).

**Size:** M
**Files:**

- `src/features/inbox/InboxPage.tsx` (nuevo)
- `src/features/inbox/InboxSection.tsx` (nuevo)
- `src/features/inbox/InboxItemRow.tsx` (nuevo)
- `src/features/inbox/InboxEmptyState.tsx` (nuevo)
- `src/routes/inbox.tsx` (modificado: monta `InboxPage` real)

## Approach

- `InboxPage` consume `useInboxQuery` y reparte `action_items` + `waiting_items` en dos `<InboxSection>`.
- `InboxSection` muestra header (título + count) y lista de `InboxItemRow`. Sección vacía no se renderiza si `counts === 0` y hay items en la otra sección; si ambas están vacías → `InboxEmptyState`.
- `InboxItemRow` es local (NO extraer a componente reusable global). Renderiza solo lo que viene en `item.meta`, `title`, `preview`, `counterpart`, `occurred_at`. Avatar fallback cuando `avatar_url` es null. Inline action area queda como placeholder (task .5 lo llena).
- `InboxEmptyState` usa textos del response (`empty_state.title|description`) y dos CTAs `primary_cta`/`secondary_cta` cuando vienen.
- Tokens: usar utilities de Tailwind v4 mapeadas en `src/styles.css` (colors shadcn, radios redondos según marz-design).
- Loading skeleton + error state básico.

## Design context

Relevante para esta task (UI nueva grande):

- Diseño Pencil: `Screens / Inbox` → `ckleU` (brand light), `IXg9m` (brand dark), `B7K8C` (creator light), `YVt6t` (creator dark), `g5SCF` (empty light), `PCAAk` (empty dark).
- UI redondeada (radios generosos según `marz-design/CLAUDE.md`).
- Tokens shadcn ya en `src/styles.css`. Light + dark soportados desde inicio.

Antes de implementar: tomar snapshot de los nodos Pencil con `mcp__pencil__get_screenshot` y validar visualmente al final.

## Investigation targets

**Required:**

- `src/features/chat/components/` — patrones de message row + avatar + meta
- `src/features/offers/components/` — empty state pattern
- `src/styles.css` — tokens disponibles
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §7.2
- `marz-design/marzv2.pen` nodos `ckleU`, `B7K8C`, `g5SCF` (vía `mcp__pencil__get_screenshot`)

## Acceptance

- [ ] `InboxPage` renderiza dos secciones con counts y items ordenados `occurred_at DESC`.
- [ ] Items vienen del response (no mocks); loading muestra skeleton; error muestra mensaje recuperable.
- [ ] Empty state aparece solo cuando `counts.action === 0 && counts.waiting === 0`.
- [ ] Avatar fallback funciona si `counterpart.avatar_url` es null.
- [ ] Validación visual Pencil ≥95% contra `ckleU`, `B7K8C`, `g5SCF` en light + dark.
- [ ] Headings semánticos por sección (`<h2>` o equivalente con role).
- [ ] Botones icon-only (cuando existan en el row) llevan `aria-label`.
- [ ] Unit tests: render con data, render empty, render error.

## Done summary
Fix aplicado correctamente: CTAs del EmptyState usan Link de TanStack Router. Tests actualizados con RouterProvider. Typecheck, lint y suite completa en verde.
## Evidence
- Commits:
- Tests:
- PRs: