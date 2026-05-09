---
satisfies: [R3, R8]
---

## Description

`Sheet` lateral con detail read-only del brief: description, tone, key_messages, do/don't lists, ICP, scoring dimensions visibles para el creator, deliverables, commercial. Lazy-load por `campaign_id`. Sin acciones de invite/offer.

**Size:** M
**Files:**

- `src/features/discovery/campaign-board/CampaignBriefSheet.tsx`
- `src/features/discovery/campaign-board/CampaignBriefContent.tsx` (presentational)
- `src/features/discovery/campaign-board/CampaignBoardCard.tsx` (modificar: wire `Ver brief`)
- Tests unitarios + axe

## Approach

- `CampaignBriefSheet` recibe `campaignId | null` y `onOpenChange`. Cuando abre, llama `useCampaignBoardDetailQuery(campaignId, enabled=true)`.
- Cache por `campaign_id` lo maneja la query key (F.2). Reaperturas no refetchean si está fresh.
- Contenido respeta el shape `CampaignBoardBriefSnapshot` + `CampaignBoardTargetingSnapshot` + `CampaignBoardCommercialSnapshot` (§3.4 solution).
- `Sheet` desde shadcn (existente en `src/shared/ui/sheet.tsx` o equivalente). Cierre por Escape, click overlay y botón close.
- Mostrar mismatch reasons del card.match cuando aplique (transparencia: por qué no es recomendado).
- NO renderizar botones de aceptar/declinar/invitar — eso es FEAT-015.

## Investigation targets

**Required:**

- `src/shared/ui/sheet.tsx` (o equivalente shadcn en el repo)
- `src/features/discovery/campaign-board/hooks/useCampaignBoardDetailQuery.ts` (de F.2)
- `marz-docs/features/FEAT-017-creator-campaigns-board/03-solution.md` §3.4 (shapes) y §4.1 (detail response)

**Optional:**

- Otras features con `Sheet` para igualar estilo

## Design context

- Tokens del repo. UI redondeada. Layout vertical con secciones claramente separadas.
- Referencia visual: Pencil `g941zm` (vista de brief si existe; si no, derivar del estilo de cards).

## Acceptance

- [ ] Click `Ver brief` abre el sheet, query corre on-open
- [ ] Reapertura del mismo `campaign_id` no refetchea (cache hit)
- [ ] Renderiza description, key_messages, do/don't, ICP, deliverables, commercial
- [ ] No expone acciones de invite/offer/accept
- [ ] Cierra con Escape, overlay y botón close
- [ ] `404 campaign_board_listing_not_found` y `409 campaign_not_available` muestran estado correspondiente y permiten cerrar
- [ ] Axe sin violations críticas

## Done summary
Key de deliverables corregida con índice, SheetSkeleton usa role=status con axe test de carga agregado. Implementación completa y correcta.
## Evidence
- Commits:
- Tests:
- PRs: