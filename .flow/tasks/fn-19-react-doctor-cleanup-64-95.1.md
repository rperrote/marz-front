---
satisfies: [R2, R3]
---

## Description

Configurar tooling base que la épica usa después: `knip.json` con entries correctos para TanStack Router + Vitest + Playwright, `react-doctor` ignores para archivos generados/falsos positivos, y eslint override para silenciar `rules-of-hooks` en `src/test/e2e/**`. Sin esta fase, el reporte de dead code (226 knip issues) y los 9 errores de `rules-of-hooks` quedan inflados y bloquean el progreso real.

**Size:** M
**Files:**
- `knip.json` (nuevo)
- `package.json` (script `pnpm knip`, devDep `knip`)
- `react-doctor.config.*` o equivalente (revisar docs del paquete; si no existe config file, documentar approach en `.react-doctor-ignore.md`)
- `eslint.config.*` (override para `src/test/e2e/**` y `src/test/e2e/fixtures.ts`)
- `src/routes/__root.tsx:79` (comentario `eslint-disable-next-line` o equivalente justificando el `dangerouslySetInnerHTML` legítimo)

## Approach

- Instalar `knip` como devDependency con `pnpm add -D knip`.
- Crear `knip.json` con:
  - `entry`: `src/routes/**/*.tsx`, `src/routeTree.gen.ts`, `src/router.tsx`, `src/client.tsx`, `src/server.ts`, `src/styles.css`, `**/*.test.{ts,tsx}`, `src/test/e2e/**/*.ts`, `scripts/**/*.ts`, configs (vite, vitest, playwright).
  - `ignore`: `src/shared/api/generated/**`, `src/routeTree.gen.ts`.
  - `ignoreExportsUsedInFile`: `{ interface: true, type: true }` para Zod schemas y `z.infer`.
  - Plugins: vitest, playwright, vite, tailwind. Knip los detecta auto si están instalados.
- Verificar localmente: `pnpm exec knip` debe reportar ≤ 30 issues reales (vs 226 actuales). Si reporta más, refinar `entry` y documentar por qué los restantes no son falsos positivos.
- Para `rules-of-hooks` en Playwright fixtures: agregar override en `eslint.config.*`:
  ```
  { files: ['src/test/e2e/**'], rules: { 'react-hooks/rules-of-hooks': 'off' } }
  ```
  Confirmar que react-doctor consume el output de eslint y respeta este override; si no, agregar comentario `// react-doctor-disable rules-of-hooks` en `fixtures.ts` (revisar sintaxis exacta en docs).
- `__root.tsx:79`: añadir `// eslint-disable-next-line react/no-danger` con comentario justificativo arriba ("theme init script must run pre-hydration").

## Investigation targets

**Required**:
- `package.json` — scripts existentes + versión pnpm.
- `eslint.config.*` (o `.eslintrc.*`) — config actual + overrides existentes.
- `src/routes/__root.tsx:50-100` — confirmar el script de theme.
- `src/test/e2e/fixtures.ts:380-420` — confirmar shape Playwright fixture `use`.

**Optional**:
- https://knip.dev/reference/configuration
- https://knip.dev/reference/plugins/tanstack-router

## Acceptance

- [ ] `pnpm exec knip` corre sin errores y reporta solo dead code real (objetivo: < 30 issues; los reales se difieren a task 9).
- [ ] `react-doctor` reporta los 9 `rules-of-hooks` como suprimidos o desaparecidos (debido al eslint override o ignore por path).
- [ ] `__root.tsx:79` ya no aparece en `react/no-danger` (suprimido con justificación inline).
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.
- [ ] Snapshot pre/post: `npx -y react-doctor@latest .` muestra el score subiendo (esperado > 70).
- [ ] `knip.json` documentado con comentarios JSON5 (o README adjunto) explicando cada entry.

## Done summary
lint script revertido correctamente, RAFITA:ANY agregado en router.tsx con justificación válida, resto del diff limpio
## Evidence
- Commits:
- Tests:
- PRs: