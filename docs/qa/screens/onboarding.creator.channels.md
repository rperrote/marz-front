# QA Screen — onboarding.creator.channels

> Fuente inicial: `src/test/e2e/creator-channels.spec.ts`.
> Estado: documentacion generada desde cobertura existente. Requiere revision QA.

## Screen

```yaml
screen: onboarding.creator.channels
flow: creator_onboarding
route: /onboarding/creator/channels
state: onboarding_pending
user:
  role: creator
  account_kind: creator
fixture_helper: creatorOnboardingUser
```

## Existing E2E

### onboarding.creator.channels.overflow_scroll_keeps_first_channel_reachable

```yaml
id: onboarding.creator.channels.overflow_scroll_keeps_first_channel_reachable
screen: onboarding.creator.channels
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-channels.spec.ts
  test_name: first channel header remains reachable via scroll when content overflows
```

**Cubre**

- Con viewport bajo y varios channels, el scroll container permite volver al inicio.
- El primer header de channel sigue visible en `scrollTop=0`.
- Regresion historica: contenido cortado por `justify-center` + `overflow-y-auto`.

**Resultado esperado**

- El primer header de channel esta dentro del viewport.

### onboarding.creator.channels.add_channel_disabled_when_all_platforms_taken

```yaml
id: onboarding.creator.channels.add_channel_disabled_when_all_platforms_taken
screen: onboarding.creator.channels
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-channels.spec.ts
  test_name: Agregar canal disables once all 3 platforms are taken
```

**Cubre**

- El usuario puede agregar hasta tres channels.
- Las plataformas presentes son Instagram, TikTok y YouTube.
- El boton `Agregar canal` queda deshabilitado cuando ya no hay plataformas disponibles.

**Resultado esperado**

- `Agregar canal` esta disabled.
- Los headers contienen Instagram, TikTok y YouTube.

### onboarding.creator.channels.empty_rate_amount_marks_input_invalid

```yaml
id: onboarding.creator.channels.empty_rate_amount_marks_input_invalid
screen: onboarding.creator.channels
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-channels.spec.ts
  test_name: rate card with empty amount marks the input as invalid
```

**Cubre**

- Al agregar una tarifa sin monto, el input de monto se marca invalido.
- Regresion historica: una rate card sin amount no mostraba estilo destructivo.

**Resultado esperado**

- El input con placeholder `0.00` esta visible.
- El input tiene `aria-invalid="true"`.

### onboarding.creator.channels.continue_disabled_missing_handle

```yaml
id: onboarding.creator.channels.continue_disabled_missing_handle
screen: onboarding.creator.channels
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-channels.spec.ts
  test_name: Continuar is disabled while any channel is missing its handle
```

**Cubre**

- Un channel sin handle bloquea el avance.
- Completar el handle habilita `Continuar` cuando no hay otros errores.

**Resultado esperado**

- `Continuar` esta disabled con handle vacio.
- `Continuar` queda enabled al completar `tu_handle`.

### onboarding.creator.channels.continue_disabled_missing_rate_amount

```yaml
id: onboarding.creator.channels.continue_disabled_missing_rate_amount
screen: onboarding.creator.channels
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-channels.spec.ts
  test_name: Continuar is disabled while any rate card is missing its amount
```

**Cubre**

- Una rate card sin monto bloquea el avance aunque el handle este completo.
- Completar el monto re-habilita `Continuar`.
- Regresion historica: `Continuar` no debia habilitarse con rate cards incompletas.

**Resultado esperado**

- `Continuar` esta disabled con una rate card sin amount.
- `Continuar` queda enabled al completar el amount.

## Gaps / candidatos

### onboarding.creator.channels.platform_selector_excludes_unsupported

**Motivo**

- La cobertura actual confirma que aparecen Instagram, TikTok y YouTube al completar channels, pero no documenta explicitamente que Twitch y Twitter/X no aparecen como opciones seleccionables.

### onboarding.creator.channels.valid_channels_persist_on_continue

**Motivo**

- No hay caso documentado que continue con channels validos y confirme persistencia/navegacion al siguiente step.

### onboarding.creator.channels.edit_or_remove_channel

**Motivo**

- No hay caso documentado de edicion o remocion de channels, si la UI lo soporta.

### onboarding.creator.channels.primary_channel_rules

**Motivo**

- El schema exige exactamente un primary channel, pero los E2E actuales no documentan el comportamiento de seleccion/cambio de primary.
