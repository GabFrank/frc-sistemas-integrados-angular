# Plan — #358: el delivery cobra con TARJETA sin terminal y sin `venta_tarjeta`

Rama: `fix/delivery-cobro-tarjeta-terminal` (desde `develop` d824cc17). Una sola pieza: **desktop**.

## Causa

Un delivery se cobra en dos momentos:

1. `edit-delivery-dialog`: cada línea se guarda en el filial al agregarla (`onSaveCobroDetalle`).
2. **FINALIZAR** (opciones del delivery → `venta-touch.onPagoClick` → `pago-touch` con `data.delivery`). Es el
   único camino **de los clientes** que concluye un delivery: «REABRIR» y «Cancelar delivery» no tienen `case` en
   `list-delivery.onAbrirDeliveryOpciones`, y mobile/PWA no tienen delivery. El filial sí podría concluirlo por
   `saveDeliveryEstado(CONCLUIDO)`, pero ningún cliente lo llama así (hallazgo A1).

`pago-touch` ya hace todo lo de la tarjeta: lee `habilitado`, exige terminal con `terminalObligatoria`, escanea el
cupón y arma `tarjetaPagos`, que `venta-touch` registra con `registrarPagosConTarjeta(…, venta.id)` en el `next` de
`onSaveVentaDelivery`. El problema es que a las líneas que **vuelven del filial** (replay en `ngOnInit`, `item.id != null`)
les pone `requiereRegistroTarjeta = false`, con el supuesto de que «su venta_tarjeta YA existe».

Ese supuesto es falso: `venta_tarjeta` se crea solo después de concluir el delivery, y un delivery concluido no vuelve
a pasar por FINALIZAR. Al finalizar, ninguna línea TARJETA del delivery tiene registro todavía. Quedan afuera:

- las líneas TARJETA cargadas en `edit-delivery-dialog` (la #358), y
- una línea TARJETA cargada en `pago-touch` cuando se cierra el cobro sin finalizar y después se reabre.

## Cambio (fase única)

`pago-touch.component.ts`, `addCobroDetalle`: una línea de un delivery requiere registro aunque venga del filial.

```ts
// antes
item.requiereRegistroTarjeta = esLineaNueva;
// después
item.requiereRegistroTarjeta = esLineaNueva || this.data?.delivery != null;
```

`escanearSiEsTarjeta` sigue solo para líneas nuevas: al abrir el cobro no se dispara un escaneo por cada línea
guardada. La terminal se pide al finalizar (`lineasTarjetaSinTerminal` + `terminalObligatoria`, como en una venta
común) o desde el ícono de QR de la línea, que ya se muestra para toda línea TARJETA.

`hayTarjetaNueva` pasa a usar `esCobroTarjetaRegistrable(cd) && cd.requiereRegistroTarjeta` (hallazgo B3).

Se corrigen los comentarios que repiten el supuesto falso: `onFinalizar` y `hayTarjetaNueva` (`pago-touch`), y
`lineasTarjetaSinTerminal` (`cobro-tarjeta.ts`).

`edit-delivery-dialog` no cambia. Ahí la línea TARJETA dice cómo va a pagar el cliente. El cupón vuelve con el
repartidor y se registra al finalizar, que es cuando existe.

### Efecto que cambia una decisión de #390 (44a20a0b)

`hayTarjetaNueva()` usa la misma marca. Con el cambio, si la configuración de tarjeta del filial no cargó, **un
delivery con líneas TARJETA no se puede finalizar** hasta reabrir el cobro, igual que una venta común. 44a20a0b lo había
dejado pasar porque suponía que esas líneas ya estaban registradas. Si se dejara pasar, `ventaTarjetaHabilitada`
queda en `false`, `tarjetaPagos` sale vacío y el hueco de la #358 sigue abierto en silencio. **Recomendación: bloquear.**

## Perillas, puerta por puerta

| Perilla | Dónde se respeta para el delivery |
|---|---|
| `habilitado` (+ `isLocal`) | `ventaTarjetaHabilitada` en `pago-touch`: apagado → TARJETA es forma de pago común, sin registro (igual que hoy en venta común) |
| `terminalObligatoria` | `onFinalizar` → `lineasTarjetaSinTerminal`: ahora incluye las líneas del delivery |
| `registroObligatorio` | cierre de caja (`countVentasTarjetaSinRegistrar`): cuenta los `PENDIENTE` que ahora sí se crean |

## Datos nuevos

Ninguno: sin columnas, campos ni claves. `requiereRegistroTarjeta` ya existe (escritor `pago-touch.addCobroDetalle`,
lectores `onFinalizar`, `hayTarjetaNueva`, `lineasTarjetaSinTerminal`).

## Tests

- Paso 9: N/A para desktop (sin batería en ningún gate; Karma roto). Gate: `npm run check`.
- Prueba por pantalla, desktop web contra central 8081 y filial 8082 (sucursal 24, SIFEN apagado), MR con caja abierta,
  `configuracion_venta_tarjeta.habilitado = true`:
  1. Delivery nuevo con una línea TARJETA en el diálogo de edición → FINALIZAR → pide terminal (con
     `terminalObligatoria`) → «Registrar más tarde» → finaliza → fila `venta_tarjeta` PENDIENTE con `venta_id`,
     terminal y monto; seña impresa (cola de captura zz_, avisar).
  2. Igual, pero escaneando un cupón → fila COMPLETADO.
  3. Línea TARJETA cargada en `pago-touch`, cerrar el cobro sin finalizar, reabrir → FINALIZAR la registra.
  4. Delivery con EFECTIVO solamente → sin `venta_tarjeta` (no regresiona).
  5. `habilitado = false` → finaliza sin pedir terminal, sin `venta_tarjeta`.
  6. `terminalObligatoria = false` → finaliza sin terminal, PENDIENTE sin terminal.
  7. Venta común con TARJETA → sigue igual (no regresiona).
  8. Delivery con dos líneas TARJETA: FINALIZAR pide terminal una por una; «Cancelar» en el escaneo deja el cobro
     abierto y el delivery sin concluir.
  9. Config de tarjeta que no responde (filial sin la query o cortado) → no finaliza, avisa (decisión B2: bloquear).
  10. Línea TARJETA en USD guardada → `venta_tarjeta` con monto y moneda de la línea.
  11. Aumento con TARJETA → no bloquea ni se registra.
  Configuración restaurada al final.

## Auditoría del plan (paso 5)

Dos auditores (eje A contrato/propagación, eje B reversibilidad/estado), verificados contra el código:

| # | Hallazgo | Verificación | Qué se hace |
|---|---|---|---|
| A1 | FINALIZAR no es el único camino **en el backend**: `saveDeliveryEstado(CONCLUIDO)` y `saveVenta` de una venta ligada concluyen sin `venta_tarjeta` | Cierto. En clientes: el único llamador de `onSaveDeliveryEstado` manda `PARA_ENTREGA`; mobile y PWA no tienen delivery | Se aclara arriba: es convención del cliente, no contrato del backend |
| A2 | Un segundo FINALIZAR sobre un delivery ya concluido duplicaría `venta_tarjeta` (`saveVentaDelivery` sin guarda de `CONCLUIDO`, `saveVentaTarjeta` no idempotente) | Cierto en teoría. La lista relee el delivery del filial (`onGetById`) antes de mostrar FINALIZAR, que se oculta en `CONCLUIDO`: queda la carrera de dos PCs a la vez. Ese caso ya duplica hoy la venta y los cobros (preexistente) | Fuera de alcance; se propone issue del filial: guarda de `CONCLUIDO` en `saveVentaDelivery` |
| A3 / B7 | Replay de vuelto o finalizar automático con saldo 0 en el replay | Descartado: un vuelto se guarda con valor negativo y el replay lo marca vuelto (`:807`); TARJETA con vuelto/descuento pasa a EFECTIVO al crearse | — |
| B1 | Con `terminalObligatoria`, cada línea del replay exige terminal; el diálogo solo cierra con terminal o «Cancelar» | Cierto (`scan-terminal-pos-dialog` `onCancel`). Mismo comportamiento que una venta común; al finalizar el repartidor ya volvió con el POS. Cancelar deja el delivery abierto (no se pierde nada) | **Franco (23/11): exigir terminal**, como en venta común |
| B2 | Con la config de tarjeta en «fallo», el delivery no cierra | Cierto. Es lo mismo que pasa hoy en una venta común con TARJETA en esa filial | **Franco (23/11): bloquear** |
| B3 | `hayTarjetaNueva` mira solo `formaPago == TARJETA`: un aumento TARJETA bloquearía sin nada que registrar | Cierto (`:1422`) | **Se aplica**: `esCobroTarjetaRegistrable(cd) && cd.requiereRegistroTarjeta` |
| B4 | La moneda del replay podría quedar cruzada | Descartado: `setMoneda` hace `find` y, si no está, `item.moneda` conserva la de la línea (`:846`) | Se suma una prueba con una línea en USD |
| B6 | Lo ya concluido en producción sigue sin `venta_tarjeta` | Cierto; el cierre de caja no lo ve | Fuera de alcance; si se quiere, un conteo de solo lectura aparte |

## Queda sin verificar

- Electron (impresión real de la seña en la térmica): se usa la cola de captura.
- Filiales con un desktop anterior: siguen con el hueco hasta actualizar (no hay cambio de backend).
