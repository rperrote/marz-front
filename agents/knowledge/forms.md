# forms

TanStack Form + Zod schemas generados por Orval. Cargar cuando definas formularios nuevos o modifiques validación.

## Stack

- **TanStack Form** para state, dirty/touched, submit handling.
- **Zod schemas de Orval** para validación. Source of truth: contrato del backend.
- **shadcn `Input`, `Select`, etc.** como inputs.
- **`OnboardingField`** wrapper en `features/identity/onboarding/shared/components/` para label + error + hint en pantallas de onboarding.

NO usar `react-hook-form`. No introducir otra lib de forms.

## Patrón básico

```tsx
import { z } from 'zod'
import { kindSelectionRequestSchema } from '#/shared/api/generated/zod/...'

const formSchema = kindSelectionRequestSchema.extend({
  // overrides solo si la validación del front difiere del backend
})

export function MyForm() {
  const form = useForm({
    defaultValues: { kind: '' as Kind | '' },
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => mutation.mutate({ data: value }),
  })
  // ...
}
```

## Validación en bordes

- **Cliente** valida UX (formato, requerido, longitud) — feedback inmediato.
- **Servidor** valida invariantes (unicidad, ownership, business rules) — autoridad final.
- Errores 422 del backend deben mapearse a fields del formulario, no mostrar toast genérico.

## Errores del backend

Pattern: el mutation hook devuelve `ApiError` con `status: 422` y body con shape `{ error: { fields: { handle: 'taken', ... } } }` (o similar — chequear contrato actual). Mapear a `form.setFieldMeta('handle', { errors: [msg] })` o equivalente.

Los stores Zustand de onboarding tienen `fieldErrors` y `setFieldErrors()` para este caso (ver `features/identity/onboarding/<kind>/store.ts`).

## OnboardingField

Wrapper interno usado en pantallas de onboarding. Acepta `label`, `hint`, `error`, `className`. Default `max-w-[440px]` — usar `className="max-w-none"` cuando el contenedor padre limita el ancho.

```tsx
<OnboardingField label="Nombre" error={errors.name}>
  <Input value={...} onChange={...} />
</OnboardingField>
```

## NO

- Validar contraseñas / handles con regex inventadas. Usar el schema generado por Orval.
- Bloquear el botón submit basado en estado local del form. TanStack Form expone `canSubmit`.
- Mostrar `error` siempre. Mostrar después de touched/dirty para no irritar al usuario.
- Lift state del form a un Zustand store global salvo que sea un wizard multi-step donde el state tiene que persistir entre rutas.
