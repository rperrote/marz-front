# QA Screen — onboarding.creator.birthday

> Fuente inicial: `src/test/e2e/creator-birthday.spec.ts`.
> Estado: documentacion generada desde cobertura existente. Requiere revision QA.

## Screen

```yaml
screen: onboarding.creator.birthday
flow: creator_onboarding
route: /onboarding/creator/birthday
state: onboarding_pending
user:
  role: creator
  account_kind: creator
fixture_helper: creatorOnboardingUser
```

## Existing E2E

### onboarding.creator.birthday.day_month_year_preserves_values

```yaml
id: onboarding.creator.birthday.day_month_year_preserves_values
screen: onboarding.creator.birthday
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-birthday.spec.ts
  test_name: selecting day, then month, then year keeps all three values
```

**Cubre**

- Los selects Radix de dia, mes y anio funcionan en orden dia -> mes -> anio.
- Seleccionar un campo no borra los valores anteriores.
- Una fecha completa y valida habilita `Continuar`.

**Resultado esperado**

- Dia muestra `5`.
- Mes muestra `Marzo`.
- Anio muestra un anio valido.
- `Continuar` esta enabled.

### onboarding.creator.birthday.month_day_year_preserves_values

```yaml
id: onboarding.creator.birthday.month_day_year_preserves_values
screen: onboarding.creator.birthday
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-birthday.spec.ts
  test_name: selecting in month -> day -> year order also keeps all values
```

**Cubre**

- Los selects conservan valores tambien en orden mes -> dia -> anio.
- La pantalla no depende de un orden unico de seleccion.

**Resultado esperado**

- Mes muestra `Julio`.
- Dia muestra `12`.
- Anio muestra un anio valido.
- `Continuar` esta enabled.

### onboarding.creator.birthday.complete_valid_date_enables_continue

```yaml
id: onboarding.creator.birthday.complete_valid_date_enables_continue
screen: onboarding.creator.birthday
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/creator-birthday.spec.ts
  test_name: Continuar enables once a complete valid date is selected
```

**Cubre**

- `Continuar` arranca disabled.
- Elegir dia, mes y anio validos habilita el avance.

**Resultado esperado**

- `Continuar` esta disabled al entrar.
- `Continuar` queda enabled despues de completar fecha valida.

## Gaps / candidatos

### onboarding.creator.birthday.invalid_or_underage_date_blocked

**Motivo**

- La cobertura actual valida fechas completas, pero no documenta fechas invalidas o edad minima si aplica.

### onboarding.creator.birthday.persistence_after_navigation

**Motivo**

- No hay caso documentado que navegue hacia adelante/atras y confirme que la fecha seleccionada se conserva.
