---
satisfies: [R3, R4]
---

## Description

Agregar `InboxToolbar` con tres controles: filtro de campaign (lista de `campaign_filter_options` del response, opción "All"), botón refresh manual y botón "Mark all as read". Conectar mark-read individual desde cada `InboxItemRow`. El filtro vive en search params (`?campaign_id=...`); cambiarlo invalida y refetcha. Mark-all envía el `campaign_id` y `sections` actuales.

**Size:** M
**Files:**

- `src/features/inbox/InboxToolbar.tsx` (nuevo)
- `src/features/inbox/InboxPage.tsx` (modificado: monta toolbar y pasa campaignId desde search params)
- `src/features/inbox/InboxItemRow.tsx` (modificado: botón "Mark read")

## Approach

- Filtro: `<Select>` (shadcn) poblado con `campaign_filter_options[]` + opción "All campaigns" que limpia el search param. Usar `useNavigate({ to: '/inbox', search: { campaign_id } })` de TanStack Router para mutar search params; no Zustand.
- Refresh: botón que invalida `['inbox']` (no `refetch()` directo — invalidar es más limpio y respeta query state).
- Mark-all: usa `useMarkInboxVisibleReadMutation` con `{ campaign_id: currentCampaignId, sections: undefined }` (default ambas). Disabled si `counts.action + counts.waiting === 0`.
- Mark-read individual: usa `useMarkInboxItemReadMutation`. Sin optimistic update — mostrar spinner pequeño en el row hasta que invalide. 409 `inbox_item_not_actionable` muestra toast neutro y refetcha.

## Investigation targets

**Required:**

- `src/components/ui/select.tsx` (shadcn) — componente de filtro
- `src/features/chat/` o `src/features/offers/` — patrón de mutación con toast de error
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §4.1 (contratos mark-read) y §7.4 task F.4

## Acceptance

- [ ] Cambiar filtro de campaign actualiza `?campaign_id=...` en URL y refetcha.
- [ ] Seleccionar "All" elimina el param de la URL.
- [ ] Refresh button invalida `['inbox']` y muestra loading state breve.
- [ ] "Mark all as read" envía `campaign_id` actual; success refetcha y los counts caen.
- [ ] Mark-read individual oculta el item de la sección al refetchar (status pasa a `read`).
- [ ] 409 en mark-read individual muestra toast y refetcha sin romper UI.
- [ ] Mutations usan `Idempotency-Key` (UUID v7 por request).
- [ ] Unit test: cambiar filtro → query key cambia; mark-all calls mutation con campaign actual.

## Done summary
InboxToolbar implementado correctamente con filtro, refresh e invalidación por prefix matching, mark-all con disabled state y Idempotency-Key en ambas mutations; mark-read individual con toast diferenciado 409 vs otros errores y hook que invalida en onError; tests cubren los acceptance criteria explícitos; typecheck, lint y suite pasan sin errores
## Evidence
- Commits:
- Tests:
- PRs: