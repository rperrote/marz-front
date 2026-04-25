# forms

Sistema único de formularios en `src/shared/ui/form/`. Construido sobre **TanStack Form** (`createFormHook` + `createFormHookContexts`), valida con **Zod** (Standard Schema v1, sin adapter) y wrappea primitives de **shadcn**. Cargar este archivo cuando definas un formulario nuevo, agregues un field type, o toques validación.

## Stack

- **TanStack Form** (`@tanstack/react-form`) — state, dirty/touched/blurred, submit handling.
- **Zod 4** — schemas. Standard Schema v1 nativo: `validators.onChange = zodSchema` directo, sin `zodValidator()` ni adapter.
- **shadcn primitives** (`src/components/ui/`) — `Input`, `Textarea`, `Select`, `Switch`. Wrappeados en `shared/ui/form/fields/`, **nunca editados directamente**.
- **Lingui** — labels y mensajes de error pasan por `t\`...\``.

NO usar `react-hook-form`. NO introducir otra lib. NO crear "FieldXxx" propios fuera del sistema (si falta un type, se agrega al sistema).

## Estructura

```
src/shared/ui/form/
  index.ts                          # exports públicos
  contexts.ts                       # createFormHookContexts()
  app-form.ts                       # createFormHook + lista de field/form components
  fields/
    TextField.tsx                   # input text/email/password/url/tel
    TextareaField.tsx
    NumberField.tsx                 # value: number | null, emite null cuando se vacía
    SwitchField.tsx
    SelectField.tsx                 # acepta { value, label, disabled? }[]
  components/
    FieldRow.tsx                    # label + control + hint + error + aria wiring
    SubmitButton.tsx                # consume form.Subscribe → canSubmit, isSubmitting
    FormError.tsx                   # error a nivel form (no de un field)
  hooks/
    applyBackendFieldErrors.ts      # mapea ApiError → form.setFieldMeta
  lib/
    firstErrorMessage.ts            # extrae string de StandardSchemaV1Issue | string
```

## Patrón base

```tsx
import { useAppForm } from '#/shared/ui/form'
import { z } from 'zod'
import { brandIdentitySchema } from '#/shared/api/generated/zod/...'

export function BrandIdentityForm() {
  const form = useAppForm({
    defaultValues: { name: '', website_url: '' },
    validators: { onChange: brandIdentitySchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ data: value })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="name">
        {(field) => (
          <field.TextField label={t`Nombre`} placeholder={t`Mi marca`} />
        )}
      </form.AppField>

      <form.AppField name="website_url">
        {(field) => <field.TextField label={t`Sitio web`} type="url" />}
      </form.AppField>

      <form.AppForm>
        <form.FormError />
        <form.SubmitButton label={t`Continuar`} loadingLabel={t`Enviando…`} />
      </form.AppForm>
    </form>
  )
}
```

Reglas:

- `useAppForm` viene de `#/shared/ui/form`, no de `@tanstack/react-form` directamente. Eso garantiza que `form.AppField` y `form.AppForm` tengan los components tipados (`field.TextField`, `form.SubmitButton`, etc.).
- Schema único a nivel form (`validators.onChange`). No mezclar validators per-field con form-level salvo que tengas razón clara.
- `field.TextField`/`field.SelectField`/etc. no aceptan `value`/`onChange`/`onBlur`/`id`/`name` — los maneja TanStack Form vía context.
- Submit es siempre `form.handleSubmit()` (devuelve void Promise). El `<form>` wrapper hace `preventDefault`.

## Validación

- **`onChange`** es el modo default. Schema corre en cada cambio.
- **Errores se muestran cuando** `field.state.meta.isBlurred && errors.length > 0`. Cada field component ya implementa esto. **No** uses `isTouched` — se activa apenas el field cambia y irrita al usuario antes de que termine de tipear.
- **Mensajes de error en español argentino** definidos en el schema mismo (no hardcoded en JSX):

```tsx
const schema = z.object({
  email: z.string().email(t`Ingresá un email válido`),
  handle: z.string().min(3, t`Mínimo 3 caracteres`),
})
```

- **Schemas Zod de Orval** son la fuente de verdad cuando el campo es del backend. Importar desde `#/shared/api/generated/zod/...` y `.extend()` solo si el front necesita validación adicional UX-only. Nunca redefinir un campo que el backend ya valida.

## Errores del backend (422 / field_errors)

`ApiError.details.field_errors` (`Record<string, string[]>`) se mapea con `applyBackendFieldErrors`:

```tsx
import { applyBackendFieldErrors } from '#/shared/ui/form'

const form = useAppForm({
  defaultValues: { handle: '' },
  validators: { onChange: schema },
  onSubmit: async ({ value }) => {
    try {
      await mutation.mutateAsync({ data: value })
    } catch (err) {
      applyBackendFieldErrors(form, err, {
        fallback: (msg) => toast.error(msg),
      })
    }
  },
})
```

Comportamiento:

- Si `err` es `ApiError` con `details.field_errors`, mapea cada campo a `form.setFieldMeta(field, prev => ({ ...prev, errorMap: { ...prev.errorMap, onServer: msg }, isTouched: true, isBlurred: true, isDirty: true }))`. El error aparece debajo del input correspondiente.
- Si no hay `field_errors`, llama `fallback(message)` para que el caller decida (toast, FormError, etc.).
- Si no es `ApiError`, idem fallback con el `Error.message`.

## Submit deshabilitado

Lo maneja `<form.SubmitButton>` automáticamente vía `form.Subscribe` selector `canSubmit && !isSubmitting`. **NO** chequear `form.state.canSubmit` desde el caller para deshabilitar manualmente.

## Field components disponibles

| Component       | Tipo de value    | Uso                                                      |
| --------------- | ---------------- | -------------------------------------------------------- |
| `TextField`     | `string`         | text, email, password, url, tel (prop `type`)            |
| `TextareaField` | `string`         | textareas multi-línea                                    |
| `NumberField`   | `number \| null` | inputs numéricos. Vacío = `null`, no `0`                 |
| `SwitchField`   | `boolean`        | toggles on/off                                           |
| `SelectField`   | `string`         | dropdowns shadcn. Acepta `{ value, label, disabled? }[]` |

Si necesitás un type que no existe (ej. RadioGroup con visual de "card", PhoneField, FileUpload), **agregalo al sistema** en `fields/` con su test, y registralo en `app-form.ts`. No reinventes la rueda en una feature.

## FieldRow (cuando construís un field nuevo)

`FieldRow` es el wrapper visual que toda field component usa. Render-prop API:

```tsx
<FieldRow label={label} hint={hint} error={error}>
  {(aria) => <MyControl {...aria} value={...} onChange={...} />}
</FieldRow>
```

`aria` tiene `id`, `aria-describedby`, `aria-invalid`. `FieldRow` genera ids estables con `useId()` y conecta `htmlFor` del label automáticamente. **Nunca pasar `id` o `name` desde fuera** — el field component lee `field.name` del context.

## Compose con Zustand para multi-step wizards

Cuando un wizard tiene state que vive más allá de la screen (ej. brand onboarding 14 pasos), el store mantiene **navegación + datos derivados de APIs externas** (no inputs del usuario). Cada screen monta su propio `useAppForm` con `defaultValues` hidratados del store, y al avanzar persiste el subset al store. **No usar el form como global state** y **no usar el store como state del form**.

Detalle del patrón en `state.md` (cuando se actualice — ver Epic 5).

## Tests

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Queries por label, no por id ni testid:
const input = screen.getByLabelText('Email')
await user.type(input, 'no-mail')
await user.tab() // dispara blur
expect(await screen.findByRole('alert')).toHaveTextContent(/inválido/i)
```

- No mockear `useAppForm`. Renderizar el form real con un harness pequeño y ejercer con `userEvent`.
- Para errores 422 del backend: testear `applyBackendFieldErrors` con `ApiError` mockeado, no Clerk/MSW.
- Mock de Lingui igual que el resto del repo (ver `testing.md`).

## NO

- No `react-hook-form`. No `zodResolver`. No adapters.
- No mostrar errores antes de blur (el sistema ya lo hace; no overrideás `field.state.meta.errors` directo).
- No deshabilitar submit a mano. `SubmitButton` lo hace.
- No editar `src/components/ui/*`. Si querés variante visual del control, hacé un wrapper en `shared/ui/form/fields/` (ej. `PhoneField` envolviendo `Input` con mask).
- No hardcodear strings user-facing en field labels o errors. Todo pasa por `t\`...\``.
- No componer un form sin `<form.AppField>` (ej. usando `<form.Field>` directo). Sin `AppField` perdés los components tipados.
- No persistir el state del form en Zustand "por si acaso". Viven en el form mientras la screen está montada.
