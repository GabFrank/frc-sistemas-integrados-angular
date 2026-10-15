# Plan: aviso tras un corte en las escrituras del PDV (issue #501, tanda 2)

Rama `fix/mutations-corte-pdv`, sale de `develop`. La tanda 1 (dinero y stock) es el PR #515.

## Alcance

Las 7 llamadas de `pdv/comercial` que listó la issue. Revisadas en `develop`:

| Línea (issue) | Llamada | Estado |
|---|---|---|
| `venta-touch:961`, `:1005` | `onSaveVenta2` al agregar o quitar ítems de un delivery | **fuera**: es el modo edición de delivery, sin acceso desde la UI. El botón «Modif. itens» está comentado a propósito por fraude y no se reabre |
| `venta-touch:1664`, `venta-touch.service:47` | `onSaveVenta` | **ya resuelto**: distingue rechazo de «sin respuesta» (`esRechazoDelServidor`), avisa solo en el segundo y siempre si ya hay factura emitida |
| `venta-touch:1329` | `onSaveVentaDelivery` | cambia (1) |
| `venta-touch:1405` | `onSavePendiente` (cobros con tarjeta) | cambia (2) |
| `venta-touch:1704` | `onVincularFacturaAVenta` | cambia (3) |

## Regla (la de #488 y la tanda 1)

`onCustomMutation`:

- **Rechazo:** el genérico ya muestra el motivo y no se aplicó nada.
- **Sin respuesta:** se avisa «no se pudo confirmar», y no se deja repetir a ciegas lo que duplica.

Decide `erroresDeRechazo(err)`. El timeout del link también es un «sin respuesta».

## Cambios

| # | Dónde | Reintento en el filial | Hoy | Cambio |
|---|---|---|---|---|
| 1 | `onSaveVentaDelivery` (cobrar un delivery) | **no es idempotente**: `saveVentaDelivery` no mira si el delivery ya está `CONCLUIDO`. Los `cobro_detalle` viajan con id y se actualizan, pero vuelve a crear la venta a crédito con sus cuotas y pisa `fechaConcluido` (auditoría del plan) | en un rechazo suma «No se pudo guardar el delivery. Verifique…» al motivo del genérico; sin respuesta dice «No se pudo guardar» y la pantalla queda en el delivery, lista para cobrar otra vez | rechazo: sin aviso propio; queda en el delivery para corregir. Sin respuesta: «No se pudo confirmar si se cobró el delivery: no lo cobres de nuevo. Revisalo en la lista de deliverys antes de seguir.» y vuelve al carrito (`volverAlCarritoActivo`), así no se puede cobrar de nuevo sin reabrirlo. El error de `toInput()` (antes de enviar) sigue igual |
| 2 | `registrarPagosConTarjeta`, `forkJoin` de `onSavePendiente` | crea otra fila `PENDIENTE` | con varios pagos, si falla uno el `forkJoin` corta: las filas que sí se crearon quedan sin completar y sin seña, y el aviso dice «NO se registró el cobro con tarjeta» aunque sin respuesta pudo haberse creado | cada pago con su propio `catchError`: los que salen bien siguen su camino (completar o seña). Por cada pago que falla se avisa con su terminal. En un rechazo no se creó ese registro, así que hay que registrarlo a mano desde el cierre. Sin respuesta, revisarlo en el cierre de caja y, si no aparece, registrarlo a mano |
| 3 | `onVincularFacturaAVenta` (factura manual emitida antes de la venta) | idempotente | solo `console.error`: la factura queda sin venta y nadie avisa. Y en un **delivery** cobrado con «Finalizar con factura» ni siquiera se llama: la rama delivery ignora `response.facturaLegalId` (auditoría del plan) | rechazo: «La venta se guardó, pero la factura no quedó vinculada. Avisá al encargado.» (el genérico ya dio el motivo). Sin respuesta: «La venta se guardó, pero no se pudo confirmar si se vinculó la factura. Avisá al encargado.». Va en un helper `vincularFacturaManual`, que también se llama tras cobrar un delivery con factura |

## Fuera de alcance

- `onDeleteCobroDetalle` (pago-touch, edit-delivery) y `onDeleteVueltoItem` (delivery-dialog) no tienen `error`, pero van por `onDelete` y `onDeleteWithSucId` del genérico. Esos ya avisan el corte y emiten null, así que no hay nada que cambiar.

- `saveVentaDelivery` del filial no es idempotente: no tiene guarda de `CONCLUIDO` y un reintento vuelve a crear la venta a crédito y sus cuotas. El desktop lo mitiga con (1). Se le pasa a Franco para el filial.

## Tests

No hay helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop servido estático, configurado contra el filial local (8082, sucursal 24) y el central local (8084). Usuario `MR`, con la caja 1185 abierta, que tiene deliverys sin concluir. Se usa el interceptor de XHR con sus tres modos: corte, aplicado y rechazo.

- (1): cobrar un delivery en los tres modos. En «aplicado», comprobar en la base que no queda un cobro doble y que el delivery no se vuelve a ofrecer para cobrar.
- (2): cobrar con tarjeta (venta o delivery), con corte y rechazo en `saveVentaTarjeta`.
- (3): «Finalizar con factura» con corte y rechazo en `vincularFacturaAVenta`. Si en local no se puede emitir la factura, se arma el caso con lo mínimo que haga falta.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop.
