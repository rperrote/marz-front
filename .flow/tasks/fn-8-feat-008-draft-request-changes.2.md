---
satisfies: [R1, R8, R9, R10]
---

## Description

Modal de "Request changes" con preview reproducible del video, chips seleccionables de `Change category`, textarea de notas. Hook `useRequestChangesFlow` orquesta validación client-side + Idempotency-Key + mutation. Componente `ChangeCategoryChip` reusable. Validación: ≥1 categoría; si `Other` ∈ categorías → notas no-vacías; notas ≤4000 runas. Mapeo de errores 409/422/403 del backend a estados de UI sin perder lo tipeado.

**Size:** M
**Files:**

- `src/features/deliverables/components/RequestChangesModal.tsx` (nuevo)
- `src/features/deliverables/components/ChangeCategoryChip.tsx` (nuevo)
- `src/features/deliverables/hooks/useRequestChangesFlow.ts` (nuevo)
- `src/features/deliverables/components/__tests__/RequestChangesModal.test.tsx`
- `src/features/deliverables/hooks/__tests__/useRequestChangesFlow.test.tsx`

## Approach

- Modal usa primitive base de `src/shared/ui/wizard/` o `src/components/ui/dialog.tsx` (shadcn), foco atrapado, ESC cierra.
- Estado del form local con `react-hook-form` + Zod schema generado por Orval (`requestChangesRequestSchema`). Set de chips manejado como `Set<ChangeCategory>` en estado controlled.
- `ChangeCategoryChip`: molécula con `aria-pressed`, toggle de `selected`. Usa tokens (`$--radius-md`, `$--spacing-2`); estado seleccionado = fill primary, default = outline.
- `useRequestChangesFlow(deliverableId, currentDraftId)`:
  - Genera `Idempotency-Key` UUID v4 al montar (una por apertura del modal).
  - `submit({ categories: Set, notes: string })` ordena el `Set` determinísticamente, llama `useRequestChangesMutation` con header `Idempotency-Key`.
  - `canSubmit` deriva de `categories.size >= 1 && (!categories.has('other') || notes.trim().length > 0) && notes.length <= 4000`.
  - Mapea errores: 422 `validation_error` → highlight del campo (`error.details.field`); 409 `change_request_already_exists` → toast "Already requested" + cierre soft; 403 `forbidden_role` → estado de error fatal.
- Preview del video: reusar el primitive `InlineVideoPlayer` de FEAT-007 si existe (`src/features/deliverables/components/InlineVideoPlayer.tsx`). Toma `playback_url` del `DraftDTO` actual.

**Reuse points** (no reescribir):

- Mutator de Orval (auth/errors) — pasar `Idempotency-Key` via override de headers en el call.
- `InlineVideoPlayer` (FEAT-007) — reproducir el draft current dentro del modal.
- `react-hook-form` + Zod adapter ya configurado en el repo (FEAT-001/002).

## Investigation targets

**Required**:

- `src/features/deliverables/components/DraftSubmittedCard.tsx` — para entender desde dónde se va a abrir el modal en F.3
- `src/features/deliverables/components/InlineVideoPlayer.tsx` (FEAT-007) — preview del draft
- `src/shared/ui/wizard/` — primitives de modal/forms reusables
- `src/shared/api/generated/zod/` — schemas Zod regenerados por F.1
- `src/components/ui/dialog.tsx` — primitive shadcn de modal

**Optional**:

- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (FEAT-007) — patrón de hook orquestador

## Design context

Frames de referencia (Pencil): `EJfv5`, `nTTdM` (modal Request Changes light/dark), instancia `ZEKzd` (Modal/RequestChanges en librería). Sub-elementos: chips de `Change category`. Validación visual ≥95%.

- Tokens: `$--radius-lg` para el modal, `$--spacing-*` para gaps; chip seleccionado usa fill `--primary`, default usa border `--border`.
- Tipografía y dark mode desde tokens; nunca hardcodear hex.
- Botón "Send request" usa el primary color (acción más importante de la pantalla).

## Acceptance

- [ ] `RequestChangesModal` renderiza preview reproducible del video del draft current, chips de las 5 categorías, textarea de notas con contador (max 4000), botón "Send request" + "Cancel".
- [ ] `submit` deshabilitado mientras `categories.size === 0`.
- [ ] `submit` deshabilitado si `Other` está seleccionado y notas son vacías o solo whitespace.
- [ ] `submit` habilitado con cualquier otra categoría sin `Other` y notas vacías.
- [ ] Toggle de chip deselecciona; ESC cierra el modal sin disparar mutation.
- [ ] Error 422 del backend resalta el campo con copy del `details.field`; el form mantiene los valores tipeados.
- [ ] Error 409 `change_request_already_exists` cierra el modal con toast informativo.
- [ ] Error 403 `forbidden_role` muestra estado de error fatal sin permitir reintento.
- [ ] `useRequestChangesFlow` genera un `Idempotency-Key` distinto por apertura del modal (verificable en mock).
- [ ] Tests Vitest pasan: validación de submit, toggle, ESC, error mapping, idempotency-key uniqueness.
- [ ] A11y: foco atrapado en modal, chips con `role="button"` + `aria-pressed`, textarea con `aria-describedby` apuntando al mensaje de validación cuando aplica.
- [ ] Validación visual Pencil ≥95% contra `EJfv5` y `nTTdM` (light + dark) con screenshots adjuntos al PR.

## Done summary

_Pendiente de implementación._

## Evidence

_Pendiente de implementación._
