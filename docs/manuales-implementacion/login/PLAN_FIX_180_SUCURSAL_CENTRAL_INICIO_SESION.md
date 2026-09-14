# Plan — fix #180: no reenviar `sucursal.id = 0` en `saveInicioSesion`

Issue: GabFrank/frc-sistemas-integrados-angular#180. Relacionada: GabFrank/franco-system-backend-filial#77.
Rama: `fix/login-sucursal-central-inicio-sesion` (desde `origin/develop` `1e2a2b65`).

## Problema

`/login` devuelve `sucursal`; `login.service.ts` la copia a `mainService.sucursalActual` y
`registrarSesionActiva` la manda como `sucursalId` en `saveInicioSesion`. Si un backend filial
devuelve la sucursal `0` (identidad de central), el filial la persiste tal cual
(`InicioSesionGraphQL.saveInicioSesion` es pass-through) y la fila `(id, 0)` choca en central por
PK y corta la replicación filial → central.

## Hechos verificados (paso 3)

| Hecho | Evidencia |
|---|---|
| Central, con `sucursalId` null, cae a `sucursalActual()` → `sucursalId=0` → `findById(0)` | central `InicioSesionGraphQL.java:61-73`, `SucursalService.java:71-75`, `application.properties:93` |
| Filial persiste lo que manda el cliente, sin fallback (sigue igual en `develop`) | filial `InicioSesionGraphQL.java:52`; PR filial #124 solo tocó secuencias |
| PK `(id, sucursal_id)` y `sucursal_id NOT NULL` | catálogo de las 7 bases locales (5551/5552/5553), central `V0__initial_schema.sql:8182` |
| El desktop en modo local puede hablar con central (`sucursalActual.id == 0` → `isServidor`) | `main.service.ts:183-186` |
| Hay 4 puertas que llaman `toInput()`: login (`registrarSesionActiva`), `cerrarSesionActiva`, logout de `header` y de `side-mini-variant` (y el huérfano `side.component.ts`) | `grep "toInput()"` |

## Decisión

Sanear en **`InicioSesion.toInput()`**: `sucursalId = sucursal?.id > 0 ? sucursal.id : null`.

- Contra **central** (modo servidor o modo local sobre central): resultado idéntico al actual — el
  backend resuelve null a la sucursal 0.
- Contra un **filial** que devuelve 0: el insert se rechaza por `NOT NULL` → no nace la fila que
  rompe la replicación. El usuario ve el snackbar de error de `GenericCrudService.onSave`. La sesión
  no queda registrada en ese filial mal configurado; es el comportamiento buscado (señal visible).
- Cubre las 4 puertas con un solo punto.

Descartado:
- Filtrar en `login.service.ts` al asignar `sucursalActual`: `sucursalActual` null rompe venta-touch
  y otros consumidores, y el 0 es legítimo contra central.
- Saltear `registrarSesionActiva` en modo local con id 0: rompe el registro de sesión de los
  desktop en modo local cuyo server es central.

## Fases

**Fase 1 (única)** — commit `fix(login): no enviar la sucursal 0 de central al guardar el inicio de sesion`
- `src/app/modules/configuracion/models/inicio-sesion.model.ts`: saneo en `toInput()`.
- `src/app/shared/components/header/header.component.ts` y
  `src/app/shared/components/side-mini-variant/side-mini-variant.component.ts` (`onLogout`): la
  promesa resuelve también en `error`, para que un cierre rechazado no cuelgue el logout (auditoría B, R2/R3).
- `src/app/modules/login/login.service.ts`: `error` handler (warn) en los `subscribe` de
  `registrarSesionActiva` y `cerrarSesionActiva` (auditoría B, R1).
- `src/app/modules/configuracion/models/inicio-sesion.model.spec.ts` (nuevo): id 0 → null, id null →
  null, id válido → se conserva. Se verifica que el caso 0 falla con el código viejo.
- `npm run check` (AOT).
- Prueba de runtime (paso 9): filial dev con `sucursalId=0` + desktop `ng serve -c web` en modo
  local → login muestra error y no crea fila; logout no se cuelga. Si no se puede levantar, queda
  anotado como no verificado.

## Datos nuevos

Ninguno. No hay campo, columna ni clave nueva.

## Impacto

- GraphQL / schema: sin cambios. DB: sin cambios. Electron main: sin cambios.
- Otros clientes (mobile, mobile-pwa): fuera de alcance; la #77 del filial anota que tienen su propia issue.
- Rollback: revertir el commit. No hay estado.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Central resuelve null y 0 idéntico en insert y update (fallback sin guard por id) | baja | confirma la decisión |
| A | Entidad filial dice `nullable=true` pero la base tiene `NOT NULL`; el rechazo depende de la DB | media | se agrega prueba de runtime contra filial dev |
| A | Desktops viejos siguen mandando 0 hasta que el fix llegue a stable | media | anotado; la defensa definitiva es filial#77 capa 2 (otro repo, fuera de alcance) |
| A | Ningún flujo legítimo manda 0 a un filial | baja | confirma la decisión |
| B | `onLogout` (header, side-mini-variant) espera una promesa que solo resuelve en `next`; `onSave` emite `error` si la mutation falla → logout colgado | media | verificado en `generic-crud.service.ts:488-491`; se agrega resolve en error |
| B | Fila legacy con sucursal 0 en filial + logout tras el fix = UPDATE con null rechazado → dispara lo anterior | alta | cubierto por el fix de `onLogout` |
| B | `subscribe` sin `error` en `login.service` → error no capturado en consola | media | se agrega handler |
| B | Rollback = revert, sin estado; sin ids negativos de sucursal | baja | — |

Preexistente, no se toca: `onSave` ante error de red sin `errorConf.propagate` no emite ni `next`
ni `error`, así que el logout ya hoy puede colgarse sin red.

## Sin verificar

- Bajo qué condición el `/login` del filial devuelve 0 (capa 3 de filial#77) — backend, fuera de alcance.
- Prueba de runtime contra un filial con `sucursalId=0`: requiere levantar filial dev con esa
  property; se cubre con el spec del modelo y la lectura del resolver.
- Las 687 filas históricas ya en conflicto: no las toca este fix.
