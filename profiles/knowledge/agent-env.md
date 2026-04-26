# agent-env

Cómo levantar el ambiente local para probar tu código. Cargar cuando arranques una sesión nueva o un feature dependa del backend.

## Setup inicial

```bash
nvm use            # asegura Node 22
pnpm install       # deps
pnpm api:sync      # genera client desde backend dev (requiere backend up)
```

## Dev server

```bash
pnpm dev           # :3000
```

HMR via Vite. SSR por TanStack Start. Si rompe con "Cannot find module './routeTree.gen'", correr `pnpm build` o `pnpm dev` una vez.

## Variables de entorno

`.env.local` (no committeado). Variables esperadas:

- `VITE_API_URL` — backend (default `http://localhost:8080`).
- `VITE_WS_URL` — websocket (default `ws://localhost:8080/ws`).
- `VITE_APP_TITLE`.
- Variables de Clerk (`VITE_CLERK_PUBLISHABLE_KEY`).

`@t3-oss/env-core` valida en `src/env.ts`. Si falta algo, la app no arranca y tira un error claro.

## Backend acompañante

Para features que dependen del backend (auth, /me, onboarding submit, etc.) necesitás `marz-api` corriendo:

```bash
cd ../../marz-api
make stack-up      # docker compose: postgres + redis + api
```

API en `localhost:8080`. Health check: `curl localhost:8080/healthz`.

Detalle en `marz-api/agents/knowledge/agent-env.md`.

## Probar el flujo completo

1. Backend up.
2. `pnpm api:sync` para tener el client último.
3. `pnpm dev` para levantar el front.
4. Browser en `localhost:3000`.
5. DevTools abierto: Network, Console, Application > SessionStorage / LocalStorage.
6. Si la feature toca onboarding, sessionStorage tiene `marz-brand-onboarding` o `marz-creator-onboarding` con el draft.

## Healthcheck

`/health` SSR devuelve `{ status, uptime_sec }`. Usado por Dockerfile.

## Build producción local

```bash
pnpm build
node .output/server/index.mjs   # comando exacto puede variar, ver package.json
```

Casi nunca lo necesitás. Solo para debuggear problemas de SSR que no aparecen en dev.
