# fn-1.22 F.19 — Borrar residuos placeholders pre-Clerk

## Description

Eliminar residuos placeholder pre-Clerk.

- `src/routes/login.tsx` — borrar (reemplazado por `/auth`).
- `src/shared/auth/session.ts` — borrar si ya nadie lo importa.
- Cualquier referencia muerta en `routeTree.gen.ts` (regenerar con `pnpm dev` o build).
- `src/routes/index.tsx` — revisar lógica de redirect; debe consultar `useMe` y redirigir según `redirect_to` (sin session → `/auth`).

## Acceptance

- [ ] `rg "shared/auth/session"` devuelve 0 resultados fuera del archivo mismo (o el archivo ya no existe).
- [ ] `rg "routes/login"` idem.
- [ ] Navegar a `/login` → 404 del router.
- [ ] `/` redirige correcto en los 3 casos (sin session, onboarding incompleto, onboarded).
- [ ] Typecheck + lint limpios.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
