# Plan — errores de red en productos: stock, precios y edición (issue #390, PR 11a)

Pieza: **desktop**. Rama: `fix/productos-errores-de-red-en-stock-precios-y-edicion`, desde `origin/develop` (no
depende de #409: no toca `venta.service` ni el servicio de movimientos de stock, solo usa parámetros que ya
existen). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s),
`TIMEOUT_POR_DEFECTO_MS` (60 s). Relevamiento: auditor de solo lectura sobre `productos/` y `activos/`
(2026-10-05, leído de `origin/develop`); el ajuste de stock y el alta de precios releídos a mano. Todo va al
**central** (salvo lo indicado).

## División del bloque

**11a** (este): lo que **escribe** — ajuste de stock, precios por presentación, edición del producto y sus
códigos. **11b**: búsquedas y listados de productos (buscador compartido, lista de productos, familias, precios
especiales, proveedores). **11c**: activos (plan de cuotas, entes, formularios, listas).

## Regla (la de #391–#409)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`. Un `null` (error GraphQL) se
trata como fallo, nunca como «no hay» / 0. Un guardado sin respuesta **pudo haberse aplicado**: no se reintenta
sobre datos viejos.

## 1. Ajuste de stock (`ajustar-stock-dialog`) (fase 1) [verificado]

El diálogo guarda un movimiento con la **diferencia** (`cantidad nueva − stock actual`), no la cantidad final:
- **Base equivocada**: `cargarStockActual` hace `stock || 0`. Con un error GraphQL (`null`) el stock actual queda
  en **0** y Guardar se habilita: para dejar 50 donde hay 50 manda **+50**. El `error:` escrito (hoy inalcanzable
  por red) hace lo mismo: pone 0 y habilita.
- **Reintento duplicado**: si el guardado se aplicó y se perdió la respuesta, el reintento vuelve a calcular contra
  el stock viejo y **suma otra vez** la diferencia.
- Sin respuesta, queda cargando sin aviso.

Cambio: la consulta se hace con `PROPAGAR_ERROR_DE_RED` y error GraphQL como error (20 s; opt-in, el método tiene
otros llamadores); `stockCargado` bloquea Guardar; error o `null` → «No se pudo leer el stock actual» con
«Reintentar», nunca 0. Tras un guardado **sin respuesta** se avisa que pudo haberse aplicado y se **vuelve a leer
el stock** antes de permitir otro intento (Guardar bloqueado hasta entonces). Contador para descartar la respuesta
de otra sucursal. Sucursales: opt-in + aviso y «Reintentar».

## 2. Precios de una presentación (`adicionar-precio-dialog`) (fase 2) [verificado]

- **Dos precios principales**: al guardar uno principal se leen los existentes para bajar el principal anterior;
  con error GraphQL (`null`) no baja ninguno y guarda el nuevo: quedan **dos principales**. Sin respuesta, el modal
  «Guardando…» queda colgado. Y si bajar el anterior falla, el `catch` **guarda igual**.
- **Tipo de precio duplicado**: el chequeo «ya existe ese tipo» con `null` pasa como «no existe».
- **Guardar** (`precioService.onSave`, `onSave` genérico sin propagar): sin respuesta el modal queda colgado y el
  `error:` es inalcanzable.
- Las bajas del principal anterior van al **filial** (`servidor = false`) y el alta al central: se alinea al
  central salvo que la auditoría muestre que es intencional.

Cambio: `onGetPrecioPorSurursalPorPresentacionId` y `precioService.onSave` propagan (sus llamadores están en este
PR); error o `null` en cualquiera de las lecturas → **no se guarda**, se cierra el modal y se avisa; si no se pudo
bajar el principal anterior, **no** se guarda el nuevo. Guardado sin respuesta: aviso «pudo haberse guardado:
cerrá y revisá los precios antes de reintentar» y el diálogo se cierra indicando recargar. Tipos de precio
(`onGetAllTipoPrecios`): propagar + aviso.

## 3. Edición del producto (`producto.component`) y códigos (fase 3)

- **Cargar el producto** (`cargarProducto`, `onGetById` sin `errorConf`): sin respuesta la pantalla queda vacía y
  «Guardar» crearía un producto **nuevo** (sin id); con `null`, TypeError. Cambio: opt-in + `error:`/`null` →
  aviso, guardado bloqueado y «Reintentar».
- **Nombre duplicado** (`onProductoDescripcionExists`): con `null` el control se **saltea** y guarda; sin respuesta
  «Siguiente» no hace nada. Cambio: propagar; `null` o error = «no se pudo validar», no se guarda.
- **Presentaciones, códigos y precios de la presentación** (`getPresentacionPorProductoId`,
  `onPresentacionSelect`): flag trabado, o quedan los códigos y precios de la presentación **anterior**. Cambio:
  propagar (presentaciones con el método de diálogo que ya existe; códigos con `errorConf` nuevo), limpiar las
  tablas antes de pedir, aviso.
- **Códigos** (`adicionar-codigo-dialog`): el chequeo de código existente no responde (Guardar mudo); guardar y
  generar código dejan el modal o el flag colgados. Cambio: propagar en `codigo.service` + avisos.

Sin cambio: `ajustar-costo-dialog` (no consulta nada; su guardado ya propaga; no se le encontró ninguna pantalla que
lo abra), `onSaveProducto` (ya propaga), búsqueda de familia/subfamilia (va en 11b).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Para un issue de **central** (no se toca acá): que
el ajuste de stock reciba la cantidad final (como el ajuste por lote) y no la diferencia, para que un reintento no
sume dos veces.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(productos): no ajustar stock sobre un stock actual sin leer` | 1 |
| 2 | `fix(productos): no dejar dos precios principales ni guardar precios sin verificar` | 2 |
| 3 | `fix(productos): no guardar un producto sin cargar ni sin validar su nombre` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos: abrir el ajuste de stock de un producto (vivo: stock
real; congelado: «No se pudo leer», Guardar bloqueado; cambiar de sucursal), alta de un precio (lecturas
congeladas: no guarda), abrir un producto en edición congelado (no se puede guardar) y validar el nombre.
**No se guarda ningún ajuste ni precio** con el central congelado; con el central vivo, solo si hace falta armar un
caso en la base local.

## Riesgos y qué queda sin verificar

- El reintento duplicado del ajuste solo se cierra del todo en el central (cantidad final); acá se reduce
  releyendo el stock antes de permitir otro intento.
- Si las bajas del principal al filial son intencionales, se mantiene el destino y solo se agrega el manejo de error.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Ajuste de stock, releer no alcanza**: el corte de 60 s es del cliente; el central puede confirmar **después** de
  la relectura, y un stock que «sigue igual» habilitaría un segundo intento que duplica. Tras un guardado sin
  respuesta se guardan `stockBase` y `diferencia` y se relee: si `stock == base + diferencia` → se aplicó (éxito y
  se cierra refrescando la lista); si `stock == base` → «todavía no se ve aplicado: esperá y volvé a leer», Guardar
  **sigue bloqueado**; otro valor → aviso con los números y Guardar solo tras «Volver a leer» (parte del stock
  nuevo). «Volver a leer» y Cancelar siempre disponibles.
- **El bloqueo va dentro de `onGuardar()`**: el campo tiene `(keyup.enter)="onGuardar()"`, que no pasa por el
  `[disabled]` del botón. Al cambiar de sucursal `stockCargado = false` antes de pedir.
- **Rechazo vs incierto** (ajuste, precios, códigos): un error que llega como **array** es un rechazo del servidor
  (no se aplicó: se puede reintentar); cualquier otro es incierto. En el corte por tiempo ya avisa el link («pudo
  haberse aplicado»): el aviso propio solo si no fue corte del link. Donde el PR avisa por su cuenta,
  `graphError.show: false` para no duplicar el «Ups».
- **Precios, las bajas del principal van al central**: `precio_por_sucursal` se replica central → filial; la baja
  mandada al filial (`servidor = false`) se pierde y el central queda con dos principales: **es un bug**, se manda al
  central. El orden baja-luego-alta no es atómico: si falla el alta (o parte de las bajas) puede quedar **sin
  principal** → aviso explícito «revisá los precios de la presentación» y se recarga; el cierre real (bajar los
  demás en la misma transacción) se anota para el issue de central.
- **Recarga del padre**: `producto.component` solo recarga los precios si el diálogo cierra con un valor; tras un
  guardado incierto se cierra con un centinela para que recargue. El ajuste incierto cierra refrescando la lista.
- **Producto nuevo vs producto sin cargar**: la pantalla sirve para las dos cosas; el bloqueo usa un flag propio
  (`productoSinCargar`, solo cuando había id), no `selectedProducto == null`. `null` = «no se pudo cargar».
- **Opt-in donde hay otros llamadores**: `onGetAllTipoPrecios` (lo usa el POS), `getProducto` (dos buscadores),
  `onGetStockPorProducto` (ya tiene los parámetros). Cada consulta nueva lleva su contexto de 20 s (sin él
  `onCustomQuery` espera 300 s con el modal).
- **Chequeo de código existente** (`onGetByTexto`): con solo `networkError` un error GraphQL no emite nada: se pasa
  también `graphError.propagate`.
- **Corrección**: `ajustar-costo-dialog` **sí** se abre (menú de la lista de productos); sigue sin cambio porque no
  consulta nada y su guardado ya propaga.
- Fuera de alcance (anotado): borrar código y borrar precio desde la edición del producto, y los avisos de
  «generar código» e «imprimir».

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Releer el stock tras un guardado incierto no basta (el central puede confirmar después) | alta | comparación `base` / `base + diferencia` y bloqueo |
| A | Enter en el campo llama a `onGuardar()` sin pasar por el botón deshabilitado | alta | el bloqueo va en `onGuardar()` |
| B | Las bajas del principal al filial se pierden: no es intencional | alta | van al central |
| A | La pantalla de producto también crea: `selectedProducto == null` no distingue | alta | flag `productoSinCargar` |
| B | Baja-luego-alta puede dejar cero principales | media | aviso + recarga; cierre atómico al issue de central |
| A/B | Rechazo (array) vs incierto; aviso duplicado con el del link y el «Ups» | media | regla explícita |
| A | `onGetAllTipoPrecios` y `getProducto` tienen otros llamadores | media | opt-in |
| A | Consultas sin contexto esperan 300 s; `onGetByTexto` no emite con error GraphQL | media | contexto de 20 s; `graphError.propagate` |
| A | Los padres solo recargan si el diálogo cierra con valor | media | centinela / refresco |
| A | `ajustar-costo-dialog` sí tiene quien lo abra | baja | corregido |
| B | `null` como fallo es seguro (el central devuelve 0.0, `[]` o Boolean) | — | verificado |
| A/B | El ajuste suma la diferencia en el central; lectura y guardado van al central (sin lag de réplica) | — | verificado |
