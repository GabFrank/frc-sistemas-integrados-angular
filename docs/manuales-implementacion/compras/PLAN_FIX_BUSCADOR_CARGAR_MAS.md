# Plan — fix: el botón «+» del buscador de productos de compras no carga más resultados

Rama: `fix/compras-buscador-cargar-mas` (desde `origin/develop` @ `1383056c`). Pieza: **desktop**.
Central, filial, mobile y mobile-pwa: N/A porque el contrato de `productoSearch` no cambia; el bug
está en cómo el desktop calcula el `offset`.

## Diagnóstico

`ComprasSearchProductoDialogComponent.cargarMasDatos()` pide `paginaActual + 1`. Para texto,
`BuscadorComprasService.ejecutarBusquedaProductosDialog` llama
`productoService.onSearch(termino, page * size, …)` con `size = 20`, pero `productoSearch` del
central devuelve **10 filas** desde ese offset:

- SQL: `ProductoRepository.findbyAll` → `limit 10 offset :offset`.
- Lucene: `ProductoService.buscarPorTextoLucene` → `subList(offset, offset + 10)`, sobre como máximo
  200 ids.

Resultado: la página 0 muestra las filas 1-10 y el «+» pide desde la 21. Con ≤ 20 coincidencias no
trae nada (el síntoma reportado); con más, saltea las 11-20 en cada clic.

El camino de código de barras (`buscarProducto` → `buscarProductoInteligente` /
`searchProductoWithFilters`) pagina por número de página con `PageRequest(page, size)`: está bien.

Otros tres defectos del mismo botón, que se arreglan en el mismo cambio:

1. Si la carga falla, `paginaActual` ya avanzó: el clic siguiente saltea una página.
2. Si el usuario cambia el texto mientras la carga está en curso, las filas del término viejo se
   agregan a la lista nueva (la suscripción del «+» no se cancela).
3. El botón no avisa cuando ya no hay más resultados: sigue pareciendo que «no hace nada».

## Fase 1 (única) — `fix(compras): …`

`buscador-compras.service.ts`
- Constante `FILAS_POR_LLAMADA_PRODUCTO_SEARCH = 10` (lo que devuelve `productoSearch`), y en el
  camino de texto `offset = page * FILAS_POR_LLAMADA_PRODUCTO_SEARCH`.
- La página 0 queda igual (offset 0) → la clave de caché `termino|0|20` que comparten el prefetch de
  `gestion-compras` / `add-edit-item-dialog` y el diálogo no cambia.
- Nuevo `filasPorPaginaDialog(termino, size)`: 10 para el camino de texto, `size` para el de
  código de barras. Es el tamaño que tiene una página **llena**.
- `catchError(() => of([]))` se aplica solo a la página 0 (la usan el prefetch y los Enter, que
  esperan lista vacía ante error). En las páginas > 0 el error llega al componente, así no se
  confunde con «no hay más». Además la entrada de caché de una llamada que falló se borra.

`compras-search-producto-dialog.component.{ts,html,scss}`
- `paginaActual` avanza **solo** cuando la carga responde bien.
- Contador de generación `generacionBusqueda`: se incrementa en cada búsqueda nueva (valueChanges y
  `ejecutarBusqueda` sin append). La respuesta de un «+» cuya generación no coincide se descarta.
  Comparar el término no alcanza: A → B → A lo daría por válido.
- Flag `hayMasResultados` (propiedad, no función en el HTML), patrón portado de mobile-pwa
  (`shared/producto/buscador-producto.component.ts:386`, `hayMas = filas.length === LOTE`):
  se calcula con el **tamaño crudo** de la página recibida (`productos.length >= filasPorPagina`),
  no con las filas nuevas después del dedupe. Una página llena de repetidos no corta la paginación.
- El «+» se deshabilita con `busquedaEnCurso || !hayMasResultados` (evita el doble clic), y aparece
  «No hay más resultados» cuando `hayMasResultados` es falso y la lista tiene filas.
- Error en el «+»: aviso `openWarn`, `hayMasResultados` queda como estaba y se puede reintentar.
- Invariante que se mantiene: el append solo agrega al final. `mostrarStock` y
  `cargarDetalleProducto` escriben por índice capturado al hacer clic.

### Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `hayMasResultados` | `ComprasSearchProductoDialogComponent` (búsqueda inicial por valueChanges, `ejecutarBusqueda` con y sin append) | template del diálogo (`[disabled]` del «+» y el aviso) |
| `generacionBusqueda` | mismo componente, al iniciar cada búsqueda nueva | `ejecutarBusqueda` en append, al recibir la respuesta |
| `filasPorPaginaDialog()` | `BuscadorComprasService` | el diálogo, para calcular `hayMasResultados` |

Sin migraciones, sin GraphQL nuevo, sin roles (no modifica datos).

### Tests

N/A para desktop porque el CI no corre tests y no hay batería confiable
[ev: `.github/workflows/ci.yml` — ningún paso de test]. Gate: `npm run check` + prueba en el
navegador.

## Prueba manual (`ng serve -c web` contra central local 8081)

Compras → buscar producto (Enter con varios resultados abre el diálogo, o el diálogo desde la lista
de compras) con un término que tenga:

1. **11-20 coincidencias**: el «+» agrega las filas 11-N y después queda deshabilitado con «No hay
   más resultados».
2. **> 30 coincidencias**: cada clic agrega 10 filas consecutivas (sin salto; comparar contra
   `productoSearch` con offset 10/20 por GraphQL).
3. **Cambiar el texto** durante una carga: la lista nueva no mezcla filas del término anterior.
4. **Código de barras**: sigue igual.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| B | El `catchError → []` del servicio hace que un error de red en el «+» se lea como «no hay más» | Aplicado: error propagado en páginas > 0 (arriba) |
| B | «0 filas nuevas tras el dedupe» ≠ «fin»: en Lucene `fetchSize` crece con el offset (`ProductoService.java:136`) y el orden puede variar | Aplicado: `hayMasResultados` por tamaño crudo de la página |
| B | Comparar el término no alcanza para descartar un «+» viejo (A → B → A) | Aplicado: contador de generación |
| B | Escritura por índice (`mostrarStock`, `cargarDetalleProducto`) + append concurrente | Sin cambio: el append es solo al final; queda anotada la invariante |
| A | Consumidores de la caché de página 0 (prefetch, add-edit-item, warmup) | Sin riesgo: el offset de la página 0 sigue siendo 0 y la clave no cambia |
| A | El `10` del central está hardcodeado y no viaja en el schema: si cambia, el desktop se desincroniza en silencio | Anotado como deuda. La constante lleva un comentario con la referencia al repositorio y al servicio del central |
| A | mobile-pwa tendría el mismo bug de offset | **Falso**: `buscador-producto.component.ts:50` usa `LOTE = 10` y `offset += LOTE` |
| A | ¿El filial entra en juego? | No: `onSearch(..., servidor=true)` va siempre al central |

## Durante la implementación

- `GenericCrudService.onCustomQuery` (`generic-crud.service.ts:178-194`), ante un error de red y sin
  `errorConf.networkError.propagate`, **no emite ni completa**: el «+» habría quedado deshabilitado
  para siempre. El camino de texto ya no pasa por `ProductoService.onSearch`: llama la misma query
  (`ProductoForPdvGQL`, mismas variables) con `propagate: true`, y una respuesta `null` (error
  GraphQL, que onCustomQuery ya avisa) se trata como error. Para la página 0 el efecto es que el
  prefetch y los Enter reciben `[]` en vez de quedar esperando.
- El control de generación también se aplica a la búsqueda por `valueChanges`: un Enter puede lanzar
  una búsqueda más nueva mientras esa vuela.
- `hayMasResultados` arranca en `false` en cada búsqueda (no `true`): el «+» ya está deshabilitado
  mientras carga, y así no parpadea habilitado con la lista vacía.
- Camino de código de barras (`buscarProducto`): sigue sin `propagate`, así que un error de red en
  su página > 0 deja el «+» esperando. Es raro (un código trae 0 o 1 resultado) y queda fuera.

## Queda sin verificar

- Lucene: tope de 200 ids, y `fetchSize` variable con el offset. Puede saltear o repetir alguna
  fila entre páginas; el dedupe tapa las repetidas. Pasadas las 200 filas no hay más páginas. Es un
  límite del central, fuera de este fix.
- Electron: no aplica (no toca main process).
