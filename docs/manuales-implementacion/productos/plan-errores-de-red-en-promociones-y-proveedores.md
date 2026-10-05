# Plan — errores de red en promociones, producto-proveedor, envases y altas de productos (issue #390, PR 11d)

Pieza: **desktop**. Rama: `fix/productos-errores-de-red-en-promociones-proveedores-y-altas`, desde `origin/develop`
(bb2b9f90, ya con #410–#412). No depende de #413 (no toca la lista de productos ni la etiqueta; ambos tocan
`producto.service.ts` en métodos distintos: si #413 se mergea antes, se rebasa). Usa `PROPAGAR_ERROR_DE_RED`,
`ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s). Relevamiento: el del PR
11b (auditor de solo lectura sobre `productos/`, 2026-10-05) más la auditoría de ese plan; todos los archivos del
alcance releídos a mano de `origin/develop`. Todo va al **central**.

## Regla (la de #391–#413)

Un `null` (error GraphQL) es un fallo, nunca «no hay». Una lista que no se pudo leer no se muestra como vacía ni se
deja la anterior sin avisar. Un guardado sin respuesta **pudo haberse aplicado**: en un alta no se reintenta a
ciegas (duplicaría). Un aviso por flujo.

## 1. Promociones por sucursal (fase 1) [verificado]

- **Diálogo de promociones de un precio** (`precio-especial-dialog:cargar` → `onPorPrecio`, un solo llamador): sin
  `errorConf` ni `error:`. Con error del servidor `(res || [])` → **«sin promociones», 0 vigentes**, cuando puede
  haber una vigente; con error de red, la lista no carga, o queda la anterior después de guardar o cortar (la
  promoción nueva no aparece y la cortada sigue figurando). Cambio: propagar en el servicio (red y GraphQL,
  `show: false`, 20 s); estado de la lista (`cargando` / `ok` / `error`): con `error` no se afirma «sin
  promociones» — cartel «No se pudieron cargar las promociones» (o «La lista puede no reflejar el último cambio»
  si ya había filas) + «Reintentar».
- **Guardar / cortar** (`onSaveCustom`: ya propaga y avisa): tras un error que **no** es rechazo del servidor la
  operación pudo haberse aplicado → se relee la lista (hoy `error: () => {}` no hace nada). El central valida la
  superposición, así que un reintento no duplica.
- **Sucursales del diálogo y de la lista** (`onGetAllSucursales(true)` sin `errorConf`): el selector queda vacío sin
  explicación. Cambio: opt-in + aviso y «Reintentar».
- **Lista de promociones** (`list-precio-especial:onGetData` → `onFiltrar`, un solo llamador): sin `error:`; con
  `null` o error de red queda la página anterior sin aviso. Cambio: propagar en el servicio (60 s); al filtrar,
  grilla vacía + aviso; al paginar, se conserva la página a la vista y vuelve el paginador (patrón de #413);
  contador para respuestas viejas.

## 2. Buscar envase y producto-proveedor (fase 2) [verificado]

- **Buscar envase** (`search-envase-dialog` → `onEnvaseSearch`, un solo llamador): con error de red `isSearching`
  queda en `true` y la lista anterior a la vista; con `null`, `dataSource.data = null` o una fila nula al «cargar
  más». Cambio: propagar en el servicio (red y GraphQL, 20 s); primera página fallida → lista vacía + aviso;
  «cargar más» fallido → se conserva; contador para descartar respuestas de un texto anterior.
- **Productos de un proveedor** (`gestion-productos-proveedor-dialog:loadList` → `getByProveedorId`, que ya acepta
  `errorConf`; su otro llamador es compras y ya lo pasa) y **proveedores de un producto**
  (`gestion-proveedores-producto-dialog:loadList` → `getByProductoId`, un solo llamador, sin `errorConf`): el
  `error:` existe pero es inalcanzable → `loading` para siempre; con `null`, «sin productos/proveedores
  vinculados». Cambio: `errorConf` (se agrega el parámetro a `getByProductoId`) con red y GraphQL propagados, 20 s;
  `error:` → cartel «No se pudo cargar» + «Reintentar» en vez de la tabla vacía. Tras vincular o desvincular con
  la relectura fallida, el cartel dice que la lista puede no reflejar el cambio.

## 3. Altas de familia, subfamilia y presentación (fase 3) [verificado]

- **Familia** (`add-familia-dialog` → `onSaveFamilia` → `onSave` genérico): con error de red no avisa nada (el
  genérico se lo traga) y el diálogo queda abierto sin que el usuario sepa si guardó; con error del servidor, el
  `subscribe` sin `error:` deja una excepción sin capturar. Sin guarda contra doble «Guardar».
- **Subfamilia** (`add-subfamilia-dialog` → `onSaveSubfamilia`): el servicio envuelve en un `Observable` con un
  `subscribe` interno sin `error:` → ante cualquier error no emite ni completa. Además **posición**:
  `onCountSubfamilia` sin `error:`; si falla, la subfamilia nueva se guarda con posición 1.
- **Presentación** (`adicionar-presentacion`): `onSavePresentacion` (`onCustomMutation`, ya propaga) sin `error:` →
  excepción sin capturar y sin aviso por red; los **tipos de presentación** (`onGetPresentaciones`, un solo
  llamador) no cargan y el select requerido queda vacío sin explicación.

Cambio común (los tres diálogos):
- `onSaveFamilia` y `onSaveSubfamilia` propagan el error de red (el segundo se reescribe con `pipe(tap(...))`
  manteniendo la recarga de las listas en memoria); flag `guardando` contra el doble clic.
- **Rechazo del servidor** (error en array; el servicio ya avisa): el diálogo queda abierto y se puede reintentar.
- **Sin respuesta en una edición** (hay id): aviso «no se pudo confirmar»; reintentar es inocuo (mismo id).
- **Sin respuesta en un alta**: reintentar duplicaría. El diálogo **verifica solo** si se guardó, releyendo por
  nombre (familia: `onSearchFamilia`; subfamilia: `onSearchSubfamilia` dentro de la familia; presentación: las
  presentaciones del producto, por descripción + cantidad + tipo). Si la encuentra → cierra devolviéndola (quien
  abrió el diálogo sigue como en un guardado normal); si no está → «No se guardó: podés reintentar»; si la
  verificación tampoco responde → Guardar queda bloqueado con «Verificar» y el aviso de que pudo haberse guardado.
- **Posición de la subfamilia**: `onCountSubfamilia` propaga; si falla, en el **alta** Guardar queda bloqueado con
  cartel y «Reintentar» (la edición no usa el conteo y no se bloquea).
- **Tipos de presentación**: opt-in + cartel y «Reintentar».

Sin cambio: los guardados de promociones y de producto-proveedor (ya propagan y avisan), `desvincular` (ya tiene
`error:`), `onBuscarProveedor` (servicio de personas, va con ese módulo), `seleccionar-presentacion-dialog` (nadie
lo abre), `familiaBS` / `subfamiliaBS` del constructor de los servicios (van con gráficos / reportes),
`add-familia-dialog` nunca carga las posiciones (toda familia nueva queda en posición 1: bug previo, no es de red),
`edit-producto/producto.component` (ya cubierto en #410; no se toca).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(productos): no mostrar 'sin promociones' cuando no se pudieron leer` | 1 |
| 2 | `fix(productos): no dejar trabados el buscador de envases ni producto-proveedor sin respuesta` | 2 |
| 3 | `fix(productos): no duplicar ni perder el alta de familia, subfamilia o presentacion sin respuesta` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos:
1. Promociones de un precio y lista de promociones, vivo y congelado (cartel, sin «sin promociones»; paginar
   conserva); con el central vivo se puede crear y cortar una promoción **en la base local** para ver la relectura.
2. Buscar envase congelado (primera página y «cargar más»); productos de un proveedor y proveedores de un producto
   congelado (cartel + Reintentar, sin «sin vinculados»).
3. Altas: **no se guarda nada con el central congelado**. El guardado sin respuesta se prueba reemplazando la
   mutation por un error, con el central vivo: (a) la entidad ya existe (creada antes en la base local) → la
   verificación la encuentra y cierra; (b) no existe → permite reintentar; (c) verificación sin respuesta →
   bloqueado con «Verificar». Posición de subfamilia y tipos de presentación congelados.

## Riesgos y qué queda sin verificar

- La verificación por nombre de un alta puede encontrar una entidad **preexistente** con el mismo nombre (familias
  y subfamilias no tienen unicidad por nombre): se devolvería esa. Se acota comparando nombre exacto (y familia,
  para subfamilias) y, si hay más de una coincidencia, no se elige: se avisa y queda «Verificar».
- El PR toca ~9 componentes; si supera lo razonable se parte en lecturas (fases 1–2) y altas (fase 3).
- `onSave` genérico (se traga el error de red para todos sus llamadores sin `errorConf`) no se toca: PR propio.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### División: este PR son las lecturas (fases 1 y 2); las altas van aparte

| PR | Alcance | Plan |
|---|---|---|
| **11d** (este) | Promociones por sucursal, buscar envase, producto-proveedor | este documento, fases 1 y 2 |
| 11e | Altas de familia, subfamilia y presentación (la sección 3) | propio |
| 11f | Activos | propio |

Rama de este PR: `fix/productos-errores-de-red-en-promociones-y-proveedores`. La sección 3 queda como insumo del
plan 11e, con estas correcciones ya anotadas para entonces:
- **Familia tiene unicidad por nombre** en la base (`familia_unique`) y el central responde «Ya existe una familia
  con ese nombre»: reintentar un alta de familia es seguro y **no necesita verificación**. Subfamilia y presentación
  no tienen unicidad.
- **Nunca afirmar «no se guardó»** tras un alta sin respuesta: el corte es del cliente y el central puede confirmar
  después. Variante simple: Guardar deshabilitado, aviso persistente y «Verificar» solo informativo (si encuentra
  exactamente una igual, lo dice y cierra con ella; si no, sigue bloqueado y se pide cerrar y revisar).
- La búsqueda de subfamilias es `like`, paginada y ordenada por id: la nueva queda al final; pedir tamaño grande y
  comparar el nombre exacto en el cliente. La presentación puede tener descripción nula (el servicio la reemplaza
  por la cantidad).
- **La posición no se usa para ordenar en ningún lado**: no se bloquea el alta de subfamilia por el conteo.
- Un error con el mensaje «Respuesta vacía del servidor» llega como array pero es un **sin respuesta**, no un
  rechazo: helper `esRechazoDelServidor`.
- Sin verificar: `onEditSubfamilia` no manda `familiaId` (la edición de subfamilia podría fallar hoy).

### Promociones
- **Releer siempre** tras un error de guardar o cortar (no solo si «no es rechazo»): es barato e idempotente, y
  aclara el caso «el reintento dice que ya existe» = el primero sí se guardó.
- **Orden de las lecturas**: `cargar()` se llama al abrir, tras guardar y tras cortar sin protección → contador
  para que una respuesta vieja no pise a la nueva. `onPorPrecio` pasa a silencioso (hoy abre el modal «Buscando…»);
  el estado lo muestra el propio diálogo.
- **Con error y filas previas** se conservan las filas con el cartel «puede no reflejar el último cambio»; el
  conteo «N vigentes de M» se oculta mientras el estado sea `error`. Sin filas, solo el cartel.
- **Sucursales sin cargar**: hoy, con «Todas» elegido, `ids()` da `[]` y Guardar retorna en silencio. Con el fallo
  se deshabilitan el selector y «Agregar» y se muestra el cartel con «Reintentar». La lista de promociones sin
  leer **no** bloquea el alta (el central valida la superposición): solo avisa.
- **Lista general**: `handlePageEvent` pisa `pageIndex` / `pageSize` antes de consultar → se guarda la página
  mostrada en cada respuesta buena y se restaura (también en el paginador) si falla un cambio de página, conservando
  filas y total. Si falla un filtro nuevo: grilla vacía y `selectedPageInfo = null`. `onCortar` también relee.
- Precisión: con `null` la lista de promociones ya mostraba el «Ups» del servicio (no era «sin aviso»); con el
  cambio avisa la pantalla, una vez.

### Buscar envase
- Precisión: la tabla está bajo `*ngIf="!isSearching"`: con error de red hoy gira el spinner para siempre (no queda
  «la lista anterior a la vista»). `onEnvaseSearch` vive en `producto.service.ts`.

### Producto-proveedor (los dos diálogos)
- Estado `error` **separado de la lista vacía**: el HTML muestra «No hay … vinculados» cuando la tabla está vacía y
  no carga; con error se muestra el cartel con «Reintentar».
- En error **no se toca `totalElements`** (hoy quedaría en 0 y el paginador colapsa); se restaura la página
  mostrada si falló un cambio de página; `loading = false`; contador contra respuestas viejas (`loadList` se llama
  al abrir, al paginar y tras vincular o desvincular).
- **Releer también en el `error:` de vincular y de desvincular**: pudo haberse aplicado, y un reintento que
  responde «ya vinculado» deja la lista sin refrescar.

### Fases de este PR

| Fase | Commit |
|---|---|
| 1 | `fix(productos): no mostrar 'sin promociones' cuando no se pudieron leer` |
| 2 | `fix(productos): no dejar trabados el buscador de envases ni producto-proveedor sin respuesta` |

### Prueba de runtime de este PR

Los casos 1 y 2 de arriba. En la base **local**, con el central vivo, se crea y se corta una promoción de prueba
para ver la relectura; con el central congelado no se guarda nada (el error de guardado se simula).

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | «Error en array = rechazo» es falso para «Respuesta vacía del servidor» | alta | promociones: releer siempre; altas: helper (plan 11e) |
| B | La verificación por nombre no puede afirmar «no se guardó»; la búsqueda pagina y ordena por id | alta | pasa al plan 11e con la variante simple |
| A | Familia sí tiene unicidad por nombre | alta | corregido; sin verificación para familia |
| B | El PR era demasiado grande | media | lecturas acá, altas en 11e |
| B | `cargar()` de promociones sin orden; conteo de vigentes con datos viejos; modal global | media | contador, conteo oculto en error, silencioso |
| B | Sucursales sin cargar dejan «Agregar» mudo | media | selector y botón deshabilitados + cartel |
| B | Paginado de la lista de promociones y de producto-proveedor: qué restaurar; `totalElements` en 0 | media | regla explícita |
| B | Producto-proveedor: «sin vinculados» con la tabla vacía por error; no relee tras error de vincular | media | estado propio; relectura |
| A | La posición de subfamilia no ordena nada; el conteo es global | media | no se bloquea (plan 11e) |
| A | Redacción: envases (spinner eterno), promociones (ya había «Ups») | baja | corregida |
| A/B | Llamadores únicos de cada método, `getByProveedorId` de compras ya propaga, `preciosEspecialesPorPrecio` nunca `null`, crear promoción valida superposición, editar/cortar y vincular idempotentes | — | verificado |

## Implementación: desvíos

- **Cartel de la lista de promociones (pantalla general)**: además del aviso, un cartel con «Reintentar» sobre la
  grilla cuando falló un filtro (la grilla vacía no significa «sin promociones»).
- **Producto-proveedor**: el cartel distingue «No se pudo cargar la lista» (nunca cargó) de «puede no reflejar el
  último cambio» (había filas).
- **Buscar envase**: conserva el modal «Buscando…» del servicio (se cierra solo con el error propagado).

## Prueba de runtime (2026-10-05)

Central local `:8081` sin perfil (replicación apagada; los dos schedulers en *Did not match*), `ng serve -c web`,
congelado con `kill -STOP` + respaldo `kill -CONT`.

| Caso | Resultado |
|---|---|
| Promociones de un precio, vivo: crear una (COCA COLA 2LTS, suc. 3, Gs. 15.000, base local) | aparece, «1 vigente de 1» |
| Ídem, congelado con filas a la vista | filas conservadas, conteo oculto, «La lista puede no reflejar el último cambio» + Reintentar, sin modal |
| Abrir el diálogo congelado | «No se pudieron cargar las promociones de este precio»; sin «Todavía ninguna sucursal…»; sucursales con aviso y «Agregar» deshabilitado |
| Lista de promociones, congelado / al reanudar | cartel + Reintentar / carga las 23 |
| Lista: paginado y filtro con error simulado | paginado conserva página y total; filtro vacía con cartel |
| Cortar con error simulado / cortar de verdad (la promoción de prueba) | relee igual / sale de las vigentes (22) |
| Buscar envase, congelado | aviso, deja de girar, lista vacía |
| Proveedores de un producto, congelado | cartel + Reintentar en vez de «No hay proveedores vinculados» |
| Productos de un proveedor, error simulado al paginar | filas, total y página conservados; Reintentar recupera |

En la base local quedó la promoción de prueba (id 27) cortada.
