# QA Flow — onboarding

> Fuente inicial: E2E existentes en `src/test/e2e/onboarding.spec.ts`, `creator-channels.spec.ts`, `creator-birthday.spec.ts` y `app-shell.spec.ts`.
> Estado: documentacion generada desde cobertura existente. Requiere revision QA.

## Alcance

El onboarding tiene flujos separados para brand y creator, mas la seleccion inicial de kind.

Rutas principales:

- `/auth/kind`
- `/onboarding/brand`
- `/onboarding/brand/$step`
- `/onboarding/creator`
- `/onboarding/creator/$step`

Estados usados por E2E:

- `kind_pending`
- `onboarding_pending` con `account_kind=brand`
- `onboarding_pending` con `account_kind=creator`
- onboarded brand
- onboarded creator

## Existing E2E

### onboarding.brand.wizard.visible

```yaml
id: onboarding.brand.wizard.visible
screen: onboarding.brand
flow: brand_onboarding
state: onboarding_pending
user:
  role: brand
  account_kind: brand
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: brand onboarding_pending ve el wizard
```

**Cubre**

- Un brand en onboarding pendiente puede abrir `/onboarding/brand`.
- El wizard muestra `Paso 1 de`.
- El boton `Continuar` esta visible.

### onboarding.creator.wizard.visible

```yaml
id: onboarding.creator.wizard.visible
screen: onboarding.creator
flow: creator_onboarding
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: creator onboarding_pending ve el wizard de creator
```

**Cubre**

- Un creator en onboarding pendiente puede abrir `/onboarding/creator`.
- El wizard muestra `Paso 1 de`.

### onboarding.brand.onboarded.redirects_to_campaigns

```yaml
id: onboarding.brand.onboarded.redirects_to_campaigns
screen: onboarding.brand.guard
flow: brand_onboarding
state: onboarded
user:
  role: brand
  account_kind: brand
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: brand onboarded es redirigido de /onboarding/brand a /campaigns
```

**Cubre**

- Un brand ya onboarded no queda dentro del onboarding.
- `/onboarding/brand` redirige a `/campaigns`.

### onboarding.creator.onboarded.redirects_to_offers

```yaml
id: onboarding.creator.onboarded.redirects_to_offers
screen: onboarding.creator.guard
flow: creator_onboarding
state: onboarded
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: creator onboarded es redirigido de /onboarding/creator a /offers
```

**Cubre**

- Un creator ya onboarded no queda dentro del onboarding.
- `/onboarding/creator` redirige a `/offers`.

### auth.kind.selector.visible

```yaml
id: auth.kind.selector.visible
screen: auth.kind
flow: account_kind_selection
state: kind_pending
user:
  role: authenticated_user
  account_kind: none
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: kind_pending ve el selector de kind
```

**Cubre**

- Un usuario en `kind_pending` puede abrir `/auth/kind`.
- La pantalla muestra el heading `Que te trae por aca`.

### onboarding.brand.full_completion.redirects_to_campaigns

```yaml
id: onboarding.brand.full_completion.redirects_to_campaigns
screen: onboarding.brand.full_wizard
flow: brand_onboarding
state: onboarding_pending
user:
  role: brand
  account_kind: brand
source:
  e2e: src/test/e2e/onboarding.spec.ts
  test_name: brand completa el wizard de B1 a B14 y termina en /campaigns
```

**Cubre**

- Brand completa el wizard desde B1 hasta B14.
- El flujo acepta los steps informativos sin input.
- El paywall permite continuar sin acceso a red de creadores.
- Al confirmar, el usuario termina en `/campaigns`.

**Steps cubiertos**

- B1 identity
- B2 vertical
- B3 priming social proof
- B4 objective
- B5 experience + sourcing intent
- B6 budget
- B7 priming match preview
- B8 timing
- B9 contact
- B10 priming projection
- B11 attribution
- B12 loading
- B13 paywall
- B14 confirmation

### app_shell.brand_onboarding_user.redirects_to_brand_onboarding

```yaml
id: app_shell.brand_onboarding_user.redirects_to_brand_onboarding
screen: app_shell.routing
flow: app_shell_routing
state: onboarding_pending
user:
  role: brand
  account_kind: brand
source:
  e2e: src/test/e2e/app-shell.spec.ts
  test_name: app shell brand onboarding redirect
```

**Cubre**

- El app shell redirige a un brand en onboarding pendiente hacia el onboarding brand.

### app_shell.creator_onboarding_user.redirects_to_creator_onboarding

```yaml
id: app_shell.creator_onboarding_user.redirects_to_creator_onboarding
screen: app_shell.routing
flow: app_shell_routing
state: onboarding_pending
user:
  role: creator
  account_kind: creator
source:
  e2e: src/test/e2e/app-shell.spec.ts
  test_name: app shell creator onboarding redirect
```

**Cubre**

- El app shell redirige a un creator en onboarding pendiente hacia el onboarding creator.

## Screens con documentacion especifica

- [onboarding.creator.channels](../screens/onboarding.creator.channels.md)
- [onboarding.creator.birthday](../screens/onboarding.creator.birthday.md)

## Fixtures inferidos

- `brandOnboardingUser`: `onboarding_pending`, kind `brand`.
- `creatorOnboardingUser`: `onboarding_pending`, kind `creator`.
- `onboardedBrandUser`: `onboardFull('brand')`.
- `onboardedCreatorUser`: `onboardFull('creator')`.
- `testUser + setOnboardingState('kind_pending')`: usuario autenticado sin kind final.

## Gaps / candidatos

### onboarding.creator.full_completion.redirects_to_offers

**Motivo**

- Hay cobertura de ingreso al wizard creator y de pantallas puntuales, pero no un E2E documentado que complete todo el creator onboarding de punta a punta.

### onboarding.brand.step_validation

**Motivo**

- El E2E happy path de brand completa campos validos. No documenta casos negativos por step, por ejemplo contacto invalido, vertical sin seleccionar o attribution referral sin texto.

### onboarding.kind_selector.role_paths

**Motivo**

- El E2E confirma que el selector aparece para `kind_pending`, pero no documenta la seleccion de brand/creator ni la navegacion resultante.
