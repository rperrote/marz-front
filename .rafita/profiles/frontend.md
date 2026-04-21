# Frontend Profile (Marz — `marz-front`)

Perfil para el frontend de Marz: **TanStack Start** (SSR full-stack con TanStack Router + server functions), Tailwind + shadcn/ui, TanStack Query para server state, Zustand para cliente, TanStack Form + Zod para forms.

## DEV Rules

- Lee `CLAUDE.md` del proyecto y `marz-docs/architecture/overview.md` para entender stack y convenciones.
- Lee la **task épica de flow-next** (`.flow/tasks/{task-id}.md`) y la **épica padre** (`.flow/specs/fn-N.md`). Todo lo que hacés cumple eso.
- Si la task referencia `03-solution.md`, leelo para entender contratos API/WS y rutas nuevas.
- Implementá SOLO lo que pide la task.
- NO usar TodoWrite.
- Cargá skills de react/frontend instalados cuando sean relevantes (usar ToolSearch): `react-doctor`, `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`.

### Stack

- **TanStack Router**: rutas file-based en `src/routes/`. Validá search params con Zod en el `validateSearch` de la ruta. Usá `createFileRoute` o `createRoute`. No Next.js `pages/` o `app/`.
- **Server functions** (TanStack Start): para data fetching y mutations server-side usá `createServerFn` con schemas Zod. Evitá APIs REST propias del front si el caso se resuelve con server function. Llamadas directas al backend Go van a través del cliente generado de OpenAPI (`openapi-fetch`).
- **TanStack Query**: todo fetch de backend pasa por un hook `useXxxQuery`/`useXxxMutation` con query keys consistentes. Nada de `fetch` directo en componentes.
- **TanStack Form**: forms con `useForm` + schema Zod. Nunca `react-hook-form` (stack unificado en TanStack).
- **shadcn/ui**: usá componentes existentes antes de crear nuevos. El design system está instalado; extender variantes con `cva` donde corresponde. No inventar componentes base.
- **Tailwind**: usá tokens del theme. No colores hex sueltos. Classnames con `cn()` helper.
- **Zustand**: solo para estado cliente puro (UI state, drafts locales). Server state va en TanStack Query. Forms van en TanStack Form.
- **WebSocket**: hook `useWSSubscribe(eventTypes, handler)` sobre el cliente WS unificado. No `new WebSocket()` disperso en componentes.
- **OpenAPI → tipos**: el cliente tipado se regenera con `pnpm gen:api` tras cambios en `marz-api/openapi.yaml`. Si la task toca endpoints nuevos, regenerá antes de codear.

### Diseño (pencil)

- El diseño vive en `marz-design/marzv2.pen`. Lee con pencil MCP (`get_editor_state`, `batch_get`, `get_screenshot`). Nunca abrás el `.pen` con Read/Grep (encriptado).
- Si la task tiene pantalla asociada, exportá la referencia a PNG:
  ```
  pencil --in marz-design/marzv2.pen --out /tmp/rafita-design-out.pen --prompt "export <screen-name>" --export .rafita/design-refs/<screen>.png
  ```
- Implementá respetando el diseño: colores via variables shadcn, spacing del theme Tailwind, tipografía, layout.

### Validación visual (playwright)

- Levantá dev server si no está corriendo. URL por default `http://localhost:3000` (configurable vía `.rafita/config.json` clave `devServerUrl`).
- Navegá con `mcp__playwright__browser_navigate` a la ruta del feature.
- Capturá con `mcp__playwright__browser_take_screenshot` en `.rafita/design-actual/<screen>.png`.
- Comparación pixel-to-pixel contra `.rafita/design-refs/<screen>.png`. Objetivo **≥95%** similitud.
- Si <95%, ajustá código e iterá hasta llegar al umbral.

### Tests

- **Unit**: Vitest + Testing Library para componentes, hooks y utils. Cubrí lógica del código que escribiste, casos de error, estados intermedios. NO testees implementación; testeá comportamiento observable.
- **E2E**: Playwright en `e2e/`. Happy path de la feature + edge cases críticos. Nombres descriptivos.
- Mocks de server functions con MSW cuando aplique.
- `pnpm format` + `pnpm typecheck` + `pnpm test` antes de terminar.
- NO agregar comments/docstrings/type annotations a código que no cambiaste.
- Al terminar, output: `<done/>`.

## DEV Fix Rules

- Aplicá SOLO los fixes listados.
- Si el fix afecta UI → re-exportá la referencia del pencil y re-validá con Playwright (≥95%).
- Si el fix afecta lógica → actualizá/agregá tests unit correspondientes.
- Si el fix afecta contratos API → regenerá tipos con `pnpm gen:api`.
- `pnpm format` + `pnpm typecheck` + `pnpm test` antes de terminar.
- NO usar TodoWrite.
- Cargá skills relevantes si hacen falta.
- Al terminar, output: `<done/>`.

## Review Rules

**Input del reviewer**: el diff del branch + la **task épica de flow-next** (`.flow/tasks/{task-id}.md`) + la épica padre (`.flow/specs/fn-N.md`). Leerlos antes de revisar.

Veredicto **estructurado obligatorio**:

```
APPROVED
```

o

```
REJECTED:
1. {archivo:línea} — {qué está mal} — {qué hacer}
2. {archivo:línea} — {qué está mal} — {qué hacer}
...
```

Sin texto adicional. Sin "LGTM con nits". Sin sugerencias cosméticas.

Chequeos obligatorios en orden:

1. **Cumple la task flow-next**: lo implementado resuelve la task al pie. Si falta algo, listar qué.
2. **Stack correcto**:
   - Rutas en `src/routes/` con `createFileRoute`, no carpetas estilo Next.
   - Server functions con `createServerFn` + Zod schemas.
   - Fetching via TanStack Query hooks, no `fetch` suelto en componentes.
   - Forms con TanStack Form, no react-hook-form.
   - Cliente API generado desde OpenAPI, no URLs hardcodeadas.
3. **shadcn & design**:
   - Componentes existentes reutilizados antes de crear nuevos.
   - Tokens del theme (Tailwind/shadcn) en vez de hex/px sueltos.
   - Variantes con `cva` cuando corresponde.
4. **Accesibilidad**:
   - `alt` en imágenes con contenido.
   - Labels asociados a inputs.
   - Roles ARIA donde corresponde.
   - Navegación por teclado funcional en flujos críticos.
5. **Seguridad**:
   - Sin `dangerouslySetInnerHTML` sobre input de usuario sin sanitizar.
   - Sin secrets en bundle cliente (verificar que variables server-only no se filtran).
   - Validación client + server (server functions con Zod).
6. **Performance**:
   - Query keys estables; sin refetch en loop.
   - `useMemo`/`useCallback` donde haya listas grandes o children pesados (no everywhere).
   - Imágenes optimizadas (`<img loading="lazy">` o componente del framework).
   - Lazy loading de rutas pesadas con `lazy: true` en la ruta.
   - Sin imports de módulos pesados sin code-split.
7. **Responsive**:
   - Sin anchos fijos que rompan en mobile.
   - Breakpoints consistentes con el theme.
8. **WebSocket**:
   - Uso del hook unificado, no `new WebSocket()`.
   - Cleanup en `useEffect` return (unsubscribe).
9. **Validación visual**:
   - Exportá la referencia del `.pen`:
     ```
     pencil --in marz-design/marzv2.pen --out /tmp/rafita-review-out.pen --prompt "export <screen>" --export .rafita/design-refs/<screen>.png
     ```
   - Navegá con Playwright al feature, capturá screenshot, compará.
   - **REJECTED** si similitud <95% con lista concreta de diferencias (spacing, color, tipografía, layout).
10. **Tests**:
    - Leé los tests unit: testean comportamiento real (no solo render), cubren error cases, asserts significativos.
    - Corré `pnpm test`. REJECTED si alguno falla.
    - Corré `pnpm test:e2e` (carpeta `e2e/`). REJECTED si alguno falla.
    - REJECTED si falta cobertura sobre código nuevo no trivial.
11. **TypeScript**:
    - `pnpm typecheck` pasa.
    - Sin `any` implícito/explícito en código nuevo (excepto en casts justificados con comentario).
    - Search params de rutas validados con Zod.

Si todo pasa → `APPROVED`. Si falla cualquier punto → `REJECTED:` con lista numerada.

## Format Command

```
pnpm format && pnpm typecheck
```

## Skills

react-doctor, vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines
