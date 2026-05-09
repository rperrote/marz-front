---
satisfies: [R1, R6, R10]
---

## Description

Migrar la ruta común `/workspace` (Chats) para que monte un único `AppShell` parametrizado por `sessionKind`, sin doble shell legacy. Conservar `validateSearch` y subscriptions/rail existentes de Chat.

**Size:** M
**Files:**

- `src/routes/workspace.tsx` (modificar — reemplazar BrandShell/CreatorShell por AppShell)
- `src/routes/workspace.index.tsx` (revisar — hereda layout)
- `src/routes/workspace.conversations.$conversationId.tsx` (revisar — hereda layout)
- Tests de routing en `/workspace`.

## Approach

- `workspace.tsx` `beforeLoad`: aplicar guard equivalente a `_brand`/`_creator` — requiere sesión + onboarded; kind faltante → `/auth`. **No** rechaza por kind: ambos pueden ver `/workspace`.
- En el `component`, leer `kind` de `MeResponse`/sesión y montar `<AppShell accountKind={kind} ...>` una sola vez. Hijos (`workspace.index`, `workspace.conversations.$conversationId`) renderizan dentro del outlet.
- Mantener `validateSearch: workspaceSearchSchema` intacto.
- **No** crear `_brand/workspace*` ni `_creator/workspace*` (colisión de paths pathless).
- No tocar `ConversationRail`/`WorkspaceLayout`/subscriptions internas — solo el chrome externo.

## Investigation targets

**Required:**

- `src/routes/workspace.tsx` — implementación actual con `BrandShell`/`CreatorShell`.
- `src/routes/workspace.index.tsx`, `src/routes/workspace.conversations.$conversationId.tsx` — uso del shell actual.
- `src/features/chat/*` — `ConversationRail`, `WorkspaceLayout` y subscriptions.

**Optional:**

- `workspaceSearchSchema` — confirmar dónde está definido.

## Key context

- "Ruta común" significa que el path `/workspace` no está bajo `_brand` ni `_creator`. El kind se decide a nivel componente, no a nivel route group.
- Alternativa rechazada: duplicar Chats — colisiona en path público.

## Acceptance

- [ ] Route test: brand en `/workspace` ve `AppShell` con sidebar brand y contenido Chats sin doble shell.
- [ ] Route test: creator en `/workspace` ve `AppShell` con sidebar creator y contenido Chats sin doble shell.
- [ ] Route test: usuario sin sesión en `/workspace` redirige a `/auth`.
- [ ] Route test: usuario `onboarding_status !== 'onboarded'` redirige a `redirect_to`.
- [ ] `validateSearch: workspaceSearchSchema` sigue presente y funcional.
- [ ] E2E o snapshot: `ConversationRail` filtros y `workspace.conversations.$conversationId` siguen cargando sin regresiones.
- [ ] Grep: no quedan imports de `BrandShell`/`CreatorShell` en rutas `workspace*`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
Migración limpia: BrandShell/CreatorShell reemplazados por AppShell parametrizado, guard de kind reordenado antes del onboarding check según spec, tests unitarios y E2E cubren todos los acceptance criteria, sin imports muertos ni deuda técnica.
## Evidence
- Commits:
- Tests:
- PRs: