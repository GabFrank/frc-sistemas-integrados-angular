# Plan — errores de red en la lista de productos y la etiqueta de precio (issue #390, PR 11c)

Pieza: **desktop**. Rama: `fix/productos-errores-de-red-en-lista-de-productos-y-etiqueta`, desde `origin/develop`
(a556668a, ya con #410 y #411). No depende de #412 (no toca el buscador). Usa `ContextoConsulta`,
`TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s). Relevamiento: el del PR 11b (auditor de solo
lectura sobre `productos/`, 2026-10-05) más la auditoría de ese plan; `list-producto` y `print-label-dialog` releídos
a mano de `origin/develop`. La lista va al **central**; la etiqueta lee las monedas del **filial**
(`monedaService.onGetAll(false)`) y debe seguir leyéndolas de ahí.

## Regla (la de #391–#412)

Un `null` (error GraphQL) es un fallo, nunca «no hay» / 0. Un stock o una cotización que no se pudo leer no se
muestra como 0 ni se reemplaza por un valor fijo. Un aviso por flujo.

## 1. Stock por sucursal al expandir un producto (fase 1) [verificado]

`list-producto:onRowClick` arma la fila con `existencia = null` (que el HTML pinta como spinner) y pide
`onGetStockPorSucursales(producto.id)` sin `errorConf` ni `error:`:
- **error del servidor**: el servicio convierte el `null` en un mapa vacío y la pantalla hace `?? 0` → **stock 0 en
  todas las sucursales**, indistinguible de «sin stock».
- **error de red**: spinner para siempre en cada sucursal.

Cambio: la llamada pasa `errorConf` con red y GraphQL propagados y `show: false` (el método ya lo acepta; así lo
usan los dos llamadores de compras) y contexto de 20 s. `error:` → cada sucursal de la fila queda **«—»** (estado
propio, `sinDato`, distinto de «cargando» y de 0) con un cartel «No se pudo leer el stock» + «Reintentar» en la
tarjeta, y un aviso. El `?? 0` se conserva solo para la respuesta buena (las sucursales sin movimientos no vienen
y son 0 de verdad). La carga se extrae a un método para poder reintentar.

**Sucursales** (`cargarSucursales`): sin `errorConf`; con error de red `sucursales` queda sin asignar y con `null`
queda `undefined` → `this.sucursales.map` rompe al expandir, y el filtro de sucursal queda vacío sin explicación.
Cambio: opt-in (`onGetAllSucursales` ya acepta `errorConf`/`contexto`), `sucursales` siempre arreglo, flag
`sucursalesFallo` con aviso y «Reintentar» junto al filtro; sin sucursales, expandir muestra el cartel en vez de
romper.

## 2. Búsqueda y exportación (fase 2) [verificado]

- **Buscar / filtrar / paginar** (`onSearchProducto` → `onSearchWithFilters`, un solo llamador): sin `error:`. Con
  error de red `isSearching` queda en `true` y la grilla muestra los resultados del filtro anterior con los filtros
  nuevos a la vista; con `null`, `res.getContent` rompe y el flag también queda trabado. Cambio: propagar en el
  servicio (red y GraphQL, `show: false`, 60 s); `error:` → grilla vacía, paginador en cero, «Generar PDF»
  deshabilitado, `isSearching = false` y aviso. Ya hay contador (`busquedaSeq`): se respeta también en el `error:`.
- **Exportar reporte** (`onExportarReporteConFiltros`, un solo llamador): con error de red el `error:` no se
  alcanza y el modal «Generando reporte de productos…» queda colgado. Cambio: propagar en el servicio el error de
  red (sin acortar el corte: un reporte puede tardar; queda el del link para `onCustomQuery`, 300 s); con error del
  servidor sigue llegando `null` → «Error al generar el reporte» (un solo aviso: `graphError.show: false`).

## 3. Etiqueta de precio (fase 3) [verificado]

`print-label-dialog:loadCotizaciones` usa `monedaService.onGetAll(false)`, cuyo genérico (`onGetAll`) **no emite
ante ningún error** (ni red ni GraphQL): el `error:` es código muerto. Las cotizaciones quedan en los valores fijos
**130 (real) / 7000 (dólar)** — propiedad, valor inicial del formulario y tres `|| this.cotizacionReal/Dolar` — y la
etiqueta sale con precios en real y dólar calculados con eso, sin aviso. Lo mismo si la moneda no tiene `cambio`.
Los campos de cotización son `readonly`.

Cambio:
- `MonedaService.onGetAllEnSegundoPlano(servidor = true)`: gana el parámetro (hoy fijo al central; su único
  llamador es el header) y la etiqueta lo llama con `false` (filial, como hoy). Propaga la red, sin modal, 20 s.
- Sin valores fijos: `cotizacionReal` / `cotizacionDolar` arrancan en `null`, el formulario también, y se quitan
  los tres `||`. Un único helper decide si hay cotización usable (`> 0`).
- Estado `cotizacionesEstado`: `cargando` / `ok` / `error`. `null` de la consulta = fallo. Si la consulta responde
  pero falta REAL o DÓLAR (o su `cambio`), esa moneda queda sin cotización con su propio texto («sin cotización
  cargada»), que no es un error de red.
- Sin cotización de una moneda: su precio en la vista previa y en las plantillas es «—» y **no se imprime** en un
  modo que la necesite (aviso «No hay cotización del real/dólar: no se puede imprimir en esa moneda»). El modo
  **solo guaraníes imprime siempre**.
- Cartel en la fila de cotizaciones (solo visible cuando el modo no es guaraníes) con «Reintentar». Los campos
  siguen `readonly`.

Sin cambio: el resto de `print-label-dialog` (impresoras, plantillas), `ajustar-costo-dialog`, lotes, y todo lo de
11d (promociones, envase, producto-proveedor, altas de familia / subfamilia / presentación).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(productos): no mostrar stock 0 por sucursal cuando falla la consulta en la lista` | 1 |
| 2 | `fix(productos): no dejar trabada la lista de productos ni el reporte sin respuesta` | 2 |
| 3 | `fix(productos): no imprimir etiquetas con cotizaciones fijas cuando no se pudieron leer` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`; para la etiqueta, el filial local `:8080` congelado de la misma
forma (práctica aceptada). Solo lectura: **no se imprime ninguna etiqueta** (se observa la vista previa y que
`printLabel` no llegue a la impresora). Casos:
1. Expandir un producto vivo (stock real, 0 real en sucursales sin movimientos) y congelado («—» + cartel, no 0 ni
   spinner eterno); «Reintentar» al reanudar. Error del servidor simulado (consulta que emite error) → «—».
2. Filtrar y paginar congelado: grilla vacía, paginador en cero, aviso, sin «buscando» trabado; recuperar.
3. Exportar congelado: el modal se cierra con aviso (con el corte que corresponda; se simula el error para no
   esperar 300 s).
4. Etiqueta: abrir con el filial vivo (cotizaciones reales), congelado (campos vacíos, cartel, vista previa «—»,
   imprimir en real bloqueado, guaraníes permitido hasta la impresora simulada).

## Riesgos y qué queda sin verificar

- Quien hoy imprime etiquetas en real/dólar sin conexión al filial deja de poder hacerlo (antes salían con 130 /
  7000): es el comportamiento buscado, pero es un cambio visible.
- La etiqueta tiene tres caminos de impresión (imagen, HTML, plantilla vertical): se cubren los tres puntos donde
  se calcula el precio; el resto de cada camino no se toca.
- `onGetAll` genérico (no emite ante ningún error; 38 llamadores de monedas) no se toca: PR propio.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Lista de productos
- **Estado del stock en la pantalla, no en el modelo**: no se agrega `sinDato` a `ExistenciaCostoPorSucursal` (clase
  compartida). El componente lleva el estado de la fila expandida (`stockEstado`: `cargando` / `ok` / `error`); con
  `error` la columna muestra «—» y el cartel con «Reintentar».
- **Armado de la fila robusto**: con filtro de sucursal activo y la sucursal no encontrada (p. ej. porque no
  cargaron las sucursales) hoy `selectedProducto.sucursales` queda sin asignar y el `forEach` rompe, con spinner
  eterno. Siempre se asigna un arreglo; si no hay sucursales para mostrar, no se consulta el stock y se muestra
  «No se pudieron cargar las sucursales» + «Reintentar».
- **Ajustar stock con las sucursales sin cargar**: `getSucursalPreseleccionada` devolvería `undefined` con un
  filtro de sucursal activo y el diálogo abriría sin sucursal y sin poder elegirla. Con `sucursalesFallo` y filtro
  de sucursal activo, «Ajustar stock» avisa y no abre.
- **`isSearching` no se muestra en ningún template**: lo visible hoy es el modal «Buscando…» (cuando la búsqueda no
  es silenciosa) y la grilla del filtro anterior sin aviso. Se corrige la descripción; en la prueba se mira la
  grilla, el paginador y el aviso, no un «buscando».
- **Paginar no vacía**: al fallar un cambio de página se conservan la grilla y el paginador anteriores, se vuelve
  `pageIndex` al valor previo y se avisa. Solo buscar / filtrar vacían (los filtros ya cambiaron y la grilla vieja
  engaña). El buscador dispara una búsqueda silenciosa por tecla: se respeta `busquedaSeq` también en `error:` y el
  aviso no se repite dentro de una ventana corta.
- **Exportar**: hoy hay **dos modales** superpuestos (el propio «Generando reporte…», sin vencimiento, y el
  «Buscando…» de `onCustomQuery`). En el servicio: red propagada, `networkError.show: false`,
  `graphError.show: false`, `silentLoad = true` y contexto explícito de 300 s con `silenciarAvisoTimeout: true`
  (un solo modal y un solo aviso, el del componente).

### Etiqueta
- **`onGetAllEnSegundoPlano` tiene dos llamadores**, no uno: `cotizacion-header.service` y
  `create-edit-solicitud-pago-dialog`. Gana dos parámetros opcionales al final (`servidor = true`, `errorConf?`);
  sin pasarlos se comporta igual que hoy para ambos. La etiqueta lo llama con `false` y con
  `graphError.show: false` (si no, un error del servidor daría el «Ups» del servicio más el cartel propio).
- En un desktop **sin filial** todo va al central: `servidor = false` sigue funcionando.
- El cambio **quita el modal «Buscando…»** que hoy aparece al abrir la etiqueta (lo abría `onGetAll`).
- **Dónde se calcula el precio en real/dólar** (los tres se cubren con el mismo helper): vista previa
  (`updatePreviewComputedProperties`, de la que también sale la plantilla vertical `priceReal`/`priceDolar`),
  térmica (`printThermalPriceLabel`) y afiche (`printOfficeLabel`). Sin el helper, `precio / null` da «∞».
- **Dónde se bloquea**: un único cálculo `faltaCotizacion` (según el modo: `real` y `guarani_real` necesitan REAL;
  `todas`, REAL y DÓLAR; `guarani`, ninguna; solo aplica a la etiqueta de **precio**, no a código de barras ni QR)
  guardado en una propiedad que se actualiza cuando cambia el modo o llegan las cotizaciones. Se usa en el
  `[disabled]` de los **dos** botones (térmica y afiche A4) y como guarda al inicio de `printLabel` (rama de
  precio, que incluye la vertical) y de `printOfficeLabel`.
- Vista previa sin cotización: «R$ —» / «D$ —». Ninguna ruta de impresión lo emite (queda bloqueada antes).
- Anotado, sin tocar: la plantilla vertical muestra Gs. y R$ también en modo `real` (incoherencia previa).

### Riesgos (se agregan)
- `MonedaService.onGetAllEnSegundoPlano` es compartido con el header y con solicitud de pago: el cambio es solo de
  parámetros opcionales; se verifica que esos dos siguen igual.
- Un filial con la réplica de monedas atrasada da una cotización vieja sin aviso: ya es así y queda fuera de alcance.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `onGetAllEnSegundoPlano` tiene dos llamadores; un error del servidor daría doble aviso | alta | parámetros opcionales; `graphError.show: false` |
| A | La impresión entra por dos botones y dos métodos; solo uno valida el formulario | alta | `faltaCotizacion` en los dos botones y las dos entradas |
| A | Con filtro de sucursal y la sucursal no encontrada, `onRowClick` rompe y deja spinner eterno | alta | armado robusto + cartel |
| B | `isSearching` no se ve en pantalla: el síntoma descrito no era el real | alta | descripción y prueba corregidas |
| B | Exportar: dos modales superpuestos, uno sin vencimiento, y doble aviso en el corte | alta | `silentLoad`, contexto de 300 s silenciado, un aviso |
| B | Vaciar la grilla al fallar un cambio de página pierde la página buena | media | paginar conserva; filtrar vacía |
| A | «Ajustar stock» con las sucursales sin cargar abriría sin sucursal | media | avisa y no abre |
| A | Flag en el modelo compartido | media | estado en la pantalla |
| B | `precio / null` → «∞» en tres cálculos; literal de la vista previa | media | helper único; «R$ —» solo en vista previa |
| A | La plantilla vertical muestra R$ en modo `real` | baja | anotado |
| A/B | Origen del stock 0, `?? 0` legítimo (el central no devuelve sucursales sin movimientos), llamadores únicos de búsqueda y exportación, modos de moneda (4), monedas en el filial por réplica | — | verificado |
