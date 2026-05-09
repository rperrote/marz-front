---
satisfies: [R1, R2, R4, R10]
---

## Description

Implementar el paso `bonus`: toggle global, toggle de speed_bonus con rows agregables/editables/removibles (window_hours + bonus_pct), toggle de performance_bonus con rows (views + window_hours + bonus_pct). Al deshabilitar una sección, las filas se limpian local y backend. Validación: `bonus_pct` 1-100, `window_hours` 1-720, no duplicados, speed windows ordenados por hours con bonus_pct decreciente o igual.

**Size:** M
**Files:**

- `src/features/campaigns/configuration/BonusStep.tsx` (nuevo)
- `src/features/campaigns/configuration/components/SpeedBonusRow.tsx` (nuevo)
- `src/features/campaigns/configuration/components/PerformanceBonusRow.tsx` (nuevo)
- `src/features/campaigns/configuration/hooks.ts` (extender con `useUpdateCampaignBonusMutation`)

## Approach

- Form state con TanStack Form usando `BonusConfigSchema` de .1 como resolver.
- Toggle global `enabled`: si false, ocultar/deshabilitar las dos secciones internas y al submit enviar el shape "vacío" del default.
- Speed/Performance: cada uno con su toggle propio + lista de rows. Rows con botón "+" para agregar y "✕" para borrar.
- Backend genera `window_id` / `milestone_id` UUIDs si faltan; el front conserva los que vinieron en el GET y solo deja "" para nuevos (o los omite del request).
- Validación cruzada de speed: ordenar local por `window_hours`, si dos rows tienen mismo `window_hours` mostrar error "ventanas duplicadas"; verificar `bonus_pct` decreciente o igual al ordenar.
- Validación de performance: no duplicar `views`.
- Continuar disabled mientras `formState.errors` no esté vacío o el form esté pristine y el step ya esté en `completed_steps` (en cuyo caso solo navega).

## Investigation targets

**Required:**

- `src/features/campaigns/configuration/schemas.ts` (creado en .1) — `BonusConfigSchema`
- `src/features/campaigns/brief-builder/components/ScoringDimensionCard.tsx` — patrón de rows agregables/removibles
- `src/features/campaigns/brief-builder/components/WeightSumIndicator.tsx` — patrón de validación cruzada visual

**Optional:**

- TanStack Form `useFieldArray` docs

## Design context

Pencil ref: `kI2DY` (S4 Bonus).

- **Toggles:** switch shadcn; sección colapsa cuando off.
- **Rows:** card pequeña por row con inputs inline; "+" como ghost button; "✕" iconbutton al final de cada row.
- **Errores:** mensaje agregado al final de la sección cuando hay validación cruzada (duplicados, orden).
- **Tokens:** shadcn rounded.

Full design system: `src/styles.css`.

## Acceptance

- [ ] Toggle global off limpia secciones; submit envía `enabled: false` con windows/milestones vacíos.
- [ ] Speed/Performance independientes; togglear off una limpia sólo esa.
- [ ] Agregar/editar/borrar rows funciona en ambas secciones.
- [ ] Validación: `bonus_pct` fuera de 1-100, `window_hours` fuera de 1-720, `views<=0` muestran error inline.
- [ ] Speed windows con `window_hours` duplicados muestran error agregado.
- [ ] Speed windows ordenados ascendente por `window_hours` y `bonus_pct` no creciente al avanzar.
- [ ] Performance milestones con `views` duplicadas muestran error agregado.
- [ ] Unit tests: cubre toggle off limpia rows, validators de rangos, validación cruzada.
- [ ] E2E: agregar 2 speed + 2 performance, guardar, recargar, verificar IDs persistidos por backend.
- [ ] Validación visual desktop dark ≥95% match contra `kI2DY`.

## Done summary
Dark variants agregadas en ambos componentes, parseNumberInput extraído a shared local — todos los fixes del round anterior resueltos sin introducir nuevos problemas.
## Evidence
- Commits:
- Tests:
- PRs: