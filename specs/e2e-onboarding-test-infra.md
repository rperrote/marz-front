# Especificación: Infraestructura de test para E2E de onboarding

## Contexto

El frontend tiene wizards de onboarding para brand y creator que dependen del estado `onboarding_status` devuelto por `/v1/me`. Los estados posibles son:

- `kind_pending` — el usuario logueado con Clerk no eligió si es brand o creator
- `onboarding_pending` — eligió kind, debe completar el wizard
- `onboarded` — flujo completo, accede a la app

Los tests E2E con Playwright necesitan validar que:

1. Un usuario `kind_pending` ve el selector y es redirigido al wizard correcto
2. Un usuario `onboarding_pending` ve el wizard de su kind y puede avanzar pasos
3. Un usuario `onboarded` es redirigido lejos del onboarding

## Problema

El onboarding es un flujo unidireccional stateful. Una vez que un usuario avanza, no hay forma de volver atrás sin mutar estado en el backend. Esto hace imposible correr tests E2E determinísticos contra un mismo usuario de test.

## Requisitos

### R1. Control de estado de onboarding para usuarios de test

El frontend necesita poder, antes de cada test E2E, asegurar que un usuario de test esté en un estado conocido de onboarding.

**Entradas esperadas:**

- Identificador del usuario de test
- Estado objetivo (`kind_pending`, `onboarding_pending`, `onboarded`)
- Kind deseado (si aplica)

**Salida esperada:**

- Confirmación de que el usuario quedó en el estado solicitado
- `GET /v1/me` posterior debe reflejar el nuevo estado

### R2. Creación de usuarios de test

El frontend necesita poder crear usuarios de test nuevos bajo demanda, sin depender de flujos de email o invitaciones.

**Restricciones:**

- Los usuarios creados deben ser reconocibles como de test (para evitar contaminar métricas/analytics)
- Deben poder autenticarse con Clerk (tener sesión válida)
- El backend debe crear su perfil interno asociado

### R3. Seguridad

La funcionalidad de test no debe ser explotable en producción.

**Criterios:**

- En producción, cualquier intento de usar estas capacidades debe fallar silenciosamente o no existir
- No debe ser posible usar esto para mutar usuarios reales
- No debe exponer información de usuarios reales

### R4. Determinismo

Dos ejecuciones del mismo test con el mismo usuario de test deben producir el mismo resultado.

## Criterios de aceptación

- [ ] El frontend puede, vía una llamada al backend, crear un usuario de test autenticable
- [ ] El frontend puede, vía una llamada al backend, poner un usuario de test en estado `kind_pending`
- [ ] El frontend puede, vía una llamada al backend, poner un usuario de test en estado `onboarding_pending` con kind `brand` o `creator`
- [ ] El frontend puede, vía una llamada al backend, poner un usuario de test en estado `onboarded`
- [ ] Después de cualquiera de estas operaciones, `GET /v1/me` devuelve el estado actualizado
- [ ] En ambiente productivo, estas capacidades no están disponibles o son inaccesibles
- [ ] Un usuario de test en estado `kind_pending` que llama a `/v1/me` recibe `onboarding_status: "kind_pending"`, `kind: null`
- [ ] Un usuario de test en estado `onboarding_pending` que llama a `/v1/me` recibe `onboarding_status: "onboarding_pending"`, `kind: "brand" | "creator"`, `redirect_to: "/onboarding/{kind}"`
- [ ] Un usuario de test en estado `onboarded` que llama a `/v1/me` recibe `onboarding_status: "onboarded"`, `redirect_to: null`

## Entregables esperados

1. Contrato de API o mecanismo que exponga las capacidades R1 y R2
2. Documentación de cómo configurar los usuarios/secrets de test por ambiente
3. Confirmación de que R3 está implementado y auditado

## Out of scope

- Reset de contraseñas o credenciales de Clerk (eso es responsabilidad de `@clerk/testing` o del dashboard de Clerk)
- Mock del frontend (los tests E2E corren contra el frontend real)
- Modificación de código de producción del frontend para soportar esto

## Notas

- El frontend usará `@clerk/testing/playwright` para autenticación. El backend no necesita saber de Playwright; solo necesita exponer la capacidad de mutar estado de usuarios de test.
- La decisión de implementación (endpoint HTTP, script CLI, seed de DB, feature flag, etc.) queda a criterio del equipo de backend.
