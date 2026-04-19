# marz-front

Frontend de Marz. TanStack Start (SSR Node) + shadcn/ui + Tailwind v4 + TanStack Query.

## Setup

```bash
pnpm install
cp .env.example .env.local   # VITE_API_URL, VITE_WS_URL
pnpm dev                     # http://localhost:3000
```

## Scripts

| Comando | |
|---|---|
| `pnpm dev` | Dev server con HMR en `:3000` |
| `pnpm build` | Build SSR para producción |
| `pnpm start` | Corre `.output/server/index.mjs` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier check |
| `pnpm check` | Prettier write + ESLint fix |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm api:sync` | Fetch OpenAPI de dev + regenera cliente (ver CLAUDE.md) |
| `pnpm api:generate` | Solo regenera desde `openapi/spec.json` local |

## Docker

```bash
docker compose up --build
```
