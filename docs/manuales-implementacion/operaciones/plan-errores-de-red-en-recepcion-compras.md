# Plan — errores de red en recepción de compras (issue #390, PR 7b)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-recepcion`, desde `origin/develop` **después del merge
de #401** (usa lo que #401 cambió en `pedido.service`: `onGetPedidoById` y otros ya propagan, y los llamadores de
recepción reciben errores que hoy no les llegaban). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`,
`TIMEOUT_CONSULTA_DE_FONDO_MS`, `TIMEOUT_POR_DEFECTO_MS`. Relevamiento: auditor de solo lectura sobre recepción de
mercadería, notas de recepción y sus diálogos (2026-10-03), cada suscriptor leído; los puntos A1, A2, A3 y A7
releídos a mano. Todo va al **central**. Solicitud de pago queda para 7c.

## Regla (la de #391–#401)

«Propagar» = `networkError`, siempre con contexto explícito y `silenciarAvisoTimeout: true`: 20 s para cotización,
lotes, presentaciones y verificaciones dentro de un diálogo; 60 s para cargas de pantalla. Un `error:` que hoy es
inalcanzable y **escribe un valor inventado** (cotización 1, `[]` como «sin distribuciones», lotes vacíos) se
reescribe **antes** de volverlo alcanzable: aborta o bloquea con aviso, nunca guarda el fallback. Un `null` (error
GraphQL) se trata como fallo donde importa.

## 1. Plata y datos escritos (fase 1)

- **A1 · Cotización de una nota nueva** (`add-edit-nota-recepcion:283`, `loadCotizacionFromCambio`): sin respuesta
  la nota queda con la cotización **1** que el formulario puso por defecto (`:385-391`, validador `min(0)`) y se
  puede guardar una nota en dólares a 1. Cambio: `getUltimoCambioPorMonedaId` recibe `errorConf?`/`contexto?`
  (opt-in: tiene 5 llamadores fuera de #390); con error o `null` → aviso «No se pudo obtener la cotización:
  ingresala a mano» y la cotización queda **vacía**; al guardar una nota en moneda extranjera se exige cotización
  > 1 (ninguna moneda extranjera cotiza 1 contra el guaraní), con aviso. Si el pedido trae cotización fijada no se
  consulta (`:295-305`, sin cambio).
- **A2 · Cotización de la nota que crea el rechazo** (`rechazar-item-dialog:423`): con error de red `isLoading`
  queda trabado; con error GraphQL **hoy** guarda la nota con cotización 1 (`?? 1`), y el `error:` escrito
  (`cotizacion = 1` y guarda) sería lo mismo. Cambio: opt-in (20 s); error o `null` → **no** se crea la nota,
  `isLoading = false`, aviso «No se pudo obtener la cotización: el rechazo no se registró. Intentá de nuevo.».
  Además el fallback de moneda `{ denominacion: 'Guaraní' }` (`:416`) no coincide con `'GUARANI'` y consultaría la
  cotización de la moneda 1: se corrige la comparación.
- **A3 · Distribuciones del ítem a rechazar** (`rechazar-item-dialog:613`): sin respuesta `tieneDistribuciones`
  queda `false` y Guardar procede sin confirmar ni rechazar las distribuciones; el `error:` escrito pone `[]`/`false`.
  Cambio: `onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId` propaga en el servicio (6 llamadores, todos
  en este PR, todos con `error:` o reciben uno); en este diálogo, error o `null` → flag `distribucionesFallo` que
  **bloquea Guardar** con aviso y «Reintentar»; mientras cargan, Guardar también espera.
- **A4/A5 · Recepción: verificar y rechazar** (`recepcion:900, 1606, 1726, 1899`): mismo método. Con red el click
  se pierde sin aviso; con `null` TypeError (`:1913`). Los `error:` existentes ya avisan (el de `:2036` dice
  «Rechazo registrado, pero…» y actualiza la fila): se vuelven alcanzables; `null` tratado como error.
- **A6 · Lotes al verificar un ítem** (`recepcion-mercaderia-verificar-item-dialog:221`, dentro de un `forkJoin`):
  hoy el diálogo no inicializa nunca; si se propagara, el `catchError(of([]))` haría que un lote existente no
  autocompletara sus fechas ni avisara que no está liberado. Cambio: `lote.onGetLotesPorProducto` opt-in (20 s; su
  otro llamador, `lotes-producto-dialog`, no cambia); error → aviso y el diálogo **se cierra** sin verificar
  (no se degrada en silencio). Las presentaciones del mismo `forkJoin` mantienen su fallback
  `[item.presentacionEnNota]` (coherente), ahora alcanzable con opt-in.
- **A7 · Nota duplicada** (`add-edit-nota-recepcion:1579`, `validarNotaDuplicada`, `await` dentro de `onSave`): con
  red `onSave` queda colgado sin spinner (se puede reclicar); si se propagara, el `catch` devuelve `true` (guarda sin
  verificar). Cambio: `onBuscarNotasPorProveedorYNumero` propaga (60 s; un solo llamador); error o `null` →
  confirmación explícita «No se pudo verificar si la nota está duplicada. ¿Guardar igual?» (mismo estilo que el
  aviso de duplicado, que también deja continuar), y un flag evita el doble clic mientras se verifica.

## 2. Pantalla de recepción (fase 2)

- **B1 · Sucursales** (`recepcion:484`, `onGetSucursalesDisponiblesRecepcionFisica`, un llamador): sin respuesta
  los 4 controles quedan deshabilitados para siempre; con `null` TypeError; el `error:` escrito habilita con `[]` y
  la pantalla dice «No hay ítems…». Cambio: propagar (60 s); error o `null` → aviso + «Reintentar», controles
  deshabilitados (no «sin ítems»).
- **B2 · Notas** (`recepcion:808`, `onGetNotaRecepcionPorPedidoId`, un llamador): `loadingNotas` trabado; `null`
  → TypeError. Propagar + aviso + guarda de `null`.
- **B3/B4 · Ítems de la nota** (`recepcion:616` y `:2677` «Recepcionar todo»,
  `onGetNotaRecepcionItemListPorNotaRecepcionIdYSucursales`): `loadingItems` trabado y, al cambiar de nota, **siguen
  a la vista los ítems de la nota anterior** con la nueva seleccionada (se podría verificar un ítem de otra nota).
  Cambio: propagar; al pedir una nota se **vacía** la tabla antes de consultar; error → aviso + «Reintentar»,
  `itemsTotalElements = 0`; contador para descartar la respuesta de una nota elegida antes. `:2677` ya avisa.
- **B5 · Recargas del pedido** (`recepcion:978, 1078, 2458, 2852, 2924`, ya propagan desde #401, `error:`
  silenciosos): el estado de la etapa queda viejo y «Finalizar recepción física» puede quedar mal habilitado. Cambio:
  aviso «La acción se registró, pero no se pudo recargar el pedido» y `etapaEstadoComputed = null` (deshabilita
  el botón, fail-safe); con `null` no se pisa `this.pedido`.

## 3. Diálogos (fase 3)

- **B6 · Presentaciones** (`onGetPresentacionesPorProductoId`, ya acepta `errorConf`): `rechazar-item:173`,
  `dividir-item:122`, `edit-nota-recepcion-item:407, :760`, `recepcion-…-verificar:208`, `recepcion-…-rechazar:111`
  → opt-in (20 s) + aviso. En `edit-nota-recepcion-item` se agrega `error:` y la guarda de `null` (`null.find`). En
  ninguno hay riesgo de «factor 1»: `presentacionId` es `required` o el fallback es la presentación de la nota.
- **B7 · Monedas de la nota** (`add-edit-nota-recepcion:221`, `onGetAll` genérico): `loadingMonedas` trabado →
  `timeout` + `catchError` con aviso (patrón de #397, sin tocar el genérico).
- **B8 · Ítems de la nota en el diálogo** (`:403, :1470, :1541`, `onGetNotaRecepcionItemListPorNotaRecepcionId`, un
  solo llamador): propagar; en las recargas tras crear/asignar el error **conserva** la tabla y avisa (hoy la
  vaciaría); `null` tratado igual. Si falla la recarga, la asignación automática no se saltea en silencio: se avisa.
- **B9 · Distribuir desde la nota** (`:948`): mismo método de A3; su `error:` ya avisa y el diálogo solo abre con
  datos.

Sin cambio: `add-edit-nota-proveedor` (todo comentado), `devoluciones-pendientes`, `select-sucursales`,
`verificacion-rapida-sucursales` (sin queries), `distribute-item` y `distribute-nota-recepcion-item` (solo
mutaciones), `onGetEtapaActual` (ya corta a 60 s desde #401), `onGetNotaRecepcionById` (su llamador es de
solicitud de pago: 7c).

## Fuera de alcance (observación)

`distribute-nota-recepcion-item-dialog:~690-745` llama a `onReplaceNotaRecepcionItemDistribuciones(id, [])` en
paralelo con el guardado y `checkCompletion` cuenta ramas `else`: posible carrera que vacíe lo recién guardado. Es
de mutaciones, no de #390; se reporta en un issue aparte tras verificar la semántica del backend.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no guardar notas de recepcion con cotizacion o datos sin cargar` | A1–A7 |
| 2 | `fix(operaciones): avisar cuando no carga la pantalla de recepcion de mercaderia` | B1–B5 |
| 3 | `fix(operaciones): avisar cuando no cargan los dialogos de notas de recepcion` | B6–B9 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. El pedido 4 está en recepción de notas: sirve para la pantalla
de notas y sus diálogos. Casos: abrir/editar una nota (monedas, ítems, cotización en moneda extranjera), guardar
con la verificación de duplicado sin respuesta (confirmación; se responde **Cancelar**), rechazar un ítem
(distribuciones y cotización: no se registra), pantalla de recepción física (sucursales, notas, ítems, cambio de
nota), verificar un ítem (lotes). **No se guarda nada con el central congelado.** Si la pantalla de recepción física
necesita un pedido en esa etapa, se arma con el central vivo (la base local puede crear datos). Casos `null`:
verificados por código.

## Riesgos y qué queda sin verificar

- Con el central lento, rechazar un ítem o verificar con lotes queda bloqueado hasta que respondan (hoy se colgaba
  o guardaba con datos inventados).
- La exigencia de cotización > 1 en moneda extranjera bloquea una nota cargada a mano con 1 (siempre errónea).
- Efecto en backend de re-guardar distribuciones (A3): sin verificar; el cambio solo evita saltearlo.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Firmas** (parámetros finales opcionales `errorConf?`/`contexto?`): opt-in en `cambio.getUltimoCambioPorMonedaId`
  (5 llamadores fuera de #390) y `lote.onGetLotesPorProducto` (`lotes-producto-dialog` no cambia). En
  `pedido.service`, con todos sus llamadores en este PR, se propaga en el servicio:
  `onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId`, `onGetNotaRecepcionPorPedidoId`,
  `onGetNotaRecepcionItemListPorNotaRecepcionId`, `…PorNotaRecepcionIdYSucursales`, `onBuscarNotasPorProveedorYNumero`,
  `onGetSucursalesDisponiblesRecepcionFisica`. Las citas de línea se anclan por símbolo al implementar.
- **A1 · guarda de guaraní** (`loadCotizacionFromCambio`): compara la denominación del **pedido**, no la de la
  moneda elegida: pedido en Gs y nota cambiada a USD queda con cotización 1 sin consultar (determinista, sin fallo
  de red). Se corrige para mirar la moneda elegida. Una respuesta tardía de una moneda elegida antes no pisa la
  actual (se compara con la moneda del formulario antes de escribir). Con error o `null`: aviso y cotización vacía.
- **A1 · regla cotización > 1**: solo al crear una nota o cuando el usuario cambió moneda o cotización; una nota
  vieja guardada en moneda extranjera con 1 se puede seguir editando (fecha, número) sin que la bloquee.
- **A2**: además del error y el `null`, `pedido.moneda` ausente → no se crea la nota (aviso), en vez de inventar
  `{ id: 1, 'Guaraní' }`. Se elimina ese fallback (corrige de paso la comparación con `'GUARANI'`).
- **A3**: una sola propiedad calculada «puede guardar» (formulario + `isLoading` + cargando/fallo de
  distribuciones); «Reintentar» limpia el flag.
- **A6**: el `catchError(of([]))` actual es una decisión explícita («un fallo acá no puede frenar la
  verificación»): se reemplaza y se actualiza el comentario. El cierre con aviso pasa en `ngOnInit`, antes de que se
  tipee nada; el aviso nombra el producto e indica reintentar.
- **A7**: el flag anti doble clic va al **inicio de `onSave`** (también lo llama un atajo de teclado) y se baja en
  todas las salidas; `savingNota` hoy se activa recién después del `await`.
- **B2**: el `error:` de notas ya baja `loadingNotas`; falta el aviso y la guarda de `null` (corregida la redacción).
- **B3/B4**: «Recepcionar todo» fija la nota al iniciar y descarta la respuesta si la selección cambió.
- **B5**: además de `etapaEstadoComputed = null`, el aviso remite a «Actualizar»/volver a entrar para recuperar.
- **Avisos al caer la red**: cada carga avisa por su cuenta (pueden apilarse 3-5); aceptado, como en #397/#399.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Guarda de guaraní de la cotización mira la moneda del pedido, no la elegida | media | corregida en A1 |
| A | Firmas sin `errorConf`/`contexto` no listadas | media | listadas; propagar en servicio vs opt-in |
| A | El `catchError(of([]))` de lotes es una decisión explícita | media | se reemplaza y se actualiza el comentario |
| B | Cotización > 1 bloquearía editar notas viejas con 1 | media | solo al crear o al cambiar moneda/cotización |
| B | Respuesta tardía de cotización pisa la moneda nueva | media | se compara con la moneda actual |
| B | Fallback de moneda inventada en el rechazo | media | sin moneda del pedido no se crea la nota |
| B | Doble clic en Guardar durante la verificación de duplicado | media | flag al inicio de `onSave` |
| B | «Recepcionar todo» con cambio de nota en vuelo | media | nota fijada al iniciar |
| A | Línea de A2 y redacción de B2 | baja | corregidas / ancladas por símbolo |
| B | Estado compuesto del botón en rechazar | baja | propiedad calculada única |
| B | Recuperación tras fallo de recarga de etapa | baja | aviso remite a «Actualizar» |
| B | Avisos apilados con la red caída | baja | aceptado |
| A/B | Llamadores de cada método, otros llamadores de cotización y lotes, `null` de duplicados, carrera de `distribute-nota-recepcion-item` fuera de alcance | — | verificado |

## Implementación: desvíos respecto del plan (2026-10-03)

- **Presentaciones**: un método nuevo `presentacion.onGetPresentacionesPorProductoIdParaDialogo` (20 s, propaga el
  error de red) en vez de repetir `errorConf`/contexto en cada diálogo.
- **Distribuciones en recepción**: los 4 llamadores pasan por `distribucionesDelItem$`, que manda el `null` al
  `error:` existente (antes TypeError).
- **Recargas del pedido**: las 5 se centralizan en `recargarPedidoYEtapa(trasAccion)`; la de la carga inicial
  avisa «No se pudo cargar el estado del pedido» (no «la acción se registró»). Con el fallo no se llama a
  `loadEtapaActual`: el estado saldría del `@Input pedido`, que puede venir viejo.
- **Notas de la pantalla de recepción**: además del aviso, «No se pudieron cargar las notas» con «Reintentar» (en
  vez de «No hay notas»), detectado en la prueba de runtime.
- **Verificación de duplicado**: 20 s (consulta dentro de un diálogo), no 60.

## Prueba de runtime (paso 9, 2026-10-03)

Central local `:8081` (worktree de pruebas, sin perfil, `ReplicationPublicationSyncScheduler` y
`ReplicationRefreshScheduler` en *Did not match*), congelado con `kill -STOP` + respaldo `kill -CONT`; desktop
`ng serve -c web`; pedido 4 (recepción de notas, nota 6). No se guardó nada.

| Caso | Resultado |
|---|---|
| Nota nueva, pedido en Gs, cambio a DOLAR (central vivo) | consulta y trae 5880 (antes quedaba en 1 sin consultar) |
| Cambio a REAL congelado | a los 20 s aviso «ingresala a mano», cotización vacía, formulario inválido |
| Guardar con la verificación de duplicado sin respuesta (dos `onSave` seguidos) | una sola confirmación «No se pudo verificar la nota… ¿Guardar igual?»; **Cancelar** → no se creó nota, flag liberado |
| Rechazar el ítem 5 de la nota 6 | Guardar deshabilitado mientras carga; a los 20 s `distribucionesFallo`, avisos de presentaciones y distribuciones, «Reintentar distribuciones» |
| Distribuir desde la nota | aviso, no se abre el diálogo |
| Pantalla de recepción física (habilitada por código en el pedido 4) | sucursales: banner con «Reintentar», controles deshabilitados; avisos de notas y de estado del pedido; «Finalizar Recepción Física» deshabilitado |
| Reanudar: «Reintentar» sucursales, notas, elegir la nota 6 | 1 sucursal, controles habilitados, 1 ítem |
| Congelado: elegir otra nota | la tabla se vacía al instante; a los 60 s «Reintentar» (no «No hay ítems») |
| «Recepcionar todo» congelado | aviso «No se recepcionó nada», sin confirmación ni recepción |

No probado en runtime: verificar un ítem con control de lote (el producto del pedido 4 no lleva lote) — por
código. Casos `null` (error GraphQL): por código.

## Auditoría del diff (paso 8, 2026-10-03)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Con las sucursales caídas se podía elegir una nota y verla «sin ítems» | media | elegir una nota pide reintentar las sucursales primero |
| La carga inicial con el pedido fallido deja la etapa sin cargar hasta volver a entrar | media | aceptado (fail-safe: «Finalizar» deshabilitado); el aviso dice «volvé a entrar» |
| Verificación de duplicado a 20 s y sin spinner | baja | aceptado: el resultado es la confirmación, que es segura |
| Edición de nota con `null` en ítems muestra tabla vacía | baja | aceptado: el servicio ya avisa «Ups» |
| Aviso de cotización aunque el usuario ya tipeó una | baja | solo avisa cuando la vacía |
| Rechazo con presentaciones `null` sin reintento; doble clic en «Recepcionar todo» (previo) | baja | aceptado |
| Suscriptores de todo lo que propaga, `null`, fallbacks, cotización, `onSave`, rechazo, recepción, verificar ítem | — | verificado sin hallazgos |
