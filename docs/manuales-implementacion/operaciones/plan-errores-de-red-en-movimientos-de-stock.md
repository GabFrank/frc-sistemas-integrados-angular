# Plan — errores de red en la lista de movimientos de stock (issue #390, PR 10b)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-movimientos-de-stock`, desde `origin/develop`
**después del merge de #409** (usa el `errorConf?`/`contexto?` de `ventaService.onGetPorId` que agrega #409). Usa
`PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s).
Relevamiento: el del PR 10 (auditor de solo lectura sobre `operaciones/movimiento-stock`, 2026-10-05, leído de
`origin/develop`); el resumen de stock y el detalle de un movimiento releídos a mano. Todo va al **central**.

## Regla (la de #391–#409)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`. En esta pantalla la regla
central es: **un stock que no se pudo leer no se muestra como 0**. El resumen (stock actual, stock del período) y el
detalle (stock anterior / stock final) alimentan decisiones de compra y ajuste: si falta una sucursal o falla la
consulta, se muestra «no disponible», no un total parcial ni un cero.

## 1. Resumen de stock al filtrar (fase 1) [verificado]

`list-movimiento-stock:onFiltrar` pone en **0** `stockTotal`, `stockPorRangoFecha` y los desgloses, y lanza dos
`forkJoin` (uno por sucursal) sin `error:`:
- **Stock actual** (`service.onGetStockPorProducto`, por sucursal): si una sola consulta no responde, el `forkJoin`
  nunca emite y queda **stock 0** a la vista; con error GraphQL llega `null`, `stockTotal += null` suma 0 y el total
  sale **parcial** como si fuera completo.
- **Stock del período por tipo de movimiento** (`onGetStockPorTipoMovimiento`, un solo llamador): igual; con `null`
  esa sucursal se **omite en silencio** del resumen.

Cambio: las dos consultas propagan (20 s) — `onGetStockPorProducto` opt-in (tiene otros llamadores, ya acepta los
parámetros), `onGetStockPorTipoMovimiento` en el servicio —, con error GraphQL también como error
(`graphError.propagate`), para que un `null` no se confunda con «sin stock». Cada bloque del resumen tiene estado
propio (`cargando` / `ok` / `no disponible`): mientras carga o si falla **cualquier** sucursal, el total y el
desglose muestran «—» con «No se pudo calcular: reintentá», nunca 0 ni un parcial. Un contador descarta las
respuestas de un filtro anterior (hoy una respuesta vieja puede pisar la nueva).

## 2. Lista de movimientos (fase 1)

`onGetMovimientos` (`onGetMovimientoStockPorFiltros`, un solo llamador): con error de red, modal «Buscando…» y la
grilla y el paginador del filtro anterior. Cambio: propagar en el servicio (60 s, sin modal); al fallar se vacía la
grilla con aviso; mismo contador de carga.

## 3. Detalle de un movimiento (fase 2) [verificado]

Al expandir una fila se pide el **stock anterior** (`onGetStockAntesDeFecha`; sus tres llamadores están en este
componente):
- los dos `error:` de `onClickRow` y `obtenerStockAnteriorYProcesarMovimiento` (hoy inalcanzables) arman el detalle
  con **stock anterior 0** → «stock final = cantidad», falso; y hoy mismo un error GraphQL (`null`) ya produce ese 0
  por el `stockPrevio || 0`.
  Cambio: propagar en el servicio (20 s) con el error GraphQL también como error; los dos `error:` arman el detalle
  con stock anterior y final **no disponibles** («—») y avisan, sin inventar 0. Un `null` exitoso (sin movimientos
  previos) sigue siendo 0.
- `calcularDataParaAjuste` (`:949`): su `error:` solo registra; se le agrega la marca «no disponible» para esa fila.
- **Venta del movimiento** (`ventaService.onGetVentaItemPorId`, un solo llamador, y `onGetPorId`): sin `error:`, la
  fila no se expande y no avisa; con `null` puede dar TypeError. Cambio: propagar (`onGetVentaItemPorId` en el
  servicio; `onGetPorId` opt-in de #409) + `error:` que arma el detalle básico (sin la venta) y avisa; guarda de
  `null`.
- «Ir a la venta» (`irAVenta`): su `error:` ya avisa; se vuelve alcanzable con el opt-in.

Sin cambio: `transferenciaService.onGetTransferenciaItem` e `inventarioService.onGetInventarioProductoItem` (de
otros módulos: el primero ya quedó cubierto en #399; el segundo va con inventario), `ajustar-stock-dialog`
(mutación que ya propaga), `onGetCantidadSugeridaPorSucursales` (cubierto en #401).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no mostrar stock 0 ni totales parciales cuando no responde el servidor` | 1, 2 |
| 2 | `fix(operaciones): no inventar el stock anterior en el detalle de un movimiento` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos: filtrar con un producto y varias sucursales (resumen y
grilla) vivo y congelado («—», no 0; grilla vacía con aviso), expandir un movimiento de venta y uno de ajuste
congelado (detalle con stock «—»), recuperar al reanudar. Solo lectura: no se ajusta stock.

## Riesgos y qué queda sin verificar

- Con una sucursal lenta (>20 s) el resumen queda «no disponible» hasta reintentar, aunque las demás respondan: se
  prefiere a mostrar un total parcial.
- Si `stockAntesDeFecha` devuelve `null` de forma legítima para algo distinto de «sin movimientos previos», se
  seguiría mostrando 0 (comportamiento actual).

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Qué devuelve el central**: `stockPorProducto` y `stockByProductoIdAntesDeFecha` devuelven siempre un número
  (0.0 sin movimientos), nunca `null`; `findStockPorTipoMovimiento` devuelve `[]` para una sucursal sin movimientos y
  `null` **solo si falta el producto o las fechas**. Por lo tanto: en las dos consultas de stock un `null` es un
  fallo (se corrige la frase «un `null` exitoso sigue siendo 0» y su riesgo: ya no aplican).
- **Sin producto no se consulta el stock del período**: hoy ese `forkJoin` corre igual y el central responde `null`
  legítimo; con «null = no disponible» el resumen diría «no disponible» sin que nada falle. El bloque queda en
  estado «elegí un producto».
- **Aritmética con stock desconocido**: `stockPrevio + cantidad` se calcula en 6 lugares; con `null` daría «stock
  final = cantidad», justo el error a evitar. Un único helper: `stockFinal = stockPrevio == null ? null : stockPrevio
  + cantidad`. El «—» se cubre en los **cinco** lugares del HTML (los tres bloques de stock anterior/final y
  `cantidadPrevia`/`cantidadFinal` del ajuste en la grilla y en el detalle).
- **Reintento del detalle**: `onClickRow` solo calcula si `movimiento.data == null`; si el error armara un `data`,
  la fila nunca reintentaría. El detalle fallido se marca (`data.noDisponible`) y se vuelve a pedir al expandir.
- **Ajustes de la página** (`procesarDataDeAjustes` → `calcularDataParaAjuste`): se disparan para **cada** ajuste
  (hasta 100 por página), hoy con un modal por consulta. `onGetStockAntesDeFecha` pasa a silencioso; los fallos
  marcan la fila sin avisar uno por uno (un solo aviso por carga).
- **Respuestas tardías**: el detalle y los ajustes escriben por índice; si entre tanto se refiltró o paginó, pisan
  otra fila. Solo aplican si `dataSource.data[index] === movimiento`.
- **Contadores separados**: uno para la lista (cada `onGetMovimientos`) y otro para el resumen (solo cuando no es
  paginación): paginar no limpia ni invalida el resumen.
- **Resumen**: `catchError` por sucursal (marcador de fallo) en vez de dejar que el `forkJoin` corte en la primera;
  `graphError: { propagate: true, show: false }` (constante propia) y **un solo aviso** por bloque. Con alguna
  sucursal fallida el total queda «no disponible» y el desglose marca cuál falló. Corte de **60 s** (son hasta 2N
  consultas en paralelo, N = sucursales) y sin modal (`onGetStockPorProducto` recibe `silentLoad?`).
- **Lista**: `onFiltrar` ya vacía la grilla antes de pedir; lo que queda viejo es el paginador → al fallar,
  `selectedPageInfo = null` y aviso (se corrige la descripción).
- **Venta del movimiento**: `onGetVentaItemPorId` recibe `errorConf?`/`contexto?`; ambas consultas silenciosas;
  guarda `ventaItem?.venta?.id`; el `error:` interno arma el detalle sin la venta.
- Fuera de alcance (anotado): sucursales del filtro, búsqueda de producto y de usuario de esta pantalla,
  `onGetInventarioProductoItem`, y el `stock || 0` de `ajustar-stock-dialog` (mismo patrón, va con productos).

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A/B | Sin producto el stock del período responde `null` legítimo | alta | no se consulta sin producto |
| A/B | `null + cantidad` daría «stock final = cantidad» en 6 lugares | alta | helper único + «—» en los 5 lugares del HTML |
| B | El detalle fallido no se reintentaría nunca | alta | marca `noDisponible` y reintento al expandir |
| B | Un contador único invalidaría el resumen al paginar | alta | contadores separados |
| B | El central nunca devuelve `null` de stock por «sin movimientos» | media | `null` = fallo; frase y riesgo corregidos |
| A/B | Hasta 100 consultas de ajuste por página, con modal y aviso por fila | media | silencioso, un aviso por carga |
| B | Respuestas tardías pisan otra fila por índice | media | se verifica la fila antes de escribir |
| B | `forkJoin` corta en la primera; «Ups» por sucursal; 2N consultas | media | `catchError` por sucursal, aviso único, 60 s, sin modal |
| A | La grilla ya se vacía antes de pedir; `onGetVentaItemPorId` sin parámetros; constante con `graphError` | baja | corregido |
| A | Otras consultas de la pantalla sin proteger | baja | anotadas, fuera de alcance |
| A/B | Llamadores de cada método, líneas citadas, el diálogo de ajuste no lee estos valores | — | verificado |
