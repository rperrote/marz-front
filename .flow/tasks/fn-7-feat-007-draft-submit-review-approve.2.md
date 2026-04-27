---
satisfies: [R2, R9, R10]
---

## Description

Construir los componentes de upload (dialog + progress + error) y el player inline, además del hook custom `useDraftUploadFlow` que orquesta el flujo two-phase con `XMLHttpRequest` para reportar progreso de upload (capacidad que `fetch` no expone en upload bodies).

Este es el **early proof point** de la feature: si el flujo intent → PUT con `Content-Type` firmado → complete no funciona contra el dev backend, hay que re-evaluar el approach antes de seguir con F.3+.

**Size:** M (4 componentes + 1 hook coordinados, scope acotado a upload UX)
**Files:**

- `src/features/deliverables/components/InlineVideoPlayer.tsx` (nuevo)
- `src/features/deliverables/components/UploadDraftDialog.tsx` (nuevo)
- `src/features/deliverables/components/UploadProgressOverlay.tsx` (nuevo)
- `src/features/deliverables/components/UploadErrorBanner.tsx` (nuevo)
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (nuevo)
- `src/features/deliverables/components/__tests__/UploadDraftDialog.test.tsx` (nuevo)
- `src/features/deliverables/hooks/__tests__/useDraftUploadFlow.test.ts` (nuevo)

## Approach

**`useDraftUploadFlow(deliverableId)`:**

- Estado local: `{ status: 'idle' | 'requesting' | 'uploading' | 'completing' | 'done' | 'cancelled' | 'error', progress: 0..100, error: UploadError | null, intentId: string | null }`.
- `start(file)`:
  1. Llama `useRequestDraftUploadMutation` — recibe `{ intent_id, upload_url, headers, expires_at }`.
  2. Crea `XMLHttpRequest`, registra `upload.onprogress` (mapea `loaded/total` a `progress`), `onload`/`onerror`/`onabort`. `xhr.open('PUT', upload_url)` + setea cada header del response (`Content-Type` + `x-amz-meta-deliverable`).
  3. `xhr.send(file)`.
  4. En `onload` con `xhr.status` 2xx → llama `useCompleteDraftUploadMutation({ deliverableId, intentId, body: { duration_sec? } })`. Para `duration_sec` intentar leer del `<video>.duration` previo (load metadata off-DOM); si NaN/Infinity, mandar `null`.
  5. En éxito → `status='done'`, exponer `draft` resultante.
- `cancel()`: `xhr.abort()` + `useCancelDraftUploadMutation({ deliverableId, intentId })` best-effort. Status `cancelled`.
- Errores tipados (`UploadError = { kind: 'format' | 'size' | 'network' | 'server' | 'cancelled' | 's3_size_mismatch' | 's3_object_missing'; message: string }`) — el kind se deriva del `error.code` del backend (`mutator.ts` ya tipa `ApiError.code`).

**`UploadDraftDialog`:**

- shadcn `Dialog` (`src/components/ui/dialog.tsx`). Trigger viene de afuera (props `open`, `onOpenChange`).
- Drop zone con click + drag&drop. Validación client-side antes de invocar `start()`:
  - extension/MIME ∈ `{video/mp4, video/quicktime, video/webm}` (matching backend §4.1.1) → si no, `status='error'` kind `format`.
  - `file.size <= 2 * 1024 * 1024 * 1024` → si no, kind `size`.
- Renderizado conditional según status del hook: idle → drop zone, uploading/completing → `<UploadProgressOverlay>`, error → `<UploadErrorBanner>`, done → cierra el dialog (callback `onSuccess(draft)`).
- ESC y click outside cancelan (con confirm si hay upload en curso). Focus trap + `aria-labelledby`.
- Frame Pencil: `y7l3U` (open empty) y `u0zya` (with file selected).

**`UploadProgressOverlay`:**

- Barra `<progress>` (o div con `role="progressbar"` + `aria-valuenow={progress}` + `aria-valuemin=0` + `aria-valuemax=100`).
- Texto: filename + `${progress}%`.
- Botón "Cancel" → `hook.cancel()`.

**`UploadErrorBanner`:**

- Texto según `error.kind`:
  - `format`: "This file format isn't supported. Use MP4, MOV, or WebM."
  - `size`: "File too large (max 2 GB)."
  - `network`: "Upload failed. Check your connection and try again."
  - `server` / `s3_*`: "Something went wrong. Try again."
  - `cancelled`: no banner (volver a idle).
- Botón "Try again" → `setStatus('idle')`.

**`InlineVideoPlayer`:**

- `<video controls playsInline preload="metadata" src={playback_url} poster={thumbnail_url ?? undefined}>`.
- Aspect-ratio container (16:9 default). Tokens del `.pen`: rounded-lg, fondo `--muted`.
- `onError` → render fallback "Cannot play this video" (sin reintento auto — la `playback_url` es CloudFront signed con TTL 1h; si vence, TanStack Query refetch resuelve).
- Props: `{ playbackUrl, thumbnailUrl?, durationSec?, onPlay?, onPause? }`. `onPlay` callback se usa en F.6 para analytics.
- Frame Pencil dentro de `n9qKI` y `TkgaG`.

**Tests:**

- `UploadDraftDialog.test.tsx`: render + selección de `.zip` muestra `UploadErrorBanner` con kind `format`; selección > 2GB muestra kind `size`; archivo válido invoca `hook.start`. Mockear `useDraftUploadFlow`.
- `useDraftUploadFlow.test.ts`: mockear global `XMLHttpRequest` (clase fake con `upload.onprogress`, `onload`, `onerror`, `abort`). Casos: progress 0→100, abort durante upload, error 5xx en complete, idempotencia en re-complete del mismo intent. Mockear las mutations con MSW o `vi.mock` sobre el módulo Orval.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — verificar cómo se setea el bearer (NO debe ir al PUT a S3; el PUT usa solo los headers del response del intent)
- `src/shared/api/generated/endpoints.ts` (post-F.1) — firma exacta de los 3 mutation hooks de upload
- `src/components/ui/dialog.tsx` — Dialog primitive shadcn (focus trap, ESC, aria props)
- `src/styles.css` — tokens `--background`, `--muted`, `--border`, `--radius-lg`, etc.
- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §4.1.1, §4.1.2, §4.1.3 (contratos), §11 R6 (browsers viejos sin progress)

**Optional:**

- Frames Pencil `y7l3U`, `u0zya` via `mcp__pencil__batch_get` (visual ref para validación)
- `src/features/identity/components/*` — patrón de form validation existente

## Design context

Relevant `marzv2.pen` frames y tokens del `.pen` (mapeados en `src/styles.css`):

- **Modal/Dialog:** rounded-2xl, padding generoso, fondo `--background`, border `--border`. Frame `y7l3U`.
- **Drop zone:** dashed border `--border` 2px, hover state cambia border a `--primary`. Centra ícono + texto.
- **Progress bar:** altura `--spacing-2`, color `--primary` sobre fondo `--muted`, `--radius-full`.
- **Player:** aspect-ratio 16:9, `--radius-lg`, fondo `--muted` mientras carga.
- **Botones:** primary fill `--primary`, destructive (Cancel mid-upload) usa `--destructive`. Siempre rounded.

UI redondeada siempre. Nunca hardcodear colores: usar utilities (`bg-background`, `text-foreground`, `rounded-lg`) o `var(--token)`. Light + dark.

Validación visual: `mcp__pencil__get_screenshot` sobre `y7l3U` (idle), `u0zya` (uploading) en light + dark, comparar con render Playwright. Target ≥95% match.

Full design system: leer tokens en `src/styles.css` antes de implementar.

## Acceptance

- [ ] `useDraftUploadFlow` ejecuta el flujo completo intent → PUT (con XHR + progress) → complete contra dev, devolviendo el `Draft` final.
- [ ] `cancel()` aborta el XHR y llama el endpoint `DELETE` del intent.
- [ ] `UploadDraftDialog` rechaza `.zip` y archivos > 2GB con `UploadErrorBanner` de kind correcto.
- [ ] `InlineVideoPlayer` reproduce un `playback_url` válido y muestra fallback "Cannot play this video" en `onError`.
- [ ] Unit tests Vitest pasan con cobertura de los casos listados (progress, abort, format, size, server error).
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.
- [ ] A11y: dialog con focus trap, ESC cierra (con confirm si uploading), `role="progressbar"` con `aria-valuenow`, file input `aria-label`.
- [ ] Validación visual Pencil ≥95% sobre `y7l3U` y `u0zya` en light + dark (screenshot match con frame).
- [ ] Smoke manual: integrado a una ruta de prueba (puede ser un harness temporal en `_creator/workspace/$conversationId.tsx`), el creator puede subir un `.mp4` y ver el `done`.

## Done summary

CompleteDraftUploadResponse eliminada correctamente, useCompleteDraftUploadMutation tipado como ApiResponse<Draft>, acceso a completeRes.data consistente, tests ajustados a la nueva forma. Sin observaciones.

## Evidence

- Commits:
- Tests:
- PRs:
