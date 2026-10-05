# Plan — errores de red en listas de ventas (issue #390, PR 10a)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-listas-de-ventas`, desde `origin/develop`. Usa
`PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s).
Relevamiento: auditor de solo lectura sobre `operaciones/venta` (listas, últimas ventas, reportes),
`financiero/venta-credito`, `financiero/venta-tarjeta` y `operaciones/movimiento-stock` (2026-10-05, leído de
`origin/develop`); la cancelación y la venta a crédito releídas a mano.

## División

**10a** (este): listas de ventas, cancelación, venta a crédito, lista de ventas con tarjeta y sus reportes.
**10b**: lista de movimientos de stock (resumen de stock por sucursal, detalle de un movimiento), que tiene `error:`
hoy inalcanzables que muestran **stock 0** como dato real y va con su propia prueba.

Ya cubierto en PRs anteriores (sin cambio): filtro e impresión de la lista de ventas a crédito, cobro de una venta
a crédito, ventas con tarjeta por caja, cancelar desde «Últimas ventas» del POS.

## Regla (la de #391–#406)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`: 20 s en diálogos y acciones,
60 s en listados. Un `null` (error GraphQL) se trata como fallo. Una mutación sin respuesta **pudo haberse
aplicado**: no se promete que falló y no se deja reintentar a ciegas.

## 1. Cancelar una venta (fase 1) [verificado]

`ventaService.onCancelarVenta` **alterna** el estado en el central (una venta cancelada se reactiva, con su caja y
su stock). Las listas (`generic-list-venta:onCancelarVenta`, `list-venta`, `list-venta-credito:onCancelar`) deciden
qué hacen según el `estado` de la **fila**, y su `subscribe` no tiene `error:`:
- si la mutación falla o se corta, no hay aviso; si el central **sí** la aplicó y se perdió la respuesta, la fila
  queda con el estado viejo y un segundo clic la **revierte** (reactiva una venta recién cancelada, o al revés);
- la fila puede estar vieja (otro usuario ya la canceló): el clic hace lo contrario de lo que se confirmó, y el
  cartel dice «Venta cancelada con éxito» en los dos casos.

Cambio (solo desktop; la mutación idempotente con «estado esperado» es de backend y se anota aparte):
- antes de mandar, se **relee la venta** (`onGetPorId` con `errorConf`, 20 s): si no se puede leer → aviso y no se
  manda; si su estado ya no es el de la fila → se actualiza la fila y se avisa «La venta ya estaba … : revisá antes
  de volver a intentar», sin mandar;
- el texto de la confirmación y del éxito dicen lo que se va a hacer (**cancelar** o **reactivar**);
- `error:` en los tres llamadores: aviso «No se pudo confirmar si se aplicó: se recarga la venta» y se relee la
  fila del central (si esa relectura falla, la fila queda marcada y la acción bloqueada hasta recargar la lista).

## 2. Venta a crédito (fase 1)

- **Cliente de una venta a crédito** (`add-venta-credito-dialog:onSearch`, `onSearchByNombre`): los servicios ya
  propagan, pero los `subscribe` no tienen `error:`. Si la búsqueda falla, queda seleccionado el cliente
  **anterior** (con su saldo) mientras el texto ya es otro, y Confirmar valida y carga la venta contra ese cliente.
  Cambio: `error:` que **quita** el cliente seleccionado y avisa; al empezar una búsqueda nueva también se quita.
- **Finalizar ventas a crédito** (`list-venta-credito:onFinalizar`, `onFinalizarSeleccionados`; irreversible): sin
  `error:`, el observable interno nunca emite y el `forkJoin` de la selección queda colgado: parte puede haber
  quedado finalizada sin que la lista lo refleje. Cambio: `error:` por ítem (cuenta como terminado con fallo), al
  final se recarga la lista del central y se avisa cuántas no se pudieron confirmar.
- **Abrir una venta a crédito** (`onClickRow`, `onGetPorId`): `loading` trabado → `errorConf` + `error:`.

## 3. Listas de ventas (fase 2)

- **Lista con filtros** (`generic-list-venta:onFiltrar`, `ventaService.onVentasFilter`, un solo llamador): spinner
  y modal «Buscando…» hasta 300 s; quedan las filas, el paginador y los totales del filtro anterior. Cambio:
  propagar en el servicio (60 s, sin modal); al fallar se vacía la lista con «No se pudo cargar» + «Reintentar».
- **Lista simple** (`list-venta:onGetVentas`) y **«Últimas ventas» del POS** (`ultimas-ventas-dialog:cargarVentas`
  y la búsqueda por código, filial): `ventaService.onSearch` y `onGetPorId` reciben `errorConf?`/`contexto?`
  (opt-in: tienen llamadores fuera de alcance); al fallar se vacía la lista y se avisa (en «Últimas ventas» no
  queda a la vista, y cancelable, el listado de otra búsqueda).
- **Abrir una venta** (`onClickRow` en `generic-list-venta` y `list-venta`): `isLoading` trabado → opt-in + aviso.
- **Balance de la caja** en las listas (`onGetBalance`, ya acepta `errorConf`): `isLoading` trabado o total viejo
  tras cancelar → opt-in; al fallar se muestra «—», no el valor anterior.
- **Reportes** (`onReporteGenericVentas`, `…Detallado`, con el `subscribe` dentro del servicio): modal hasta 300 s y
  no abre nada → propagar dentro del servicio con aviso.

## 4. Ventas con tarjeta y lucro por funcionario (fase 2)

- **Lista de ventas con tarjeta** (`list-venta-tarjeta:onGetData`, `ventaTarjetaService.onFiltrar`, un solo
  llamador): sin aviso, quedan las filas del filtro anterior → propagar en el servicio + `error:` que vacía y avisa.
- **Lucro por funcionario** (`onGetLucroPorFuncionario`, un llamador, dentro de un `switchMap`): queda el reporte
  anterior bajo filtros nuevos, leído como real. Cambio: propagar con `catchError` **dentro** del `switchMap`, que
  vacía el reporte y avisa. Si no se pueden resolver los usuarios de los funcionarios elegidos, no se consulta un
  subconjunto con un aviso engañoso: se avisa y no se consulta.

Sin cambio: el sondeo del registro de venta con tarjeta (`registrar-venta-tarjeta-dialog`, `interval` + `switchMap`:
hoy tolera una consulta colgada), `onReimprimirVenta` (solo recibe su `error:` con aviso), métodos sin llamadores,
POS (`venta-touch`, `pago-touch`), `list-caja`, `analisis-diferencia`, `garantia-dialog`.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Se anota para un issue de **central**: que
`cancelarVenta` reciba el estado esperado (o se separe en cancelar/reactivar) para que no alterne a ciegas.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no revertir una venta al cancelarla ni acreditarla al cliente anterior` | 1, 2 |
| 2 | `fix(operaciones): avisar cuando no cargan las listas y reportes de ventas` | 3, 4 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos: lista de ventas con filtros (filtrar, abrir una fila,
balance), cancelar con el central congelado (no se manda; aviso), cancelar una venta cuyo estado cambió por fuera
(se actualiza la fila, no se manda), venta a crédito (búsqueda de cliente fallida: sin cliente), lista de ventas con
tarjeta. **No se cancela ni se finaliza nada** con el central congelado; la cancelación real de una venta de prueba
de la base local, solo con el central vivo si hace falta para armar el caso.

## Riesgos y qué queda sin verificar

- La relectura antes de cancelar reduce la ventana pero no la cierra (dos usuarios en el mismo segundo): el cierre
  real es del central.
- Cancelar tarda una ida y vuelta más.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Cómo alterna el central** (`VentaService.cancelarVenta`): CANCELADA → CONCLUIDA, y **cualquier otro estado**
  (ABIERTA, EN_VERIFICACION, CONCLUIDA) → CANCELADA; exige `sucId`. La regla de la relectura es
  **`estado releído == estado de la fila`** (no «tiene que estar CONCLUIDA»): si coinciden se manda; si difieren se
  actualiza la fila, se avisa y no se manda. Así no se bloquea cancelar una venta ABIERTA o EN_VERIFICACION.
- **La relectura va siempre al central** (`servidor = true`, con el `sucursalId` de la fila), silenciosa
  (`silentLoad`) y sin el «Ups» propio (`graphError.show: false`): el aviso lo da el llamador, uno solo por flujo.
  `ventaService.onGetPorId` recibe `errorConf?`/`contexto?` (opt-in: tiene llamadores fuera de alcance).
- **Ventas a crédito** (`list-venta-credito:onCancelar`): la fila no trae el estado de la venta y la acción **no**
  ofrece reactivar (solo aparece con el crédito ABIERTO). Cambio: se relee la venta y, si ya está CANCELADA, se
  avisa y **no se manda** (hoy la reactivaría).
- **«Últimas ventas» del POS**: su lista viene del filial (puede ir atrasado) y solo bloquea si la fila dice
  CANCELADA. Se le agrega la misma relectura al central antes de cancelar (si ya está cancelada, no se manda).
- **Reactivar** se nombra así solo en las dos listas de ventas (donde el menú ya dice «Habilitar»). Tras un error
  incierto se relee **solo esa fila** (no la lista entera) y el bloqueo es por fila.
- **Lucro por funcionario**: `onGetUsuarioPorPersonaId` se llama con `PROPAGAR_ERROR_DE_RED` (hoy un corte cuelga
  el `forkJoin`); si hay funcionarios elegidos y **ninguno** se pudo resolver, hoy la consulta sale **sin filtro**
  y devuelve el reporte de todos como si fuera el de los elegidos: no se consulta, con aviso; lo mismo si se
  resolvió solo una parte. El `catchError` va dentro del `switchMap` y cubre también esa resolución.
- **Finalizar ventas a crédito**: cada ítem termina siempre (éxito, error o confirmación cancelada) para que el
  `forkJoin` no quede colgado.
- **Venta a crédito, búsqueda del cliente**: un `null` de la búsqueda por código (error GraphQL) no encadena la
  búsqueda por nombre como si fuera «no existe»: quita el cliente.
- **Ventas con tarjeta**: `onFiltrar` ya es silencioso; se le agrega propagar + 60 s. Se suma el reporte
  `onImprimirReporteVentaTarjeta` a los reportes del punto 3.
- **Para el issue de central** (no se toca acá): `cancelarVenta` con estado esperado (o separar
  cancelar/reactivar); y que reactivar no revive la factura legal ni el documento electrónico que la cancelación
  dio de baja (el fallo de SIFEN se traga).

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A/B | Crédito: la fila no trae el estado y no ofrece reactivar; hoy reactivaría una venta ya cancelada | alta | relectura y bloqueo si ya está CANCELADA |
| A | Lucro por funcionario: sin usuarios resueltos consulta sin filtro (reporte de todos) y un corte cuelga el `forkJoin` | alta | no se consulta + propagar la resolución |
| A/B | El central cancela desde cualquier estado no cancelado; exigir CONCLUIDA bloquearía casos válidos | media | regla `releído == fila` |
| A | La relectura mostraría su propio «Ups» y el modal | media | silenciosa y con `graphError.show: false` |
| A/B | «Últimas ventas» lee del filial; la relectura debe ir al central | media | relectura al central también ahí |
| A | Finalizar: el observable no emite en error ni al cancelar la confirmación | media | cada ítem termina siempre |
| A | Reporte de ventas con tarjeta sin cubrir; `onFiltrar` sin corte | media | incluidos |
| B | `null` en la búsqueda por código encadena la de nombre | media | quita el cliente |
| B | Reactivar no revive factura/DE (central) | media | anotado para el issue de central |
| B | Doble aviso; recarga de lista pisando la marca de fila | baja | un aviso por flujo; relectura solo de la fila |
| A | Llamadores de cada método, clave compuesta `id + sucursalId`, `onCustomMutation` propaga, lista de crédito ya cubierta | — | verificado |
