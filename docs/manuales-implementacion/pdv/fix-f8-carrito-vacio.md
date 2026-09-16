# Fix — F8 (Cobro Rápido) guarda una venta sin ítems (#312)

Rama: `fix/pdv-f8-carrito-vacio` (desde `origin/develop`, que ya trae #311). Pieza: **desktop**.

## Diagnóstico (paso 3)

`venta-touch.component.ts`:

| Entrada | Guard hoy |
|---|---|
| Tecla F8 (`case "F8"`, `:419`) | **ninguno**: `this.onTicketClick(false)` |
| Tecla F11 (`:406-411`) | `selectedItemList?.length > 0 && !disableCobroRapido && !isDelivery` (#311) |
| Botón «Cobro Rápido (F8)» (`.html:96-99`) | disabled si `selectedItemList.length == 0 \|\| isDelivery` |
| Botón «CR + Ticket (F11)» (`.html:103-106`) | idem |
| `onTicketClick()` (`:1208`) | solo `modoConsulta` y `disableCobroRapido` |

Con el carrito vacío, F8 arma `Venta` con `ventaItemList = []` y `totalGs = 0` y llama `onSaveVenta`.
`VentaService.onSaveVenta` no valida, y en el filial `VentaGraphQL.saveVenta:194` solo desvía cuando
la lista es `null`: con `[]` guarda `Cobro` + `Venta CONCLUIDA` sin ítems. Verificado **leyendo
código**; la reproducción queda como primer caso de la prueba manual (ver abajo).

En delivery, F8 cobra `selectedItemList` (ítems del delivery) por el cobro rápido, que la UI no
ofrece por botón.

## Fase 1 — un solo portón en `onTicketClick`

Archivo: `src/app/modules/pdv/comercial/venta-touch/venta-touch.component.ts`.

1. `onTicketClick()`: después del `modoConsulta`, salir si `!(selectedItemList?.length > 0)` o
   `isDelivery`, reenfocando el buscador (`buscadorFocusSub.next()`, como hace el `finally`).
   Va **antes** de `disableCobroRapido = true`, así el flag no se toca.
   Cubre las cuatro entradas (F8, F11 y los dos botones) aunque un guard de afuera falle.
2. `case "F8"`: mismo guard que el botón (`selectedItemList?.length > 0 && !isDelivery`), por
   simetría con F11/F12.

Sin cambios de GraphQL, modelos, backend ni Electron main.

Commit: `fix(pdv): el cobro rapido no guarda ventas con el carrito vacio` (Closes #312 en el PR).

### Tabla de datos nuevos

N/A: no nace ningún campo, columna ni clave.

### Tests

- Automatizados: N/A para desktop (sin batería en CI; `venta-touch.component.spec.ts` es boilerplate).
- Gate: `npm run check` leído del log.
- Manual (`ng serve -c web`, central 8081 + filial 8082 con `isLocal:true`):
  0. **Con el código viejo** (checkout de `develop`), carrito vacío → F8: confirmar en
     `operaciones.venta` del filial si se crea una venta sin `venta_item`. Es la prueba que falla
     antes del fix; si no se reproduce, se anota y se sigue igual (el guard es inocuo). Mirar
     también `factura_legal` con esa `venta_id` y el log del filial («facturación silenciosa»).
     ⚠️ SIFEN del filial local está en PROD: correr esta prueba con el scheduler de SIFEN apagado
     y sin `facturaCountDown` en 0, o saltearla.
  1. Con el fix, carrito vacío → F8: no pasa nada, sin snackbar, sin fila nueva.
  2. PDV 1 con ítems → F8: cobro rápido normal, «Venta guardada con éxito».
  3. PDV 2 con ítems y PDV 1 vacío → F8: cobra PDV 2.
  4. F10 → editar delivery → F8 y F11: no pasa nada.
  5. Tras 1 y 4, F12/F2/F9 siguen andando (el flag `disableCobroRapido` no quedó en `true`).

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | La salida temprana no dispara `buscadorFocusSub.next()` del `finally`; tras editar un delivery (`autoFocus:false`) el foco puede quedar suelto | baja | **Adoptado**: el return reenfoca el buscador |
| A2 | A | F8 en «editar delivery» (`isDelivery=true`, `selectedItemList` = ítems del delivery) guarda por `onSaveVenta` una venta **nueva** con `delivery` asignado pero sin `id`: duplica la venta del delivery en vez de concluirla (`onPagoClick` usa `onSaveVentaDelivery`) | media | Verificado (`onSaveVenta` hace `venta.delivery = selectedDelivery` sin id). El fix lo cierra; se suma a pruebas (caso 4) |
| A3 | A | Sin otros llamadores: `onTicketClick` solo en `venta-touch` (F8, F11, 2 botones); `onSaveVenta` solo desde `onTicketClick` y `onPagoClick` (ya con guard). Sin cambio de contrato | — | Verificado |
| B1 | B | Return antes del `try` y de `disableCobroRapido = true`: ningún flag queda colgado; mismo patrón que `onPagoClick` (#311) | — | Verificado |
| B2 | B | Filial: F8 con `[]` cae en facturación silenciosa con 0 ítems y total 0 cuando `facturaCountDown == 0`, y cada venta vacía consume el contador | alta (datos/fiscal) | Verificado leyendo `VentaGraphQL.java:292-335`. No cambia el fix desktop; sube la prioridad de la defensa en filial y se anota en #312 |
| B3 | B | `isDelivery` pegado en `true` por un error no manejado en `onSaveVentaDelivery` dejaría F8/F11 bloqueados | baja | Preexistente: F12 y F2 (sale de delivery) siguen disponibles. Sin cambio |
| B4 | B | Prueba 0: el esperado debe incluir «sin `factura_legal` asociada» y mirar el log del filial por «facturación silenciosa» | baja | Adoptado en pruebas |

## Qué queda sin verificar

- F8 manda `ticket=false` y `facturar=null`: en el filial cae en `facturaCountDown == 0`
  (`VentaGraphQL.java:292-333`) y llama `saveFacturaLegal` con **lista de ítems vacía y
  `totalFinal = 0`**, en un `catch` que solo loguea. Falta verificar si `saveFacturaLegal` lo
  rechaza o emite un DE en 0. Además cada venta vacía **consume el contador** (`:335`), así que
  corre qué venta real recibe la factura silenciosa.
- Si ya hay ventas vacías en producción generadas por esto (consulta a hacer por separado:
  `venta` sin `venta_item` con `total_gs = 0`). No se corrigen datos en este fix.
- Defensa en el filial (rechazar `ventaItemList` vacía en `saveVenta`): propuesta en #312, fuera
  de este PR (otro repo).

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
