---
satisfies: [R3, R11]
---

## Description

Implementar la tab `overview` consumiendo `GET /v1/campaigns/{campaign_id}/overview`: tres stats (applications/reach/budget — sin `match_rate`, sin `progress`), bloque details (objective/deadline/budget/platforms/audience), preview de creators participantes y recent activity. Empty states para datos no críticos faltantes.

**Size:** M
**Files:**

- `src/features/campaigns/detail/OverviewTab.tsx`
- `src/features/campaigns/detail/overview/StatsBlock.tsx`
- `src/features/campaigns/detail/overview/DetailsBlock.tsx`
- `src/features/campaigns/detail/overview/CreatorsPreview.tsx`
- `src/features/campaigns/detail/overview/RecentActivity.tsx`
- `src/features/campaigns/detail/useCampaignOverviewQuery.ts`

## Approach

- Hook `useCampaignOverviewQuery(campaignId, { activityLimit: 5 })` con key `["campaign", campaignId, "overview"]`.
- Reach: si `state === "not_available"` mostrar placeholder neutro con copy de spec. Budget: format USD a partir de `total_amount/spent_amount` (USD-only, CF-13).
- CreatorsPreview reutiliza `CreatorCardSummary` (rows compactas).
- RecentActivity: lista de `CampaignActivityItem` con `occurred_at` formateado relativo, ícono por `source`.
- Empty states: cuando `creators_preview.length === 0` o `recent_activity.length === 0`, mostrar copy + CTA hacia Discovery/Creators según corresponda.

## Investigation targets

**Required:**

- `src/shared/api/generated/` — hook generado para overview
- Pencil nodes `SFWpj` (Overview light), `Rd4vP` (Overview dark)
- Helpers de format USD existentes (buscar en `src/shared/`)

## Design context

Tokens desde `src/styles.css`. Cards redondeadas, separación generosa. Light + dark. Layout desktop-only dentro del shell brand (no responsive).

Full design system: `marz-design/marzv2.pen`.

## Acceptance

- [ ] Stats render exactamente 3 (applications/reach/budget); reach honra `state`.
- [ ] Details muestra todos los campos del response sin inventar datos.
- [ ] Creators preview renderiza desde `creators_preview` (sin segundo fetch).
- [ ] Recent activity ordenada DESC por `occurred_at`, limit 5 por defecto.
- [ ] Empty states con CTAs correctos.
- [ ] Visual fidelity ≥95% contra `SFWpj` y `Rd4vP`.

## Done summary
Correcciones aplicadas: dead export eliminado, role=status en skeleton. Wiring en CampaignDetailPage correcto.
## Evidence
- Commits:
- Tests:
- PRs: