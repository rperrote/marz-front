## Description

Regenerar el cliente Orval contra el backend de dev una vez que B.8 (HTTP adapters + OpenAPI) está deployado. Quedan disponibles hooks de React Query, schemas Zod y tipos TS para los 4 endpoints nuevos del chat.

**Size:** S
**Files:**

- `openapi/spec.json` (snapshot regenerado)
- `src/shared/api/generated/conversations/*` (hooks por tag)
- `src/shared/api/generated/model/*` (request/response types)
- `src/shared/api/generated/zod/*` (schemas Zod)

## Approach

- Correr `pnpm api:sync` (fetchea spec del dev + regenera).
- Verificar que aparecen los hooks: `useGetApiV1ConversationsConversationId`, `useGetApiV1ConversationsConversationIdMessages`, `usePostApiV1ConversationsConversationIdMessages`, `usePostApiV1ConversationsConversationIdRead`.
- Verificar que aparecen los schemas Zod equivalentes (especialmente `MessageSendRequest` con `text: string(1..4096)`).
- Commitear `openapi/spec.json` + `src/shared/api/generated/` (estos están marcados `linguist-generated=true` en `.gitattributes`).
- `pnpm typecheck` y `pnpm build` deben quedar verdes.

## Investigation targets

**Required:**

- `marz-front/CLAUDE.md` §Cliente API (Orval) — flujo de regeneración y por qué se commitea generated/
- `orval.config.ts` — config de outputs
- `src/shared/api/mutator.ts` — fetcher custom; verificar que sigue siendo compatible

## Key context

- No editar manualmente `src/shared/api/generated/`. Si falta algo en el contrato, pedir cambio en el OpenAPI del backend (FEAT-004 en marz-api).
- Esta task tiene dependencia externa: B.8 deployado en dev. Si dev devuelve un spec sin los endpoints nuevos, la task espera.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y produce diff en `openapi/spec.json` + `src/shared/api/generated/`.
- [ ] Existen los 4 hooks de React Query (uno por endpoint nuevo) + sus schemas Zod.
- [ ] `pnpm typecheck` y `pnpm build` pasan.
- [ ] Commit incluye `openapi/spec.json` y los archivos en `src/shared/api/generated/`.

## Done summary

_To be filled by the worker on completion._

## Evidence

_To be filled by the worker on completion (commands run, test output, screenshots, etc.)._
