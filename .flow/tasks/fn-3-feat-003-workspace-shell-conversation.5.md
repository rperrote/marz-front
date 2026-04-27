---
satisfies: [R4]
---

## Description

`<CampaignFilterSelect/>` brand-only: single-select con campaigns activas/pausadas, default "Todas las campaigns". Maneja 409 (`validation.campaign_filter_invalid`) reseteando a "Todas" + toast neutro.

**Size:** S
**Files:**

- `src/features/chat/workspace/CampaignFilterSelect.tsx` (nuevo)
- Modificación: `src/routes/_brand/workspace.tsx` (montar el select solo en brand)
- Tests co-located

## Approach

- Consume `useGetApiV1Campaigns({ status: 'active,paused' })` (hook existente, FEAT-002).
- `<select>` o el primitivo de combobox del DS (chequear `src/components/ui/`). Primera opción "Todas las campaigns" con `value=""`.
- Cambio dispara `navigate({ search: { campaign_id: value || undefined }, replace: true })`.
- Manejo 409: si la query de conversations falla con `error.code === 'validation.campaign_filter_invalid'`, llamar `navigate` para borrar `campaign_id` + emitir toast (helper toast existente de FEAT-001/002).
- `staleTime: 60s` para campaigns.
- Mount condicional: solo en `routes/_brand/workspace.tsx`. NO existe en creator.

## Investigation targets

**Required:**

- `src/shared/api/generated/campaigns/` — hook existente
- `src/components/ui/select.tsx` o equivalente shadcn
- Helper de toast (grep `useToast` o `toast(`)
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §7.7 F.5

## Design context

Pencil `XSdsQ` muestra el select arriba del rail entre header y lista. Sigue el primitivo Select del DS. No introducir un componente nuevo.

## Acceptance

- [ ] `<CampaignFilterSelect/>` renderiza solo en `_brand/workspace`.
- [ ] Default "Todas las campaigns" como primera opción.
- [ ] Cambio escribe `?campaign_id=…` con `replace: true`.
- [ ] 409 (`validation.campaign_filter_invalid`) resetea a "Todas" + toast neutro.
- [ ] Tests: opciones cargadas, cambio dispara navigate, 409 handling.
- [ ] Creator workspace NO muestra el select.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary
done-placeholder
## Evidence
- Commits:
- Tests:
- PRs: