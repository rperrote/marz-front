---
satisfies: [R1, R6]
---

## Description

Crear la ruta `_creator/campaigns` con `validateSearch` Zod y regenerar tipos del cliente API. Esto fija el contrato en frontend y prueba que `pnpm api:sync` produce los schemas de §4.4 (`CreatorCampaignBoardResponse`, `CampaignBoardCard`, `CreatorCampaignBoardDetailResponse`, `SubmitCampaignApplicationRequest/Response`, `CampaignBoardBriefSnapshot`, `CampaignBoardTargetingSnapshot`, `CampaignBoardCommercialSnapshot`).

Ruta monta placeholder tipado; el guard `_creator` (existente) cubre redirect de brand.

**Size:** S
**Files:**

- `src/routes/_creator/campaigns.tsx` (nuevo)
- `src/features/discovery/campaign-board/search-schema.ts` (nuevo, Zod schema reutilizable)
- `src/features/identity/components/CreatorShell.tsx` (modificar para agregar item sidebar `Campañas`)
- `src/shared/api/generated/**` (regenerado por `pnpm api:sync`, gitignored)

## Approach

- Definir Zod schema de search params según §7.1 de la solution: `q`, `niches[]`, `interests[]`, `platforms[]`, `deliverables[]`, `fee_min_amount`, `fee_max_amount`, `min_match_score`, `recommended_only`, `sort`, `cursor`. Defaults: `recommended_only=false`, `sort='match_score_desc'`. Coerciones suaves con `.optional()`.
- Usar `createFileRoute` de TanStack Router con `validateSearch: (s) => CampaignBoardSearchSchema.parse(s)`.
- Item sidebar: seguir patrón de items existentes en `CreatorShell.tsx` (ver implementación actual antes de tocar).
- Verificar que `_creator.tsx` ya redirige brand antes de duplicar guards.

## Investigation targets

**Required:**

- `src/routes/_creator.tsx` — guard creator existente
- `src/features/identity/components/CreatorShell.tsx` — pattern del sidebar y items activos
- `src/shared/api/generated/` — tras correr `pnpm api:sync`, verificar que existen los schemas
- `marz-docs/features/FEAT-017-creator-campaigns-board/03-solution.md` §4 y §7.1
- `package.json` — confirmar script `api:sync`

**Optional:**

- `src/routes/_creator/*.tsx` — otras rutas creator para igualar estilo

## Design context

DESIGN.md no existe en este repo, pero los tokens del `.pen` están mapeados en `src/styles.css` (shadcn naming). El item de sidebar debe usar los mismos tokens que los items existentes — UI redondeada (radii generosos por convención del workspace).

## Acceptance

- [ ] `pnpm api:sync` corrido y los tipos de §4.4 existen en `src/shared/api/generated/`
- [ ] Ruta `/_creator/campaigns` resuelve para creator onboarded; brand recibe el redirect heredado de `_creator`
- [ ] `validateSearch` con Zod normaliza defaults y rechaza tipos inválidos (test unitario)
- [ ] Sidebar `CreatorShell` incluye item `Campañas` activo en la ruta nueva
- [ ] `pnpm typecheck` y `pnpm lint` limpios

## Done summary
Ruta _creator/campaigns con validateSearch Zod, schema de search params completo, sidebar item, y regeneración de routeTree — todo correcto, typecheck/lint/tests limpios
## Evidence
- Commits:
- Tests:
- PRs: