---
satisfies: [R1]
---

## Description

Crear el route group y el shell del wizard: una route layout `_brand/campaigns.$campaignId.configuration.tsx` que carga la config vía loader y enruta al sub-step correcto, y la route hijo `_brand/campaigns.$campaignId.configuration.$step.tsx` que renderiza el step activo. El shell incluye stepper visual, manejo de `block_reason` (redirect si `brief_not_confirmed` o `already_active`), y el componente `CampaignConfigurationWizard` que orquesta navegación + optimistic concurrency.

**Size:** M
**Files:**

- `src/routes/_brand/campaigns.$campaignId.configuration.tsx` (nuevo)
- `src/routes/_brand/campaigns.$campaignId.configuration.$step.tsx` (nuevo)
- `src/features/campaigns/configuration/CampaignConfigurationWizard.tsx` (nuevo)
- `src/features/campaigns/configuration/hooks.ts` (nuevo, `useCampaignConfigurationQuery`)

## Approach

- Seguir patrón route + feature de `BriefBuilderWizard` (`src/features/campaigns/brief-builder/BriefBuilderWizard.tsx`) y sus screens.
- Loader en la route layout: pre-fetcha `useCampaignConfigurationQuery` (TanStack Query SSR-aware via TanStack Start). Si `block_reason` viene seteado, redirect:
  - `brief_not_confirmed` → `/campaigns/$id/brief`
  - `already_active`, `not_draft` → `/campaigns/$id`
  - `forbidden_role` → `/campaigns` con toast de error.
- `validateSearch`: zod schema con `from?: 'brief-builder' | 'campaign-list'` para analytics y UX (titulado "Volver" diferente).
- Stepper renderiza 5 pasos con estados completed/current/upcoming según `completed_steps` y `current_step` de la response.
- En el `$step` route param: validar contra enum (`content_type | pricing_model | targeting | bonus | review`); si no matchea, redirect a `current_step`.
- Renderizar placeholder en cada slot todavía (los steps reales vienen en F.3-F.6) — usar componentes stub que reciben la config y muestran "TODO step X".

## Investigation targets

**Required:**

- `src/features/campaigns/brief-builder/BriefBuilderWizard.tsx` — pattern de wizard multi-step y stepper
- `src/routes/_brand/campaigns.new.$phase.tsx` — pattern de route con `$phase` dinámico y validateSearch
- `src/routes/_brand/campaigns.$campaignId.brief.tsx` — patrón de route con `$campaignId` y loader

**Optional:**

- `src/features/campaigns/brief-builder/screens/P2Progress.tsx` — pattern de stepper visual

## Design context

Pencil refs del shell: `g8nDly` (S1) muestra layout completo del wizard con stepper, header y footer.

- **Layout:** brand shell estándar; el wizard ocupa el área principal con stepper horizontal arriba.
- **Componentes:** stepper, card-container del step actual, footer fijo con botones "Atrás" y "Continuar".
- **Tokens:** usar shadcn (`--background`, `--foreground`, `--primary`, `--radius`); UI redondeada siempre.

Full design system: `src/styles.css` y `marz-design/marzv2.pen` (read-only via Pencil MCP).

## Acceptance

- [ ] Route `/campaigns/$campaignId/configuration` carga sin error para brand admin con campaign en estado configurable.
- [ ] Route route test verifica que admin pasa, owner/member/creator reciben 403/redirect.
- [ ] Loader redirect: `brief_not_confirmed` → `/campaigns/$id/brief`; `already_active` → `/campaigns/$id`; `forbidden_role` → toast + redirect.
- [ ] `$step` param inválido redirige a `current_step` reportado por backend.
- [ ] Stepper marca correctamente completed/current/upcoming según response.
- [ ] `validateSearch` rechaza `from` inválido pero acepta ausente.
- [ ] Visual desktop dark del shell ≥95% match contra Pencil `g8nDly`.
- [ ] `pnpm test` pasa para nuevos tests; `pnpm typecheck` y `pnpm lint` pasan.

## Done summary
Todos los fixes aplicados correctamente: redirect already_active/not_draft tipado a /campaigns/$campaignId, getStepCopy() como función en render, ruta de detalle registrada. Typecheck y tests limpios.
## Evidence
- Commits:
- Tests:
- PRs: