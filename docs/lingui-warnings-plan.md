# Plan: limpieza de warnings de Lingui

**Estado inicial:** 651 warnings (596 `no-unlocalized-strings` + 55 `no-expression-in-message`), 0 errors.
**Objetivo:** llevar a 0 warnings sin perder cobertura de i18n real.

## Fase 0 — Baseline

- Confirmar baseline: `pnpm lint 2>&1 | grep -c warning` → 651.
- Confirmar 0 errores tras el refactor previo de `t-call-in-function`.

---

## Fase 1 — Ampliar ignores en `eslint.config.js` (~180 warnings, 10 min)

Cubre falsos positivos puros: archivos donde los strings nunca llegan a UI o son código upstream.

**Cambios en `eslint.config.js`:**

Agregar al bloque existente que ya desactiva `lingui/no-unlocalized-strings`:

```js
{
  files: [
    // ya existentes:
    '**/*.config.{js,ts}',
    'scripts/**/*',
    'src/routeTree.gen.ts',
    'src/env.ts',
    'src/router.tsx',
    'src/**/analytics.ts',
    'src/**/analytics/**',
    'src/**/api/**',
    'src/**/queryKeys.ts',
    'src/shared/**',
    // nuevos:
    'src/components/ui/**',           // wrappers shadcn/Radix
    'src/**/schemas.ts',              // mensajes de Zod (no son UI)
    'src/**/types.ts',                // constantes de tipos
    'src/**/store.ts',                // stores Zustand internos
  ],
  rules: {
    'lingui/no-unlocalized-strings': 'off',
  },
},
```

**Verificación:** `pnpm lint 2>&1 | grep -c warning` debería bajar a ~470.

**Riesgos:** un `schemas.ts` podría tener strings que sí lleguen al user via TanStack Form. Mitigación: aceptado — los mensajes ya están en español y se traducirían vía `t\`\``cuando el schema pase a factory function (patrón ya aplicado en`brief-builder/schemas.ts`).

---

## Fase 2 — Refactor records enum→label a funciones con `t\`\`` (~150 warnings, 1 día)

**Patrón actual** (falla lint, además no se re-evalúa al cambiar idioma):

```ts
const STATUS_LABELS: Record<Status, string> = {
  approved: 'Approved',
  paid: 'Paid',
  pending: 'Pending',
}
```

**Patrón objetivo:**

```ts
import { t } from '@lingui/core/macro'

function getStatusLabel(status: Status): string {
  switch (status) {
    case 'approved':
      return t`Approved`
    case 'paid':
      return t`Paid`
    case 'pending':
      return t`Pending`
  }
}
```

O bien:

```ts
const getStatusLabels = () => ({
  approved: t`Approved`,
  paid: t`Paid`,
  pending: t`Pending`,
})
```

**Archivos prioritarios:**

- `src/features/campaigns/detail/CampaignCreatorsTable.tsx` (status + platform labels)
- `src/features/campaigns/detail/CampaignVideosGrid.tsx`
- `src/features/campaigns/detail/creators/CreatorsFilters.tsx`
- `src/features/campaigns/detail/videos/VideosFilters.tsx`
- `src/features/campaigns/configuration/ReviewStep.tsx` (objective/content type labels)
- `src/features/chat/components/messageTimelineRenderers.tsx`
- `src/features/chat/components/mobile/MobileSystemCards.tsx`
- `src/features/discovery/campaign-board/*.tsx`
- `src/features/offers/components/*.tsx`
- `src/features/deliverables/components/*.tsx`

**Convención a respetar (de CLAUDE.md):** no hoistear `Intl.NumberFormat`/`Intl.DateTimeFormat` dentro de las funciones — mantener a module scope si aplica.

---

## Fase 3 — Traducir strings sueltos en JSX/toasts/aria-labels (~230 warnings, 2-3 días)

Casos individuales, cero patrón común. Ejemplos:

- `ThemeToggle.tsx:55-66` — aria-labels `'Auto'`, `'Dark'`, `'Light'`.
- `BriefSummaryView.tsx` — varios bloques de JSX.
- `routes/onboarding/brand.tsx:54` / `creator.tsx:54` — placeholders.
- Múltiples `toast.error('...')` directos.

**Procedimiento por archivo:**

1. Importar `t` desde `@lingui/core/macro` (o `Trans` desde `@lingui/react/macro` si es JSX block).
2. Envolver strings visibles: `<span>{t\`Auto\`}</span>`o`<Trans>Auto</Trans>`.
3. Para atributos (`aria-label`, `placeholder`, `title`): usar `t\`\``.
4. Si hay interpolación: usar `t\`Hola ${name}\`` — extrayendo a variable si el interior es expresión compleja (ver Fase 4).

**Verificación incremental:** después de cada archivo, correr `pnpm lint <path>` para confirmar 0 warnings en ese archivo.

---

## Fase 4 — Extraer variables en `no-expression-in-message` (55 warnings, 2-3 hs)

Casos como:

```ts
t`≤ ${window.window_hours} hs · ${formatBonusAmount(window.bonus)}`
```

Refactor a:

```ts
const hours = window.window_hours
const amount = formatBonusAmount(window.bonus)
t`≤ ${hours} hs · ${amount}`
```

**Razón:** el catálogo de Lingui usa el nombre del identificador como placeholder. `${object.property}` produce IDs frágiles que cambian si se renombra la prop.

**Archivos afectados (top):**

- `src/features/campaigns/configuration/ReviewStep.tsx` (mayor concentración)
- `src/features/campaigns/brief-builder/BriefBuilderWizard.tsx`
- `src/routes/workspace.conversations.$conversationId.tsx`

---

## Fase 5 — Endurecer la regla (post-cleanup)

Cuando los warnings lleguen a 0:

```js
'lingui/no-unlocalized-strings': ['error', { ... }],
'lingui/no-expression-in-message': 'error',
```

Esto previene regresiones en PRs futuros.

---

## Validación final

- `pnpm lint` → 0 errors, 0 warnings.
- `pnpm tsc --noEmit` → 0 errors.
- Correr `pnpm test` para verificar que ningún snapshot/test rompe por strings que cambiaron de literal a `t\`\``.
- Cambiar idioma activo en dev y verificar manualmente: header de campañas, modal de invitación de creator, brief builder wizard, chat timeline, onboarding.

---

## Orden recomendado de ejecución

1. **Fase 1** (10 min, alto ROI) — baja ruido a ~470.
2. **Fase 4** (2-3 hs, mecánico) — limpia los 55 `no-expression-in-message` mientras el contexto está fresco.
3. **Fase 2** (1 día, patrón repetido) — fácil de paralelizar por archivo.
4. **Fase 3** (2-3 días, archivo por archivo) — el grueso.
5. **Fase 5** (5 min) — flipear regla a `error`.

**Total estimado:** 3-4 días de trabajo enfocado.

---

## Notas de scope

- **No hacer fuera de scope:**
  - Migrar `t\`\``a`<Trans>` o viceversa cuando el actual funciona.
  - "Mejorar" copys mientras se traduce — preservar el string literal exacto.
  - Refactorear componentes adyacentes.
- **Sí hacer:**
  - Convertir records módulo→función si el archivo ya se está tocando para traducir.
  - Eliminar imports muertos que el refactor deje huérfanos.
