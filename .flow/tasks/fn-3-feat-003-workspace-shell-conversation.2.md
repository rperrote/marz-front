---
satisfies: [R9]
---

## Description

Sincronizar el cliente Orval con el OpenAPI de dev una vez que el endpoint `GET /api/v1/conversations` esté deployado. Committear los archivos generados.

**Size:** S
**Files:**

- `openapi/spec.json` (regenerado)
- `src/shared/api/generated/conversations/conversations.ts` (nuevo)
- `src/shared/api/generated/model/conversationListItem.ts` y schemas relacionados
- `src/shared/api/generated/zod/` (nuevos schemas)

## Approach

- Cross-team blocker: depende de `B.4` deployado a marz-api dev (verificar antes de empezar). Si el endpoint no está aún, levantar bloqueo y volver.
- Comando: `pnpm api:sync` (fetchea spec del backend dev, regenera).
- Verificar que el diff tenga **solo** archivos `linguist-generated=true`. Si hay cambios fuera de `generated/`, escalá.
- Confirmar que `useGetApiV1ConversationsInfinite` existe (variante infinite del hook). Si Orval no lo emite, ajustar `orval.config.ts`.

## Investigation targets

**Required:**

- `marz-front/CLAUDE.md` §Cliente API — flujo committeado
- `orval.config.ts`
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §4.4

## Acceptance

- [ ] `pnpm api:sync` corre clean contra el backend dev.
- [ ] `pnpm typecheck` verde post-regen.
- [ ] Tipos `ConversationListItem`, `ConversationListResponse`, `ConversationCounterpart`, `ConversationLastMessagePreview` exportados desde `src/shared/api/generated/`.
- [ ] Hook `useGetApiV1ConversationsInfinite` disponible (o la variante que Orval emita para keyset).
- [ ] Schemas Zod de query params disponibles.
- [ ] Diff del PR consiste solo en archivos `linguist-generated=true` + `openapi/spec.json`.

## Done summary

Task bloqueada correctamente: el worker verificó que el endpoint y el spec no están disponibles en dev, documentó la dependencia (B.4 de marz-api) con evidencia concreta, y no tocó código. No hay entregables de código porque la spec lo prevé explícitamente.

## Evidence

- Commits:
- Tests:
- PRs:
