# fn-2.3 F.0b — Diseño Pencil: 4 templates + organismos del Brief Builder

## Description

# F.0b — Diseño Pencil: 4 templates + organismos del Brief Builder

## Por qué

`marz-design/marzv2.pen` es la fuente de verdad visual. Ningún componente de UI se codea sin diseño previo (regla de `marz-design/CLAUDE.md` y `DESIGN.md`). El frontend código mapea 1:1 a moléculas/organismos diseñados acá.

## Scope (solo Pencil MCP, NO código)

Trabajar dentro de `marz-design/marzv2.pen` usando exclusivamente las tools `mcp__pencil__*`. Nunca usar `Read`/`Edit`/`Write` sobre el `.pen`.

### Flujo de la sesión

1. `get_editor_state({ include_schema: true })`
2. `get_variables()` para confirmar tokens disponibles. Si faltan tokens (radius/spacing/colors específicos del wizard), agregarlos primero.
3. Diseñar en este orden estricto (átomos → moléculas → organismos → templates):

### Moléculas a verificar/crear

- `WizardStepIndicator` (ítem de progreso: pending/active/completed/failed). Reusable fuera del Brief Builder.
- `FileUploadDropzone` (PDF). Reusable.
- `WeightSumIndicator` (X/100, color por estado).

### Organismos a crear

- `BriefProcessingStep` — fila visual de un step IA (icon + label + estado).
- `ScoringDimensionCard` — card editable con name, description, weight slider, signals.
- `HardFilterForm` — selector de tipo + valor.
- `BriefSummaryView` — vista read-only del Brief con todas las secciones.
- `PDFUploadField` — wrapper específico del input de PDF con feedback.

### Templates (pantallas)

- **P1 Input** (desktop + mobile, light + dark): URL field + textarea + PDFUploadField + CTA "Analizar".
- **P2 Progress**: 5 BriefProcessingStep en columna; estado de error con CTAs Reintentar / Volver.
- **P3 Review**: secciones colapsables Campaign/ICP/Scoring/Filters/Disqualifiers; WeightSumIndicator sticky; CTAs Volver/Confirmar.
- **P4 Confirmation**: confirmación + 2 CTAs ("Ir al marketplace", "Ver resumen del brief"). Resumen se abre como dialog/sheet con `BriefSummaryView`.

### Reglas duras

- Toda propiedad visual referencia variables: `fill: "$--background"`, `cornerRadius: "$--radius-lg"`, `padding: "$--spacing-4"`.
- UI siempre redondeada (`--radius-lg/xl/2xl`), nunca cuadrada.
- Light + Dark desde el primer template.
- Desktop + Mobile responsive.
- `batch_design`: máx 25 ops por llamada.
- `get_screenshot()` después de cada template para validar.

### Guardado

Modo interactivo solo:

```bash
pencil interactive --app desktop --in marzv2.pen
pencil > save()
pencil > exit()
```

## Notas

- Esta task NO toca `marz-front`. Es pre-requisito visual de F.4–F.6 (puede correr en paralelo con F.0/F.0a/F.1 que son scaffolding sin pantallas).
- Si durante el diseño aparecen tokens nuevos, replicar a mano en `src/styles.css` (no hay export automático).
- Componentes nuevos se instancian en código con `type: "ref"` + `ref: "I:xxxx"`; los IDs hay que listarlos al final para referenciarlos en F.4–F.6.

## Acceptance

- 4 templates (P1, P2, P3, P4) en `marzv2.pen`, cada uno en desktop + mobile, light + dark.
- 5+ organismos creados (BriefProcessingStep, ScoringDimensionCard, HardFilterForm, BriefSummaryView, PDFUploadField).
- Moléculas reusables: WizardStepIndicator, FileUploadDropzone, WeightSumIndicator.
- Toda propiedad visual usa variables `$--*`; cero hex/px hardcoded en propiedades visuales.
- `get_screenshot()` aprobado para cada template.
- IDs de componentes (`I:xxxx`) listados en un comentario/post de la task para que F.4–F.6 los instancien.
- `pencil interactive ... save()` ejecutado; cambios persistidos.
- Si se agregaron tokens nuevos, replicados en `marz-front/src/styles.css` (light + dark).

## Done summary

Tarea de diseño Pencil (sin código). Se diseñaron 4 templates (P1 Input, P2 Progress, P3 Review, P4 Confirm) en desktop+mobile, light+dark dentro de `marzv2.pen`. Se crearon las moléculas reusables (WizardStepIndicator, FileUploadDropzone, WeightSumIndicator) y los organismos del Brief Builder (BriefProcessingStep, ScoringDimensionCard, HardFilterForm, BriefSummaryView, PDFUploadField). Todas las propiedades visuales referencian variables `$--*`. Los IDs de componentes están listados para uso en F.4–F.6.

## Evidence

- Commits: faedec4
- Tests: n/a (diseño, sin código)
- PRs:
