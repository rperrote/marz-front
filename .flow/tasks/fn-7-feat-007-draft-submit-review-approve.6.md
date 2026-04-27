---
satisfies: [R8]
---

## Description

Agregar tracking client-side de los 8 analytics events declarados en §10 del solution doc, vía `POST /api/v1/analytics/events` (endpoint genérico FEAT-002). Cablearlos a los puntos correctos de `useDraftUploadFlow`, `ApproveDraftButton`, `InlineVideoPlayer` y `DeliverableListPanel`.

**Size:** S
**Files:**

- `src/features/deliverables/analytics.ts` (nuevo)
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (modificar — invocar trackers)
- `src/features/deliverables/components/ApproveDraftButton.tsx` (modificar — invocar tracker)
- `src/features/deliverables/components/InlineVideoPlayer.tsx` (modificar — `trackDraftPlayerPlayed` en `onPlay`)
- `src/features/deliverables/components/DraftSubmittedCard.tsx` (modificar — `trackDraftSubmittedCardSeen` con IntersectionObserver o equivalente)
- `src/shared/ws/handlers.ts` (modificar — `trackMultistageStageUnlocked` en `stage.opened` recibido por brand)
- `src/features/deliverables/__tests__/analytics.test.ts` (nuevo)

## Approach

**`analytics.ts`** expone 8 helpers tipados, todos delgados sobre un `postAnalyticsEvent(name, props)` único:

- `trackUploadStarted({ deliverable_id, file_size_bytes, content_type })`
- `trackUploadProgress({ deliverable_id, milestone })` — milestone ∈ `{25, 50, 75}`. Disparar 1 vez por milestone (deduplicar en el hook).
- `trackUploadCompleted({ deliverable_id, draft_id, version, duration_ms })`
- `trackUploadFailed({ deliverable_id, reason })` — reason matches `UploadError.kind` de F.2.
- `trackDraftSubmittedCardSeen({ message_id, deliverable_id, version })` — disparar cuando la card entra al viewport (IntersectionObserver, threshold 0.5).
- `trackDraftPlayerPlayed({ deliverable_id, draft_id })` — primera vez por sesión por draft (state local en el player).
- `trackDraftApproved({ deliverable_id, draft_id, version })`
- `trackMultistageStageUnlocked({ offer_id, stage_id, position })` — solo en brand cuando llega `stage.opened` (no en `stage.approved`; el unlock corresponde al opened).

**Implementación de `postAnalyticsEvent`:**

- Llama al endpoint `POST /api/v1/analytics/events` (existe desde FEAT-002). Usar el hook generado por Orval si está disponible o el `mutator.ts` directo (no se quiere bloquear la UX si falla → fire-and-forget con `.catch(noop)`).
- Body: `{ event_name: string, properties: object, occurred_at: ISOString }`.

**Cableado:**

- En `useDraftUploadFlow`:
  - `start` → `trackUploadStarted` con tamaño/MIME del file.
  - Dentro del `xhr.upload.onprogress` listener, calcular `milestone` y disparar `trackUploadProgress` cuando cruza 25/50/75 (state local `seenMilestones: Set<number>`).
  - `complete` exitoso → `trackUploadCompleted` con `duration_ms` (`Date.now() - startedAt`).
  - Cualquier rama de error → `trackUploadFailed` con `error.kind`. NO disparar en `cancelled` (rule: cancelled tiene su propio kind y se trackea como `failed` con `reason='cancelled'` por simplicidad — confirmar consistencia con backend §10).
- En `ApproveDraftButton.onSuccess` → `trackDraftApproved`.
- En `InlineVideoPlayer.onPlay` (callback prop) → `trackDraftPlayerPlayed`.
- En `DraftSubmittedCard` → IntersectionObserver hook → `trackDraftSubmittedCardSeen` una vez (ref).
- En `handlers.ts` case `'stage.opened'` (preexistente o creado en F.5) → `trackMultistageStageUnlocked`.

## Investigation targets

**Required:**

- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §10 (analytics events) — shape exacto y nombres
- `src/shared/api/generated/endpoints.ts` — existe `usePostAnalyticsEventMutation`? (probable, FEAT-002)
- Tasks de FEAT-002 para entender el patrón actual de analytics en frontend (puede haber ya una utility tipo `track()`)
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (post-F.2) — hooks lifecycle donde insertar trackers

**Optional:**

- `src/shared/api/mutator.ts` — para usar fire-and-forget directo si Orval no expone hook útil

## Key context

- **Fire-and-forget:** los trackers nunca deben bloquear ni romper la UX. `.catch(noop)`.
- **Dedupe milestones:** `useDraftUploadFlow` debe mantener un `Set` por upload; al `start` resetearlo.
- **Card seen:** un solo tracker por `message_id` + sesión (usar ref + flag, no state si no causa re-render).
- **No SSR:** los trackers son client-only. Wrappear en `if (typeof window !== 'undefined')` o asumir client por contexto (los componentes que los invocan son client-only).

## Acceptance

- [ ] `src/features/deliverables/analytics.ts` exporta 8 helpers tipados.
- [ ] Cada helper invoca `POST /api/v1/analytics/events` con shape correcto (verificado en tests con `fetch` mock).
- [ ] `useDraftUploadFlow` dispara `trackUploadStarted` / `trackUploadProgress` (25/50/75 dedupeados) / `trackUploadCompleted` / `trackUploadFailed`.
- [ ] `ApproveDraftButton` dispara `trackDraftApproved` en `onSuccess`.
- [ ] `InlineVideoPlayer` dispara `trackDraftPlayerPlayed` en primer play por draft por sesión.
- [ ] `DraftSubmittedCard` dispara `trackDraftSubmittedCardSeen` una vez cuando entra al viewport.
- [ ] `handlers.ts` dispara `trackMultistageStageUnlocked` en `stage.opened` (solo brand).
- [ ] Tests con `fetch` mock afirman shape del body para los 8 trackers.
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.
- [ ] Errores de la red de analytics no rompen la UX (verificable mockeando 500 → `useDraftUploadFlow` sigue completando OK).

## Done summary

Todos los cambios son correctos. analytics.ts usa event_name/occurred_at consistente con el contrato. trackUploadFailed se llama en onabort con reason 'cancelled'. Tests actualizados con los campos correctos sin typos. StageOpenedWSPayload tipado y exportado. handlers.ts dispara analytics solo para sessionKind === 'brand'. InlineVideoPlayer deduplica por draftId con módulo-level Set. DraftSubmittedCard usa IntersectionObserver con seenRef para disparar una sola vez. ApproveDraftButton recibe draftId y trackea en onSuccess. Sin deuda técnica.

## Evidence

- Commits:
- Tests:
- PRs:
