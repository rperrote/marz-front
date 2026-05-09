---
satisfies: [R9, R1]
---

## Description

Sincronizar el contrato OpenAPI del backend dev (FEAT-013 publicado) y dejar listo el scaffold de carpetas para que las tasks siguientes solo agreguen componentes/hooks. No se commitean tipos generados (gitignored). Verificar que aparezcan los hooks/Zod schemas para los endpoints `/v1/campaigns/{id}/detail|overview|discovery/*|participants|videos` y mutaciones contact/accept/reject/invite.

**Size:** S
**Files:**

- `src/features/campaigns/detail/` (carpeta nueva, vacía con `.gitkeep` solo si es necesario)
- `src/features/discovery/campaign-detail/` (carpeta nueva)
- `src/shared/api/generated/` (regenerado, NO committeado)

## Approach

- Ejecutar `pnpm api:sync` contra backend dev (cliente Orval).
- Verificar `src/shared/api/mutator.ts` ya cubre auth Bearer Clerk + header `X-Brand-Workspace-Id` + envelope `ApiError`. Si no, ajustar (sin cambiar firma global).
- Verificar que `Idempotency-Key` se inyecte en mutaciones (mutator existente o config Orval).
- Crear las dos carpetas feature como anclas para tasks siguientes (sin componentes todavía).
- No tocar `tsconfig`, `vite.config`, ni rutas.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — confirmar manejo de `X-Brand-Workspace-Id` e `Idempotency-Key`
- `src/shared/api/generated/` — ver hooks existentes y nombre de modules generados
- `package.json` — script `api:sync` y orval config referenciado
- `marz-front/CLAUDE.md` — convenciones de feature folders
- `marz-docs/features/FEAT-013-campaign-detail/03-solution.md` §4 — endpoints esperados

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y genera tipos para todos los endpoints de §4.
- [ ] `src/shared/api/generated/` queda en `.gitignore` (no se committea).
- [ ] `pnpm typecheck` pasa después del sync.
- [ ] Carpetas `src/features/campaigns/detail/` y `src/features/discovery/campaign-detail/` existen.
- [ ] Mutator inyecta `X-Brand-Workspace-Id` (desde session brand workspace) y propaga `Idempotency-Key` cuando se pasa.

## Done summary
Tests correctos para X-Brand-Workspace-Id e Idempotency-Key en mutator; mock de BrandSession en P1Input justificado; carpetas feature creadas; generated gitignored.
## Evidence
- Commits:
- Tests:
- PRs: