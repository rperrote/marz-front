---
satisfies: [R2]
---

## Description

Endurecer los guards de los pathless route groups para garantizar separación estricta brand vs creator: mismatch de `kind` redirige a `/workspace`; sin `kind` redirige a `/auth`; brand onboarded sin `brand_workspace` muestra pantalla de fallback "no tenés workspace, contactá soporte" sin redirigir a `/auth`.

**Size:** M
**Files:**

- `src/routes/_brand.tsx` (modificar — guard mismatch)
- `src/routes/_creator.tsx` (modificar — guard mismatch)
- `src/features/identity/app-shell/MissingWorkspaceFallback.tsx` (nuevo — pantalla soporte)
- Tests de routing.

## Approach

- En `_brand.tsx` `beforeLoad`:
  1. Resolver `MeResponse` (ya hecho).
  2. Si no hay sesión → redirect `/auth`.
  3. Si `kind` ausente o inválido → redirect `/auth`.
  4. Si `kind === 'creator'` → redirect `/workspace`.
  5. Si `onboarding_status !== 'onboarded'` → redirect `redirect_to ?? '/onboarding/brand'`.
  6. Si `kind === 'brand'` y `brand_workspace` ausente → **no redirigir a `/auth`**, render `<MissingWorkspaceFallback />` dentro de un layout mínimo (sin sidebar/topbar funcional o con `AppShell` en modo limitado, según facilidad).
- `_creator.tsx`: simétrico (mismatch a `/workspace`; sin kind a `/auth`; no aplica missing-workspace).
- `MissingWorkspaceFallback`: copy claro "No tenés un workspace asociado. Contactá soporte." + botón logout/contacto. Sin datos sensibles.

## Investigation targets

**Required:**

- `src/routes/_brand.tsx`, `src/routes/_creator.tsx` — guard actual post-F.4.
- `src/routes/auth.*` — rutas de auth para confirmar destino redirect.
- `src/routes/workspace.tsx` — landing canónica común.

**Optional:**

- `redirect()` API de TanStack Router.

## Key context

- CF-11: el backend ya bloquea con `403 onboarding_incomplete`; el redirect frontend es UX preventivo.
- "Mismatch redirige a `/workspace`" — no a `/auth`. Solo "kind ausente" va a `/auth`.

## Acceptance

- [ ] Route test: creator que entra a una ruta `_brand/*` redirige a `/workspace`.
- [ ] Route test: brand que entra a una ruta `_creator/*` redirige a `/workspace`.
- [ ] Route test: usuario sin `kind` (o `kind` inválido) en cualquiera redirige a `/auth`.
- [ ] Route test: brand `onboarded` sin `brand_workspace` renderiza `MissingWorkspaceFallback`, **no** redirige a `/auth`.
- [ ] Route test: brand `onboarded` con `brand_workspace` renderiza `AppShell` normal.
- [ ] Route test: usuario con `onboarding_status !== 'onboarded'` sigue redirigiendo a `redirect_to`.
- [ ] `MissingWorkspaceFallback` no muestra `email`/`full_name`/`brand_workspace.name`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
Guards refactorizados correctamente: kind inválido → /auth, mismatch → /workspace, missing workspace → fallback sin redirect. Tests cubren todos los acceptance criteria. MissingWorkspaceFallback correcto en i18n, accesibilidad y bounds de BC. Rules of Hooks respetadas en BrandLayout.
## Evidence
- Commits:
- Tests:
- PRs: