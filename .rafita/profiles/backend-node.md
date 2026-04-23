# Backend Node Project Profile (TS/JS)

## DEV Rules

- Leé `CLAUDE.md`, `README.md`, y los archivos `index.ts` relevantes antes de modificar endpoints.
- TypeScript strict. Si necesitás `any`, justificá con `// RAFITA:ANY: <razón>`.
- Validá input externo con schema (zod / valibot / joi según el proyecto). No confíes en el request body crudo.
- Errores en endpoints devuelven status HTTP correcto + mensaje machine-readable; nunca exponer stack traces a clientes.
- Queries SQL parametrizadas siempre; no interpolar strings.
- NO uses TodoWrite. NO commitees. Al terminar, `<done/>`.

## DEV Fix Rules

- Solo aplicar fixes listados. No refactors.
- Si el fix afecta un endpoint público, verificá que el contrato de respuesta siga igual salvo que la spec diga lo contrario.
- Al terminar, `<done/>`.

## Review Rules

- [ ] Input externo validado antes de usarlo.
- [ ] No hay SQL interpolado sin parámetros.
- [ ] No hay secrets hardcoded (URLs con credenciales, tokens, etc).
- [ ] Errores capturados y logueados sin exponer stack al cliente.
- [ ] Si se agregó endpoint, hay test de integración.
- [ ] Logging sin secretos (no loguear request body completo si contiene PII).
- [ ] Sin `any` injustificado.

## Plan Rules

- Identificá endpoints / handlers afectados.
- Listá schema de input y output.
- Migraciones de DB: deben ser reversibles y listadas aparte.

## Format Command

pnpm prettier --write .

## Test Command

pnpm test --run

## Lint Command

pnpm lint

## Typecheck Command

pnpm tsc --noEmit

## Skills

(none)

## Forbidden Paths

.env
.env.\*
package-lock.json
pnpm-lock.yaml
yarn.lock
node_modules/**
dist/**
build/**
migrations/**
.rafita/\*\*
