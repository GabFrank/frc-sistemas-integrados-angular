# Plan: la lista de cajas pinta la caja verificada sin refrescar

Rama: `fix/caja-lista-verificada-en-vivo` (desktop, desde `origin/develop` 4df0919b).

## Problema

En **Lista de cajas** la fila de una caja verificada se pinta naranja (`.verificado`, `#f57c00`) y la
columna «Verificado» dice «Si». La verificación se hace en otra pestaña, **Ventas de la caja N**
(`list-venta.component.ts`, `onVerificado`). Al verificar o anular, esa pestaña actualiza **su**
`selectedCaja`, que es el objeto que devolvió `onGetByIdSimp` y no la fila de la lista. La lista no
se entera hasta que se busca de nuevo.

## Cambio (una fase)

1. `caja.service.ts`: `cajaVerificada$ = new Subject<{ cajaId, sucursalId, verificado }>()`.
   `onVerificarCaja` emite con `tap` solo si el central responde `r === true`. Así cualquier llamador queda
   cubierto, no solo el de `list-venta`.
2. `list-caja.component.ts`, en `ngOnInit`: se suscribe con `untilDestroyed(this)`, busca la fila por
   `Number(id)` + `Number(sucursalId)` en `dataSource.data` y le asigna `verificado`. La tabla usa detección de
   cambios por defecto, así que `[class.verificado]` y la columna se actualizan solos.

Sin backend ni migraciones: N/A para central y filial porque `verificarCaja` ya devuelve `true` al
aplicarse (#682) y no hay dato nuevo persistido.

## Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `CajaService.cajaVerificada$` (en memoria) | `CajaService.onVerificarCaja` (llamado por `ListVentaComponent.onVerificado`) | `ListCajaComponent.ngOnInit` |

## Llamadores de `onVerificarCaja`

Solo `list-venta.component.ts:731` (grep en `src/app`). El tap no cambia lo que recibe.

## Fuera de alcance

- Otro usuario que verifica desde otra PC: requiere suscripción del backend; no se pidió.
- Con el filtro «No verificado» activo, la caja recién verificada queda en la lista (pintada) hasta
  la próxima búsqueda. Sacarla movería la paginación.

## Tests

N/A para desktop porque su CI no corre tests (ciclo §1 paso 9). El gate es `npm run check`, más la
prueba por pantalla: verificar y anular desde «Ventas de la caja» y volver a la lista sin refrescar.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Los ids pueden llegar como string o number (Apollo `ID!` vs `id: number`); un `===` no pintaría nada en silencio | Comparar con `Number(...)` en id y sucursalId |
| A y B | `onCustomQuery` con error GraphQL emite `null`/parcial, no `false` | El tap emite solo si `r === true` |
| B | La fila no recibe `verificadoPor` | Descartado: `cajasWithFiltersCampos` no pide `verificadoPor` y la lista no lo muestra |
| B | `checkProperties` del servicio root, fugas, OnPush, objetos congelados | Descartados con evidencia: sin OnPush ni trackBy, la fila ya se muta (`hasObservation`), suscripción con `untilDestroyed` |

Probar con una caja de una sucursal distinta de la 24 para ejercitar el match por `sucursalId`.

## Sin verificar

- Que la fila siga en la lista si se buscó de nuevo mientras la pestaña de ventas estaba abierta:
  se busca por id, así que también se pinta la fila nueva.
