---
satisfies: [R2, R7]
---

## Description

Regenerar el cliente Orval contra el OpenAPI de `marz-api` dev (que ya incluye los 6 endpoints de FEAT-019), crear los Zod adapters locales para validación form-side y extender el `mutator.ts` para inyectar `Idempotency-Key` (UUID v4 nuevo por request) y `X-Brand-Workspace-Id` en las mutaciones del wizard.

**Size:** M
**Files:**

- `src/shared/api/generated/*` (regenerados por `pnpm api:sync`, gitignored)
- `src/shared/api/mutator.ts` (extender)
- `src/shared/api/mutator.test.ts` (extender)
- `src/features/campaigns/configuration/schemas.ts` (nuevo)

## Approach

- Correr `pnpm api:sync` contra backend dev — backend debe haber mergeado FEAT-019 antes (gate: B.6 done).
- Para los headers de mutación, extender `mutator.ts` siguiendo el patrón existente de auth/workspace; agregar opción `requireIdempotency: boolean` o detectar por path/método. Generar `Idempotency-Key` con `crypto.randomUUID()` por invocación de mutación (no compartir entre retries del mismo logical request — Orval/TanStack Query maneja retries con la misma key automáticamente vía cache).
- Zod schemas espejo de §4 del solution doc: `OperationalTargetingSchema`, `BonusConfigSchema` (con refines para follower_min ≤ follower_max, age_min ≤ age_max ≤ 120, bonus_pct 1-100, window_hours 1-720, no duplicados en windows/milestones). Usar como `resolver` de TanStack Form en cada step.
- No mocks MSW. No tests E2E acá — las llamadas reales se cubren en F.3+.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — patrón actual de header injection
- `src/shared/api/mutator.test.ts` — cómo se testean headers
- `marz-docs/features/FEAT-019-campaign-configuration-wizard/03-solution.md` §4 — contrato exacto

**Optional:**

- `package.json` — verificar comando `api:sync` y versión Orval

## Key context

- `Idempotency-Key` debe ser único por mutación lógica pero estable durante retries de la misma operación. TanStack Query maneja retries con la misma `mutationFn`, así que generar la key dentro del `mutationFn` (no en el componente) garantiza que un retry de TanStack Query reusa la key — pero un retry manual del usuario debe generar una nueva.
- `X-Brand-Workspace-Id` se obtiene del store/contexto de session (verificar si ya hay helper en `mutator.ts`).
- TTL backend de la idempotency es 24h; el front no debe persistir keys.

## Acceptance

- [ ] `pnpm api:sync` regenera `src/shared/api/generated/` con tipos `CampaignConfigurationResponse`, `CampaignOperationalTargeting`, `CampaignBonusConfig`, los 4 `Update*Request` y `ActivateCampaignConfigurationRequest/Response`.
- [ ] `pnpm typecheck` pasa.
- [ ] `mutator.ts` inyecta `Idempotency-Key` (UUID v4) y `X-Brand-Workspace-Id` en las 5 mutaciones del wizard (4 PATCH + 1 POST activate); las queries GET solo llevan `X-Brand-Workspace-Id`.
- [ ] Test unit en `mutator.test.ts` verifica header injection para PATCH y POST de configuration; verifica que misma invocación no muta la key entre headers (estable).
- [ ] `schemas.ts` exporta Zod schemas con refines de follower/age ranges, bonus_pct, window_hours; tests unit cubren happy path + 2 inválidos por schema.
- [ ] No se committea `src/shared/api/generated/`.

## Done summary
Fixes aplicados correctamente: adjusted_from_brief cambiado a default(false), contrato de retry:0 documentado con comentario explícito, nuevo test verifica que cada invocación de customFetch genera una key distinta. El AC de pnpm api:sync falla por gate externo (B.6 no mergeado en backend dev), que la propia spec lista como prerequisito — no es un defecto del código entregado.
## Evidence
- Commits:
- Tests:
- PRs: