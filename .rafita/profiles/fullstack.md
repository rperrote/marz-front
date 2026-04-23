# Fullstack Project Profile (Next.js + API)

## DEV Rules

- Leé `CLAUDE.md` y los `README` de cada app/package del monorepo.
- TypeScript strict en todo el stack.
- Separá client / server components; no filtrar lógica server al bundle client.
- Endpoints API validan input; usan tipos compartidos con el frontend cuando hay.
- Migraciones de DB reversibles, en su directorio específico.
- NO uses TodoWrite. NO commitees. Al terminar, `<done/>`.

## DEV Fix Rules

- Aplicá solo los fixes listados.
- Si el fix cruza frontend/backend, actualizá el tipo compartido en ambos lados.
- Al terminar, `<done/>`.

## Review Rules

- [ ] Tipos compartidos entre client y server están sincronizados.
- [ ] No hay `any` injustificado.
- [ ] No hay secrets hardcoded ni en client ni en server.
- [ ] Validación de input en endpoints.
- [ ] `console.log` y prints de debug fuera.
- [ ] Tests para lógica nueva en ambos lados si corresponde.
- [ ] Imports ordenados y sin usar.
- [ ] Accesibilidad básica en componentes interactivos.

## Plan Rules

- Identificá paths en frontend, backend, y shared types.
- Si hay migración de DB, listála aparte con su rollback.
- Marcá qué tests backend y qué tests frontend se tocan.

## Format Command

pnpm prettier --write .

## Test Command

pnpm test --run

## Lint Command

pnpm lint

## Typecheck Command

pnpm tsc --noEmit

## Skills

vercel-react-best-practices, vercel-composition-patterns, react-doctor

## Forbidden Paths

.env
.env.\*
package-lock.json
pnpm-lock.yaml
yarn.lock
.next/**
node_modules/**
dist/**
build/**
migrations/**
.rafita/**
