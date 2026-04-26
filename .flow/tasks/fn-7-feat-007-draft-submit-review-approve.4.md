---
satisfies: [R4, R6, R9]
---

## Description

Construir el `DeliverableListPanel` (panel lateral derecho del Workspace) que lista los `Deliverable` de la current offer. Soporta los tres tipos de offer: `single`, `bundle`, `multistage`. Para `multistage` agrupa por `Stage`, deshabilita "Upload draft" para stages `locked`, y refleja transiciones de stage en vivo.

**Size:** M (componente nuevo + integración en 2 rutas, lógica de tres modos)
**Files:**

- `src/features/deliverables/components/DeliverableListPanel.tsx` (nuevo)
- `src/features/deliverables/components/DeliverableListItem.tsx` (nuevo — wrapper sobre `Card/Deliverable` `zcddo`)
- `src/features/deliverables/components/MultistagePanelGroup.tsx` (nuevo — agrupador por stage)
- `src/routes/_brand/workspace/$conversationId.tsx` (modificar — montar el panel)
- `src/routes/_creator/workspace/$conversationId.tsx` (modificar — montar el panel)
- `src/features/deliverables/components/__tests__/DeliverableListPanel.test.tsx` (nuevo)
- `tests/e2e/feat007/multistage-stage-unlock.spec.ts` (nuevo, si Playwright ya scaffold-eado en repo; si no, crear unit equivalente y abrir issue)

## Approach

**`DeliverableListPanel`:**

- Carga `useGetConversationDeliverablesQuery({ conversationId })`. La query ya se prefetcha en el `loader` de la ruta (SSR-friendly).
- Si `offer_type === 'single'` o `'bundle'`: lista plana, un `DeliverableListItem` por `deliverable`.
- Si `offer_type === 'multistage'`: itera `stages[]` y por cada uno renderiza `<MultistagePanelGroup>` con los `deliverable_ids` filtrados.
- Empty state: si `offer_id === null` (no hay current offer) → texto "No active offer yet."
- Frame Pencil: `J6Q0y` (single/bundle), `zKjTc` (multistage container).

**`DeliverableListItem`:**

- Reusa visualmente `Card/Deliverable` (`zcddo`). Muestra: platform icon, format, status badge, deadline, version (`vN` si hay `current_version`).
- Botón "Upload draft": visible solo para creator. Disabled si:
  - `deliverable.status` ∈ `{'draft_approved', 'link_submitted', 'link_approved', 'completed'}`, o
  - `stage.status === 'locked'` (multistage).
- Click sobre el botón abre `<UploadDraftDialog>` (de F.2) con `deliverableId` correspondiente.

**`MultistagePanelGroup`:**

- Header: nombre del stage + status badge (`locked` / `open` / `approved`) + deadline.
- Lista de `DeliverableListItem`.
- Estilo distinto por status del stage (locked → opacity, approved → check icon).

**Integración en rutas:**

- `_brand/workspace/$conversationId.tsx` y `_creator/workspace/$conversationId.tsx` ya tienen un slot para el panel lateral derecho (definido en FEAT-003 `BrandShell`/`CreatorShell` o equivalente). Insertar `<DeliverableListPanel conversationId={...} />` en ese slot.
- `loader` agrega `queryClient.ensureQueryData(getConversationDeliverablesOptions({ conversationId }))` para prefetch SSR.

**Tests:**

- `DeliverableListPanel.test.tsx`: con MSW o `vi.mock`, casos:
  - `offer_type='single'` con 1 deliverable → 1 item
  - `offer_type='bundle'` con 3 deliverables → 3 items planos
  - `offer_type='multistage'` con 2 stages (1 open + 1 locked) → 2 grupos, items del locked tienen botón disabled
  - `offer_id=null` → empty state
- E2E `multistage-stage-unlock.spec.ts` (si Playwright disponible): aprobar último deliverable de un stage activo → el stage siguiente se "abre" sin reload (depende de WS de F.5; este test valida la integración E2E completa entre F.3, F.4 y F.5).

## Investigation targets

**Required:**

- `src/routes/_brand/workspace/$conversationId.tsx` — entender el layout actual y dónde montar el panel
- `src/routes/_creator/workspace/$conversationId.tsx` — idem
- `src/features/identity/components/BrandShell.tsx` y `CreatorShell.tsx` — si el panel slot vive en el shell o en la ruta
- `src/shared/api/generated/endpoints.ts` (post-F.1) — `useGetConversationDeliverablesQuery` y la shape del response
- `src/router.tsx` — patrón de `loader` + `ensureQueryData`
- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §4.1.5 (response shape) y §7.2 (frames)

**Optional:**

- Frames Pencil `J6Q0y`, `XpxPI`, `zKjTc`, `zcddo`
- Tasks de FEAT-006 (`fn-6-...-multistage`) para entender cómo se definió el patrón de stages en frontend (puede haber un componente `StageBadge` reusable)

## Design context

- **Panel lateral:** width fija (300-360px desktop), full-height, `bg-background`, border izquierdo `--border`.
- **DeliverableListItem (frame `zcddo`):** rounded-xl, padding interno, hover state con `--muted`, status badge usa colores semánticos (`--accent` / `--success` / `--muted`).
- **MultistagePanelGroup (frame `zKjTc`):** header con stage name bold + badge, separador entre grupos.
- **Locked state:** opacity-60 + ícono lock + botón "Upload draft" disabled con tooltip "Stage not yet open."
- **Approved state:** check ícono `--success`, sin botón.

UI redondeada siempre. Mobile: el panel se transforma en bottom sheet (responsive — fuera de scope de este task pero dejar el componente CSS-grid friendly).

Full design system: `src/styles.css`.

## Acceptance

- [ ] `DeliverableListPanel` rinde correctamente para los 3 tipos de offer.
- [ ] Para `multistage`, agrupa por stage y respeta los 3 estados (`locked` / `open` / `approved`).
- [ ] El botón "Upload draft" se deshabilita en stages `locked` y en deliverables ya aprobados/post-aprobación.
- [ ] El panel se monta en el shell de brand y de creator.
- [ ] El `loader` de las rutas Workspace prefetchea `useGetConversationDeliverablesQuery`.
- [ ] Empty state cuando `offer_id === null`.
- [ ] Click en "Upload draft" abre `UploadDraftDialog` de F.2 con el `deliverableId` correcto (puede stub-earse si F.5 aún no completó).
- [ ] Unit tests cubren los 3 tipos de offer y los 3 estados de stage.
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.
- [ ] Validación visual Pencil ≥95% sobre `J6Q0y` y `zKjTc`, light + dark.

## Done summary

_To be filled by the worker._

## Evidence

_Logs, screenshots, or test output go here._
