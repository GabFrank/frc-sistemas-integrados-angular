# Plan — errores de red en búsquedas y listados de productos (issue #390, PR 11b)

Pieza: **desktop**. Rama: `fix/productos-errores-de-red-en-busquedas-y-listados`, desde `origin/develop`. No depende de
#410 ni de #411 (no toca `ajustar-stock-dialog`, `adicionar-precio-dialog`, `producto.component` ni la lista de
movimientos); si #410 se mergea antes, se rebasa (ambos tocan `producto.service.ts` en métodos distintos). Usa
`PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s).
Relevamiento: auditor de solo lectura sobre `productos/` (2026-10-05, leído de `origin/develop`); la lista de
productos, el detalle del buscador y la etiqueta de precio releídos a mano. Todo va al **central** salvo el buscador
compartido, que usa el servidor que le pasa quien lo abre.

## Regla (la de #391–#411)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`. Un `null` (error GraphQL) es un
fallo, nunca «no hay» / 0. Un stock o un precio que no se pudo leer no se muestra como 0 ni se reemplaza por uno
viejo. Un aviso por flujo.

## 1. Stock y precio a la vista (fase 1)

- **Lista de productos, stock por sucursal al expandir** (`list-producto:onRowClick`) [verificado]:
  `onGetStockPorSucursales` convierte un `null` (error del servidor) en un mapa vacío y la pantalla pinta
  `?? 0`: **stock 0 en todas las sucursales**. Con error de red, spinner eterno. Cambio: `errorConf` con red y
  GraphQL propagados (el método ya lo acepta; es el patrón de compras), `error:` que deja la fila en «no disponible»
  (ni spinner ni 0) con aviso; contador para descartar la respuesta de otra fila.
- **Buscador compartido, detalle del producto** (`pdv-search-producto-dialog:getProductoDetail`) [verificado]: sin
  `error:`; con `null`, TypeError. Además `selectedPresentacion` / `selectedPrecio` /
  `selectedPresentacionRowIndex` **no se reinician al cambiar de fila**: si el detalle del producto B no llega, una
  tecla numérica devuelve el producto B con la **presentación y el precio del producto A** (`tableKeyDownEvent`,
  rama `default`). Cambio: `getProducto` con `errorConf` (opt-in, ya agregado en #410: se agrega acá igual si #410 no
  está mergeado), `error:`/`null` → aviso y la fila queda sin presentaciones; se reinicia la selección de
  presentación/precio al cambiar de fila y al expandir; Enter y las teclas numéricas no hacen nada si la fila
  resaltada no tiene sus presentaciones cargadas o la presentación seleccionada no es de esa fila.
- **Promociones por sucursal** (`precio-especial-dialog:cargar`, `list-precio-especial:onFiltrar`): con `null`
  muestra «sin promociones» (`vigentes = 0`); con error de red queda la lista anterior tras guardar o cortar.
  Cambio: propagar en el servicio (`onPorPrecio` y `onFiltrar` tienen un solo llamador), red y GraphQL; al fallar,
  estado «no se pudo cargar» + «Reintentar», sin afirmar que no hay promociones.
- **Etiqueta de precio** (`print-label-dialog:loadCotizaciones`): usa `monedaService.onGetAll`, que no emite ante
  ningún error; las cotizaciones quedan en **130 / 7000 fijos** y la etiqueta sale con precios en real y dólar
  calculados con eso, sin aviso. Cambio: `onGetAllEnSegundoPlano()` (ya existe y propaga); mientras no carguen (o
  si falla) los campos de cotización quedan **vacíos** con aviso y «Reintentar», y los precios en real/dólar de la
  vista previa y de la impresión no se calculan hasta tener cotización (cargada o escrita a mano).

## 2. Búsquedas y listas (fase 2)

- **Buscador compartido, búsqueda** (`onSearchProducto`): hoy solo propaga en modo mostrador; en los otros ~15
  usos `isSearching` queda trabado y la lista anterior a la vista; con `null`, TypeError en todos los modos. Cambio:
  red y GraphQL propagados en todos los modos (los timeouts del mostrador no cambian: 10 s allá, 20 s en el resto),
  `null` = fallo, `isSearching = false`, lista vacía y aviso.
- **Lista de productos** (`onSearchProducto` → `onSearchWithFilters`, un solo llamador): flag trabado y resultados
  del filtro anterior; con `null`, TypeError. Cambio: propagar en el servicio, `error:`/`null` → grilla vacía,
  paginador en cero y aviso; contador de carga.
- **Sucursales de la lista** (`cargarSucursales`): con `null`, TypeError al expandir. Cambio: opt-in + `res ?? []`,
  aviso y «Reintentar» (sin sucursales no se expande el stock).
- **Exportar reporte** (`onExportarReporteConFiltros`, un solo llamador): con error de red el modal «Generando
  reporte…» queda colgado (el `error:` es inalcanzable). Cambio: propagar en el servicio (60 s).
- **Buscar envase** (`search-envase-dialog`, un solo llamador): flag trabado; con `null` agrega una fila nula.
  Cambio: propagar en el servicio + `error:`/`null`.
- **Productos de un proveedor / proveedores de un producto** (`gestion-productos-proveedor-dialog`,
  `gestion-proveedores-producto-dialog`): `loading` para siempre; con `null` «sin productos vinculados». Cambio:
  `errorConf` (se agrega a `getByProductoId`; `getByProveedorId` ya lo acepta), `error:`/`null` → «no se pudo
  cargar» + «Reintentar».

## 3. Guardados y diálogos menores (fase 3)

- **Alta de familia** (`add-familia-dialog` → `onSave` genérico): con error de red no avisa nada y el diálogo queda
  abierto; con error del servidor, excepción sin capturar. Cambio: propagar en `onSaveFamilia` + `error:`; rechazo
  (array) → se puede reintentar; sin respuesta → aviso «pudo haberse guardado» y se cierra recargando.
- **Alta de subfamilia** (`add-subfamilia-dialog`): `onSaveSubfamilia` envuelve en un `Observable` con un
  `subscribe` interno sin `error:`: ante cualquier error no emite ni completa. Cambio: reescribir el envoltorio con
  `pipe(tap(...))` y propagar; mismo manejo que familia.
- **Posición de la subfamilia** (`onCountSubfamilia`): con error o `null` la subfamilia nueva se guarda con
  **posición 1**. Cambio: propagar; si falla, no se guarda hasta reintentar la lectura.
- **Alta de presentación** (`adicionar-presentacion`): los tipos de presentación no cargan y el select requerido
  queda vacío sin explicación → aviso + «Reintentar»; `onSavePresentacion` (ya propaga) sin `error:` → `error:` con
  el criterio rechazo / incierto.

Sin cambio: `ajustar-costo-dialog`, `lotes-producto-dialog`, `ajustar-stock-lote-dialog` (ya cubiertos), los
guardados de promociones y de producto-proveedor (ya propagan y avisan), `seleccionar-presentacion-dialog` (nadie lo
abre), `familiaBS` / `subfamiliaBS` del constructor de los servicios (van con gráficos/reportes), los `stock` del
buscador (ya dejan «Ver» si no llegan, no muestran 0).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(productos): no mostrar stock 0 ni devolver precio de otro producto cuando falla una consulta` | 1 |
| 2 | `fix(productos): no dejar trabadas las busquedas y listas de productos sin respuesta` | 2 |
| 3 | `fix(productos): avisar cuando no se confirma el alta de familia, subfamilia o presentacion` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos: expandir un producto de la lista vivo y congelado (sin
0), buscar en la lista congelado, exportar congelado (el modal se cierra), buscador compartido desde transferencias
o compras (buscar y expandir congelado; resaltar otro producto y apretar una tecla numérica: no devuelve nada),
promociones de un precio congelado, etiqueta de precio congelada (cotizaciones vacías). **No se guarda ninguna
familia, subfamilia ni presentación con el central congelado**; el camino de guardado sin respuesta se prueba
reemplazando la mutation por un error.

## Riesgos y qué queda sin verificar

- El buscador compartido lo abren ~16 pantallas (POS incluido): los cambios son de manejo de error y de reinicio de
  la selección; el camino feliz (teclado: flechas, Enter, números) se prueba a mano en el POS y en una pantalla de
  servidor.
- El cruce presentación/precio entre productos se confirmó leyendo el código; se reproduce en la prueba de runtime
  antes de dar por bueno el arreglo.
- `onGetAll` genérico (no emite ante ningún error, 38 llamadores de monedas) y el `onSave` genérico (no avisa por
  red) no se tocan: quedan para un PR propio.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### División: este PR es solo el buscador compartido

El bloque no entra en un PR (≈16 archivos, >400 líneas) y mezcla el buscador compartido —lo único que toca el POS—
con pantallas administrativas. Se parte, y **este plan pasa a cubrir solo el PR 11b**:

| PR | Alcance | Plan |
|---|---|---|
| **11b** (este) | `pdv-search-producto-dialog`: detalle, selección de presentación/precio y búsqueda | este documento |
| 11c | Lista de productos (stock al expandir, búsqueda, sucursales, exportar) y etiqueta de precio | propio |
| 11d | Promociones por sucursal, buscar envase, producto-proveedor, altas de familia / subfamilia / presentación | propio |
| 11e | Activos (era 11c) | propio |

Rama de este PR: `fix/productos-errores-de-red-en-el-buscador-de-productos`. Lo demás de las secciones 1–3 queda
como insumo de los planes 11c y 11d, con estas correcciones ya anotadas para entonces:
- **Etiqueta**: los campos de cotización son `readonly` y hay tres `|| this.cotizacionReal/Dolar` además del valor
  inicial del formulario: vaciar el campo no alcanza. La consulta de monedas va al **filial** (`onGetAll(false)`) y
  debe seguir yendo ahí (la variante en segundo plano va al central): hace falta una variante con `servidor`.
  Guaraníes debe poder imprimirse siempre.
- **Lista**: `existencia = null` ya significa «cargando» (spinner): «no disponible» necesita un estado propio.
- **Guardados**: quien abre los diálogos de familia / subfamilia / presentación solo actúa si recibe la entidad;
  cerrar tras un guardado incierto no recarga nada. Se deja el diálogo abierto con aviso y una relectura que
  confirme si se guardó. Reintentar sin id duplicaría. La posición de subfamilia solo bloquea el alta.
- Fuera de alcance, anotado: `compras-search-producto-dialog:390` (mismo `getProducto` sin `errorConf`),
  `add-familia-dialog` nunca carga la lista de posiciones (toda familia nueva queda en posición 1).

### El cruce de presentación y precio no depende solo de la red

`highlightPresentacion` solo asigna `selectedPresentacion` si el índice cae en rango y `selectedPrecio` solo si la
presentación tiene precios; `getProductoDetail` no hace nada si la fila ya tiene presentaciones. Con Enter sobre A,
flecha a B y Enter sobre B, la presentación y el precio de A quedan seleccionados cuando: (a) el detalle de B falla,
(b) B **ya tenía** sus presentaciones cargadas (segunda visita), o (c) B queda con 0 presentaciones tras el filtro
de precios. Desde ahí una tecla numérica devuelve B con presentación y precio de A, y **Enter** devuelve la
presentación de B en el índice viejo con el **precio de A** (`onPresentacionClick` cae a `selectedPrecio`). El clic
del mouse no cruza (cada tarjeta pasa lo suyo). **Es un bug que existe hoy sin falla de red**; la red lo hace más
probable.

Arreglo (en la selección, no solo en el `error:`):
- Al cambiar de fila resaltada (solo si el índice cambia de verdad): `selectedPresentacion = undefined`,
  `selectedPrecio = undefined`, índice `-1`.
- Al expandir una fila, **siempre** se vuelve a seleccionar su primera presentación si ya las tiene (hoy solo en la
  primera carga). `highlightPresentacion` pone `selectedPrecio = undefined` si la presentación no tiene precios.
- `onPresentacionClick` y los caminos de teclado (Enter, números, flechas izquierda/derecha) salen sin hacer nada si
  la fila no tiene presentaciones cargadas, si no hay presentación seleccionada, o si la presentación no pertenece
  a esa fila / el precio no pertenece a esa presentación. Espacio no cuenta como número (`+" " == 0`).
- **Respuesta tardía del detalle**: hoy escribe en `dataSource.data[index]` con el índice de cuando se pidió; si
  se buscó de nuevo o se cambió de fila, las presentaciones de A caen en otra fila. Se busca la fila por
  `producto.id` al llegar, se descarta si ya no está, y `highlightPresentacion(0)` solo corre si sigue siendo la
  fila expandida.
- **Estado del detalle por fila**: `presentaciones == null` muestra un spinner. En error no se pone `[]` (se
  perdería el reintento): estado propio (`cargando` / `error`) con «No se pudo cargar: Enter o clic para
  reintentar». `res?.presentaciones ?? []` en los filtros de precio.
- `getProducto` ya acepta `errorConf` en `develop`: no hay que agregarlo.

### Búsqueda

- El descarte de respuestas viejas (`busquedaId`) y el manejo de fallo hoy están solo dentro de `if (mostrador)`:
  salen de ahí y valen para todos los modos.
- Fallo en la **primera** página: lista vacía + aviso. Fallo al **cargar más** (`offset != null`): se conserva lo
  que hay + aviso.
- `errorConf` con `networkError` y `graphError` propagados y ambos `show: false` (avisa el diálogo, una vez). El
  mostrador mantiene sus 10 s; el resto, 20 s.
- `productoPorCodigo` devuelve `null` legítimo («no existe»): con `graphError.propagate` el error ya no llega como
  `null`, así que `null` sigue significando «no existe».

### Fases de este PR

| Fase | Commit |
|---|---|
| 1 | `fix(productos): no devolver presentacion ni precio de otro producto desde el buscador` |
| 2 | `fix(productos): no dejar trabado el buscador de productos cuando no responde el servidor` |

Fase 1 = selección + detalle (incluye el bug sin red). Fase 2 = búsqueda. Las dos tocan el mismo archivo.

### Prueba de runtime de este PR

Filial local `:8080` para el POS (modo mostrador) y central local `:8081` para una pantalla de servidor
(transferencias o movimientos de stock), congelados con `kill -STOP` + respaldo `kill -CONT`. Solo lectura.
1. **Sin falla de red** (reproduce el bug de hoy, antes y después): Enter sobre A, flecha a B, Enter sobre B con
   B ya visitado → número y Enter devuelven lo de B, nunca lo de A.
2. Teclado en el camino feliz: Enter/Enter; Enter-flecha-Enter en segunda visita; número con un tipo de precio que
   la presentación no tiene; flechas izquierda/derecha; clic del mouse.
3. Detalle congelado: aviso, sin spinner eterno, Enter y números no devuelven nada; al reanudar, reintenta.
4. Respuesta tardía: congelar, expandir A, buscar otra cosa, reanudar → las presentaciones de A no aparecen en otra fila.
5. Búsqueda congelada en modo servidor y en mostrador: aviso y `isSearching` liberado; «cargar más» conserva la lista.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | El cruce A/B ocurre también sin falla de red (segunda visita, 0 presentaciones) y por Enter, no solo por número | alta | el arreglo va en la selección; escenario ampliado |
| A | Respuesta tardía del detalle escribe por índice en otra fila | alta | se busca por id y se descarta |
| B | La etiqueta lee monedas del filial; la variante en segundo plano va al central; campos `readonly` y tres `\|\|` | alta | pasa al plan 11c con la corrección |
| B | Los llamadores de los diálogos de alta no recargan si se cierra sin entidad | alta | pasa al plan 11d: diálogo abierto + relectura |
| B | El PR era demasiado grande y mezclaba el buscador del POS con pantallas administrativas | media | dividido en 11b / 11c / 11d |
| A | Teclado sin presentaciones cargadas da TypeError (Enter, flechas, números, espacio) | media | guardas en todos los caminos |
| A | Spinner eterno si el detalle falla; `[]` como marca perdería el reintento | media | estado por fila |
| A | `busquedaId` y el manejo de fallo solo existen en mostrador; «cargar más» no debe vaciar | media | regla explícita |
| B | Reiniciar la selección a −1 sin re-seleccionar rompería Enter en la segunda visita | media | re-selección siempre al expandir; casos de prueba |
| A | `existencia = null` ya es «cargando»; nombres de métodos de promociones | baja | anotado para 11c / 11d |
| A/B | Llamadores únicos de los métodos a propagar, `getProducto` ya con `errorConf`, el clic del mouse no cruza | — | verificado |
