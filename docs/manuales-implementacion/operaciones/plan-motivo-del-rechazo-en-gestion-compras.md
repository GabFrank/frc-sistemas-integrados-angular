# Plan — motivo del rechazo en gestión de compras (issue #488, tanda 2)

Rama `fix/compras-motivo-rechazo`, sale de `fix/generics-motivo-rechazo-llamadores` (PR #496) porque usa
`avisoTrasMutacion`. Cuando #496 se mergee, se rebasea sobre `develop` y recién ahí se abre el PR (hacia `develop`).

Alcance elegido por Franco (2026-10-14): la regla de #488 en las 42 escrituras del módulo de compras (salvo
recepción de mercadería, tanda 1) **más 3 fallas graves** que aparecieron en el inventario. El resto de lo encontrado
va a issues aparte (ver «Fuera de alcance»).

## Qué pasa hoy

Todas las escrituras de `pedido.service`, `solicitud-pago.service` y `cambio.service` usan
`onCustomMutation(gql, data)` sin `silentLoad`. En un **rechazo** el genérico ya avisa «Ups! Algo salió mal:
<motivo>» y emite un arreglo; el componente suma después su propio `openAlgoSalioMal('Error al …')` (segundo aviso,
genérico, que no aporta) y en 5 casos lee `error.message` del arreglo («[object Object]» en GC 981/1007/1037, «Error
desconocido» en GC 4100, fallback en GC 3492). En un **corte de red** el genérico no avisa: el componente dice «Error
al …» como si no se hubiera aplicado, no recarga, y repetir puede duplicar (las altas sin id del central crean otra
fila, y `savePedidoFull`, `saveNotaRecepcion` y `saveNotaRecepcionItem` no tienen transacción común).

Tres escrituras no pasan por el genérico (`apollo.mutate` a mano): `asignarItemsANota` (diálogo de nota :1582 y GC
3824) y `desvincularProductoProveedor` (GC 4914). Ahí nadie muestra el motivo del rechazo.

## Hechos del central (`origin/develop`) que sostienen la regla

| Mutation | Transacción | Repetir |
|---|---|---|
| `savePedidoFull` | **no común** (save + fechas + sucursales + etapas por separado) | sin id **duplica** el pedido |
| `savePedidoItem`, `saveNotaRecepcionItemDistribucion` | una | sin id **duplica** |
| `saveNotaRecepcion` | **no común** (save + asignar ítems) | sin id **duplica** la nota |
| `saveNotaRecepcionItem`, `deleteNotaRecepcionItem` | **no común** | alta sin id **duplica** ítem y distribuciones |
| `deletePedidoItem`, `deleteNotaRecepcion` | `deleteById` | repetir da `false`; un fallo por FK también da `false` sin mensaje |
| `mergePedidoItemDistribuciones`, `replaceNotaRecepcionItemDistribuciones` | atómica | idempotente |
| `finalizarCreacionPedido`, `revertirEtapaCreacion`, `deletePedido` (cancelar), `finalizarRecepcionNotas`, `actualizarEstadoSolicitudPago`, `cancelarSolicitudPago` | atómica | repetir **falla con mensaje**, no re-aplica |

## Regla (la misma de la tanda 1)

- **Rechazo** (`erroresDeRechazo(error) != null`): el componente no suma aviso; queda el del genérico con el motivo.
  Si la operación era una de varias (forkJoin / Promise.all / cadena), se agrega «Algunas operaciones pudieron
  haberse aplicado: se recarga …» y se recarga.
- **Corte** (lo demás): `avisoTrasMutacion(error, '<qué>')` (null en el timeout del link, que ya avisó) y recarga
  **a los 5 s** de lo que el camino feliz recarga.
- Los diálogos que hoy quedan abiertos tras un fallo **siguen abiertos** (en un rechazo el usuario corrige y
  reintenta). En un corte se agrega el aviso; donde reintentar duplica, el diálogo queda en un estado que no duplica
  (ver cada caso).
- **Mutations a mano** (`asignarItemsANota`, `desvincularProductoProveedor`): no hay aviso del genérico, así que en un
  rechazo el componente muestra el motivo. Helper nuevo `motivoDelRechazo(error): string | null` en
  `graphqlErrorUtils.ts` (primer mensaje limpio de `erroresDeRechazo`, o null), con spec.
- **Impresiones** (mutations que generan PDF o ticket): en un rechazo, nada extra; en un corte, el texto actual sin
  `error.message` («Error al generar PDF: el servidor no respondió.»). No se recarga nada.
