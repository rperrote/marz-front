---
satisfies: [R1]
---

## Description

Crear la ruta `/inbox` en TanStack Router con guard de sesión + onboarding (mismo patrón que `/workspace`) y agregar la entrada `Inbox` en el Sidebar de las dos shells (brand y creator) con icono `Inbox` de lucide. La ruta valida search params según `inboxSearchSchema` de la task .1.

**Size:** S
**Files:**

- `src/routes/inbox.tsx` (nuevo)
- `src/features/identity/components/BrandShell.tsx` (modificado)
- `src/features/identity/components/CreatorShell.tsx` (modificado)

## Approach

- Replicar guard de `/workspace` (redirect si no hay sesión o `account.onboarding_status !== 'onboarded'`).
- `validateSearch: inboxSearchSchema.parse` (Zod) para `{ campaign_id?: string }`.
- Page component delega a `InboxPage` (creado en task .3); en esta task la page es placeholder mínimo que solo monta `InboxPage` o un loader.
- Sidebar item: icon `Inbox` de `lucide-react`, posición coherente con jerarquía actual del Sidebar (consultar diseño Pencil `f1xap` para orden exacto).
- TanStack Router marca activo automáticamente vía `useRouterState` o `<Link activeProps>` (patrón ya usado en shells).

## Investigation targets

**Required:**

- `src/routes/workspace.tsx` (o equivalente) — patrón de guard + validateSearch
- `src/features/identity/components/BrandShell.tsx` — estructura del Sidebar y patrón de `<Link>` activo
- `src/features/identity/components/CreatorShell.tsx` — mismo en creator
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §7.1

**Optional:**

- `marz-design/marzv2.pen` nodo `f1xap` (vía `mcp__pencil__get_screenshot`) para confirmar posición del item en sidebar

## Acceptance

- [ ] `/inbox` accesible para brand y creator autenticados+onboarded.
- [ ] Sin sesión → redirect a login. Sin onboarding completo → redirect a onboarding.
- [ ] Search params `?campaign_id=<uuid-invalido>` falla validación (Zod) y limpia el param.
- [ ] Item `Inbox` visible en `BrandShell` y `CreatorShell` con icon lucide `Inbox`.
- [ ] Estado activo del item se resalta cuando ruta = `/inbox`.
- [ ] Test de route guard (redirect sin sesión / sin onboarding).

## Done summary
Test validateSearch corregido: verifica comportamiento real del schema, import sin uso removido. Sin otros defectos.
## Evidence
- Commits:
- Tests:
- PRs: