# fn-2.8 F.5 — Fase 3: revisión y edición (ICP, scoring, filters, disqualifiers)

## Description

# F.5 — Fase 3: revisión y edición

## Por qué

Pantalla más densa del wizard. La brand revisa lo que generó la IA y lo edita antes de confirmar. Aquí vive la validación clave: `SUM(weight_pct) = 100`.

## Scope

### Componentes

- `src/features/campaigns/brief-builder/screens/P3Review.tsx`.
- `src/features/campaigns/brief-builder/components/ScoringDimensionCard.tsx`.
- `src/features/campaigns/brief-builder/components/WeightSumIndicator.tsx`.
- `src/features/campaigns/brief-builder/components/HardFilterForm.tsx`.

### Form

TanStack Form (pioneer use en este repo) con Zod superRefine:

```ts
const phase3Schema = z
  .object({
    campaign: z.object({
      name: z.string().min(1).max(150),
      objective: z.enum([
        'brand_awareness',
        'conversion',
        'engagement',
        'reach',
      ]),
      budget_amount: z.number().positive(),
      budget_currency: z.string().default('USD'),
      deadline: z.string().datetime().optional(),
    }),
    brief: z.object({
      icp_description: z.string().nullable(),
      icp_age_min: z.number().int().min(13).max(99).nullable(),
      icp_age_max: z.number().int().min(13).max(99).nullable(),
      icp_genders: z.array(z.enum(['male', 'female', 'non_binary'])),
      icp_countries: z.array(z.string().length(2)),
      icp_platforms: z.array(z.enum(['youtube', 'instagram', 'tiktok'])),
      icp_interests: z.array(z.string()),
      scoring_dimensions: z.array(ScoringDimSchema).min(1).max(4),
      hard_filters: z.array(HardFilterSchema),
      disqualifiers: z.array(z.string()),
    }),
  })
  .superRefine((v, ctx) => {
    const sum = v.brief.scoring_dimensions.reduce((a, d) => a + d.weight_pct, 0)
    if (sum !== 100)
      ctx.addIssue({
        code: 'custom',
        path: ['brief', 'scoring_dimensions'],
        message: `weights_must_sum_100:${sum}`,
      })
  })
```

### Secciones UI

1. **Campaña** — name, objective (select), budget (input numérico), deadline (date).
2. **ICP** — descripción + edad min/max + géneros (multi-chip) + países + plataformas + intereses.
3. **Scoring Dimensions** — array de cards. "Agregar dimensión" disabled si ya hay 4. Cada card: name, description, weight (slider shadcn 1–100), positive_signals[], negative_signals[]. Botón "Eliminar" por card.
4. **Hard Filters** — array de filtros (filter_type select + filter_value depende del tipo).
5. **Disqualifiers** — array de textos libres.

`WeightSumIndicator` sticky muestra `Total X / 100`. Verde si =100, rojo si ≠. `aria-live="polite"`.

### Estado vacío

Si `briefDraft.scoring_dimensions.length === 0` y demás campos vacíos, mostrar banner "La información proporcionada no fue suficiente para generar el brief completo. Llená los campos manualmente."

Campos individuales vacíos: aviso inline "información insuficiente para este campo".

### Acciones

- "Volver": `goTo(1)`. **Conserva `briefDraft` y datos del form en el store**.
- "Confirmar": disabled si validación falla. On valid → `setField('briefDraft', formValues)` + `goTo(4)`.

### Tests

- `P3Review.test.tsx`:
  - WeightSum real-time.
  - Add dimension disabled cuando hay 4.
  - Confirmar disabled si sum≠100.
  - Confirmar disabled si scoring_dimensions=0.
  - Empty fields muestran banner insufficiency.
  - Volver preserva datos.
- `ScoringDimensionCard.test.tsx`: editar weight via slider actualiza state.
- `WeightSumIndicator.test.tsx`: cambia color según sum.

## Notas

- Slider de shadcn ya existe (`src/components/ui/slider.tsx`).
- Para multi-select de géneros/plataformas/países: como NO hay `checkbox` ni `select multi` shadcn, reusar `OnboardingOptionChip` reubicado o copiar el patrón visual con primitives existentes (button toggleable). Decidir y dejar nota en el PR.
- Pesos son enteros — evitar floats.

## Acceptance

- Form prellenado con `briefDraft` del store; secciones colapsables/visibles.
- `WeightSumIndicator` actualiza en tiempo real, color rojo/verde según sum.
- "Agregar dimensión" disabled con 4 dimensiones.
- "Confirmar" disabled si: sum≠100, dimensions=0, campaign campos requeridos vacíos.
- "Volver" preserva datos en el store al re-entrar.
- Banner "insuficiente" cuando draft está vacío.
- Pesos enteros (no floats), slider 1–100 paso 1.
- `aria-live` en sum indicator y errores.
- 8+ tests verdes.
- `pnpm typecheck`, `pnpm lint` verde.

## Done summary

key={tag} correcto: tags son únicos por invariante de addTag, la key es estable ante eliminación del medio. Sin issues pendientes.

## Evidence

- Commits:
- Tests:
- PRs:
