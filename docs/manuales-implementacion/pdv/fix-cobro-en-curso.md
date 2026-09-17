# Fix — F12 durante un cobro rápido abre el pago y puede duplicar la venta (#316)

Rama: `fix/pdv-cobro-en-curso` (desde `origin/develop`, con #318). Pieza: **desktop**.

## Diagnóstico (paso 3)

Reproducido en local el 2026-09-16 (ver #316): `keydown` F8 y F12 seguidos abren el pago con el
ítem mientras el cobro rápido se guarda; a los ~575 ms F8 vacía el carrito y el pago sigue abierto
con la venta ya cobrada. Finalizarlo guarda una segunda venta.

1. **Ventana entre disparar el guardado y bloquear los atajos.** `onTicketClick` →
   `onSaveVenta` → `VentaTouchService.onSaveVenta` → `GenericCrudService.onCustomMutation`
   (`generic-crud.service.ts:201-255`) llama `cargandoService.openDialog()` de forma **síncrona**,
   pero el bloqueo de atajos lee `isCargando`, que se actualiza desde
   `spinnerService.spinnerObservable` ~140 ms después. En esa ventana el listener `keydown`
   (`venta-touch.component.ts:~405`) no ve nada que bloquee.
2. **`disableCobroRapido` no alcanza.** Se pone en `true` al entrar a `onTicketClick` (`:1226-1227`) y
   vuelve a `false` en el `finally` (`:1297`), apenas se dispara la mutation
   (`onSaveVenta(...).subscribe().unsubscribe()`, `:1295`), no cuando termina. Y `onPagoClick` no lo mira.
3. **`PagoTouchComponent` cierra el spinner equivocado.** `ngOnInit` (`pago-touch.component.ts:208`)
   hace `openDialog()` sin guardar el `requestId` y a los 500 ms `closeDialog()` sin id (`:229`),
   que cierra el primer pendiente del mapa. Con un guardado en curso cierra el de F8 y el suyo
   queda hasta el timer de seguridad (65 s), con `isCargando` en true y los atajos bloqueados.

`onCustomMutation` siempre termina con `next`+`complete` o con `error` (incluido el corte del
timeout link), así que un flag que se baja en `finalize` no queda trabado.

## Fase 1 — flag síncrono de guardado en curso

Archivo: `venta-touch.component.ts` (+ `.html`).

1. Campo `guardandoVenta = false`.
2. Se levanta **síncrono** justo antes de disparar la mutation y se baja en `finalize` del mismo
   `pipe`:
   - `onSaveVenta` (`:1321-1333`): dentro del `new Observable`, antes de
     `ventaTouchServive.onSaveVenta(...)`; `finalize(() => this.guardandoVenta = false)` en su `pipe`.
     Cubre F8, F11 y el pago normal (todos pasan por acá). La suscripción interna es independiente
     del `.subscribe().unsubscribe()` de `onTicketClick`, así que el flag vive hasta que termina.
   - `onPagoClick`, rama delivery (`:1089`): idem alrededor de `onSaveVentaDelivery`.
3. Lectores:
   - `keydown`: `if (!this.isDialogOpen && !this.isCargando && !this.guardandoVenta)`.
   - `onPagoClick` y `onTicketClick`: salir temprano si `guardandoVenta` (cubre clics en botones).
   - `.html`: `[disableExpression]` de «Pago (F12)», «Cobro Rápido (F8)» y «CR + Ticket (F11)» suman
     `|| guardandoVenta`.

4. **Construcción síncrona protegida (B1).** `VentaService.onSaveVenta` (`venta.service.ts:111-136`)
   arma `toInput()` **antes** de devolver el observable; si lanza, un `.pipe(finalize)` nunca se
   conecta y el flag queda en true para siempre. En `onSaveVenta` la llamada interna va en
   `try/catch` dentro del executor: en el `catch`, bajar el flag, avisar con snackbar y
   `obs.next(null)` (mismo contrato que el `error` actual). En la rama delivery de `onPagoClick`,
   `venta.toInput()`, `selectedDelivery.toInput()` y `cobro.toItemInputList()` se evalúan como
   argumentos: idem `try/catch`.
   - El flag se levanta **dentro** del executor, después del `if (modoConsulta) return` (B3), y el
     `finalize` va en el `pipe` **interno**, no en el observable que devuelve `onSaveVenta`: el
     `.subscribe().unsubscribe()` de `onTicketClick` lo dispararía en el mismo tick.
5. **Carrito siempre limpio tras una venta guardada (B2).** En el `next` exitoso de `onSaveVenta`,
   los efectos secundarios (vincular factura, notificaciones de crédito y transferencia, stock crítico,
   `registrarPagosConTarjeta`) van en `try/catch` con `console.error`, y `resetForm()` + `obs.next(res)`
   después, fuera del `try`. No se adelanta `resetForm()`: `getStockCriticoItems$` →
   `buildStockCriticoAggregate()` (`:1593`) lee `selectedItemList` de forma síncrona.
6. **Rama delivery con `error:` (A1).** Hoy `onSaveVentaDelivery(...).subscribe(next)` no tiene
   handler de error: el cajero no se entera si falla. Agregar `error:` con snackbar (y `console.error`).

Commit: `fix(pdv): no abrir el pago ni cobrar de nuevo mientras se guarda una venta`.

## Fase 2 — el pago cierra su propio spinner

`pago-touch.component.ts:208-229`: guardar `const { requestId } = this.cargandoDialog.openDialog()`
y cerrar con `closeDialog(requestId)`.

Commit: `fix(pdv): el pago cierra su propio spinner de carga`.

### Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `VentaTouchComponent.guardandoVenta` (estado de UI, no persiste) | `onSaveVenta`, rama delivery de `onPagoClick` | listener `keydown`, `onPagoClick`, `onTicketClick`, 3 botones del `.html` |

### Tests

- Automatizados: N/A para desktop (sin batería en CI).
- Gate: `npm run check` leído del log.
- Manual en local (se pueden crear datos), con `c = ng.getComponent(document.querySelector('app-venta-touch'))`:
  1. **Reproducción de #316 (falla con el código viejo):** ítem en el carrito → `keydown` F8 y F12 seguidos en el mismo tick → el pago **no** se abre, una sola venta guardada, carrito vacío.
  2. F8 dos veces seguidas → una sola venta.
  3. Pago normal: F12 → Finalizar → mientras guarda, F12/F8 no hacen nada; al terminar, andan.
  4. Error de guardado (filial detenido) → aviso de error, `guardandoVenta` vuelve a false y los atajos andan.
  5. F12 con un guardado en curso → al abrir el pago después, el spinner del pago se cierra solo a los 500 ms (sin quedar 65 s).
  6. Delivery → Finalizar → cobrar: mientras guarda, atajos bloqueados; después andan. Con el filial detenido: aviso de error y atajos vivos.
  7. `toInput()` que lanza (forzado desde consola, p. ej. `VentaService.prototype.onSaveVenta` temporalmente lanzando): aviso, `guardandoVenta` en false, se puede volver a cobrar.
  8. Efecto secundario que lanza tras guardar (forzado desde consola sobre `registrarPagosConTarjeta`): venta guardada, carrito vacío.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | Rama delivery de `onPagoClick` (`:1088-1100`) llama `onSaveVentaDelivery` directo y sin `error:` | media | **Adoptado** (ítems 2 y 6) |
| A2 | A | Únicas entradas de cobro: F8/F11/F12 y sus 3 botones; «Finalizar con Factura» guarda la factura aparte y la venta pasa por `onSaveVenta` | — | Verificado |
| A3 | A | `onSaveVenta2` (`:821`, `:865`) es guardado incremental de ítems de delivery (camino deshabilitado), no cobro | baja | Fuera de alcance |
| A4 | A | `VentaTouchComponent` se abre desde menú, crédito y `delivery-dialog`; el flag y el `keydown` son por instancia | — | Verificado |
| A5 | A | Fase 2: un solo `openDialog`/`closeDialog` en `pago-touch` | — | Verificado |
| B1 | B | `toInput()` síncrono antes de devolver el observable: sin `try/catch` el flag queda trabado para siempre | **crítica** | **Adoptado** (ítem 4) |
| B2 | B | Una excepción en los efectos del éxito deja la venta guardada con el carrito lleno → cobro doble | alta | **Adoptado** (ítem 5), sin adelantar `resetForm()` |
| B3 | B | Levantar el flag antes de `if (modoConsulta) return` haría `.subscribe` sobre `undefined` | media | Nota de implementación (ítem 4) |
| B4 | B | Timeout link y `onCustomMutation` siempre terminan; `closeDialog(id)` ya cerrado es no-op; no hay async entre `afterClosed` del pago y `onSaveVenta` | — | Verificado |

## Qué queda sin verificar

- 70 llamadas más a `closeDialog()` sin id en el resto de la app (incluidas
  `delivery-dialog.component.ts:428` y `:844`) con el mismo riesgo de cerrar el spinner de otro.
  Fuera de alcance; candidato a issue aparte.
- Doble clic físico muy rápido sobre los botones: cubierto por el guard de `onPagoClick`/`onTicketClick`,
  no por `disableExpression` (que se evalúa en el siguiente ciclo de detección).

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop. La validación de duplicados del filial (`VentaGraphQL.saveVenta:199`, 5 s) es otra red, no cambia.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
