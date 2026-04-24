# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

Frontend de Marz. El workspace raíz está en `../` con `CLAUDE.md` propio — leé ese primero para entender el contexto del producto, bounded contexts, glosario, pipeline rafita. Este doc cubre solo lo específico del repo.

## Stack

- **TanStack Start** — SSR sobre Node, `:3000`. Corre detrás de nginx en producción (ver `marz-docs/architecture/infrastructure.md`).
- **TanStack Router** — file-based en `src/routes/`, type-safe, search params con Zod.
- **TanStack Query** + `react-router-ssr-query` — cache de servidor/cliente unificada.
- **TanStack Form** — forms type-safe.
- **shadcn/ui** — primitives en `src/components/ui/`. Estilo alineado al `.pen`.
- **Tailwind v4** — `@theme inline` en `src/styles.css` expone tokens como utilities.
- **Zustand** — estado cliente global (auth snapshot, workspace activo).
- **Orval** + **React Query** + **Zod** — cliente API tipado generado desde el OpenAPI de `marz-api`.
- **Vitest + Testing Library**, **Playwright** (pendiente).

Node 22+. pnpm 10. Ambos pineados en `package.json`.

## Layout del source

```
src/
  routes/
    __root.tsx            # layout raíz: HTML shell, devtools, theme init script
    index.tsx             # redirige por kind: brand → /campaigns, creator → /offers
    login.tsx             # ruta pública
    health.tsx            # healthcheck SSR (ruta /health)
    _brand.tsx            # pathless: guard kind=brand + BrandShell
    _brand/*.tsx          # rutas de brand (campaigns, chat, payments...)
    _creator.tsx          # pathless: guard kind=creator + CreatorShell
    _creator/*.tsx        # rutas de creator (offers, deliverables, earnings...)
  features/               # un folder por bounded context — espeja marz-docs/architecture/bounded-contexts.md
    identity/             # login, workspace switcher, account kind, shells
    campaigns/
    discovery/
    offers/
    chat/
    deliverables/
    payments/
    notifications/
  shared/
    api/
      mutator.ts          # custom fetch que Orval usa (auth, errors, params)
      generated/          # output de Orval — COMMITTEADO (ver "Cliente API")
    ws/                   # useWebSocket + tipos DomainEventEnvelope
    auth/                 # getSession stub + tipos de Session/AccountKind
    ui/                   # moléculas/organismos reusables (no primitives shadcn)
    hooks/
  components/
    ui/                   # primitives shadcn (NO editar sin criterio, regenerables)
    ThemeToggle.tsx
  integrations/tanstack-query/   # scaffold del add-on tanstack-query
  env.ts                  # @t3-oss/env-core: VITE_API_URL, VITE_WS_URL, VITE_APP_TITLE
  router.tsx              # createRouter + SSR query integration
  routeTree.gen.ts        # auto-generado, no editar
  styles.css              # tokens del .pen + Tailwind @theme + Geist
```

**Reglas de organización:**

- **Nada de dominio en `shared/`**. Si un componente sabe qué es una Offer o un Deliverable, va en `features/<contexto>/`. Si solo sabe de primitives UI o HTTP, va en `shared/`.
- **Rutas = composición.** Los archivos en `src/routes/` no definen componentes nuevos, instancian organismos de `features/*/components/`.
- **Un contexto no importa de otro**. Si `offers` necesita algo de `chat`, se mueve a `shared/` o se expone por events. Espejo de la regla del backend.

## Dos shells: brand vs creator

Un `Account` es `brand` o `creator`, nunca ambos (ver glosario + `architecture/bounded-contexts.md §Identity`). El router refleja esto con dos pathless routes:

- `_brand.tsx` → `beforeLoad` chequea `session.kind === 'brand'`, redirige a `/login` o `/` si no.
- `_creator.tsx` → idem para creator.

Cada grupo monta su `Shell` (`BrandShell`, `CreatorShell` en `features/identity/components/`). Los shells son organismos distintos porque son **productos conceptualmente distintos** — brand tiene workspace switcher y items Campaigns/Influencers/Payments, creator no tiene switcher y tiene Offers/Deliverables/Earnings. No son "sidebar con otros items", son dos layouts.

Cuando agregues una ruta nueva:

- Pertenece a brand → `src/routes/_brand/<nombre>.tsx`
- Pertenece a creator → `src/routes/_creator/<nombre>.tsx`
- Es pública (login, signup) → `src/routes/<nombre>.tsx` en la raíz

## Cliente API (Orval)

Fuente de verdad: `marz-api/openapi.yaml` (o `/openapi.json` servido por el backend de dev).

Flujo:

```bash
pnpm api:sync          # fetch spec de dev + regenera endpoints + schemas Zod
pnpm api:generate      # regenera desde openapi/spec.json local (sin refetch)
```

