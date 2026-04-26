# design

Cómo trabajar con el design system de Marz. Cargar SIEMPRE que reproduzcas un diseño, ajustes layout o agregues una pantalla nueva.

## Source of truth

```
/Users/rodrigoperrote/Proyects/marz/marzv2/marz-design/marzv2.pen
```

Único archivo de diseño activo. `../marzv2.lib.pen` es referencia histórica, no tocar.

**El `.pen` está encriptado.** No se lee con `Read`, `Grep`, `cat` o `head`. Solo via tools MCP de `pencil`.

## Documento de contexto

```
/Users/rodrigoperrote/Proyects/marz/marzv2/marz-docs/DESIGN-DEV.md
```

Leer este archivo (con `Read` normal — está en plain markdown) cuando necesites:

- Tokens y convenciones de naming.
- Reglas de uso del CLI de `pencil`.
- Lenguaje visual del producto (redondeado, dark + light, responsive desktop + mobile).
- Enfoque atómico (átomos → moléculas → organismos → templates).
- Cómo decidir dónde va un componente.

Es la guía de alto nivel. Siempre conviene refrescarlo al empezar tarea de UI nueva.

## Tools MCP de pencil

Cargá las tools antes de usarlas con `ToolSearch query: "select:mcp__pencil__get_editor_state,mcp__pencil__open_document,mcp__pencil__batch_get,mcp__pencil__get_screenshot,mcp__pencil__get_variables,mcp__pencil__get_guidelines"`.

### Flujo estándar

1. **`mcp__pencil__get_editor_state({ include_schema: true })`** — primero. Devuelve el archivo activo, selección actual, lista de componentes reusables y schema del .pen.

2. **`mcp__pencil__open_document(path)`** — solo si no hay editor activo o querés abrir otro archivo. Para el archivo de Marz: `'/Users/rodrigoperrote/Proyects/marz/marzv2/marz-design/marzv2.pen'`.

3. **`mcp__pencil__get_variables()`** — leer tokens del design system. Hacelo antes de diseñar para no hardcodear.

4. **`mcp__pencil__get_screenshot({ filePath, nodeId })`** — render de un node específico. Útil para entender cómo se ve sin parsear JSON.

5. **`mcp__pencil__batch_get({ filePath, nodeIds, readDepth })`** — leer árbol de un node con todas sus props. **`readDepth` bajo (3-6)**, alto cuelga el desktop. Para listar componentes reusables del documento: `patterns: [{ reusable: true }], readDepth: 1`.

6. **`mcp__pencil__get_guidelines(category, name, params)`** — guías oficiales de uso del MCP. Cargar cuando hagas batch_design.

### Reproducir una pantalla

1. `get_editor_state` para ver qué archivo está activo y qué nodes top-level hay.
2. `get_screenshot({ nodeId: 'XYZ' })` para verla.
3. `batch_get({ nodeIds: ['XYZ'], readDepth: 6, resolveVariables: true })` para extraer textos, layout, colores con valores resueltos.
4. Mapear al stack: utilities Tailwind, tokens del `.pen` ya replicados en `src/styles.css`, componentes shadcn/`shared/ui/` cuando existen.
5. Si el componente reusable del `.pen` (ej. `OnboardingTierCard`, `OnboardingFooter`) ya tiene equivalente en código, **usar el equivalente**, no rehacer.

### Cuándo extraer texto

Los strings dentro del `.pen` son placeholders del diseño (ej. "María", "Nubank"). En código:

- Strings reales (botones, labels) → `t\`...\`` en español.
- Placeholders de input → `placeholder="..."` con el ejemplo del diseño.
- Heading dinámico → interpolación con datos del store (`store.contact_name?.split(' ')[0]`).

## Tokens del .pen → CSS

Los tokens nacen en el `.pen` y se replican **a mano** en `src/styles.css` con naming shadcn. Cuando cambien:

1. `mcp__pencil__get_variables()` para obtener los nuevos valores.
2. Editar `src/styles.css` para reflejar.
3. Probar light + dark.

No hay export automático. Detalle en `tokens.md`.

## NO

- Usar `Read`, `Grep`, `Write`, `Edit` contra el `.pen`.
- Usar el CLI de pencil en modo headless (`--in`, `--out`). Solo modo interactivo si hay que guardar manualmente:
  ```
  pencil interactive --app desktop --in marzv2.pen
  pencil > save()
  pencil > exit()
  ```
- Modificar el `.pen` desde acá. **Solo lectura desde marz-front.** Si hay que diseñar, lo hace el equipo de diseño.
- Hardcodear colores/radios del `.pen`. Siempre via token CSS replicado en `src/styles.css`.

## Lenguaje visual (resumen)

- Redondeado siempre, nunca cuadrado. Radios generosos.
- Light + Dark desde el inicio.
- Responsive: desktop y mobile (no mobile-first ni desktop-first).
- Naming shadcn: `--background`, `--foreground`, `--primary`, `--radius`, etc.
- Sin emojis en UI.
