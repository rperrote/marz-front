# stack

Versiones y rol de cada dependencia clave.

## Runtime

- **Node 22+** (pineado en `.nvmrc` y `package.json#engines`).
- **pnpm 10** (pineado en `package.json#packageManager`). Usar siempre `pnpm`, nunca `npm` o `yarn`.

## Framework

- **TanStack Start**: SSR sobre Node, puerto `:3000`. Reemplaza Next/Remix.
- **TanStack Router**: file-based en `src/routes/`. Type-safe, search params con Zod.
- **TanStack Query** + `react-router-ssr-query`: cache server/cliente unificada. Hooks generados por Orval.
- **TanStack Form**: forms type-safe. NO usar `react-hook-form`.

## UI

- **Tailwind v4**: usa `@import 'tailwindcss'` en CSS, no directives `@tailwind`. Tokens expuestos como utilities via `@theme inline` en `src/styles.css`.
- **shadcn/ui**: primitives en `src/components/ui/`. Regenerables — no editar.
- **Geist Sans**: self-hosted con `@fontsource/geist-sans`.
- **lucide-react**: iconos.

## Data y validación

- **Orval**: genera client API + Zod schemas desde `marz-api/openapi.yaml`. Output committeado en `src/shared/api/generated/` y `openapi/spec.json`.
- **Zod**: validación de schemas. Source of truth: schemas generados por Orval.
- **Zustand**: client state con `persist` middleware (sessionStorage o localStorage según caso).

## Auth

- **Clerk** (`@clerk/tanstack-react-start`): SSO + magic link. Token via `setAuthTokenProvider` en `mutator.ts`.

## i18n

- **Lingui** (`@lingui/core`, `@lingui/react`): macros (`t\`...\``, `Trans`) compilan a catálogos. Setup en `src/shared/i18n/`.

## Testing

- **Vitest + Testing Library**: unit y component tests.
- **vitest-axe**: accessibility checks.
- **Playwright**: pendiente, no usado todavía.

## Dev tools

- **Biome / ESLint + Prettier** (revisar `package.json` para confirmar). Lint y format antes de commit.
- **TypeScript estricto** con `noUncheckedIndexedAccess`.

## Comandos

```
pnpm dev          # dev server con HMR
pnpm build        # build producción
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest
pnpm api:sync     # fetch openapi + regenerar Orval
pnpm api:generate # regenerar desde openapi/spec.json local
```