`orval.config.ts` emite dos outputs:

- **`src/shared/api/generated/endpoints.ts`** (+ `model/`) — hooks de React Query por tag: `useGetCampaigns`, `useCreateCampaignMutation`, etc. Usa `mutator.ts` como fetcher.
- **`src/shared/api/generated/zod/`** — schemas Zod para validar requests/responses.

**Committeamos `src/shared/api/generated/` y `openapi/spec.json`.** Razones:

1. Reproducibilidad: el tag del front apunta a un spec fijo, independiente de cambios en dev.
2. Desacople de deploys: front puede mergear aunque dev esté caído.
3. Diff review: el PR muestra cambios de contrato en texto plano antes de que entren.

`.gitattributes` marca los generados como `linguist-generated=true` para que GitHub colapse los diffs.

**Cuándo regenerar:**

- Siempre después de que el backend mergea un cambio de contrato (`pnpm api:sync` → commit).
- Antes de abrir un PR si la feature depende de endpoints nuevos.

El `mutator.ts` centraliza: auth token via provider (`setAuthTokenProvider`), AbortSignal, serialización JSON/FormData, errores tipados con `ApiError`.

## WebSocket

`src/shared/ws/useWebSocket.ts` — hook que conecta a `VITE_WS_URL` y dispatchea `DomainEventEnvelope<T>` por `event_type`.

Contrato del envelope: matches `shared.domain_events` del backend (`marz-docs/architecture/event-catalog.md`). Payloads de `system_event` son **snapshots autocontenidos** — el frontend renderiza cards desde el payload, nunca re-fetchea el aggregate original.

Estado actual: el hook existe pero `enabled: false` por default. Cuando se enchufe al backend, se prenderá desde el provider raíz. Si necesitás reconexión con backoff, cambiá a `partysocket` manteniendo la misma API del hook.

## Tokens y tema

`src/styles.css` tiene los tokens del `.pen` (light + dark) mapeados a naming shadcn (`--background`, `--primary`, `--radius`, etc.). Tailwind v4 los expone como utilities via `@theme inline`.

**Nunca hardcodear colores, radios, fuentes o spacing.** Usá utilities (`bg-background`, `text-foreground`, `rounded-lg`) o variables CSS (`var(--primary)`).

Dark mode: clase `.dark` en `<html>`. Toggle en `components/ThemeToggle.tsx` persiste en localStorage con mode `auto|light|dark`. Hay un script inline en `__root.tsx` que resuelve el tema antes de hidratación para evitar flash.

Cuando cambien los tokens en `marz-design/marzv2.pen`, hay que replicar acá. No hay export automático todavía.

## Path aliases

- `#/*` → `src/*` (configurado en `package.json` imports + tsconfig)
- `@/*` → `src/*` (tsconfig paths, usado por shadcn `components.json`)

Preferí `#/*` en código nuevo. shadcn primitives usan `@/*` porque su CLI lo genera así.

## Healthcheck

Ruta `/health` SSR devuelve `{status, uptime_sec}`. Dockerfile la usa en `HEALTHCHECK`. Cuando la infra de nginx/ALB lo pida como JSON pelado, hay que convertirla a raw server route (no UI route).

## Infra local

- `Dockerfile` multi-stage (deps → build → runner Node 22 alpine).
- `docker-compose.yml` expone `:3000` con env vars del `.env.local`.
- Sin CI todavía (no hay remote). Dejar listo cuando haya repo en GitHub.

## Convenciones de código

- **TypeScript estricto.** `noUncheckedIndexedAccess` activo — indexar un `Record` devuelve `T | undefined`. Usá guards explícitos, no `?.` inventados.
- **ESLint manda.** `@typescript-eslint/no-unnecessary-condition` está prendido. Si el lint dice que un chequeo es redundante, probablemente lo es.
- **Server functions vs client.** Las rutas con data fetching usan `createServerFn` cuando el dato es del server. React Query (via Orval) maneja todo lo que sea client-cached.
- **Forms**: TanStack Form + Zod schemas generados por Orval. No `react-hook-form`.
- **Estado**: servidor primero (React Query). Client state solo cuando es genuinamente efímero (UI, toggles, selección) → Zustand o `useState`.

## Gotchas

- `routeTree.gen.ts` se genera en build/dev. Si `pnpm typecheck` rompe con "Cannot find module './routeTree.gen'" después de un clone limpio, correr `pnpm build` o `pnpm dev` una vez.
- Tailwind v4 usa `@import 'tailwindcss'` en CSS, no directives `@tailwind`. El `@theme inline` expone variables CSS como utilities sin rebuild.
- shadcn primitives en `src/components/ui/*` son regenerables — si querés un cambio global, no editá el primitive, hacé un wrapper en `shared/ui/`.
