# Generic Project Profile

## DEV Rules

- Lee el CLAUDE.md / README del proyecto antes de tocar código para entender la arquitectura.
- Implementa SOLO lo que pide la spec. No refactorees código no relacionado.
- Si la task es ambigua o imposible, escribí `// RAFITA:BLOCKER: <razón>` como comentario en el archivo relevante y no inventes requisitos.
- NO uses TodoWrite. NO commitees ni pushees. NO abras PRs. Rafita se encarga.
- Al terminar, output: <done/>

## DEV Fix Rules

- Aplicá SOLO los fixes listados en {{FIXES}}. No toques nada más.
- Si un fix parece equivocado, igual aplicalo pero agregá un comentario `// RAFITA:DISAGREE: <razón>`.
- NO uses TodoWrite. Al terminar, output: <done/>

## Review Rules

- [ ] El diff implementa exactamente lo que pide la spec (no menos, no más).
- [ ] No hay dead code, imports sin usar, variables no usadas.
- [ ] No hay secrets, API keys, URLs hardcoded, credenciales.
- [ ] No hay `console.log`, `print`, `pdb.set_trace`, `debugger` de debug dejados.
- [ ] Si tocó lógica crítica, hay tests nuevos o modificados que la cubren.
- [ ] Nombres claros, sin abreviaturas oscuras.
- [ ] Manejo razonable de errores en los bordes (I/O, input externo).

## Plan Rules

(none)

## Format Command

(none)

## Test Command

(none)

## Lint Command

(none)

## Typecheck Command

(none)

## Skills

(none)

## Forbidden Paths

.env
.env.\*
package-lock.json
pnpm-lock.yaml
yarn.lock
.rafita/\*\*
