---
satisfies: [R7, R11]
---

## Description

Tab `videos` con grid **reusable** (`CampaignVideosGrid`) parametrizado por `scope` (campaign / global futuro). Consume `GET /v1/campaigns/{id}/videos` con filtros search/status/platform/creator_account_id. Click en card navega al reviewer existente. Empty state CTA hacia `tab=creators`.

**Size:** M
**Files:**

- `src/features/campaigns/detail/CampaignVideosGrid.tsx`
- `src/features/campaigns/detail/videos/VideosTab.tsx`
- `src/features/campaigns/detail/videos/VideosFilters.tsx`
- `src/features/campaigns/detail/videos/useCampaignVideosQuery.ts`

## Approach

- API del grid: `scope` igual que la table de creators (campaign / global).
- Cards muestran `thumbnail_url` (fallback gris), badge de `status`, `duration_sec` formateado, plataforma + format, avatar de creator, `submitted_at` relativo.
- Click en card → navegar a `reviewer_url` (o ruta existente que envuelva al reviewer interno; verificar en investigation).
- `playback_url` y `thumbnail_url` son signed URLs efímeros (1h TTL) — no cachear en localStorage.
- Filters: search (deb 300ms), status, platform, creator (autocomplete sobre participants).
- Empty state sin participantes activos → CTA "Invite creators" → `?tab=creators`.

## Investigation targets

**Required:**

- Pencil nodes `S5AMj` (Videos light), `NJt6c` (Videos dark)
- `src/shared/api/generated/` — hook videos
- Reviewer route existente (buscar `reviewer` o `deliverables` en `src/routes/`)

## Design context

Grid de cards redondeadas, aspect ratio 16:9 para thumbnail. Light + dark. Status badges consistentes con CreatorsTable. Hover eleva la card sutil.

Full design system: `marz-design/marzv2.pen`.

## Acceptance

- [ ] `CampaignVideosGrid` acepta `scope` y queda reusable.
- [ ] Filtros search/status/platform/creator_account_id en URL.
- [ ] Click en card navega al reviewer existente (no se inventa ruta nueva).
- [ ] Empty state CTA correcto.
- [ ] Signed URLs no se cachean en storage.
- [ ] Visual fidelity ≥95% contra `S5AMj` y `NJt6c`.

## Done summary
pending agregado a statusOptions, Link reemplaza a href, y CampaignVideosGrid.test.tsx cubre los 5 casos requeridos. Typecheck pasa.
## Evidence
- Commits:
- Tests:
- PRs: