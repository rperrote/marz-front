## Description

Regenerar el cliente API tipado a partir del OpenAPI publicado por marz-api dev una vez que B.7 (FEAT-018 backend) esté desplegado. Esto deja disponibles los schemas `BrandPaymentsSpendingResponse` y `BrandPaymentHistoryRow` y los hooks Orval correspondientes para que las tareas posteriores puedan importarlos.

**Size:** S
**Files:** `src/shared/api/generated/**` (gitignored, regenerado), eventualmente notas en CLAUDE.md si cambia el comando.

## Approach

- Verificar que backend dev tenga los endpoints `/v1/brand-workspaces/{id}/payments/spending` y `.../export.csv` antes de correr.
- Ejecutar `pnpm api:sync`. NO committear archivos generados.
- Validar typecheck.
- Si typecheck rompe en otros features no relacionados, no parchear acá: reportar y crear task aparte.

## Investigation targets

**Required:**

- `package.json` — script `api:sync` y `typecheck`.
- `src/shared/api/mutator.ts` — mutator Orval que devuelve hooks.
- `.gitignore` — confirmar que generated/ esté ignorado.

**Optional:**

- Documentación interna de Orval/api:sync si existe en CLAUDE.md root.

## Key context

- Generated code NO se committea (CLAUDE.md). Si está committeado por error, no incluirlo en el PR de esta task.
- Si backend dev aún no tiene los endpoints, esta task se bloquea hasta que B.7 esté en dev.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores contra dev backend.
- [ ] `src/shared/api/generated/` contiene tipos para los dos endpoints nuevos (`getBrandWorkspacePaymentsSpending`, export CSV).
- [ ] `pnpm typecheck` pasa.
- [ ] No se committean archivos generados.

## Done summary
Mock parcial de BrandSessionContext correcto: preserva exports reales via importOriginal y sobreescribe solo useBrandSession. Fix necesario para que pnpm typecheck pase como criterio de aceptación de la task.
## Evidence
- Commits:
- Tests:
- PRs: