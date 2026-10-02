# Plan — errores de red en la venta del POS (issue #390, PR 1)

Pieza: **desktop**. Rama: `fix/pdv-errores-de-red-en-venta`, desde `origin/develop` `0a142bf2`.
Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`.

## Problema

Con el filial caído o congelado, varias consultas del mostrador se quedan sin respuesta para siempre:
`onCustomQuery` no propaga el error de red si no se le pide (`networkError.propagate`) y su timeout por
defecto es 300 s. El cajero ve que «no pasa nada».

## Regla de este PR

La mayoría de estos métodos los usan también pantallas fuera del POS (inventario, transferencias,
compras, reportes) **sin `error:`**. Propagar en el servicio para todos haría que esos errores lleguen
sin manejar. Entonces:

- Si **todos** los suscriptores del método tienen `error:` → se propaga en el servicio.
- Si no → el método **acepta** `errorConf` y `contexto` opcionales (como `usuario.service` ya reenvía
  `errorConf`), y solo los llamadores del POS los pasan. El resto no cambia.
- En el POS, timeout corto con `silenciarAvisoTimeout: true` cuando el `error:` del llamador ya avisa.
- «Propagar» es **solo `networkError: { propagate: true, show: false }`**, nunca `graphError`: ante un
  error GraphQL, `onCustomQuery` sigue emitiendo `null` como hoy.

Constante nueva en `generic-crud.service.ts`, junto a `TIMEOUT_CONSULTA_DE_FONDO_MS`:
`TIMEOUT_CONSULTA_MOSTRADOR_MS = 10000` — lo que espera un cajero de pie antes de que le digan algo.

## Cambios

| # | Dónde | Suscriptores | Cambio |
|---|---|---|---|
| 1 | `lote.service.ts:89` `onGetStockPorLoteEnPresentacion` (hoy `errorConf = null`) | `seleccionar-lote-venta-dialog:244` y `:282` (POS), `transferencia/seleccionar-lotes-dialog:225` — **los tres con `error:`** | propagar en el servicio + parámetro opcional `timeoutMs` (con `silenciarAvisoTimeout`); el diálogo del POS lo pasa en **las dos** consultas (`cargarUniverso` y `cargarLotes`). Queda alcanzable `manejarErrorDeCarga` (aviso + vender por FEFO) y, de paso, el `error:` de transferencias. La salida FEFO devuelve `lotes: []`; **verificado en el filial** que `[]` y `null` son lo mismo: `VentaItemGraphQL.java:96-99` los traduce a `null` = «FEFO puro» |
| 2 | `producto.service.ts:184` `onGetProductoPorCodigo` | POS: `buscador:206`, `:276` (pesables), `pdv-search:278`; fuera del POS: inventario, movimiento-stock, transferencia, lucro-* (sin `error:`) | `errorConf?` y `contexto?` opcionales. `buscador` pasa propagate + 10 s silenciado en **las dos** consultas y agrega `error:` a cada una: `boop`, snackbar «No se pudo consultar el producto: el servidor local no responde», **el texto queda en el buscador y seleccionado** (`select()`: el próximo escaneo lo reemplaza en vez de concatenarse) y `setFocusToInput()` (hoy solo corre dentro del `next`). No abre el buscador de respaldo (consultaría al mismo servidor) |
| 3 | `producto.service.ts:188` `onSearch` | POS: `pdv-search:272`; fuera: `search-bar.service:94` | ídem opcional. **`pdv-search-producto-dialog` se abre desde ~16 pantallas** (transferencias, devolución, inventario, compras, reportes…): el cambio aplica **solo si `data.modoMostrador === true`**, marca nueva que pone únicamente el buscador del POS (`buscador.component.ts:~141`). En ese modo, **las dos** consultas del `forkJoin` (descripción y código) pasan propagate + 20 s silenciado. Además, en ese modo: (a) un contador `busquedaId` descarta respuestas de tandas viejas (cada pausa de 1 s dispara una tanda nueva y con el filial congelado se superponían); (b) si alguna consulta falló, **no se toca `dataSource.data`** (no borrar la lista buena ni simular «fin de lista» al paginar) y sale **un** aviso «No se pudo buscar: el servidor no responde», como mucho uno cada 10 s; (c) `isSearching` vuelve a `false` solo con la tanda vigente. Fuera de ese modo, nada cambia |
| 4 | `movimiento-stock.service.ts:82` `onGetStockPorProducto` | POS: `venta-touch:1865` (stock crítico post-venta), `pdv-search:662/:675`; fuera: compras, list-movimiento-stock, ajustar-stock-dialog | ídem opcional. `venta-touch` pasa propagate + 10 s silenciado: su `catchError(() => of(null))` ya existe; el `forkJoin` deja de quedar abierto. Sin aviso: es un chequeo de fondo después de la venta |
| 5 | `pdv-categoria.service.ts:64` `onGetCategorias` | solo el propio servicio: `cargarCategorias()` (constructor) y `onRefresh()` (botón «actualizar» de favoritos) | propagar en el servicio + 20 s silenciado. `cargarCategorias()` (constructor de un servicio `root`, puede correr fuera del POS o antes del login) agrega un `error:` **silencioso** (solo log): no tira un aviso en una pantalla ajena. `onRefresh()`, que dispara el cajero, agrega `error:` con aviso «No se pudieron cargar las categorías del PDV. Probá de nuevo con actualizar». Los dos: `res ?? []` (hoy `forEach` sobre `null` con un error GraphQL) |

Fuera de este PR a propósito:
- `buscarTiposPrecios()` (`venta-touch:590`): **nadie lo llama**, es código muerto. Lo listó el
  relevamiento como B; no se toca.
- Columna de stock del `pdv-search` (`onGetStockPorProductoAndSucursal`, `:620-:675`): solo queda vacía,
  sin trabar nada. Queda para el PR de productos.
- Cobro, cupones, cierre de caja, delivery: PR 2.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `TIMEOUT_CONSULTA_MOSTRADOR_MS` | `generic-crud.service.ts` | `buscador`, `seleccionar-lote-venta-dialog`, `venta-touch` (stock crítico) |
| parámetros opcionales `errorConf` / `contexto` en `onGetProductoPorCodigo`, `onSearch`, `onGetStockPorProducto` | los llamadores del POS | `onCustomQuery` |
| parámetro `timeoutMs` en `onGetStockPorLoteEnPresentacion` | `seleccionar-lote-venta-dialog` | `onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(pdv): avisar cuando el filial no responde al escanear o buscar un producto` | 2, 3 (+ constante) |
| 2 | `fix(pdv): no dejar colgado el diálogo de lotes ni el stock crítico sin filial` | 1, 4 |
| 3 | `fix(pdv): avisar cuando no cargan las categorías del pdv` | 5 |

Tests: `N/A para desktop porque el CI no corre tests y no hay batería confiable
[ev: desktop:.github/workflows/ci.yml]`. `npm run check` al final; prueba de runtime.

## Prueba de runtime

Desktop `ng serve -c web` contra el filial local `:8080`, PDV 3, Franco hace el login. Filial congelado
con `kill -STOP` y `kill -CONT` de respaldo programado.

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal: escanear/tipear un código y Enter | agrega el ítem como siempre |
| 2 | Filial congelado: código + Enter | a los ~10 s: boop + aviso; el código queda en el buscador; descongelar y Enter → agrega |
| 3 | Filial congelado: buscador de productos (F9) por descripción | a los ~20 s aviso «No se pudo buscar»; la lista no queda «buscando» |
| 4 | Producto con lotes, filial congelado al abrir el diálogo de lote | a los ~10 s: «No se pudo consultar el stock por lote. La venta se puede completar igual, por FEFO» |
| 5 | Filial normal: venta con un producto de stock bajo | notificación de stock crítico como hoy |
| 6 | Filial congelado: botón «actualizar» de favoritos | a los ~20 s aviso de categorías; descongelar y actualizar → cargan |
| 7 | Regresión fuera del POS: inventario o transferencia, buscar por código con filial normal | igual que hoy |
| 8 | Filial congelado: código + Enter, y sin esperar el aviso escanear otro | el primer aviso deja el texto seleccionado; el segundo escaneo lo reemplaza (no se concatena) |
| 9 | Filial congelado: F9, tipear en tres tandas | un solo aviso (no tres); la lista anterior no se borra |
| 10 | Filial congelado en la 2.ª consulta de un pesable (código 20…) | un aviso, sin doble boop raro ni buscador de respaldo |

Si no hay un producto con lotes a mano en el PDV 3, el caso 4 queda sin verificar.

## Riesgos y qué queda sin verificar

- **Doble Enter con el filial lento (preexistente)**: el buscador no tiene guardia de consulta en
  vuelo; dos Enter seguidos que respondan los dos agregan dos ítems. No se agrega guardia: frenaría
  escaneos legítimos rápidos (producto A y B en menos de lo que tarda la consulta). Se anota en #390.

- **Error GraphQL vs red**: con `res.errors`, `onCustomQuery` sigue emitiendo `null` → el buscador hace
  `boop` y abre el buscador de respaldo, como hoy. No cambia.
- **10 s para el escaneo**: un filial lento pero vivo (bodega cargada) puede dar el aviso y el cajero
  reintenta. Hoy espera hasta 300 s sin saber nada.
- **Categorías al arrancar**: el servicio es `root` y carga en su constructor; si el filial no responde
  en ese momento, ahora sale un aviso al iniciar. Se reintenta con el botón; no se agrega reintento
  automático.
- Diálogo de lote con el filial muerto: tiene `disableClose` y el aviso FEFO llega a los 10 s; hasta
  ahí solo se puede esperar o cancelar (no vender el ítem).
- Transferencias: el cambio 1 también hace alcanzable el `error:` de `transferencia/seleccionar-lotes-dialog`
  (hoy colgado). Es un cambio de comportamiento fuera del POS, buscado; no se prueba en runtime.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `pdv-search-producto-dialog` se abre desde ~16 pantallas; el plan le aplicaba propagate + 20 s + aviso a todas | alta | **aplicado**: solo con `data.modoMostrador === true`, que pone únicamente el buscador del POS (`servidor: false` en `buscador.component.ts:141`, verificado) |
| A | La consulta por código del `forkJoin` (`:278`) quedaba sin timeout | media | **aplicado**: las dos consultas en modo mostrador |
| A | No estaba fijado qué flag es «propagar» | media | **aplicado**: solo `networkError`, nunca `graphError` |
| A | Aviso de categorías desde el constructor de un servicio `root` | media | **aplicado**: el constructor falla en silencio; avisa solo `onRefresh()` |
| A | Opcionales al final de las firmas: sin llamadas posicionales en conflicto; mobile-pwa no comparte código | — | verificado |
| B | pdv-search: un fallo borraba la lista con `[]`, tandas superpuestas, spam de avisos | alta | **aplicado**: `busquedaId`, no tocar `dataSource` si falló, un aviso cada 10 s como mucho |
| B | buscador: el `error:` debe llamar `setFocusToInput()`; texto viejo + escaneo nuevo se concatenan; 2.ª consulta de pesables sin `error:` | media | **aplicado** (`select()`, foco, `error:` en las dos) + casos 8 y 10 |
| B | buscador: doble Enter ya duplica | media | preexistente; **no** se agrega guardia (frenaría escaneos rápidos) → Riesgos |
| B | lote: `lotes: []` vs `null` | media | **verificado en el filial**: equivalentes (`VentaItemGraphQL.java:96-99`) |
| B | lote: `cargarUniverso` también necesita el timeout | media | **aplicado** |
| B | stock crítico: sin flags ni efectos | baja | verificado |
| B | La constante va en la fase 1 y la usan las otras | baja | anotado: revertir en orden 3 → 2 → 1 |
