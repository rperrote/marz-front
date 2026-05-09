---
satisfies: [R1, R6, R9, R10]
---

## Description

Sidesheet `Submit Link` (overlay Sheet de shadcn) que permite al creator pegar una URL, validarla en cliente y enviarla via `useSubmitLinkMutation`. No es optimistic: muestra estado de loading hasta que el server responde con `link.preview` resuelto. Maneja errores tipados del backend (`DOMAIN_NOT_ALLOWED`, `INVALID_DELIVERABLE_STATUS`, `STAGE_LOCKED`, `FORBIDDEN`).

Esta task es el **early proof point** del epic — valida tipos Orval, contrato del backend, y la estrategia de loading vs optimistic.

**Size:** M
**Files:**

- `src/features/deliverables/components/SubmitLinkSidesheet.tsx` (nuevo)
- `src/features/deliverables/components/SubmitLinkSidesheet.test.tsx` (nuevo)
- `src/features/deliverables/hooks/useSubmitLink.ts` (nuevo, wrap del hook Orval con invalidación de queries y manejo de errores)
- `tests/e2e/link-submit.spec.ts` (nuevo, Playwright)

## Approach

- Estado local con `useState` (URL input). Sin store Zustand.
- Validación cliente con Zod: `z.string().url().regex(/^https?:\/\//)`. Botón "Send link" disabled hasta válido.
- `Idempotency-Key` generado con ULID en el cliente por intento (regenerar al re-abrir el sidesheet).
- Al `mutate()`: estado `submitting` con spinner y label "Resolving preview...". Al success: cerrar sidesheet, invalidar `['deliverable', id]` y `['deliverable', id, 'links']`.
- Errores del backend mapeados a mensajes UX:
  - `422 DOMAIN_NOT_ALLOWED` → "Domain not allowed. Use a YouTube, Instagram or TikTok URL."
  - `409 INVALID_DELIVERABLE_STATUS` → "This deliverable is no longer accepting links."
  - `409 STAGE_LOCKED` → "This stage is locked."
  - `403 FORBIDDEN` → "You can't submit links on this deliverable."
- Mensajes de error en `aria-live="polite"`.
- Focus trap nativo del Sheet shadcn; `Esc` cierra; al cerrar, resetea input.

## Design context

- Frames Pencil: `XXkhA` (Creator 09 sidesheet) + variant dark `yJHY6`. Layout del shell sigue convención de Send Offer sidesheet.
- Tokens shadcn: `--card`, `--input`, `--ring`, `--destructive`, `--primary`. Bordes redondeados.
- Light + dark.
- `LinkPreviewBlock` se renderiza vacío/placeholder hasta que llegue el response.

## Investigation targets

**Required:**

- `src/features/deliverables/components/LinkPreviewBlock.tsx` — uso del bloque
- `src/features/offers/components/Send*Sidesheet.tsx` (si existen, FEAT-005/006) — patrón de sidesheet
- `src/components/ui/sheet.tsx` — primitive shadcn
- `src/shared/api/mutator.ts` — manejo estándar de errores tipados

**Optional:**

- `src/features/deliverables/components/` (FEAT-007) — convenciones de módulo

## Acceptance

- [ ] Botón "Send link" disabled hasta URL válida (regex http/https) — unit test.
- [ ] `422 DOMAIN_NOT_ALLOWED` muestra "Domain not allowed" — unit test mock fetch.
- [ ] `409 INVALID_DELIVERABLE_STATUS` muestra mensaje contextual — unit test.
- [ ] `409 STAGE_LOCKED` muestra "This stage is locked" — unit test.
- [ ] `403 FORBIDDEN` muestra mensaje de permisos — unit test.
- [ ] E2E (Playwright): abrir sidesheet desde panel → pegar URL YouTube válida → submit → sidesheet cierra → `LinkSubmittedCard` aparece al final del chat con preview resuelto.
- [ ] Validación visual ≥95% contra `XXkhA` (light) y `yJHY6` (dark).
- [ ] A11y: focus trap activo, `Esc` cierra, label asociado al input, errores en `aria-live`.
- [ ] `Idempotency-Key` se regenera por intento (no reusa el mismo en re-open).

## Done summary
Form migrado a useAppForm con requireDirty en SubmitButton; placeholder y i18n resueltos; no hay violaciones de reglas duras.
## Evidence
- Commits:
- Tests:
- PRs: