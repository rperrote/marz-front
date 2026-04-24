# playwright

Dos usos distintos del mismo runtime, no confundirlos:

1. **Tests E2E persistentes** — código en `src/test/e2e/`, corre con `pnpm test:e2e`. Verifica regresiones a lo largo del tiempo.
2. **Verificación de UI durante desarrollo** — usa **Playwright MCP**, sin código persistente. Es lo que hacés en cada tarea para verificar que tu cambio funciona en browser.

Los dos viven en este archivo porque comparten setup y tokens de auth.

## 1. Tests E2E persistentes

### Cuándo escribir uno

- Flow crítico que no se puede romper sin que nadie se entere (login, checkout, submit de onboarding).
- Bug de regresión: cuando arregles un bug que solo se reproduce en browser, dejá un E2E para que no vuelva.
- NO escribir E2E para cada feature. Vitest cubre la lógica. E2E cubre los caminos críticos y la integración con el browser.

### Estructura

```
src/test/e2e/
  global-setup.ts        # corre clerkSetup() si las env vars están seteadas
  health.spec.ts         # smoke test: /health responde con payload válido
  <flow>.spec.ts         # un archivo por flow
```

Convención de archivo: `*.spec.ts`. Vitest excluye `**/e2e/**` así que no se mezclan.

### Comandos

```bash
pnpm test:e2e          # corre headless
pnpm test:e2e:ui       # UI mode (interactivo)
pnpm test:e2e:headed   # con browser visible
```

`playwright.config.ts` tiene `webServer` con `reuseExistingServer: true`. Si tenés `pnpm dev` corriendo en otra terminal, lo reusa. Si no, lo levanta.

### Backend

Backend `marz-api` corre siempre en `localhost:8080` y lo mantiene arriba el humano. Tus tests pueden asumirlo disponible.

### Auth con Clerk Testing Tokens

Stack: `@clerk/testing/playwright`. NO usamos M2M ni mock'eamos Clerk a mano — esa lib lo resuelve oficialmente.

Variables necesarias en `.env.local`:

- `VITE_CLERK_PUBLISHABLE_KEY` (la pública, ya existe).
- `CLERK_SECRET_KEY` (server-side, **agregar para E2E**, no committeable).
- `E2E_CLERK_USER_USERNAME` y `E2E_CLERK_USER_PASSWORD` cuando exista user de test.

Sin esas variables, `globalSetup` skipea `clerkSetup()` con warning. Tests sin auth (como `health.spec.ts`) siguen funcionando.

Patrón en tests con auth:

```ts
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('campañas listadas requieren auth', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/auth')
  await page.getByLabel('email').fill(process.env.E2E_CLERK_USER_USERNAME!)
  // ... flow de login normal, Clerk no bloquea por bot protection
  await page.waitForURL('/campaigns')
  await expect(page.getByRole('heading', { name: /campañas/i })).toBeVisible()
})
```

### NO

- Mockear Clerk a mano. Usar `@clerk/testing`.
- Generar JWTs M2M para impersonar al user. Eso es de back, en el front rompe Clerk SDK.
- Hacer assertions sobre HTML interno de shadcn (clases, data-attrs internos). Usar roles, labels, text.
- Hacer test E2E de toda feature. Solo flows críticos.

## 2. Verificación de UI durante desarrollo (Playwright MCP)

### Regla del agente

Cuando hacés un cambio de UI, **antes de declarar la tarea hecha, abrís el browser via Playwright MCP y verificás que funciona**. No alcanza con typecheck + tests.

Flujo típico:

1. `pnpm dev` corriendo (lo verificás con `curl -s localhost:3000 > /dev/null` o asumís que está).
2. Cargás las tools MCP de Playwright con `ToolSearch query: "select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_fill_form,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_console_messages,mcp__playwright__browser_network_requests"`.
3. `mcp__playwright__browser_navigate` a la ruta que tocaste.
4. `mcp__playwright__browser_snapshot` para ver el accessibility tree (más eficiente que screenshot, da estructura semántica).
5. Para flows que requieren input: `mcp__playwright__browser_fill_form` o `mcp__playwright__browser_click`.
6. `mcp__playwright__browser_console_messages` para chequear que no haya errores.
7. `mcp__playwright__browser_network_requests` si la feature toca la API — verificás 2xx, payload correcto.
8. Si encontrás bug: arreglar, repetir.

### Por qué MCP y no scripts temporales

- **MCP es la forma soportada** — el agente puede inspeccionar respuestas, leer console, navegar interactivamente.
- Scripts temporales (`tmp-test.ts` con `playwright.chromium.launch()`) son fricción: requieren commit/cleanup, no se integran al flow del agente, no permiten iterar.
- Si necesitás algo que MCP no expone, **escribir un E2E** y dejarlo en `src/test/e2e/` (ver sección 1). NO scripts ad-hoc.

### Auth durante dev verification

Si la feature requiere usuario logueado, dos caminos:

- **Via UI**: `browser_navigate('/auth')` + `browser_fill_form` con un user de dev real. Clerk en dev mode acepta magic link; podés capturar el link desde tu inbox o usar Testing Tokens.
- **Via Testing Token preinjectado**: setear cookie con el token antes de navegar. Más complejo, dejarlo para cuando el setup E2E con Clerk esté operativo.

Para tareas que solo tocan rutas públicas (login, /auth/kind sin sesión, /health), no hay que autenticar.

### NO

- Abrir browsers a mano fuera de MCP para "probar". El agente trabaja por MCP.
- Crear `tmp-*.ts` con scripts de Playwright. Si necesitás algo persistente, hacé E2E.
- Dejar el browser MCP abierto al terminar. Cerrar la sesión.

## Diferencia clave

|         | E2E persistente                    | MCP dev verification                        |
| ------- | ---------------------------------- | ------------------------------------------- |
| Vive en | `src/test/e2e/*.spec.ts`           | en la conversación, efímero                 |
| Cuándo  | flows críticos, regresión          | en cada tarea de UI antes de cerrar         |
| Auth    | Testing Tokens via lib             | UI o token manual                           |
| Output  | reporte HTML, screenshots fallidos | verificación inmediata, snapshots a demanda |
| Cleanup | git commit                         | nada, descartar al cerrar sesión            |