- No se toca el genérico ni el central.

## Fases (un commit y un push cada una; `npm run check` antes de cada push)

### Fase 1 — `gestion-compras.component.ts` (GC)

| # | Dónde | Operación | Recarga en un corte |
|---|---|---|---|
| 30-32 | GC 974 / 988 / 1014 | imprimir ticket / PDF / guardar PDF | — (regla de impresiones; saca «[object Object]») |
| 33 | GC 1247 `updatePedidoCabecera` | `savePedidoFull` (edición) | pedido (`onGetPedidoById`) y resumen |
| 34 | GC 1339 `savePedidoCabecera` | `savePedidoFull` (**alta**) | no hay id que recargar: aviso «No se pudo confirmar si se creó el pedido: … Revisá la lista de compras antes de repetir» y se bloquea «Guardar» hasta cerrar la pestaña (repetir crea otro pedido) |
| 35 | GC 2366 | actualizar cotización de mercado | — |
| 36 | GC 3039 `onDeleteItem` | `deletePedidoItem` | ítems y resumen (como el éxito) |
| 37 | GC 3306 `onFinalizarPlanificacion` | `finalizarCreacionPedido` | pedido + etapa + resumen |
| 38 | GC 3422 `onReabrirPlanificacion` | `revertirEtapaCreacion` | pedido + etapa + resumen |
| 39 | GC 3824 `asignarItemsANota` | `asignarItemsANota` (a mano) | tab 2 (recepción documental) |
| 40 | GC 4012 `onDeleteNotaRecepcion` | `deleteNotaRecepcion` | tab 2 |
| 41 | GC 4079 `onFinalizarConciliacion` | `finalizarRecepcionNotas` | pedido + resumen + estados de tabs |
| 42 | GC 4914 `onDesvincularProducto` | `desvincularProductoProveedor` (a mano) | productos del proveedor |

Commit `fix(compras): no tapar el motivo del rechazo en la gestion de compras`. Incluye `motivoDelRechazo` y su spec.

### Fase 2 — diálogo de nota de recepción y sus subdiálogos

| # | Dónde | Operación | En el fallo |
|---|---|---|---|
| 4 | nota :961 `deleteItem` | `deleteNotaRecepcionItem` | regla; corte → `loadItems()` a los 5 s |
| 5, 6 | nota :1168, :1257 | forkJoin de N `deleteNotaRecepcionItem` | regla de múltiples; **siempre** `loadItems()` a los 5 s y se vacía `itemsAgregadosEnSesion` de los que ya no existen al recargar |
| 7 | nota :1306 `onCancelarCreacion` | `deleteNotaRecepcion` | regla; corte → aviso y el diálogo se cierra con `changesMade` para que el padre recargue (la nota pudo borrarse) |
| 8 | nota :1443 (edición) | `saveNotaRecepcion` | regla; corte → recargar la nota |
| 9 | nota :1494 (alta) | `saveNotaRecepcion` | regla; corte → aviso; el reintento ya pasa por `validarNotaDuplicada`, que la detecta |
| 10 | nota :1582 | `asignarItemsANota` (a mano, tras crear la nota) | rechazo → motivo + «La nota se creó, pero no se asignaron los ítems»; corte → `avisoTrasMutacion` + `loadItemsAfterAssignment` a los 5 s |
| 16 | `edit-nota-recepcion-item-dialog` :849 | `saveNotaRecepcionItem` | regla; corte en **alta** → el diálogo se cierra con un resultado que hace recargar al padre (reintentar duplica el ítem) |
| 17, 18 | `rechazar-item-dialog` :382 → :400 | rechazo parcial (2 encadenadas) | falla la 1ª → regla simple; falla la 2ª → regla de múltiples y se cierra con resultado de recarga |
| 19, 20 | `rechazar-item-dialog` :469 → :486 | nota → ítem (rechazo completo) | falla la 2ª → «La nota de rechazo se creó, pero …» y recarga; no se reintenta a ciegas |
| 21 | `rechazar-item-dialog` :521 | Promise.all de N `saveNotaRecepcionItemDistribucion` | **falla grave B** (abajo) |

Commit `fix(compras): no tapar el motivo del rechazo en las notas de recepcion`.

### Fase 3 — diálogos de ítem del pedido y distribuciones

