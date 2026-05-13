---
satisfies: [R5, R6]
---

## Description

Dos refactors estructurales relacionados con SSR/router de TanStack Start:
1. **Hydration mismatch time ×23**: crear hook `useClientNow` con `useSyncExternalStore` y reemplazar los 23 sitios que usan `new Date()` o `Date.now()` directamente en JSX.
2. **`navigate-in-render` ×8**: migrar redirects de `useNavigate()` en componente render a `throw redirect()` en `beforeLoad`/`loader` de las 4 rutas afectadas.

**Size:** M
**Files:**
- Nuevo: `src/shared/hooks/useClientNow.ts`
- Hydration (23 sitios — listado en `/tmp/rd-verbose.txt`, ejemplos): `src/features/deliverables/components/DraftApprovedCard.tsx:49`, varios en chat/timeline, earnings, deliverables.
- Navigate-in-render: `src/routes/onboarding/creator.tsx:89,101,113`, `src/routes/onboarding/brand.tsx:92,104,116`, `src/routes/_creator/earnings.tsx:23`, `src/routes/_brand/payments.tsx:25`.

## Approach

**`useClientNow` hook**:
- Implementar con `useSyncExternalStore`:
  - `subscribe`: si se necesita actualización periódica (relativeTime), setInterval con cleanup; si solo es snapshot inicial post-mount, subscribe no-op.
  - `getSnapshot`: `() => Date.now()`.
  - `getServerSnapshot`: `() => null` o un valor fijo conocido — forzar render-only-client.
- Pattern de uso: `const now = useClientNow();` luego `now == null ? <Skeleton /> : <RelativeTime to={now} />`.
- Reemplazar los 23 sitios. Algunos son timestamps absolutos ("3 Mar 2026"), otros relativos ("hace 3 min") — el hook debe soportar ambos o crear dos variantes (`useClientNow` + `useClientNowTicking`).

**Throw redirect en beforeLoad**:
- Pattern: `beforeLoad: ({ location, context }) => { if (cond) throw redirect({ to: '/path', search: { ... } }); }` (importar `redirect` de `@tanstack/react-router`).
- Para los 4 archivos, mover la lógica del `useEffect(() => navigate(...), [])` o del `<Navigate />` al `beforeLoad` del route. Si la condición depende de async data, usar `loader` en lugar de `beforeLoad`.
- Reusar el patrón de guards ya implementados en `src/routes/_brand.tsx` / `src/routes/_creator.tsx` (los pathless route groups con guard sobre `session.kind`).
- Cuidado con loops: si `redirect` apunta a una ruta que también redirige, agregar guard `if (location.pathname !== '/target')`.

## Investigation targets

**Required**:
- `src/routes/_brand.tsx` y `src/routes/_creator.tsx` — pattern guard existente
- `src/routes/onboarding/creator.tsx` y `src/routes/onboarding/brand.tsx` — entender los 3 redirects por archivo
- `src/routes/_creator/earnings.tsx:1-40` y `src/routes/_brand/payments.tsx:1-40`
- 2-3 sitios representativos de hydration mismatch (timeline messages, draft cards)
- https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- https://react.dev/reference/react/useSyncExternalStore
- https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store

**Optional**:
- TanStack Start hydration docs: https://tanstack.com/start/latest/docs/framework/react/hydration

## Acceptance

- [ ] `react-doctor` reporta 0 `rendering-hydration-mismatch-time`.
- [ ] `react-doctor` reporta 0 `tanstack-start-no-navigate-in-render`.
- [ ] `useClientNow` hook creado, testeado (test unit con `useSyncExternalStore` mockeado) y exportado desde `src/shared/hooks/`.
- [ ] Onboarding creator/brand flow: redirects funcionan en cold load (SSR) sin flash de pantalla intermedia. Verificar manualmente.
- [ ] `_creator/earnings` y `_brand/payments` redirects funcionan en cold load.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] No regresión en mensajes de chat / timeline (que dependen de timestamps relativos).

## Done summary
Todos los bloqueos del round anterior resueltos: currentNow ahora es per-instancia via useRef, subscribe tiene referencia estable, enforceOnboardingRoute tiene tests completos con cobertura de todas las ramas, y track('onboarding_redirect_enforced') fue migrado al guard.
## Evidence
- Commits:
- Tests:
- PRs: