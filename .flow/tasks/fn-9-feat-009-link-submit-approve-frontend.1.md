---
satisfies: [R1]
---

## Description

Regenerar el cliente API con `pnpm api:sync` apuntando al backend de `dev` (que ya debe tener desplegada la epic backend de FEAT-009). Verifica que los hooks Orval para los 4 endpoints de links están disponibles y que `PublishedLink` y `ChangeRequest` reflejan los nuevos campos (XOR target).

**Size:** S
**Files:**

- `src/shared/api/generated/**` (regenerado, gitignored — verificar build)
- `src/shared/api/mutator.ts` (verificar — sin cambios esperados)

## Approach

- Confirmar que el backend dev expone el openapi con los nuevos paths/schemas antes de correr.
- Correr `pnpm api:sync` y verificar que el build TS no rompe.
- Si Orval mete drifts inesperados, abrir issue antes de seguir.

## Investigation targets

**Required:**

- `marz-front/CLAUDE.md` — sección Orval + `pnpm api:sync`
- `src/shared/api/mutator.ts` — auth/error wrapping (no tocar salvo que sea necesario)

**Optional:**

- `orval.config.ts` (config de generación)

## Acceptance

- [ ] `pnpm api:sync` corre sin errores contra el backend dev.
- [ ] `pnpm typecheck` pasa.
- [ ] Hooks generados disponibles: `useSubmitLinkMutation`, `useApproveLinkMutation`, `useRequestLinkChangesMutation`, `useListLinksQuery` (o nombres equivalentes que produzca Orval).
- [ ] Tipos `PublishedLink`, `PublishedLinkStatus`, `PublishedLinkPreview`, `SubmitLinkRequest`, `RequestLinkChangesRequest` accesibles.
- [ ] `ChangeRequest` tiene `published_link_id?` y `draft_id?` (XOR), no rompe usos previos de FEAT-008.
- [ ] No se committea código generado (verificar `.gitignore`).

## Done summary
Duplicación eliminada con extracción correcta a messagePayload.ts; blocker de backend documentado como issue .10 en el epic.
## Evidence
- Commits:
- Tests:
- PRs: