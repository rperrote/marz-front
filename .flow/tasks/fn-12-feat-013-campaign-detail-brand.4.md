---
satisfies: [R4, R11]
---

## Description

Tab `discovery` read-only: sidebar con counts (matches/applications/active/invited) desde `/discovery/summary` + sección activa controlada por search param `section` (default `matches`). Listas paginadas con cursor para cada sección y sorting (`match_score|followers|fee|engagement`) en matches. Sin mutaciones (van en task 5).

**Size:** M
**Files:**

- `src/features/discovery/campaign-detail/DiscoveryTab.tsx`
- `src/features/discovery/campaign-detail/DiscoverySidebar.tsx`
- `src/features/discovery/campaign-detail/MatchCard.tsx`
- `src/features/discovery/campaign-detail/ApplicationCard.tsx`
- `src/features/discovery/campaign-detail/InviteList.tsx`
- `src/features/discovery/campaign-detail/ActiveCollaborationList.tsx`
- `src/features/discovery/campaign-detail/queries.ts` (hooks de query)

## Approach

- Hooks: `useCampaignDiscoverySummaryQuery`, `useCampaignMatchesQuery`, `useCampaignApplicationsQuery`, `useCampaignInvitesQuery`, `useCampaignActiveQuery`. Keys `["campaign", id, "discovery", section, params]`.
- Paginación: `useInfiniteQuery` con `next_cursor`.
- Sorting matches: control en sidebar/header de la sección que actualiza search param `sort`.
- Sidebar muestra counts + indicador de availability (`availability.message`, `can_view_matches`).
- Empty states por sección con copy específica.
- Cards (Match/Application/Invite) son **read-only**: botones de acción quedan deshabilitados o ausentes hasta task 5 (mejor: no renderizar acciones todavía para evitar dead state).

## Investigation targets

**Required:**

- Pencil nodes `1WW1E` (Discovery light), `CK94g` (Discovery dark)
- `src/shared/api/generated/` — hooks generados Discovery
- TanStack Query infinite query patterns en repo (buscar usos existentes)

## Design context

Sidebar fijo a la izquierda del body de tab. Cards redondeadas, padding generoso. Avatars circulares. Tokens `--primary` solo para CTA principal por sección (regla del design system: una primary por screen).

Full design system: `marz-design/marzv2.pen`.

## Acceptance

- [ ] Sidebar muestra counts correctos desde `/summary` y reacciona a cambio de `section`.
- [ ] Cada sección lista datos con paginación cursor.
- [ ] Sorting en matches actualiza URL search param `sort` y refetchea.
- [ ] Empty list NO genera error visible.
- [ ] Default `section=matches` cuando no viene en URL.
- [ ] Visual fidelity ≥95% contra `1WW1E` y `CK94g`.

## Done summary
Todos los fixes del round 2 aplicados correctamente. utils.ts, DiscoveryTab y DiscoverySidebar están sin errores de compilación ni problemas de locale. El resto del BC estaba correcto desde el round anterior.
## Evidence
- Commits:
- Tests:
- PRs: