# Plan — errores de red en gestión de compras (issue #390, PR 7a)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-compras`, desde `origin/develop` (no depende de #400).
Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_MOSTRADOR_MS`, `TIMEOUT_CONSULTA_DE_FONDO_MS`,
`TIMEOUT_POR_DEFECTO_MS` y el `errorConf`/`contexto` opcional de `onGetById` (#399). Relevamiento: auditor de solo
lectura sobre compras, recepción y solicitud de pago (2026-10-03), cada suscriptor leído. Todo va al **central**.

## División

El relevamiento dio ~55-60 puntos de cambio → tres PRs: **7a** (este) gestión de compras, diálogo de ítem, buscador,
stock/sugerida y lista de compras; **7b** recepción de mercadería, notas de recepción y sus diálogos; **7c**
solicitud de pago. La cotización (`cambio.getUltimoCambioPorMonedaIdEnSegundoPlano`, que ya propaga con 20 s)
se reutiliza en los tres.

## Regla (la de #391–#400)

«Propagar» = `networkError`, siempre con contexto explícito y `silenciarAvisoTimeout: true`: 10 s búsquedas del
buscador, 20 s stock/sugerida/cotización, 60 s cargas de pantalla. Un `null` (error GraphQL) en `onCustomQuery`
**no** se tapa con `?.` y listas vacías: se trata como fallo donde importa. Los **fallbacks que hoy son
inalcanzables y pasarían a ejecutarse** (stock 0, cotización heredada, distribuciones vacías como alta) se
reemplazan por «no disponible» o bloqueo, no por un valor inventado.

## 1. Arranque de la pantalla (`gestion-compras:669`, `loadInitialData`) [verificado]

`forkJoin` de `moneda.onGetAll`, `formaPago.onGetAllFormaPago` y `sucursal.onGetAllSucursales`: los dos primeros
usan el `onGetAll` genérico, que **no emite nada si falla**. Con el central caído no corre ni la nueva compra ni la
carga del pedido: pantalla muerta sin aviso. Cambio: `timeout` + `catchError` por fuente (patrón de #397 para
`onGetAll`; `onGetAllSucursales` con opt-in); si falta alguna, aviso «No se pudieron cargar monedas/formas de
pago/sucursales» con «Reintentar» y **no** se ofrece guardar la compra (sin moneda ni forma de pago la cabecera
quedaría incompleta).

## 2. Pedido abierto: cargas y recargas (`pedido.service`)

- `onGetPedidoById` (`:153`): carga (`gc:746`, `:850` con `forkJoin` de etapa: `loadingPedido` pegado, `error:`
  escrito e inalcanzable) y **recargas tras una acción** (`gc:1207, :1294, :2735, :3196, :3306, :3543, :3611,
  :3748, :4094`): la acción ya se hizo en el backend pero la pantalla queda con datos y botones viejos (p. ej. tras
  crear una nota se puede duplicar; tras finalizar planificación no cambia de tab). Cambio: `onGetById` con
  `errorConf` + 60 s en el servicio; cada suscriptor con `error:` → aviso «La acción se registró, pero no se pudo
  recargar el pedido: usá Reintentar» (sin repetir la acción) y `null` tratado igual.
- `onGetPedidoResumen` (`:163`; `gc:783, :3210, :3327`, fallback local ya escrito), `onGetPedidoItemPorPedidoPage`
  (`:175`; `gc:3005, :3044`, `itemsLoading` pegado; con `null` TypeError), `onGetNotaRecepcionPorPedidoIdAndNumeroPage`
  (`:447`; `gc:3100`) → propagar + `error:` + guarda de `null`.

## 3. Ítem del pedido: distribuciones, stock y sugerida

- `onGetPedidoItemDistribucionesByPedidoItemId` (`:257`): en `add-edit-item:1537`, editando un ítem, si las
  distribuciones no cargan el fallback (hoy inalcanzable) inicializa **como alta** y guarda con `merge`: se
  perderían o duplicarían cantidades por sucursal. En `gc:2834` el botón Distribuir no hace nada (y con fallback
  abriría el diálogo vacío). Cambio: propagar; en edición, sin distribuciones **no se puede guardar** el ítem (aviso
  + «Reintentar»); en `gc:2834` no se abre el diálogo.
- Stock (`producto.onGetStockPorSucursales`, `gc:4354`, `add-edit-item:1648`; `onGetStockPorProductoAndSucursal`,
  `add-edit-item:1863`, ya tiene los parámetros de #399) y la cantidad sugerida encadenada (`:1979`, hoy con un
  `timeout(60000)` que sale por **0**): «Calculando…» eterno; si se propagara, el fallback mostraría **stock 0** y
  inflaría la sugerida. Cambio: opt-in con 20 s; sin stock se muestra «—» y la sugerida queda «no disponible»
  (no se calcula con 0).
- `onGetPedidoItemsByPedidoId` (`add-edit-item:802, :846`): no avisa «producto ya en el pedido» → se duplica; con
  `null` TypeError. Cambio: propagar; si falla, aviso y **no** se agrega hasta poder verificar.
- `onGetProductoParaPedido` (`add-edit-item:869`, `onGetById` sin `errorConf`) → `errorConf` + aviso.

## 4. Cotización (`gc:2197`, `prefillCotizacionFromMercado`) [verificado]

Al cambiar de moneda pide la última cotización (`getUltimoCambioPorMonedaId`, sin propagar): sin respuesta el
control queda **con la cotización de la moneda anterior** (p. ej. la de reales aplicada a dólares). Cambio: usar
`getUltimoCambioPorMonedaIdEnSegundoPlano` (ya propaga, 20 s); con error o `null` se **vacía** la cotización y se
avisa «No se pudo obtener la cotización: ingresala a mano». El guardado ya exige cotización en moneda extranjera
(`form.valid`, `required` + `min(0.0001)`, `gc:1145, :1050, :2181`): no hace falta agregar nada.

## 5. Buscador y lista

- `buscador-compras.buscarProducto` (código de barras, `gc:2587`, `add-edit-item:721`) y `buscarProductoConFiltros`
  (search-dialog): el Enter no responde y la petición colgada queda en la caché 60 s; el `catchError` escrito es
  inalcanzable. Cambio: propagar con 10 s; **no cachear** un fallo.
- `getByProveedorId`/`buscarProductoProveedor` (`gc:4167`, `productosProveedorLoading` pegado) → opt-in + `error:`.
- `list-compra`: `onGetPedidosWithFilters` (`:177`), `onGetPedidoById` (`:197`), `onGetPedidoRecepcionFisicaResumen`
  (`:537`, spinner de fila pegado, `error:` inalcanzable), `onGetAllSucursales` (`:153`) → propagar/opt-in +
  `error:` (hoy sin `error:` pasarían a «unhandled»).

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Distribuciones**: un `[]` exitoso es legítimo (ítem aún sin distribuir; el guardado ya exige ≥1 salvo
  SIMPLIFICADA con varias sucursales, `add-edit-item:1133-1136`). Se bloquea **solo con error o `null`** (flag
  `distribucionesFallo`), nunca por lista vacía.
- **«Producto ya en el pedido»**: además de `add-edit-item:802/846`, `fetchProductoIdsEnPedido` (`gc:2656-2664`)
  hace `catchError(() => of([]))` y abriría el alta sin verificar. Con error: aviso y **no** se abre el alta; el
  `error:` de `:802` que escribe `[]` también se cambia; `:846` recibe `error:`.
- **Firmas a extender** (`errorConf?`/`contexto?` al final, los demás llamadores no cambian):
  `producto.onGetStockPorSucursales` (`:163`), `movimiento-stock.onGetCantidadSugeridaPorSucursales` (`:128`),
  `producto.onGetProductoParaPedido` (`:237`, `onGetById`). `getByProveedorId` y `onGetStockPorSucursales` tienen
  otros llamadores (proveedor, `list-producto`): opt-in, no en el servicio.
- **Stock**: `stockActual` pasa a `number | null`; `null` = «no disponible» («—»), distinto del 0 de una fila
  oculta por rol (`cerrarSiStockOculto`); la sugerida no se calcula con `null`. Un stock vacío legítimo sigue en 0.
- **Cotización**: al cambiar de moneda se vacía el control antes de pedir y se muestra «obteniendo…»
  (`cotizacionRefreshing`); el prefill devuelve ok/fallo y los avisos «recalculada»/«actualizada» (`gc:2188-2194,
  :2250`) salen solo si salió bien.
- **Buscador**: la caché ya olvida los fallos (`olvidarBusqueda`, `buscador:109, :125-131`): no se toca. Se aplica
  10 s a `buscarProducto` y `buscarProductoConFiltros`; con error de red en el primer intento **no** se hace el
  fallback a filtros (si no, 20 s); `null` en filtros se trata (hoy TypeError, `:289`). La página 0 de
  `buscarProductosParaDialog` sigue sin propagar (lo usa el `switchMap` de `setupCodigoPrefetch`, `gc:561-566`).
- **`list-compra`**: el `error:` de `loadSucursalesRecepcionadas` (`:544-546`) escribe `[]` en el mapa y `:531` lo
  cachea para siempre → al fallar no se escribe el mapa (spinner abajo, se puede reintentar); `res?.` en `:154`;
  `error:` en `:153, :188, :198`.
- **Arranque**: `sucursales?.filter` (`gc:680`); `error:` en los `subscribe` de `:534` y `:538`.
- **`onGetEtapaActual`** (`apollo.query` crudo, sin timeout) dentro de los `forkJoin` de `gc:748, 852, 3204, 3314`:
  `timeout(60000)` en esa rama.
- Las recargas tras una acción **ya tienen** `error:`: solo cambia el texto del aviso. Ítems y notas ya bajan sus
  flags en `error:`: falta la guarda de `null`. `onGetPedidoById` también lo llaman 5 sitios de recepción
  (`rec:978, 1078, 2458, 2852, 2924`), todos con `error:` (silencioso: el aviso va en 7b).
- Las citas de línea de `gestion-compras` están corridas ~7 líneas respecto de `develop`: se revalidan al
  implementar.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `fetchProductoIdsEnPedido` traga el error y abriría el alta sin verificar duplicados | alta | incluido: sin verificar no se abre |
| B | Bloquear por distribuciones vacías bloquearía ítems legítimamente sin distribuir | alta | solo error o `null` bloquean |
| A | Firmas de stock, sugerida y producto sin `errorConf`/`contexto` | media | se extienden |
| B | Stock `null` vs 0 oculto por rol | media | `number | null`, «—» |
| B | Cotización: valor viejo durante la consulta y avisos de éxito aunque falle | media | vaciar + «obteniendo…», avisos condicionados |
| A | `list-compra` cachea el fallo de sucursales recepcionadas | media | no se escribe el mapa al fallar |
| B | `switchMap` del prefetch de código | media | la página 0 sigue sin propagar |
| A | `:846` sin `error:` | media | agregado |
| A | Caché del buscador ya olvida fallos | baja | texto corregido |
| B | Fallback a filtros duplica la espera con error de red | baja | sin fallback ante error de red |
| B | Commit de fase 2 decía «stock» (no bloquea el guardado) | baja | texto corregido |
| A | `sucursales.filter` con `null`; `subscribe` sin `error:` en el arranque | baja | guardas |
| A | `onGetEtapaActual` sin timeout en los `forkJoin` | baja | `timeout(60000)` |
| A | Citas de línea corridas | baja | se revalidan |
| A/B | Recepción y solicitud de pago no reciben errores sin handler; `EnSegundoPlano` adecuado; cotización ya obligatoria | — | verificado |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no arrancar ni recargar una compra en silencio sin servidor` | 1, 2 |
| 2 | `fix(operaciones): no guardar items de compra sin distribuciones ni cotizacion` | 3, 4 |
| 3 | `fix(operaciones): avisar cuando no responden el buscador y la lista de compras` | 5 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (rama local de pruebas, sin perfil, replicación apagada y verificada en *Negative
matches*), congelado con `kill -STOP` y un respaldo `kill -CONT`. Casos: abrir gestión de compras (nueva y un
pedido existente), cambiar de moneda (cotización), abrir un ítem en edición (distribuciones), stock/sugerida,
buscar por código de barras, lista de compras. **No se guarda ninguna compra** con el central congelado. Casos
`null`: verificados por código.

## Riesgos y qué queda sin verificar

- Con el central lento, un ítem en edición no se puede guardar hasta que carguen sus distribuciones; la sugerida
  queda «no disponible».
- Las recargas tras una acción pueden fallar después de que la acción se hizo: se avisa que se registró y se ofrece
  reintentar la recarga, no la acción.