| # | Dónde | Operación | En el fallo |
|---|---|---|---|
| 1 | `dividir-item-dialog` :281 | N `saveNotaRecepcionItem` secuenciales | regla de múltiples; si ya se guardó alguno, el diálogo se cierra con resultado de recarga (reintentar duplica) |
| 2, 3 | `add-edit-item-dialog` :1236 → :1284 | ítem → distribuciones | **falla grave C** (abajo) |
| 11, 12 | `distribute-item-dialog` :630, :706 | `mergePedidoItemDistribuciones` | regla; rechazo → el diálogo **queda abierto** (hoy cierra y se pierde lo cargado); corte → se cierra con `success:false, recargar:true` y el padre recarga ítems y resumen a los 5 s |
| 13-15 | `distribute-nota-recepcion-item-dialog` :716, :733, :792 | `replaceNotaRecepcionItemDistribuciones` | **falla grave A** (abajo) + regla |

Commit `fix(compras): guardar las distribuciones de un item sin cerrar antes de la respuesta`.

### Fase 4 — lista de compras y solicitud de pago

| # | Dónde | Operación | En el fallo |
|---|---|---|---|
| 22 | solicitud :200 `onDeleteSolicitud` | genérico `onDelete` | sin cambio (ya recarga; el doble aviso viene del genérico) |
| 23 | solicitud :229 `onChangeEstado` | `actualizarEstadoSolicitudPago` | regla; corte → `loadData()` a los 5 s |
| 24 | solicitud :260 `onCancelarSolicitud` | `cancelarSolicitudPago` | hoy **mudo en un corte**: regla; corte → aviso y `loadData()` a los 5 s |
| 25 | solicitud :284 | imprimir PDF | regla de impresiones |
| 26-28 | list-compra :286, :302, :324 | imprimir | regla de impresiones |
| 29 | list-compra :361 `onCancelar` | `cancelarPedido` vía `onDelete` | `onDelete` emite `null` al fallar (ya avisó): se recarga la lista (`onFilter()`); se borra el `error:` muerto |

Commit `fix(compras): no tapar el motivo del rechazo en la lista de compras y la solicitud de pago`.

## Fallas graves incluidas

- **A · Distribuciones de un ítem de nota (`distribute-nota-recepcion-item-dialog`, `executeSaveOperations`
  :691-747).** Con una sola rama (lo normal) la rama vacía llama a `checkCompletion()` en el acto: el diálogo cierra
  con «Distribución guardada correctamente» **antes de que responda el central**, y un rechazo aparece después con
  el diálogo cerrado. Con las dos ramas salen en paralelo `replace(item, distribuciones)` y `replace(item, [])`: el
  resultado depende del orden de llegada y puede borrar todo. Como `distribuciones` ya es el estado completo deseado y
  el central reemplaza (borra e inserta, atómico), se hace **una sola** llamada `replace(item, distribuciones)` (vacía
  si no queda ninguna) y se cierra recién en su `next`.
- **B · Rechazo de distribuciones (`rechazar-item-dialog`, `rechazarDistribucionesDelItem` :507-534).** El `catch`
  avisa en amarillo y cierra con `success:true`; el padre muestra después el verde «Ítem rechazado exitosamente. N
  distribución(es) rechazada(s)». Se agrega `parcial` al resultado: el diálogo cierra con `parcial:true` y el mensaje
  de la regla (rechazo: «Ítem rechazado, pero no se pudieron rechazar todas las distribuciones»; corte:
  `avisoTrasMutacion`), y el padre muestra un `openWarn` en vez del verde y recarga el tab 2 a los 5 s.
- **C · Ítem del pedido (`add-edit-item-dialog`, `onSave` :1236-1335).** Si falla `mergePedidoItemDistribuciones`, el
  ítem ya quedó guardado pero `this.data.item` no recibe su id: reintentar crea **otro ítem**, y si el usuario cancela
  el padre no recarga y la grilla no lo muestra. Cambio: en ese error se guarda el ítem devuelto (`this.data.item =
  savedItem`, `isEdit = true`) para que el reintento lo actualice; y al cancelar con un ítem ya guardado el diálogo
  cierra como `save` para que el padre recargue.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

**Contrato común de los diálogos.** Los diálogos que hoy cierran con `success` pasan a poder cerrar con
`{ success: false, recargar: true }` (o, donde ya se guardó algo, con el resultado real y `recargar: true`). Cada
llamador se cambia **en la misma fase** que su diálogo:

| Diálogo | Llamadores a cambiar | Cambio |
|---|---|---|
| `rechazar-item-dialog` (B) | GC ~3991 **y** `add-edit-nota-recepcion` ~1080-1100 | `parcial` → `openWarn(result.message)` en vez del verde; los dos ya recargan |
| `distribute-item-dialog` (11, 12) | GC ~2998 | `recargar` → ítems + resumen a los 5 s; hoy solo mira `success` |
| `dividir-item-dialog` (1) | GC ~3972 | `recargar` → recarga sin verde; el cancelar (:321) cierra con `recargar` si ya se guardó algún ítem |
| `edit-nota-recepcion-item-dialog` (16) | nota ~918 (alta) y ~950 (edición) | aceptar `{ recargar: true }` sin id: `loadItems()` sin verde y sin push a `itemsAgregadosEnSesion`; el aviso dice que, si cancela la nota, ese ítem puede quedar |
| `add-edit-item-dialog` (C) | GC ~2822, ~2920, ~4778 | cancelar con ítem guardado devuelve `action: 'save'` con el ítem **que devolvió el servidor** (los tres hacen cuentas locales con `result.item`) |

**Correcciones por punto:**

- **34 (alta de pedido):** flag `altaSinConfirmar` que suma `shouldDisableStep1Button` (GC ~1125) y se chequea al
  inicio de `onContinuarStep1` (~1199), seguido de `updateComputedProperties()`. Solo se bloquea en el corte. En un
  rechazo, como el central no tiene transacción común (el pedido pudo quedar creado si falló un paso posterior), el
  componente agrega «Si el motivo viene de las sucursales o las etapas, revisá la lista de compras antes de repetir».
- **9 (alta de nota):** `validarNotaDuplicada` solo pregunta y en un corte también falla. Tras un corte se marca
  `altaNotaSinConfirmar`; el siguiente «Crear» busca primero con `onBuscarNotasPorProveedorYNumero` filtrando por el
  pedido: si aparece, se **adopta** (`data.nota`, `isEdit`, `notaCreada`, `loadItemsAfterCreation()`) sin guardar; si
  la búsqueda falla, se bloquea con aviso en vez de ofrecer «guardar igual».
- **19 → 20:** si falla el ítem después de crear la nota de rechazo, el diálogo se cierra con `recargar` y aviso («La
  nota de rechazo se creó, pero no se guardó el ítem»): reintentar crearía otra nota.
- **C:** no se toca `data.isEdit` (lo leen 280, 287, 530, 854, 962); flag propio `itemYaGuardado` que también decide
  el mensaje. `this.data.item = savedItem` alcanza: `toInput()` lleva el id y `mergePedidoItemDistribuciones` empareja
  por (influencia, entrega), así que el reintento no duplica.
