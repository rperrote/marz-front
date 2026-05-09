---
satisfies: [R1, R2]
---

## Description

Crear la ruta `_brand/campaigns.$campaignId.tsx` con `validateSearch` (Zod), guard de role (creator → no acceso al brand shell), header persistente y tabs deep-linkeables. La tab `analytics` aparece disabled con tooltip y no navega. El header consume `GET /v1/campaigns/{campaign_id}/detail` y queda en una query independiente para no refetchear al cambiar de tab.

**Size:** M
**Files:**

- `src/routes/_brand/campaigns.$campaignId.tsx` (nuevo)
- `src/features/campaigns/detail/CampaignDetailPage.tsx`
- `src/features/campaigns/detail/CampaignDetailHeader.tsx`
- `src/features/campaigns/detail/CampaignDetailTabs.tsx`
- `src/features/campaigns/detail/useCampaignDetailQuery.ts`
- `src/routes/_brand/campaigns.index.tsx` (modificado: link → `/campaigns/$campaignId`)

## Approach

- `validateSearch` con Zod: `tab` enum default `overview`, `section` enum default `matches` opcional, `q/status/platform/sort` opcionales (ver §7.1 de la spec).
- Loader del route: usar el guard `_brand` ya existente para session.kind === "brand"; si la campaña no existe → 404 dentro del shell (no filtrar existencia cross-workspace).
- Header consume `useCampaignDetailQuery` (key `["campaign", campaignId, "detail"]`); muestra nombre, status, deadline, brief CTAs, plan capabilities. Persiste entre cambios de tab.
- Tabs: wrapper sobre `CampaignWorkspaceTabs` si existe (revisar `src/features/campaigns/components/`); soporta tab disabled con tooltip + ARIA `aria-disabled`. Cambiar tab → `navigate({ search: prev => ({ ...prev, tab }) })` sin remount.
- Body por tab inicialmente con placeholder; las tasks 3/4/6/7 lo llenan.

## Investigation targets

**Required:**

- `src/routes/_brand/` — patrón existente del shell brand y guards
- `src/routes/_brand/campaigns.index.tsx` — link actual a campaigns
- `src/features/campaigns/components/CampaignWorkspaceTabs.tsx` (si existe)
- `src/shared/api/generated/` — hook generado para `getCampaignDetail`
- Pencil node `vmHz8` (header + tabs)

## Design context

Tokens shadcn desde `src/styles.css` (mapeados de `marzv2.pen`). UI redondeada (radios generosos, sin esquinas cuadradas). Light + dark obligatorios. Tab disabled debe mostrar variante `muted` con cursor `not-allowed` y tooltip explicando por qué.

Full design system: `marz-design/marzv2.pen` (vía MCP `pencil`).

## Acceptance

- [ ] Ruta `/campaigns/$campaignId?tab=overview` carga para brand user; creator session no accede.
- [ ] `validateSearch` rechaza tab inválida y cae a `overview`.
- [ ] Header se renderiza con datos de `/detail`; cambiar tab no refetchea el header.
- [ ] Tab `analytics` está disabled, muestra tooltip y no navega; las otras 4 navegan vía URL.
- [ ] `pnpm typecheck` y `pnpm lint` pasan.
- [ ] Visual fidelity ≥95% contra Pencil `vmHz8` en light + dark.

## Done summary
Ruta de detalle de campaña para brand completa: validateSearch con Zod, guard via _brand existente, header con query independiente, tabs deep-linkeables con analytics disabled + tooltip, tests de schema y de tabs, accesibilidad correcta.
## Evidence
- Commits:
- Tests:
- PRs: