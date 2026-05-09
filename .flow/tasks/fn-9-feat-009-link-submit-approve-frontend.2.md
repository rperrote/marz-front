---
satisfies: [R1, R9]
---

## Description

Componente puro `LinkPreviewBlock` que renderiza los 3 outcomes de `PublishedLinkPreview` (`title_and_thumbnail`, `url_only`, `failed`). Reusado en sidesheet, cards de timeline y panel lateral. También centraliza el re-export de tipos `PublishedLink*` desde `generated/` hacia `features/deliverables/types.ts` para que el feature no importe directamente de `generated/`.

**Size:** S
**Files:**

- `src/features/deliverables/components/LinkPreviewBlock.tsx` (nuevo)
- `src/features/deliverables/components/LinkPreviewBlock.test.tsx` (nuevo)
- `src/features/deliverables/types.ts` (nuevo o ampliado: re-exports)

## Approach

- Componente sin estado: recibe `preview: PublishedLinkPreview` y `url: string`.
- Si `outcome === 'title_and_thumbnail'`: render `<img>` (lazy + alt) + título; clickable abre URL.
- Si `outcome === 'url_only'` o `'failed'`: render solo `<a>` con la URL clickable.
- Estilos via Tailwind v4 + tokens shadcn (`bg-card`, `text-muted-foreground`, `rounded-lg`, etc.).
- Links siempre con `rel="noopener noreferrer" target="_blank"`.

## Design context

- Frames Pencil de referencia: composer block en `XXkhA`/`yJHY6` (sidesheet creator), preview area en cards `Lh0UU`/`F5oKK` y `Vhl85`/`Gzfb7`.
- Tokens shadcn: usar `--card`, `--border`, `--muted-foreground`, `--radius-lg`. Lenguaje visual redondeado.
- Light + dark obligatorio.

## Investigation targets

**Required:**

- `src/features/deliverables/` — convenciones del módulo (FEAT-007/008)
- `src/components/ui/` — primitives shadcn disponibles

**Optional:**

- Cards existentes de FEAT-007 (`DraftSubmittedCard`, etc.) como referencia de estructura

## Acceptance

- [ ] Render correcto de los 3 outcomes (unit tests Vitest+RTL).
- [ ] Snapshot light + dark contra Pencil ≥95% (frame XXkhA composer block como referencia base).
- [ ] `<a>` con `rel="noopener noreferrer" target="_blank"`.
- [ ] `<img>` con `alt`, `loading="lazy"` y fallback si la URL del thumbnail rompe.
- [ ] Tipos `PublishedLink*` re-exportados desde `features/deliverables/types.ts`; resto del feature no importa de `generated/` directo.
- [ ] Sin estado interno; componente puro.

## Done summary
LinkPreviewBlock implementa correctamente los 3 outcomes, tests pasan, tipos sin any, tokens shadcn sin hardcoding, rel/target correctos, fallback de imagen verificado. Tipos definidos inline por RAFITA:BLOCKER documentado: deuda conocida, no error del diff.
## Evidence
- Commits:
- Tests:
- PRs: