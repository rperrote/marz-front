# fn-2.5 F.2 — Fase 1: form de input (URL + texto + PDF)

## Description

# F.2 — Fase 1: form de input (URL + texto + PDF)

## Por qué

Primera pantalla que ve el brand owner. Entrada mínima para arrancar el análisis IA.

## Scope

### Componentes

- `src/features/campaigns/brief-builder/screens/P1Input.tsx` — pantalla.
- `src/features/campaigns/brief-builder/components/PDFUploadField.tsx` — input de archivo con validación MIME y feedback.

### Form

Zod schema local (no del OpenAPI todavía):

```ts
const phase1Schema = z
  .object({
    websiteUrl: z.string().url(),
    descriptionText: z.string(),
    pdfFile: z.instanceof(File).nullable(),
  })
  .refine((d) => d.descriptionText.length > 0 || d.pdfFile !== null, {
    message: 'Provide description text or PDF',
    path: ['descriptionText'],
  })
```

Validación inline:

- URL: `safeParse` por field on blur + on submit.
- PDF: aceptar solo `application/pdf` (chequeo de MIME y extensión); error "Solo se aceptan archivos PDF".
- Si solo texto, textarea required. Si PDF válido, textarea optional.

Botón "Analizar" disabled hasta que pase la validación local.

### Submit

Hook `useInitBriefBuilder`:

- Construye `FormData` con `brand_workspace_id`, `website_url`, `description_text`, `pdf_file` (si hay).
- Llama `customFetch('/api/v1/campaigns/brief-builder/init', { method: 'POST', body: formData })` directamente (sin Orval mientras B.10 no esté).
- Onerror: narrow `ApiError`. Si `422 pdf_too_large` → toast/inline "El documento contiene demasiado texto. Reducí el PDF o pegá texto."; si `413` → "Archivo demasiado grande (>10MB)"; otros 422 → field_errors.
- Onsuccess: `setField('processingToken', ...)`, `setField('formInput', ...)`, dispara `useProcessBrief` (mutation second), luego `goTo(2)`.

`useProcessBrief`:

- `POST /api/v1/campaigns/brief-builder/process` con `{ processing_token }`.
- 202 → ya está, la fase 2 se encarga de los WS events.
- 409 → "El análisis ya fue procesado, reintentá desde el inicio". Reset.

### Dependencias del backend

Si B.9/B.10 todavía no están en dev, mockear con MSW para desarrollo local. F.2 puede mergear sin backend si tests mockean.

### Tests

- `P1Input.test.tsx`:
  - empty URL → error
  - invalid URL → error
  - no text + no PDF → "Analizar" disabled
  - valid URL + text → "Analizar" enabled
  - PDF uploaded → text optional
  - non-PDF MIME → error inline
  - submit con `422 pdf_too_large` → mensaje específico
  - submit success → `goTo(2)` invoked

## Notas

- Depende de F.0a (FormData en mutator) y F.1 (store + ruta).
- TanStack Form: pioneer en este task si querés (form simple). Si no, binding manual con store.
- Copy en español (sin lingui por ahora — abrir como open question si hace falta).

## Acceptance

- Form de Phase 1 renderiza con URL field, textarea, PDFUploadField.
- Validación local: URL (z.string().url()), MIME PDF, requirement OR (texto || pdf).
- "Analizar" disabled mientras la validación falla.
- Submit con texto → `POST /init` → `POST /process` → `goTo(2)`.
- Submit con PDF → multipart correcto (verificable en network tab).
- 422 `pdf_too_large` muestra mensaje específico inline.
- 413 muestra mensaje de tamaño máximo.
- 409 en `/process` resetea wizard.
- 8+ tests pasan, incluyendo validación + submit success + error paths.
- Sin hardcoded colors/sizes; tokens via Tailwind.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
