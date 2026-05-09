---
satisfies: [R9]
---

## Description

Regenerar el cliente API con Orval contra el backend de dev (que ya tiene `/v1/inbox*` deployado por el lado backend de FEAT-014) y exponer un wrapper tipado en `src/features/inbox/api/` con los hooks de TanStack Query y server functions de TanStack Start. Esta task aterriza el contrato y desbloquea el resto.

**Size:** M
**Files:**

- `src/features/inbox/api/inbox.ts` (nuevo)
- `src/features/inbox/hooks/useInboxQuery.ts` (nuevo)
- `src/features/inbox/hooks/useMarkInboxItemReadMutation.ts` (nuevo)
- `src/features/inbox/hooks/useMarkInboxVisibleReadMutation.ts` (nuevo)
- `src/features/inbox/inboxSearchSchema.ts` (nuevo, Zod schema para search params `{ campaign_id?: uuid }`)
- `src/shared/api/generated/**` (regenerado por `pnpm api:sync`, NO commitear)

## Approach

- Correr `pnpm api:sync` con backend dev disponible. Verificar que aparezcan `InboxResponse`, `InboxItem`, `InboxItemKind`, `InboxInlineAction`, `InboxNavigationAction`, `MarkInboxItemReadRequest/Response`, `MarkInboxVisibleReadRequest/Response`. Si faltan: parar y reportar — backend no está listo.
- Server functions con `createServerFn({ method })` + validators Zod (patrón ya usado en `src/features/{chat,offers}/api/`).
- Query key canónica: `['inbox', campaignId ?? null]`. Mutations invalidan `['inbox']`.
- Wrapper sobre los hooks generados de Orval, no reimplementar fetch.

## Investigation targets

**Required:**

- `src/features/chat/api/` — patrón de server function + Zod validator + Orval wrapper
- `src/features/offers/hooks/` — patrón de mutation con `Idempotency-Key` y `invalidateQueries`
- `src/shared/api/mutator.ts` — auth/error handling del cliente Orval
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §4 — contrato exacto
- `package.json` — script `api:sync`

**Optional:**

- `marz-front/CLAUDE.md` — convenciones de features

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y genera tipos `InboxResponse`/`InboxItem`/`InboxInlineAction`/etc.
- [ ] `useInboxQuery({ campaignId })` retorna data tipada como `InboxResponse`.
- [ ] `useMarkInboxItemReadMutation` y `useMarkInboxVisibleReadMutation` invalidan `['inbox']` en `onSuccess`.
- [ ] Mutations envían header `Idempotency-Key` (UUID v7 generado por request).
- [ ] `inboxSearchSchema` valida `campaign_id` como UUID opcional y exporta el tipo.
- [ ] Generated code no aparece en `git status` (gitignored ya).
- [ ] Unit test cubre query key y schema de search.

## Done summary
Correcciones aplicadas correctamente: error handling delegado al mutator con narrowing explícito, y useInboxQuery usa el server function getInbox.
## Evidence
- Commits:
- Tests:
- PRs: