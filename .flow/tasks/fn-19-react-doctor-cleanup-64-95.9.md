---
satisfies: [R3]
---

## Description

Limpieza final de dead code que knip reporte tras todos los fixes anteriores. Mucho dead code se vuelve obvio después de eliminar APIs deprecadas, refactorizar state y consolidar hooks (`useClientNow`). Ejecutar `pnpm exec knip` post-fix y resolver caso por caso.

**Size:** S
**Files:**
- 19 archivos no usados + 96 exports no usados + 108 types no usados + 3 duplicates (números pre-épica; muchos van a desaparecer naturalmente).

## Approach

1. Correr `pnpm exec knip` y comparar contra el reporte inicial (después de task 1, ya debería estar muy reducido).
2. **Files (19)**: leer cada archivo unused. Si efectivamente no se usa, borrar. Si knip lo marca por mal config, ajustar `knip.json` y documentar por qué (e.g., archivo es plugin de vite, entry de worker).
3. **Exports (96)**: para cada export unused, decidir: (a) eliminar export keyword si solo se usa internamente, (b) eliminar la función/const si no se usa, (c) suprimir si es API pública intencional (raro en frontend de app).
4. **Types (108)**: igual que exports. Muchos tipos derivados de Orval o de zod schemas — verificar que knip ignora `z.infer` lookups correctamente.
5. **Duplicates (3)**: `customFetch|default` en `mutator.ts`, `ThemeToggle.tsx`, `test-mutator.ts`. Verificar si son duplicates legítimos (mutator vs test-mutator) o errores. Dejar comentario justificando.

## Investigation targets

**Required**:
- Output de `pnpm exec knip` post-task-8
- `src/shared/api/mutator.ts` y `src/shared/api/test-mutator.ts` (los duplicados)
- `src/components/ThemeToggle.tsx` (duplicate)

**Optional**:
- https://knip.dev/guides/fixing-issues

## Acceptance

- [ ] `pnpm exec knip` reporta < 10 issues totales, todos con justificación documentada en `knip.json` ignore o comentario inline.
- [ ] `react-doctor` reporta `knip/*` en niveles equivalentes al de `pnpm exec knip` (0 o lo justificado).
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] PR diff revisado para garantizar que no se borró código en uso (especial cuidado con re-exports en `index.ts` de cada feature).

## Done summary
Dead code cleanup correcto: 19 archivos eliminados, ~96 exports/tipos unexportados — ninguno tiene consumidores externos reales. knip.jsonc migrado correctamente a ignoreIssues + ignoreDependencies. Default exports de mutator/test-mutator removidos resolviendo los duplicates reportados. Tests actualizados consistentemente con los archivos borrados.
## Evidence
- Commits:
- Tests:
- PRs: