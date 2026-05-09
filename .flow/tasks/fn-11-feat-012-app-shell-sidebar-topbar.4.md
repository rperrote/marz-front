---
satisfies: [R1, R11]
---

## Description

Componer `AppShell` (sidebar + topbar + content outlet) y montarlo en los pathless route groups `_brand.tsx` y `_creator.tsx`. Esta task es el **early proof point** del epic: valida que un único shell parametrizado por `accountKind` reemplaza los shells legacy sin romper guards SSR/cliente.

**Size:** M
**Files:**

- `src/features/identity/app-shell/AppShell.tsx` (nuevo)
- `src/features/identity/app-shell/AppShellContext.tsx` (nuevo, expone `useAppShellContext`)
- `src/routes/_brand.tsx` (modificar)
- `src/routes/_creator.tsx` (modificar)
- `src/features/identity/components/BrandShell.tsx` (modificar — wrapper compatible o eliminación de aside)
- `src/features/identity/components/CreatorShell.tsx` (modificar — idem)
- Tests de routing en `src/routes/__tests__/` o equivalente del repo.

## Approach

- `AppShell` props: `{ accountKind, accountId, pathname, children }`.
- Estructura: `<AppShellContextProvider><TopbarProvider><div flex><AppSidebar/><div col><AppTopbar/><main>{children}</main></div></div></TopbarProvider></AppShellContextProvider>`.
- `useAppShellContext()` expone `{ accountKind, accountId }` para hijos que lo necesiten (no exponer datos sensibles de sesión).
- `_brand.tsx`:
  - Mantener guard `beforeLoad` actual con `getServerMe`.
  - Pasar `MeResponse` ya validado a `AppShell` con `accountKind='brand'`.
  - Mantener `BrandSessionProvider` envolviendo el outlet.
- `_creator.tsx`: equivalente con `accountKind='creator'`.
- `BrandShell.tsx` / `CreatorShell.tsx`: reducir a wrapper sobre `AppShell` (manteniendo API existente para callers) o eliminar y migrar callers en F.6/F.7. Crucialmente: **no renderizar aside propio**.
- No emitir analytics. No loggear `email`/`full_name`/`brand_workspace.name`.

## Investigation targets

**Required:**

- `src/routes/_brand.tsx` — guard actual y composición.
- `src/routes/_creator.tsx` — idem.
- `src/features/identity/components/BrandShell.tsx`, `CreatorShell.tsx` — qué renderizan hoy y qué hay que retirar.
- `src/features/identity/session/BrandSessionContext.tsx` — orden de providers.
- `src/features/identity/hooks/useMe.ts` y `getServerMe` — contrato actual.

**Optional:**

- TanStack Router docs sobre `beforeLoad` redirects.

## Design context

- **Layout:** sidebar 72px fijo a la izquierda, topbar 56px sticky arriba, content fill remaining viewport con scroll propio si la pantalla lo necesita.
- **No doble scroll:** el `main` debe ser `min-w-0 flex-1` para que pantallas internas con scroll (Chats) no compitan con scroll del shell.
- **Theme:** respeta `light`/`dark` desde tokens shadcn de `src/styles.css`.

Full design system: `marzv2.pen` — composición global del shell.

## Key context

- Mantener orden de providers: `AppShellContext > TopbarProvider > BrandSessionProvider > Outlet`.
- Si `BrandShell`/`CreatorShell` quedan como wrappers compat, deben no aceptar children que asuman aside ya renderizado.

## Acceptance

- [ ] Route test: brand onboarded en `_brand` ve `AppShell` con sidebar brand y topbar base.
- [ ] Route test: creator onboarded en `_creator` ve `AppShell` con sidebar creator.
- [ ] Route test: usuario sin sesión en `_brand` o `_creator` redirige a `/auth`.
- [ ] Route test: usuario `onboarding_status !== 'onboarded'` redirige a `redirect_to ?? '/onboarding/{kind}'`.
- [ ] Grep o test estático: no quedan `<aside>` ni componentes con clase de sidebar fuera de `AppSidebar`.
- [ ] Grep o test estático: no quedan logs de `email`, `full_name`, `brand_workspace.name`, `creator_profile.handle` en el shell.
- [ ] `useAppShellContext` accesible desde un componente hijo y devuelve `{ accountKind, accountId }`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
Pathname reactivo vía useRouterState en ambos layouts, accountId requerido en wrappers compat sin fallback useMe — todos los issues del round anterior resueltos
## Evidence
- Commits:
- Tests:
- PRs: