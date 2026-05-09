---
satisfies: [R6, R11]
---

## Description

Tab `creators` con tabla **reusable** (`CampaignCreatorsTable`) parametrizada por `scope` para que en el futuro la usen tanto el detalle de campaign como una vista global de Creators. Consume `GET /v1/campaigns/{id}/participants` con search/status/platform y paginación cursor. Empty state con CTA hacia Discovery.

**Size:** M
**Files:**

- `src/features/campaigns/detail/CampaignCreatorsTable.tsx`
- `src/features/campaigns/detail/creators/CreatorsTab.tsx`
- `src/features/campaigns/detail/creators/CreatorsFilters.tsx`
- `src/features/campaigns/detail/creators/useCampaignParticipantsQuery.ts`

## Approach

- API de la tabla:
  - Prop `scope: { type: 'campaign'; campaignId: string } | { type: 'global'; brandWorkspaceId: string }` (esta task implementa `campaign`; `global` es opcional, dejar el branch escribible).
  - La tabla NO conoce search params; recibe `params` y `onParamsChange` (controlled) — el padre del scope mapea a/desde URL.
- Filters: search (debounced 300ms), status (chips), platform (select). Search params en URL para `q/status/platform`.
- Empty state: cuando `total_visible === 0` y sin filtros activos, CTA "Find creators" → navegar a `?tab=discovery`. Con filtros activos: "Clear filters".
- `actions.open_workspace` y `actions.invite_creator` controlan visibilidad de botones por fila; navegación a Workspace cuando aplica.

## Investigation targets

**Required:**

- Pencil nodes `zUZ3j` (Creators light), `j85X2` (Creators dark)
- `src/shared/api/generated/` — hook participants
- Tablas existentes en repo (buscar `Table` en `src/features/`) — patrón a seguir

## Design context

Tabla con rows redondeadas, hover sutil. Avatar + display_name + handle compactos. Status badges con tokens `--primary/--muted/--accent`. Platforms como íconos pequeños inline. Light + dark.

Full design system: `marz-design/marzv2.pen`.

## Acceptance

- [ ] `CampaignCreatorsTable` acepta `scope` y queda parametrizable para reuso futuro.
- [ ] Filtros search/status/platform persisten en URL.
- [ ] Paginación cursor funciona; cambiar filtro resetea cursor.
- [ ] Empty state muestra CTA correcto según hay/no filtros.
- [ ] `actions.open_workspace` navega; `actions.invite_creator` abre dialog (puede reusar `AddCreatorDialog` con creator preseleccionado si aplica).
- [ ] Visual fidelity ≥95% contra `zUZ3j` y `j85X2`.

## Done summary
Los tres issues del round anterior están corregidos: dialog deduplicado via ref+callback, heading h1→h2, y cobertura de formatLastActivity con vi.setSystemTime. Sin problemas nuevos introducidos.
## Evidence
- Commits:
- Tests:
- PRs: