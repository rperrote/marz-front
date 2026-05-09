---
satisfies: [R1, R8]
---

## Description

Implementar el layout visual del board desktop: page composer, header con counts y refresh, grid 3-col, card con todos los campos de US-2, badge de match score con band high/medium/low. Light theme con tokens de `src/styles.css`. Diseño de referencia: Pencil node `g941zm`.

**Size:** M
**Files:**

- `src/features/discovery/campaign-board/CampaignBoardPage.tsx`
- `src/features/discovery/campaign-board/CampaignBoardHeader.tsx`
- `src/features/discovery/campaign-board/CampaignBoardGrid.tsx`
- `src/features/discovery/campaign-board/CampaignBoardCard.tsx`
- `src/features/discovery/campaign-board/MatchScoreBadge.tsx`
- `src/routes/_creator/campaigns.tsx` (modificar para montar `CampaignBoardPage`)
- Tests visuales/unitarios + axe

## Approach

- `CampaignBoardPage` orquesta header + filters slot (placeholder hasta F.4) + grid + empty state slot. Consume `useCampaignBoardQuery(search)` con search del route.
- `CampaignBoardCard` muestra: brand (logo/initials, nombre, vertical), `MatchScoreBadge` (score + band), fee (`fee_label`), deliverables (chips por plataforma+formato), deadline relativo, CTA primaria `Postularme` (deshabilitada si `application.can_apply=false`) + secundaria `Ver brief`.
- `MatchScoreBadge`: bandas según solution §6.2 — `high` (80..100), `medium` (60..79), `low` (0..59). Color por band desde tokens.
- Loading: skeletons de cards (3-col); error: estado error variant (en F.7 se cierra con texto exacto, acá un placeholder funcional).
- UI redondeada generosa (CLAUDE.md workspace).

## Investigation targets

**Required:**

- `src/styles.css` — tokens shadcn light + dark
- Componentes shadcn ya wireados en `src/shared/ui/` (Button, Card, Badge)
- `marz-docs/features/FEAT-017-creator-campaigns-board/02-spec.md` US-2 (campos obligatorios de la card)
- Pencil node `g941zm` via `mcp__pencil__get_screenshot` para referencia visual

**Optional:**

- Otra feature con cards (e.g., creator earnings o invitations) para igualar densidad y radii

## Design context

- **Tokens:** colores y radii desde `src/styles.css` (mapeados del `.pen`). Nunca hex inline.
- **Forma:** todo redondeado, radii generosos (`--radius-lg` o superior para cards y badges).
- **Tipografía:** Geist self-hosted via `@fontsource/geist-sans`.
- **Reference:** Pencil node `g941zm` (RESERVED/05-CreatorCampaignsBoard) — diseño dark, implementar light equivalente.

## Acceptance

- [ ] Grid 3-col en desktop renderiza cards reales del endpoint
- [ ] Card muestra brand, match badge con band correcta, fee label, deliverables, deadline, acción primaria + secundaria
- [ ] `MatchScoreBadge` clasifica bands correctamente (test unitario por borde: 0, 59, 60, 79, 80, 100)
- [ ] Loading state muestra skeletons; error renderiza fallback funcional
- [ ] Axe sin violations críticas en `CampaignBoardPage` (test con `vitest-axe` o equivalente del repo)
- [ ] Validación visual contra Pencil `g941zm` ≥95% (adaptado a light)

## Done summary
Todos los issues del round anterior resueltos: switch accesible y funcional, formatDeadline determinístico con tests de borde, grid 2-col en tablet, placeholder documentado. Typecheck, lint y 133 test files verdes.
## Evidence
- Commits:
- Tests:
- PRs: