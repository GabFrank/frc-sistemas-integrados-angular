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
| 5 | `pdv-categoria.service.ts:64` `onGetCategorias` | solo el propio servicio: `cargarCategorias()` (constructor) y `onRefresh()` (botón «actualizar» de favoritos) | propagar en el servicio + 60 s silenciado (el tiempo por defecto del link: la consulta trae todas las categorías con sus grupos). `cargarCategorias()` (constructor de un servicio `root`, puede correr fuera del POS o antes del login) agrega un `error:` **silencioso** (solo log): no tira un aviso en una pantalla ajena. `onRefresh()`, que dispara el cajero, agrega `error:` con aviso «No se pudieron cargar las categorías del PDV. Probá de nuevo con actualizar». Con un error GraphQL (`null`) se conservan las categorías que ya había (hoy revienta en el `forEach`) |

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
| 6 | Filial congelado: botón «actualizar» de favoritos | a los ~60 s aviso de categorías; descongelar y actualizar → cargan |
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

## Auditoría del diff (paso 8, 2026-10-02)

- Fijo 1 y Fijo 2: `N/A porque el diff no agrega resolver, menú, .graphqls, migración ni entidad`.
  Condicionales A y B: ningún glob coincide.
- Fijo 3 (auditor sonnet sobre `067c1f00`): llaves y foco del buscador correctos; `busquedaId` y `fallo`
  por tanda correctos; fuera del modo mostrador el diálogo queda igual; ningún `.spec` ni constructor
  manual del diálogo; firmas sin llamadas posicionales en conflicto; los tres `error:` del lote son
  inocuos.

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Categorías: 20 s es poco para la consulta completa (todas las categorías con grupos); antes tenía 300 s | media | **aplicado**: 60 s (`TIMEOUT_POR_DEFECTO_MS`) |
| F9: borrar el texto no invalidaba la tanda en vuelo, que repoblaba la lista | baja | **aplicado**: `busquedaId++` en la rama de texto vacío |
| «Actualizar» con error GraphQL vaciaba los favoritos (antes reventaba) | baja | **aplicado**: con `null` se conservan las categorías anteriores |
| Si falla una de las dos búsquedas se descarta también la otra | baja | decidido en el plan: no se muestra un resultado parcial como si fuera completo |

## Resultado de la prueba de runtime (paso 9, 2026-10-02)

Desktop `ng serve -c web` sobre `e604cc0b`, filial `frc-filial` :8080, PDV 3, manejado con la extensión de Chrome.

| # | Resultado |
|---|---|
| 1 | ✅ `7840058000019` + Enter agrega COCA COLA 500ML y limpia el buscador |
| 2 | ✅ filial congelado: a los ~10 s (16:02:29 → 16:02:39) «No se pudo consultar el producto: el servidor local no responde»; el código queda **seleccionado** en el buscador |
| 3 | ✅ F9 con el filial congelado: a los ~20 s «No se pudo buscar: el servidor no responde»; el diálogo no queda «buscando» |
| 4 | ✅ (variante) con el diálogo de lote abierto, filial congelado y búsqueda de lote `1232`: a los ~10 s «No se pudo consultar el stock por lote. Probá de nuevo; lo que ya elegiste se mantiene.» y «Confirmar» habilitado. La rama de la **primera** carga (aviso FEFO) no se puede provocar a mano (el diálogo abre apenas responde el producto): verificada por código |
| 5 | **No verificado en runtime** (stock crítico post-venta, chequeo de fondo sin cambios visibles): verificado por código |
| 6 | ✅ «actualizar» con el filial congelado (16:17:08): el aviso «No se pudieron cargar las categorías del PDV…» sale a las 16:18:08 (60 s), registrado con un observador de snackbars. En el primer intento la captura cayó en un «Servidor Offline!!» y pareció tapado. Este PDV no tiene categorías configuradas: «cargan al actualizar» no es verificable acá |
| 7 | No se probó: los llamadores fuera del POS no cambian (sin `errorConf`); verificado por la auditoría del diff |
| 8 | ✅ con el código viejo seleccionado, escribir otro lo reemplaza (`7840058000675`), no se concatena |
| 9 | **No reproducible**: el spinner global «Cargando...» de la búsqueda (preexistente, `silentLoad` en `false`) bloquea el tipeo mientras busca, así que no se arman varias tandas |
| 10 | **No reproducible**: provocar la falla solo en la 2.ª consulta de un pesable requiere que la 1.ª responda y la 2.ª no |
| — | Regresión con el filial vivo: F9 «coca» lista resultados; el diálogo de lote carga los 5 lotes de ACTOCEF |

**Corrección:** en un primer momento se anotó que «Servidor Offline!!» (`app.component.ts:218-226`, cada
3 s) pisaba los avisos. Es falso: `app.component.ts:98-124` encola los snackbars y los muestra de a uno.
Un aviso de 4 s se ve entero, a lo sumo 1 s después. Verificado con el caso 6.
