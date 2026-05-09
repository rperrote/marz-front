---
satisfies: [R1, R2, R3, R10]
---

## Description

Implementar el paso `targeting`: formulario con prefill desde Brief para countries, genders, age range, interests; campos sólo del wizard para tiers, follower range, content_languages. Validación inline de rangos (follower_min ≤ follower_max, 18 ≤ age_min ≤ age_max ≤ 120). Al "Continuar", PATCH con el shape `operational_targeting` parcial; backend normaliza y devuelve la versión completa.

**Size:** M
**Files:**

- `src/features/campaigns/configuration/TargetingStep.tsx` (nuevo)
- `src/features/campaigns/configuration/components/CountryMultiSelect.tsx` (nuevo o reusar si existe)
- `src/features/campaigns/configuration/components/TierMultiSelect.tsx` (nuevo)
- `src/features/campaigns/configuration/components/InterestsInput.tsx` (nuevo o reusar)
- `src/features/campaigns/configuration/hooks.ts` (extender con `useUpdateCampaignTargetingMutation`)

## Approach

- TanStack Form con `OperationalTargetingSchema` (Zod) creado en .1 como resolver.
- Prefill: el GET de configuration ya viene con `operational_targeting` poblado por backend (con `source: 'brief_prefill'` si nunca se editó). Form usa eso como `defaultValues`. Si el usuario edita cualquier campo, marcar visualmente "Ajustado desde Brief" cuando `adjusted_from_brief=true`.
- Validación inline: errores debajo de cada input; Continuar disabled mientras haya errors.
- Inputs:
  - `countries`: multiselect ISO-3166 alpha-2 (reusar componente si existe en brief-builder; si no, crear simple basado en shadcn Combobox).
  - `tiers`: multiselect con 6 opciones del enum.
  - `follower_min/max`: number inputs con validación cruzada.
  - `genders`: multiselect alineado a Brief ICP.
  - `age_min/max`: number inputs (18-120).
  - `interests`: tag input.
  - `content_languages`: multiselect BCP-47 (lista corta: es, en, pt, fr...).
- Submit: solo enviar campos que cambiaron (PATCH parcial); usar `dirtyFields` de TanStack Form.

## Investigation targets

**Required:**

- `src/features/campaigns/brief-builder/components/HardFilterForm.tsx` — patrón de form complejo con TanStack Form + Zod
- `src/features/campaigns/configuration/schemas.ts` (creado en .1) — `OperationalTargetingSchema`
- `src/features/campaigns/brief-builder/screens/P3Review.tsx` — cómo se rendea ICP y tags

**Optional:**

- shadcn Combobox docs si no hay multiselect propio

## Design context

Pencil ref: `uQqif` (S3 Targeting).

- **Form layout:** secciones agrupadas (Geografía, Audiencia, Contenido); labels arriba, inputs full-width en la card.
- **Errores:** texto en `--destructive` debajo del input afectado.
- **Tokens:** shadcn rounded.

Full design system: `src/styles.css`.

## Acceptance

- [ ] Targeting form se monta con prefill desde Brief sin requerir edición.
- [ ] Modificar cualquier campo no muta el Brief (validar via fetch del brief endpoint en E2E).
- [ ] follower_min > follower_max muestra error inline; Continuar disabled.
- [ ] age_min < 18 o age_max > 120 o age_min > age_max muestra error inline.
- [ ] Country code inválido (no ISO-3166 alpha-2) → error inline.
- [ ] Continuar envía sólo campos modificados; respuesta normalizada por backend reemplaza estado local.
- [ ] Unit tests: validators de range, dirtyFields submit.
- [ ] E2E: precargar, editar tiers + follower_min, guardar, recargar, verificar persistido.
- [ ] Accesibilidad: labels asociados (`<label for>`), errors con `aria-describedby`.
- [ ] Validación visual desktop dark ≥95% match contra `uQqif`.

## Done summary
Los tres blockers del round anterior están resueltos: superRefine duplicado de ISO eliminado, TierMultiSelect y ChipMultiSelect usan {(aria) => y role='group' {...aria} correctamente. La función fieldArrayItemError usa unknown+narrowing (no any). Sin dead code, sin console.log, tests pasan.
## Evidence
- Commits:
- Tests:
- PRs: