# fn-2.4 F.1 — Ruta /campaigns/new + BriefBuilderWizard shell + store

## Description

# F.1 — Ruta `/campaigns/new` + `BriefBuilderWizard` shell + store

## Por qué

Necesitamos el shell del wizard (con guard, layout, navegación entre fases) antes que cualquier fase. Mirror de `src/routes/onboarding/brand.tsx` + `brand.$step.tsx`.

## Scope

### Rutas

- `src/routes/_brand/campaigns/new.tsx` — layout del wizard (instancia `WizardShell`, lee progreso del store, registra `useBlocker`).
- `src/routes/_brand/campaigns/new.index.tsx` — redirige a la fase 1.
- `src/routes/_brand/campaigns/new.$phase.tsx` — renderiza `PHASES[idx].component`.

`beforeLoad` adicional al `_brand` guard: validar `membership.role === 'owner'`. Redirigir a `/campaigns` con toast si no.

### Store

`src/features/campaigns/brief-builder/store.ts` — Zustand con `persist` + `createJSONStorage(() => sessionStorage)` (igual a brand onboarding):

```ts
type Phase = 1 | 2 | 3 | 4
interface BriefBuilderState {
  currentPhase: Phase
  processingToken: string | null
  formInput: {
    websiteUrl: string
    descriptionText: string
    pdfMeta: PdfMeta | null
  }
  briefDraft: BriefDraft | null
  campaignId: string | null
  setField<K extends keyof BriefBuilderState>(
    key: K,
    value: BriefBuilderState[K],
  ): void
  goTo(phase: Phase): void
  reset(): void
}
```

Storage key: `marz-brief-builder`. `skipHydration: true`. Rehydrate manual en el route layout (igual a `brand.tsx:37-39`).

### Phases

`src/features/campaigns/brief-builder/phases.ts`:

```ts
const PHASES = [
  { id: 1, component: P1Input },
  { id: 2, component: P2Progress },
  { id: 3, component: P3Review },
  { id: 4, component: P4Confirm },
]
```

### Wizard shell

`src/features/campaigns/brief-builder/BriefBuilderWizard.tsx` — instancia `WizardShell` (de `src/shared/ui/wizard/`, depende de F.0). Renderiza el componente de la fase activa con callbacks `goNext/goBack`. Por ahora las 4 pantallas son stubs `<div>Phase N</div>` (las llenan F.2/F.4/F.5/F.6).

### Tests

- `BriefBuilderWizard.test.tsx`: render inicial → muestra Phase 1.
- Route guard: simular `membership.role !== 'owner'` → redirect.
- `store.test.ts`: `goTo`, `reset`, `setField`.

## Notas

- No hooks de API en esta task. Solo scaffolding.
- Sin lógica de WS ni mutaciones — eso entra en F.3/F.4.
- Imports siempre con alias `#/...`.

## Acceptance

- `/campaigns/new` carga sin error en dev para `kind=brand` + `role=owner`.
- `kind=creator` o `role!==owner` → redirect con toast.
- Wizard arranca en Phase 1 (stub).
- Store persiste en sessionStorage (verificar en DevTools), `reset()` limpia.
- `routeTree.gen.ts` regenerado, sin errores de typecheck.
- Tests verdes: `BriefBuilderWizard.test.tsx`, `store.test.ts`, route guard test.
- No hay imports de `features/identity/...` en `features/campaigns/`.
- Sin warnings de SSR (`skipHydration` correctamente aplicado).

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
