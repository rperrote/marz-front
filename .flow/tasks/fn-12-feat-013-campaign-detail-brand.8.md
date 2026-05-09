---
satisfies: [R8, R10]
---

## Description

Suscribir el detalle de campaign al topic WS `campaign:{campaign_id}`. Patcha o invalida queries TanStack según el evento (`campaign.discovery.updated`, `campaign.participants.updated`, `campaign.videos.updated`, `campaign.activity.created`) y dedupea por `event_id`. Emite eventos producto (view/tab/section/mutations) al sistema de tracking existente.

**Size:** M
**Files:**

- `src/features/campaigns/detail/useCampaignTopicSubscription.ts`
- `src/features/campaigns/detail/tracking.ts`
- `src/features/campaigns/detail/CampaignDetailPage.tsx` (modificado: monta hook + emite eventos)
- `src/features/discovery/campaign-detail/mutations.ts` (modificado: emite eventos)

## Approach

- Hook `useCampaignTopicSubscription(campaignId)`:
  - Llama a `useWebSocket` (`src/shared/ws/useWebSocket.ts`) con topic `campaign:${campaignId}` y handler tipado por `DomainEventEnvelope<T>`.
  - Mantiene `Set<event_id>` (LRU 200) para dedupe in-memory.
  - Por evento:
    - `discovery.updated` → patch counts en `summary` + invalidate sección `changed.section`.
    - `participants.updated` → invalidate `participants` (campaign) + `overview` `creators_preview`.
    - `videos.updated` → invalidate `videos` (campaign) + `overview` activity.
    - `activity.created` → prepend en cache de `overview.recent_activity` si keys coinciden, fallback invalidate.
- Tracking: thin wrapper sobre el sistema existente (buscar `analytics`/`track` en repo). Eventos:
  - `campaign_detail_viewed` (mount con `campaign_id`).
  - `campaign_detail_tab_changed` (cambio de tab; `from/to`).
  - `discovery_section_viewed` (cambio de section).
  - `discovery_match_contacted`, `discovery_application_decided` (`accept/reject`), `discovery_invite_created` (mode email/in_platform).

## Investigation targets

**Required:**

- `src/shared/ws/useWebSocket.ts` — firma actual y tipos `DomainEventEnvelope`
- Sistema de tracking existente (grep por `track(`, `analytics`, `posthog`, `segment` en `src/`)
- TanStack Query: `setQueryData` patrones existentes

## Acceptance

- [ ] Hook se monta solo en route `_brand/campaigns.$campaignId` y se desmonta correctamente.
- [ ] Dedupe por `event_id` evita doble patch (test unitario sobre el reducer del set).
- [ ] Cada evento WS dispara la invalidación/patch correcto sin refetchear todo el tab.
- [ ] Eventos producto listados se emiten exactamente una vez por trigger (no en re-render).
- [ ] `pnpm typecheck` pasa con tipos `DomainEventEnvelope<T>` para los 4 payloads.

## Done summary
BC violations resueltas: tracking de discovery en shared/analytics/discoveryTracking.ts, DiscoverySection exportada desde tracking.ts local, sin imports cruzados entre BCs.
## Evidence
- Commits:
- Tests:
- PRs: