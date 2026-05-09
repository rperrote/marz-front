---
satisfies: [R2]
---

## Description

Filtros, búsqueda y sort con sincronización a URL search params. `niches` e `interests` son ejes independientes (filtros separados). Debounce sólo en `q`.

**Size:** M
**Files:**

- `src/features/discovery/campaign-board/CampaignBoardFilters.tsx`
- `src/features/discovery/campaign-board/CampaignBoardSort.tsx`
- `src/features/discovery/campaign-board/hooks/useBoardSearchSync.ts` (helper que une route search + setters)
- Tests unitarios

## Approach

- `useBoardSearchSync` envuelve `useSearch` + `useNavigate` de TanStack Router para mutar search params (replace, no push, en cambios menores).
- Search input con debounce 300ms en `q`. Resto de filtros se aplican on-change inmediatos.
- `CampaignBoardFilters`:
  - Search text
  - Multi-select chips/popover para `niches` (categorías macro), `interests` (tags finos), `platforms`, `deliverables`. Las opciones vienen de `response.filters.available`.
  - Fee range: dos inputs decimales USD; validación inline `fee_max >= fee_min`; cuando inválido, no dispara request y muestra error.
  - Slider 0..100 para `min_match_score`.
  - Switch `recommended_only`.
- `CampaignBoardSort`: select con las 4 opciones del schema (`match_score_desc`, `fee_desc`, `deadline_asc`, `recent_desc`). Default `match_score_desc`.
- Botón "Limpiar filtros" resetea a defaults preservando `recommended_only=false`.

## Investigation targets

**Required:**

- `@tanstack/react-router` `useSearch`, `useNavigate` (search params API)
- `src/features/discovery/campaign-board/search-schema.ts` (de F.1)
- `src/features/discovery/campaign-board/hooks/useCampaignBoardQuery.ts` (de F.2)
- shadcn Slider, Popover, Select, Input usados en otras features

**Optional:**

- Otras features con filtros + URL sync para igualar pattern

## Acceptance

- [ ] Cambios de filtros actualizan URL y disparan refetch (sin reload)
- [ ] `q` con debounce 300ms; resto on-change
- [ ] `niches` e `interests` son selectores independientes (test: aplicar uno no modifica el otro)
- [ ] Fee range con `fee_max < fee_min` muestra error inline y NO hace request
- [ ] Slider clamp 0..100
- [ ] "Limpiar filtros" restaura defaults
- [ ] Tests unitarios cubren: search por brand/campaign/niche, fee range inválido, clamp slider, reset

## Done summary
useCallback aplicado en setSearch y resetSearch con dep [navigate]; estabilidad de referencia restaurada, efecto de debounce ya no se re-ejecuta en re-renders del padre
## Evidence
- Commits:
- Tests:
- PRs: