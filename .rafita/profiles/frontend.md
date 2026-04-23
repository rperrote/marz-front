# Frontend Project Profile (React/Next/TS)

## DEV Rules
- Leé `CLAUDE.md` y cualquier `README.md` del package antes de tocar código.
- TypeScript strict; sin `any` si podés evitarlo. Si tenés que usarlo, justifica con un comentario `// RAFITA:ANY: <razón>`.
- Componentes en PascalCase, hooks en camelCase. Archivos de componentes: `.tsx`. Lógica pura: `.ts`.
- Tests colocan al lado del archivo (`Foo.test.tsx`) o en `__tests__/`.
- Preferí composition patterns sobre booleanos proliferados.
- Si la task modifica un componente con `"use client"`, no lo muevas a server sin autorización explícita en la spec.
- NO uses TodoWrite. NO commitees. Al terminar, `<done/>`.

## Diseño y componentes visuales

**Antes de implementar cualquier pantalla o componente con UI:**

1. Leé `/Users/rodrigoperrote/Proyects/marz/marzv2/marz-docs/DESIGN.md` para entender las reglas de diseño del producto.
2. Abrí el archivo de diseño `/Users/rodrigoperrote/Proyects/marz/marzv2/marz-design/marzv2.pen` con el MCP de Pencil (`batch_get`, `get_variables`, `get_screenshot`) para ver cómo se ven las pantallas que tenés que construir. El `.pen` es la fuente de verdad visual — no adivinés ni inventes la UI.

**Granularidad atómica — espejá la estructura del Pencil:**
- **Átomos**: variables CSS / tokens (`--primary`, `--radius`, etc.). Ya están en `src/styles.css`. Nunca hardcodees colores, radios ni spacing.
- **Moléculas**: componentes sin dominio de negocio reutilizables en cualquier producto (ej: `Avatar`, `Badge`, `InputField`, `Card`). Van en `src/shared/ui/`.
- **Organismos**: componentes que conocen el dominio (ej: `CampaignCard`, `OfferRow`, `ChatBubble`). Van en `src/features/<contexto>/components/`.
- **`src/components/ui/`**: SOLO primitives shadcn sin lógica de negocio. No metas nada que sepa qué es una Offer, Campaign o Creator.

## DEV Fix Rules
- Aplicá SOLO los fixes listados. No refactorees código no mencionado.
- Si el fix menciona un archivo no existente, creá el archivo siguiendo la convención del módulo más cercano.
- Al terminar, `<done/>`.

## Review Rules
- [ ] No hay `any` sin justificación explícita (comentario `// RAFITA:ANY:`).
- [ ] No hay `console.log` / `console.debug` dejados.
- [ ] Componentes tienen tipos en props (no implicit `any`).
- [ ] Si se agregó lógica con estado o efectos, hay tests que lo cubren.
- [ ] No se rompió la separación server/client components sin motivo en la spec.
- [ ] Imports ordenados (paquetes externos, alias internos, relativos) y sin imports sin usar.
- [ ] Accesibilidad: elementos interactivos tienen `aria-*` o `role` cuando corresponde.

## Plan Rules
- Identificá el o los componentes afectados y su árbol (parent / children).
- Marcá qué tests agregás y cuáles modificás.
- Si tocás fetch de datos, especificá client-side vs server-side.
- Si hay un cambio de shape en props o API route, listá TODOS los consumers.

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
.env.*
package-lock.json
pnpm-lock.yaml
yarn.lock
.next/**
node_modules/**
.rafita/**
