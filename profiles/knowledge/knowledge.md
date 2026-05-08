# Knowledge index

Índice condicional de knowledges. Antes de actuar, leé el archivo que corresponda al tipo de trabajo. Si la tarea cruza varias áreas, leé todos los aplicables.

## Reglas de lectura condicional

- Si vas a tocar un formulario o necesitás trabajar con ellos → leé `forms.md`.
- Si vas a tocar rutas, navegación, guards o file-based routing → leé `routing.md`.
- Si vas a tocar el cliente HTTP, Orval, hooks generados o `mutator.ts` → leé `api-client.md`.
- Si vas a tocar autenticación, sesión, `account.kind` o login → leé `auth.md`.
- Si vas a tocar WebSocket, eventos de dominio o `DomainEventEnvelope` → leé `ws.md`.
- Si vas a tocar estado global, Zustand o estado de cliente → leé `state.md`.
- Si vas a tocar diseño, layouts, componentes visuales o shadcn → leé `design.md` Y `marz-docs/DESIGN-DEV.md` (reglas de lectura del `.pen` y Pencil MCP — read-only para devs).
- Si vas a tocar tokens, colores, radios, tipografía o `styles.css` → leé `tokens.md`.
- Si vas a escribir o modificar tests (Vitest, Testing Library) → leé `testing.md`.
- Si tu task toca UI, ruta nueva, interacción visible, form o cualquier cambio que se vea en el browser → leé `playwright.md` (sección 2: MCP). Verificación obligatoria antes de declarar done.
- Si vas a escribir o modificar tests E2E persistentes con Playwright (`src/test/e2e/`) → leé `playwright.md` (sección 1: E2E).
- Si vas a tocar manejo de errores, `ApiError` o boundaries → leé `errors.md`.
- Si vas a tocar i18n, traducciones o textos → leé `i18n.md`.
- Si vas a tocar configuración del entorno del agente, env vars o tooling local → leé `agent-env.md`.
- Si vas a escribir cualquier código React → leé `base-react.md`.
- Si necesitás conocer el stack y decisiones técnicas globales → leé `stack.md`.
- Antes de cualquier cambio → leé `donts.md` para evitar anti-patrones del repo.

## Orden sugerido

1. `donts.md` y `base-react.md` siempre que toques código.
2. `stack.md` si es tu primera tarea en el repo o no recordás el stack.
3. El knowledge específico del dominio de la tarea según la lista de arriba.
