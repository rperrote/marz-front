# tokens

Tokens del design system + Tailwind v4 + dark mode. Cargar cuando estilizas componentes o agregas variantes visuales.

## Source of truth

Los tokens nacen en `marz-design/marzv2.pen` (encriptado, solo accesible via MCP `pencil`). Se replican **a mano** en `src/styles.css` con naming shadcn (`--background`, `--foreground`, `--primary`, `--radius`, etc.) en light + dark.

No hay export automático. Cuando cambien en el `.pen`, replicar.

## Tailwind v4

`src/styles.css` usa:

```css
@import 'tailwindcss';

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

Esto expone los tokens como utilities (`bg-background`, `text-foreground`, `rounded-lg`) sin rebuild.

## Reglas

- **Nunca hardcodear**: colores, radios, fuentes, spacing, font-sizes.
- **Usar utilities** (`bg-background`, `text-muted-foreground`, `rounded-2xl`) o **variables CSS** (`var(--primary)`) si el utility no existe.
- **Spacing**: `gap-3`, `p-6`, `space-y-4`. NO `style={{ gap: 12 }}`.
- **Radios**: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`. NO `rounded-[20px]` salvo que el diseño lo pida específicamente y no haya un token.
- **Excepción**: tamaños exactos del diseño que no tienen token (ej. `w-[260px]`, `h-[180px]`). OK.

## Dark mode

Clase `.dark` en `<html>`. Toggle en `src/components/ThemeToggle.tsx` persiste en localStorage con mode `auto | light | dark`.

`__root.tsx` tiene un script inline que resuelve el tema **antes de hidratación** para evitar flash. NO tocar ese script salvo que sepas qué estás haciendo.

## Geist

Fuente self-hosted con `@fontsource/geist-sans`. Se importa en `__root.tsx`. NO usar Google Fonts ni cargar la fuente desde CDN.

## UI redondeada siempre

Lenguaje visual del producto: redondeado, nunca cuadrado. Radios generosos.

- Pills: `rounded-full`.
- Cards: `rounded-2xl` o `rounded-3xl`.
- Botones: `rounded-xl`.
- Inputs: `rounded-xl`.

Cuadrados afilados quedan fuera del lenguaje visual.

## Iconos

`lucide-react`. Tamaños: `size-4` (16px), `size-5` (20px), `size-6` (24px). NO `width/height` directo.

## Diseño en pixel-perfect mode

Cuando reproducís un diseño del `.pen`:

- Los tamaños exactos del diseño (ej. `w-[180px]`, `h-[140px]`) son OK como `[]` literal.
- Los colores y radios siempre van por token. Si el diseño usa `#0DA678`, ese es `var(--primary)`. Si no matchea exactamente, hay que ajustar el token, no hardcodear.