- **A:** `executeSaveOperations` usa solo `distribuciones` (deja de usar `distribucionesToDelete`). Sin filas ni ids
  no llama a `replace([])`: cierra sin llamar, para no borrar si las distribuciones no cargaron (#390). En rechazo y
  corte el diálogo queda abierto (`savingComputed = false`); el replace es idempotente.
- **5, 6:** se saca el `itemsAgregadosEnSesion = []` incondicional de los dos forkJoin; en el `next` de `loadItems()`
  (:445), con `items != null`, se filtra a los que siguen existiendo.
- **7:** en el corte se cierra con `changesMade` (hoy solo si `success`).
- **41:** la recarga tras el corte es `onActualizarPedido()` (GC ~887), que recarga pedido, resumen y tabs.
- **42:** `response.data?.data` falso hoy no avisa: se agrega el aviso.
- **Recargas de GC (nombres reales):** pedido `onGetPedidoById` / `onActualizarPedido()` (~887), resumen
  `loadPedidoResumen()` (~820), ítems `loadItemsData()` (~3100), tab 2 `markTabAsUnloaded(2); reloadTabData(2)`
  (~1980), productos del proveedor `loadProductosProveedor()` (~4299).
- **Recargas seguras:** GC no tiene el patrón de la tanda 1; se porta (`destruido` en `ngOnDestroy` ~586, set de
  timers limpiado) y cada recarga captura el `pedidoId` y corre solo si sigue siendo el mismo. `loadPedidoResumen`
  no tiene `takeUntil`: el guard de `destruido` lo cubre.
- **Constante de 5 s:** pasa a `graphqlErrorUtils.ts` (`RECARGA_TRAS_CORTE_MS`, exportada) y la usa también la tanda 1;
  no se repite por archivo. `npm run verificar:imports` además de `npm run check` antes de cada push.
- **`motivoDelRechazo` y la constante en un commit propio al inicio de la fase 1** (el archivo es el mismo que toca
  #496: si #496 cambia en revisión, el conflicto queda aislado).
- **Antes del PR:** cuando #496 esté en `develop`, `git rebase --onto origin/develop ce66297f` y verificar que
  `git log origin/develop..HEAD` muestre solo commits de esta tanda. Si #496 cambia la firma de `avisoTrasMutacion` o
  `erroresDeRechazo`, se revisan las 4 fases.

## Auditoría del plan (paso 5, 2026-10-14)

| Eje | Hallazgo | Severidad | Qué se hizo |
|---|---|---|---|
| A | Falla A: el replace del central deja exactamente la lista enviada; ids existentes se reinsertan | — | confirmado; se anota en la prueba |
| A | Llamadores de los 5 diálogos no listados; varios ignoran el resultado nuevo (rechazar tiene 2) | alta | tabla de contrato común |
| A | PR apilado sobre #496 | alta | paso de `rebase --onto` y verificación del log |
| A | Constante de 5 s repetida / helper en el mismo archivo que #496 | baja | constante exportada; commit propio |
| B | 34: el rechazo también puede dejar el pedido creado | alta | texto extra en el rechazo; bloqueo solo en el corte |
| B | 9: `validarNotaDuplicada` no evita el duplicado | alta | adoptar la nota encontrada o bloquear |
| B | 16, 1: el padre ignora el «resultado de recarga» | alta | contrato `recargar` y cambio de llamadores |
| B | C: no tocar `isEdit` | media | flag `itemYaGuardado` |
| B | 19 → 20 sin mecanismo | media | cierre con `recargar` |
| B | Recargas a los 5 s en GC sin guard de destruido | media | patrón de la tanda 1 + `pedidoId` capturado |
| B | A vacío/vacío, 5/6, 7, 41, 42 | baja | ajustes por punto |

## Fuera de alcance (a issues nuevas)

- Nota huérfana en el rechazo completo (19 → 20) cuando el ítem falla: hoy queda una nota vacía; se avisa, no se
  borra.
- `cancelarPedido` usa el `onDelete` del genérico: en un corte dice «se eliminó» aunque es una cancelación.
- Los `deleteById` del central devuelven `false` sin mensaje cuando una FK bloquea el borrado.
- N avisos «Ups!» casi iguales en un rechazo de forkJoin / Promise.all (el dedupe está solo en `onSave`).
- PDF vacío sin aviso (27, 28, 31, 32) y `result=false` sin aviso en GC 3039.
- `asignarItemsANota` / `desvincularProductoProveedor` fuera del genérico (sin «Guardando…»).

## Tests

- Spec de `motivoDelRechazo`: arreglo, `{graphQLErrors}`, `ApolloError` con `graphQLErrors`, con `networkError`,
  respuesta vacía, null, y que limpia el prefijo de graphql-java. Rojo con un stub que devuelva `null`.
- `npx ng test --watch=false --include='src/app/commons/core/utils/graphqlErrorUtils*.spec.ts'` (Electron, `DISPLAY=:0`).
- `npm run check` antes de cada push.

## Prueba de runtime

Central propio en 8084 (worktree de `develop`, perfil `dev`) y desktop `ng serve -c web --port 4201`; usuario de prueba
con ADMIN temporal en `usuario_role` (se borra al final). Interceptor de XHR en la página (Apollo usa `HttpClient`): ids
a -999 o nombre de campo inexistente para un rechazo real; puerto cerrado para un corte. Casos mínimos: A (una rama y
dos ramas: el diálogo cierra solo después de la respuesta; con rechazo queda abierto), B (segunda distribución
rechazada: un solo amarillo, sin verde), C (falla de distribuciones y reintento: un solo ítem en la base), 34 (alta de
pedido cortada: aviso y «Guardar» bloqueado), 39/42 (rechazo de una mutation a mano: se ve el motivo), 24 (cancelar
solicitud cortada: aviso y recarga) y una impresión rechazada (sin «[object Object]»).

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop; no cambia operaciones GraphQL ni el genérico.

## Riesgos

- Es un PR grande (4 fases, ~15 archivos). Se prueba por fase.
- Depende de #496 (helper): no se abre el PR hasta que #496 esté en `develop`.
- A cambia el número de llamadas (1 en vez de 2): si alguna pantalla dependiera de la llamada con `[]` para borrar,
  queda cubierta porque el reemplazo con la lista completa ya borra lo que falta.
