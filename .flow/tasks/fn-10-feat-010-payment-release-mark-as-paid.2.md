---
satisfies: [R4, R9]
---

## Description

Agregar branch `paid` al `DeliverableStatusBadge` (componente creado en FEAT-009 — fn-9). Renderea badge con label "Paid" y variante visual `success`/positiva siguiendo los tokens del design system.

**Size:** S
**Files:** `src/features/deliverables/components/DeliverableStatusBadge.tsx`, `src/features/deliverables/components/DeliverableStatusBadge.test.tsx`

## Approach

- Extender el switch/map de status del componente existente con la rama `'paid'`.
- Usar tokens shadcn ya mapeados desde el `.pen` (variante success/done; revisar las variantes que ya usa el componente para `completed` y elegir un tono distinto que comunique terminalidad).
- Mantener el shape de la API del componente — sólo se agrega un input value válido.

## Investigation targets

**Required**:

- `src/features/deliverables/components/DeliverableStatusBadge.tsx` — componente existente (FEAT-009).
- `src/styles.css` — tokens disponibles (`--success`, `--positive`, etc.) mapeados desde el `.pen`.

**Optional**:

- `marz-design/marzv2.pen` nodos `wpat3`, `7pW7u` (paneles con badge `Paid` ya diseñado) — vía Pencil MCP `get_screenshot` para referencia visual.

## Design context

Relevant DESIGN.md sections para este task (tokens del `.pen` espejados en `src/styles.css`):

- **Colors:** variante success/positive del design system (no hardcodear colores; usar token shadcn).
- **Components:** Badge sigue radius generoso (UI redondeada siempre).
- **Do's/Don'ts:** El label es siempre "Paid" en inglés (consistente con el resto del badge en FEAT-009 — verificar). No usar emojis ni iconos extra.

Full design system: `src/styles.css` + `marz-design/marzv2.pen` (Pencil MCP).

## Acceptance

- [ ] Render con `status='paid'` muestra label "Paid" y variante success.
- [ ] Test Vitest+RTL cubre el branch.
- [ ] Light + dark mode renderean correctamente (sin contrast issues).
- [ ] Validación visual Pencil MCP ≥95% match contra el badge `Paid` en `wpat3`/`7pW7u`.
- [ ] Pre-existing branches (`draft_submitted`, `completed`, etc.) siguen renderizando idénticos.

## Done summary
paid branch agregado correctamente con tone terminal/primary distinto de success, tests it.each cubren todos los branches representativos más axe, refactor de DeliverableCard y DeliverableListItem limpio sin deuda
## Evidence
- Commits:
- Tests:
- PRs: