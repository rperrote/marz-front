# fn-2 — FEAT-002 Brief Builder (Frontend)

> Solución técnica completa: `marz-docs/features/FEAT-002-brief-builder/03-solution.md`
> Diseño: `marz-design/marzv2.pen` (acceso solo via Pencil MCP). Guía: `marz-docs/DESIGN.md`.
> Backend (epic separado en `marz-api`): no es prerequisito para arrancar F.0–F.2; sí para integración E2E.

## Overview

Construir el wizard de 4 fases del Brief Builder en `marz-front`:

1. **Fase 1** — Form: URL + descripción libre + PDF (multipart).
2. **Fase 2** — Progreso WS de 5 pasos (server-push del análisis IA).
3. **Fase 3** — Form de revisión/edición (ICP, scoring dimensions con sum=100, hard filters, disqualifiers, datos de Campaign).
4. **Fase 4** — Confirmación: dispara `POST /campaigns`, muestra `BriefSummaryView` y CTAs.

El estado vive en sesión (no se persiste cross-session). Al confirmar se llama `POST /api/v1/campaigns` y se navega al resumen / marketplace.

## Scope

**In scope** (frontend):

- Rutas `/_brand/campaigns/new` (wizard) y `/_brand/campaigns/$campaignId/brief` (resumen standalone).
- 4 fases + componentes de soporte (ScoringDimensionCard, WeightSumIndicator, HardFilterForm, BriefProcessingStep, BriefSummaryView, PDFUploadField).
- Hook `useBriefBuilderWS` que filtra eventos `brief.processing.*` por `processing_token`.
- Wizard store (Zustand) con sessionStorage y reset al confirmar/abandonar.
- Analytics client-side (`brief_builder_started`, `brief_builder_abandoned`).
- Diseño de pantallas en `marzv2.pen` (átomos → moléculas → organismos → templates) ANTES o en paralelo al código según disponibilidad de tokens.
- Lift de los shells de wizard del onboarding (`OnboardingShell`, `OnboardingProgress`, `OnboardingFooter`, `OnboardingField`) a `src/shared/ui/wizard/` para evitar cross-context import.
- Soporte de FormData / multipart en `src/shared/api/mutator.ts` (hoy es JSON-only).

**Out of scope**:

- Backend (Go, `marz-api`): tasks B.1–B.10 viven en otro epic.
- Marketplace `/marketplace?campaignId=...` — si no existe, navegar a `/` graceful.
- Persistencia de drafts entre sesiones (decisión rechazada en sección 12 del 03-solution).
- Reconexión WS con backoff (el flujo es efímero; si cae, "Reintentar" desde Fase 2).

## Approach

### Patrón del wizard (mirror del onboarding existente)

Replicar la estructura de `src/features/identity/onboarding/brand/`:

- `src/features/campaigns/brief-builder/store.ts` — Zustand `persist` (`sessionStorage`, `skipHydration: true`) con `currentPhase`, `processingToken`, `pdfMeta`, `briefDraft`, `formInput`, errores. Storage key: `marz-brief-builder`.
- `src/features/campaigns/brief-builder/phases.ts` — `PHASES: BriefBuilderPhase[] = [{id, component}]`.
- `src/features/campaigns/brief-builder/useSubmitBrief.ts` — copia el patrón de `useSubmitBrandOnboarding.ts` (safeParse client-side → mutation → onError narrow `ApiError` → field_errors mapping → navigate on success + invalidate `campaigns` query).
- `src/features/campaigns/brief-builder/screens/{P1Input,P2Progress,P3Review,P4Confirm}.tsx`.
- `src/features/campaigns/brief-builder/components/...` (Scoring, Filters, Summary, PDFUpload).
- `src/features/campaigns/brief-builder/hooks/useBriefBuilderWS.ts`.

### Shells reusables — lift a shared

`src/features/identity/onboarding/shared/components/OnboardingShell.tsx` etc. NO se importan desde `features/campaigns/` (cross-context). **Task F.0**: mover a `src/shared/ui/wizard/{WizardShell, WizardProgress, WizardFooter, WizardField, WizardSectionTitle}.tsx`. Los nombres se renombran a `Wizard*` (genéricos). Onboarding actualiza imports. Tests no rompen.

### Diseño en Pencil

Antes de tocar código de pantallas, abrir `marzv2.pen` y diseñar:

- 4 templates (P1, P2, P3, P4) en desktop y mobile, dark + light.
- Organismos nuevos (`ScoringDimensionCard`, `BriefProcessingStep`, `BriefSummaryView`, `HardFilterForm`, `PDFUploadField`, `WeightSumIndicator`).
- Toda propiedad visual referencia variables `$--...` (nunca hex). Bordes redondeados (radius generosos).
- `get_screenshot()` para validar; export a `marz-design/exports/` opcional para review.
- Si hay tokens nuevos (ej. layout específico del wizard), agregarlos en variables ANTES de los componentes.

### WebSocket

Usar `src/shared/ws/useWebSocket.ts` existente. `enabled: true` solo durante Fase 2. Handlers para `brief.processing.step_completed`, `brief.processing.completed`, `brief.processing.failed`. Filtrar por `processing_token` (el envelope trae `payload.processing_token`).

Tipos manuales en `src/shared/ws/brief-builder.types.ts` (no vienen del OpenAPI).

### Multipart en el mutator

`mutator.ts` actual fuerza `Accept: application/json` y serializa JSON. Ampliar:

- Si el body es `FormData`, **no** setear `Content-Type` (browser pone boundary); skip serialization.
- Mantener auth/refresh/error handling igual.
- Tests: agregar caso multipart en `mutator.test.ts`.

Orval emitirá `BriefBuilderInitBody` con FormData cuando el OpenAPI declare `multipart/form-data` (depende de B.10 backend). Mientras tanto, hook manual con FormData.

### Validación sum=100

Zod `.superRefine` sobre `scoring_dimensions[]`. UI: `WeightSumIndicator` con `aria-live="polite"` anunciando "Total X / 100". Submit `disabled` con `aria-describedby`. Pesos como **enteros** (no float) — slider de shadcn ya disponible.

### beforeunload + leave guard

- TanStack Router `useBlocker({ shouldBlockFn: () => isDirty })` en Fase 1–3.
- `beforeunload` listener solo si dirty; no se puede mostrar texto custom (modernos browsers).
- Analytics `brief_builder_abandoned` via `navigator.sendBeacon` en `pagehide` (no en `beforeunload`).

### Anti-doble-submit

Mutation `isPending` como gate del botón Confirmar. Generar `Idempotency-Key` UUID v4 una vez por sesión del wizard, enviar en header del `POST /campaigns` (decidir con backend si lo respeta; en MVP basta con el gate de UI).

## Quick commands

```bash
# Start dev
pnpm install
pnpm dev                                    # http://localhost:3000

# Regenerar tipos cuando el backend mergee endpoints (depende de B.10)
pnpm api:sync

# Smoke test
pnpm typecheck
pnpm test
pnpm test src/features/campaigns/brief-builder
pnpm lint
```

## Acceptance

- `/campaigns/new` accesible solo para `kind=brand` con membership `role=owner`. Redirige fuera con 403/redirect en otros casos.
- Wizard avanza P1 → P2 → P3 → P4 sin perder datos del usuario (excepto al refrescar — sessionStorage los retiene).
- Fase 1: validación URL, MIME PDF, "Analizar" disabled hasta válido. Manejo de `422 pdf_too_large`.
- Fase 2: 5 steps animados; `completed` → P3 con `briefDraft`; `failed retryable=true` → botón Reintentar.
- Fase 3: indicador de pesos en tiempo real; "Confirmar" disabled si sum≠100, sin dimensiones, o campos Campaign vacíos.
- Fase 4: `POST /campaigns` se llama una sola vez; "Ver resumen del brief" abre `BriefSummaryView`; "Ir al marketplace" navega graceful.
- `/_brand/campaigns/$campaignId/brief` carga read-only via `useCampaignBrief`.
- Diseños en `marzv2.pen` validados con screenshot y guardados con `pencil interactive ... save()`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` verdes.
- Sin imports cross-context (`features/campaigns/` no importa de `features/identity/`).
- Mutator soporta FormData (test agregado).

## References

- Spec técnica: `marz-docs/features/FEAT-002-brief-builder/03-solution.md`
- Spec de producto: `marz-docs/features/FEAT-002-brief-builder/02-spec.md`
- Guía de diseño: `marz-docs/DESIGN.md`
- CLAUDE.md (frontend): `marz-front/CLAUDE.md`
- Wizard pattern de referencia:
  - `src/features/identity/onboarding/brand/store.ts`
  - `src/features/identity/onboarding/brand/steps.ts`
  - `src/features/identity/onboarding/brand/useSubmitBrandOnboarding.ts`
  - `src/routes/onboarding/brand.tsx`, `brand.$step.tsx`
  - `src/features/identity/onboarding/shared/components/{OnboardingShell,OnboardingProgress,OnboardingFooter,OnboardingField}.tsx`
- Mutator: `src/shared/api/mutator.ts`
- WS: `src/shared/ws/useWebSocket.ts`, `src/shared/ws/events.ts`
- Guard brand: `src/routes/_brand.tsx`
- Tokens: `src/styles.css`
- shadcn primitives: `src/components/ui/` (slider, dialog, input, button, card, textarea — disponibles)

## Open questions

1. **Idempotency-Key en `POST /campaigns`**: ¿el backend lo respeta o solo gate UI? Decidir antes de F.5.
2. **Marketplace destino**: confirmar la ruta cuando exista (hoy graceful → `/`).
3. **i18n**: el onboarding usa `@lingui/core/macro`. ¿Mantener mismo enfoque para Brief Builder o copy en castellano hardcoded por ahora? (Spec técnica está en español, sin mención a i18n.)
4. **TanStack Form vs binding manual**: el repo no tiene precedente de TanStack Form. Pioneer en F.4 (Fase 3 es el form más complejo) o seguir el binding manual del onboarding. Recomendación: TanStack Form en F.4, pasa el filtro de uso real.
