# Plan: escrituras con `apollo.mutate` directo (#527)

Rama `fix/generics-mutate-directo-527`, desde `develop` (`969876eb`). PR único a `develop`. Solo desktop.

Criterio de #501: un rechazo se avisa una vez con el motivo («Ups!» del genérico); un corte avisa «No se pudo
confirmar si …» y no deja repetir a ciegas lo que no se puede repetir; un solo verde por éxito.

## Alcance corregido respecto del issue

| Del issue | Qué pasa | Decisión |
|---|---|---|
| `replication-table.service.ts` (4 escrituras) | Ya resuelto en `870db326` (#501): `avisarFallo` avisa rechazo y corte | fuera |
| `CajaObservacionService.onDeleteCajaObservacion`, `VentaObservacionService.onDeleteVentaObservacion` | Sin llamadores en `src/` (ni `.html`; el segundo no estaba listado) | se borran, con su GQL inyectado y el import |
| Borrado de categoría / subcategoría / motivo de observación, de caja y de venta (6) | ver fase 1 | fase 1 |
| Entrada y salida: cabecera (guardar, eliminar, finalizar) e ítems (guardar, eliminar) | ver fase 2 | fase 2 |

## Fase 1 — borrado de observaciones (6 servicios, 2 pantallas)

Hoy: `this.deleteX.mutate({ id })` sin `errorPolicy` y sin `clientName`. Un rechazo llega como error del
observable (no como `res.errors`) y la pantalla no tiene `error:` → no se ve nada. Un corte, igual.

Además, **va al servidor equivocado**: sin `clientName` la mutation sale por el link por defecto (el local, el
filial, si el desktop tiene los dos configurados), y estas seis mutations **solo existen en el central**
(`grep` en `src/main/resources/graphql` de los dos backends). La lista y el alta ya van al central
(`onGetAll`/`onSave` con `servidor` por defecto `true`). En un desktop de sucursal el borrado hoy falla siempre
y en silencio; en uno conectado solo al central ya funciona.

Cambio: cada servicio pasa por `genericService.onDelete(gql, id, null, null, false, true, null, { exito })`
(sin confirmación: la pantalla ya pregunta). `onDelete` emite `true`/`null` y completa; avisa rechazo y corte.
El `tap` que saca el ítem de la lista en memoria queda con `if (res)`.

Un solo verde: el texto de la pantalla pasa a `textos.exito` y la pantalla quita el suyo (patrón de #501 con
`onDelete`, único llamador en las seis).

| Servicio | Pantalla (verde de hoy) |
|---|---|
| `CajaCategoriaObservacionService.onDeleteCategoriaObservacion` | `main-caja-observacion` «Caja categoría eliminada exitosamente» |
| `CajaSubCategoriaObservacionService.onDeleteCajaSubCategoriaObservacion` | `main-caja-observacion` «Caja subcategoría eliminada exitosamente» |
| `CajaMotivoObservacionService.onDeleteCajaMotivoObservacion` | `main-caja-observacion` «Caja motivo eliminado exitosamente» |
| `CategoriaObservacionService.onDeleteCategoriaObservacion` | `main-venta-observacion` |
| `SubCategoriaObservacionService.onDeleteSubCategoriaObservacion` | `main-venta-observacion` |
| `MotivoObservacionService.onDeleteMotivoObservacion` | `main-venta-observacion` |

Tras un corte no se recarga: repetir un borrado no hace daño y el aviso ya pide verificar.

**Efecto del borrado que ahora llega (auditoría, eje B):** las FK del central son `ON DELETE SET NULL`
(`V43.1`, `V49.1`): borrar un motivo deja sin motivo las observaciones ya cargadas, y borrar una categoría o
subcategoría deja sin padre a sus hijos. Es lo que ya pasa hoy desde un desktop conectado solo al central; desde
uno de sucursal, que hoy falla en silencio, pasa a pasar. Las tablas no existen en el filial ni se publican: no
hay replicación. No se cambian los textos de confirmación (fuera de alcance; anotado para Franco).

## Fase 2 — entrada y salida (filial, mueven stock)

Hoy (los dos servicios son espejo):

- `errorPolicy: 'all'`: el rechazo sí se ve («Ups»). El **corte** no: el `subscribe` interno no tiene `error`,
  el observable no emite ni falla, y el «Cargando…» que abrió el diálogo **queda abierto para siempre**.
- `onSaveEntrada`/`onSaveSalida` **con rechazo tampoco emiten**: mismo cuelgue del «Cargando…».
- `finalizarEntrada`/`finalizarSalida` en el filial (`EntradaService.finalizarEntrada:59`, `SalidaService:52`)
  **no son idempotentes**: cada llamada crea un `MovimientoStock` por ítem y no mira `activo`. Repetir tras un
  corte duplica stock. Son `@Transactional`: el `activo = true` se ve recién al commit.
- Destino: sin `clientName` → link por defecto (filial si está configurado). Se mantiene: `servidor = false`
  pone `clientName: null`, igual que hoy, en los dos modos de configuración.

### Servicios

| Operación | Genérico | Notas |
|---|---|---|
| Guardar cabecera | `onSaveCustom(gql, { entity: input }, false)` | `onSave` completaría `usuarioId` con el usuario actual (hoy viaja `null` y el filial guarda `usuario = null`): cambio de datos que nadie pidió. `onSaveCustom` no toca el input. Se conserva `activo = false` en el alta |
| Guardar ítem | `onSaveCustom(gql, { entity: input }, false)` | |
| Eliminar cabecera / ítem | `onDelete(gql, id, null, null, false, false)` | la pantalla ya confirma; emite `true`/`null` |
| Finalizar | `onCustomMutation(gql, { id }, false)` | **se agrega el alias `data:` a `finalizarEntrada`/`finalizarSalida` en los dos `graphql-query.ts`** (sin alias `onCustomMutation` emitiría `undefined`; auditoría, eje A) |

Todos emiten la entidad. Hoy `onSaveEntrada`/`onSaveSalida`/`onSaveEntradaItem` emiten `res.data` y la pantalla
hace `res['data']`: se ajustan `entrada-dialog` (guardar cabecera y guardar ítem) y `salida-dialog` (guardar
cabecera). `onSaveSalidaItem` ya emitía la entidad.

`EntradaService`/`SalidaService` (`providedIn: root`) guardan `finalizacionSinConfirmar: Set<number>`: los ids
cuya finalización quedó sin respuesta en esta sesión. Sobrevive al diálogo (auditoría, eje B: cerrar y reabrir
desde la fila vieja volvía a habilitar Finalizar).

### Diálogos (`entrada-dialog`, `salida-dialog`)

- **Al abrir una existente se relee por id** (`buscarEntrada`/`buscarSalida`) además de mostrar la fila: la fila
  de la lista puede ser vieja (cargada antes de un corte). La relectura tapa la pantalla con «Cargando…» hasta
  llegar (auditoría del diff: una relectura tardía pisaba lo que el usuario hiciera mientras tanto), y la
  lectura por id termina siempre, también con error, para poder cerrarlo.
- **`bloqueada`** (propiedad, calculada en `cargarDatos`, sin getter en el HTML) = el id está en
  `finalizacionSinConfirmar` y la entrada no se leyó finalizada. Se suma a `selectedEntrada?.activo == true` en
  los `[disabled]`/`*ngIf` de Editar, Finalizar y los botones de ítem, y como guarda en `onItemSave`, `onDelete`,
  `onSaveEntrada` y `onFinalizarEntrada` (auditoría, eje B: tras un corte de finalizar, Editar → Guardar mandaba
  `activo = false` y des-finalizaba). No se suma al Guardar ítem de una entrada ya finalizada: hoy se puede y no
  mueve stock (fuera de alcance). Si la relectura trae `activo == true`, el id sale
  del conjunto. **Nunca** se desbloquea por `activo == false`: puede ser un commit que todavía no ocurrió.
  Al abrir uno bloqueado sin `activo`: aviso «No se pudo confirmar si se finalizó: revisá el stock antes de
  repetir. Para habilitarlo, reiniciá el sistema».
- Las pantallas **dejan de abrir su «Cargando…»** en estas llamadas (el genérico abre «Guardando…»/
  «Eliminando…»). En `salida-dialog.onItemSave` el suyo se abría antes del confirm de stock insuficiente: se saca.
- Guarda `finalizando` contra el doble clic en Finalizar.
- Verde de Finalizar: lo da la pantalla («Entrada finalizada» / «Salida finalizada»); `onCustomMutation` no tiene.
- Todos los `subscribe` llevan `error:`. Decide `erroresDeRechazo(err) == null` (corte, timeout del link o
  respuesta vacía), no que haya aviso: `avisoTrasMutacion` es `null` en el timeout, que ya avisó el link.

| Acción | Rechazo | Corte |
|---|---|---|
| Guardar cabecera nueva (sin id) | el genérico avisa; el diálogo queda en edición | aviso `avisoTrasMutacion('se guardó la entrada')` y **se cierra con `{ recargar: true }`** (repetir crea otra cabecera; patrón `notificacion-personalizada`) |
| Guardar cabecera existente | ídem | el aviso del genérico; queda en edición (mismo id, idempotente; con `bloqueada` no se puede tocar `activo`) |
| Guardar ítem nuevo | el genérico avisa; el formulario queda | aviso y **se cierra con `{ recargar: true }`**: un ítem duplicado se duplica en el stock al finalizar; al reabrir se relee |
| Guardar ítem existente / eliminar ítem | el genérico avisa | el genérico avisa (idempotentes) |
| **Finalizar** | el genérico avisa; sigue habilitado | el id entra a `finalizacionSinConfirmar`, aviso `avisoTrasMutacion('se finalizó la entrada')` y **se cierra con `{ recargar: true }`** |

Pérdida de trabajo al cerrar tras un corte: solo los campos de la cabecera (los ítems no se pueden cargar antes
de guardarla: `*ngIf="selectedEntrada?.id != null"`). Si la recarga llega antes del commit queda una cabecera
vacía, que no mueve stock y se puede borrar.

### Lista (`entrada-salida.component.ts`)

Los cuatro `afterClosed` (alta y edición de entrada y de salida): `res?.recargar` → `timer(RECARGA_TRAS_CORTE_MS)`
y `onGetEntradas()`/`onGetSalidas()` (con `untilDestroyed`); si no, lo de hoy. Eliminar desde la lista:
`onDelete` emite `true`/`null`, el `if (res)` de hoy queda.

## Datos nuevos

Ninguno en la base. En memoria: `finalizacionSinConfirmar` (lo escribe el diálogo tras un corte de finalizar;
lo leen el mismo diálogo al abrir y al recargar).

## Tests

- Desktop: sin batería en ningún gate (ciclo §1 paso 9). Gate: `npm run check`.
- La decisión corte/rechazo es `erroresDeRechazo`, que ya tiene spec (`graphqlErrorUtils.spec.ts`). Los specs de
  los diálogos son el scaffold de la CLI (sin providers) y no compilan acotados: la lógica nueva de pantalla
  (bloqueo y cierre) queda cubierta por la prueba de runtime, no por spec. Anotado.

## Prueba de runtime

Desktop web (`ng serve -c web`, puerto propio) contra el central local (8081) y el filial local (8082, perfil
dev, SIFEN apagado, Flyway apagado), usuario MR en la sucursal 24. Corte simulado con el parche de
`XMLHttpRequest` (memoria «Simular error de red con forma de Apollo»), incluida la variante «el pedido llegó y la
respuesta se perdió»; rechazo con un id inexistente o una consulta inválida.

| Pantalla | Casos |
|---|---|
| Observaciones de caja (categoría, subcategoría, motivo) | éxito: un verde, el de la pantalla; rechazo: un «Ups!»; corte: aviso, la fila no se quita |
| Observaciones de venta (ídem) | ídem |
| Entrada: alta cabecera | éxito; rechazo (no cuelga, queda en edición); corte (cierra, la lista recarga) |
| Entrada: ítem alta/edición/eliminar | éxito, rechazo, corte en alta (cierra; al reabrir, se ve si quedó) |
| Entrada: finalizar | éxito (un movimiento por ítem, SQL); corte con respuesta perdida (cierra; al reabrir desde la fila: bloqueado; Editar/Guardar deshabilitados; SQL: un solo movimiento por ítem con esa `referencia`); doble clic |
| Entrada: eliminar desde la lista | éxito, rechazo, corte |
| Salida: lo mismo | ídem, incluido el ítem con stock insuficiente |

Las entradas/salidas de prueba y sus movimientos de stock se borran al final (base local).

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop, sin cambios de esquema.

## Fuera de alcance (anotado)

- `CrudService.deleteById` (filial y central) devuelve `false` sin error si el borrado falla: el genérico no mira
  el booleano y dice «Eliminado». Aplica a entrada/salida y a las observaciones. Es del backend.
- Eliminar una entrada ya finalizada no revierte sus movimientos de stock; el backend tampoco impide editar
  ítems de una finalizada. Del backend.
- `finalizarEntrada`/`finalizarSalida` sin guarda de idempotencia en el filial: la solución de fondo es que el
  backend rechace si ya está `activo`. Issue aparte del filial.
- Textos de confirmación de borrado de observaciones que no avisan del `SET NULL`.
- `onGetEntrada`/`onGetSalida` y demás lecturas de estos servicios no terminan en error (lecturas, otro issue).

## Sin verificar

- Si algún desktop usa la pantalla de observaciones conectado solo a un filial: ahí el borrado seguiría
  fallando, ahora con aviso.

## Resultado de la prueba (2026-10-17)

Desktop `ng serve -c web` en `[::1]:4201` con `isLocal: true`, filial local `:8082` (perfil dev, SIFEN y
Flyway apagados) y central local `:8081` (dev, Flyway apagado), usuario MR. Falla inyectada en
`XMLHttpRequest.send` por nombre de mutation: corte (el pedido no llega), respuesta perdida (el pedido llega y
se aplica; el cliente recibe error de red), rechazo (la mutation renombrada: el servidor contesta un error
GraphQL) y colgado hasta el timeout del link. Avisos contados en `NotificacionSnackbarService.notification$`.
Datos de prueba creados y borrados al final (`PRUEBA 527` en el central; entradas, salidas, ítems y sus
`movimiento_stock` en el filial; el borrado de los movimientos replicó al central).

| Pantalla / acción | Resultado |
|---|---|
| Observaciones de venta: borrar categoría, subcategoría, motivo | ✓ éxito: un verde, el de la pantalla, y la fila se borra **en el central**; corte: un aviso naranja y la fila queda; rechazo: un «Ups!» y la fila queda |
| Observaciones de venta: borrar categoría con respuesta perdida, y repetir | ✓ aviso «No se pudo confirmar…» y la fila queda (en el central se borró); repetir: «el registro ya no existe… Actualizá la lista» |
| Observaciones de caja: borrar categoría, subcategoría, motivo | ✓ ídem venta (éxito, corte, rechazo) |
| Entrada: alta de cabecera | ✓ éxito: un verde, `usuario_id` sigue `null` como antes; rechazo: un «Ups!», queda en edición, **sin «Cargando…» colgado** (antes se colgaba); corte: «Error de red» + «No se pudo confirmar si se guardó la entrada…», se cierra, la lista no agrega basura y no se creó nada |
| Entrada: editar cabecera con corte | ✓ solo el aviso del genérico, queda en edición |
| Entrada: ítem nuevo | ✓ éxito (se ve en la tabla); rechazo: un «Ups!», el formulario conserva la cantidad; respuesta perdida: dos avisos, se cierra, la lista recarga a los 5 s y al reabrir se ve el ítem guardado |
| Entrada: eliminar ítem | ✓ éxito, corte y rechazo, un aviso cada uno |
| Entrada: finalizar con corte | ✓ aviso, se cierra; al reabrir desde la fila: aviso de bloqueo, Finalizar oculto, Editar / Guardar ítem / Eliminar ítem deshabilitados; Enter y llamadas directas no mandan nada. En el filial: sin finalizar, 0 movimientos |
| Entrada: finalizar con respuesta perdida | ✓ aviso, se cierra y queda bloqueada; al reabrir, la relectura la trae finalizada, sale del bloqueo y muestra «Finalizado». En el filial: un movimiento por ítem |
| Entrada: finalizar con rechazo / con doble clic | ✓ un «Ups!» y sigue habilitado / **un solo envío**, verde «Entrada finalizada», un movimiento por ítem |
| Entrada: finalizar colgado hasta el timeout del link | ✓ un solo aviso (el del link), se cierra y queda bloqueada |
| Entrada: eliminar desde la lista | ✓ éxito, corte y rechazo |
| Salida: todo lo anterior | ✓ ídem, más el ítem con stock insuficiente (confirma y guarda; cancelar no deja «Cargando…» ni manda nada) |
| Entrada: abrir una existente (tras la auditoría del diff) | ✓ «Cargando…» tapa la pantalla mientras llega la relectura y se cierra; con la lectura sin red se cierra igual, el diálogo queda con la fila y no hay error suelto en la consola |

Reiniciar el sistema (recargar la página) vacía `finalizacionSinConfirmar`: es la salida documentada en el aviso.

## Auditoría del diff (paso 8)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| Esquema y contrato; compatibilidad | La relectura al abrir podía llegar tarde y pisar lo que el usuario hizo (un ítem recién guardado desaparecía de la grilla y se volvía a cargar; `activo` volvía a `false` tras finalizar) | La relectura tapa la pantalla con «Cargando…» hasta llegar; `onGetEntrada`/`onGetSalida` terminan siempre (antes, sin red, el error quedaba suelto en la consola y con un rechazo no terminaban) |
| Compatibilidad | Guardar cabecera sin guarda de `bloqueada` (no alcanzable hoy: Editar está deshabilitado) | `if (this.bloqueada) return` en `onSaveEntrada`/`onSaveSalida` |
| Compatibilidad | Un 401/403 al finalizar se trata como corte y bloquea la entrada hasta reiniciar | Se deja: es el lado seguro (no se sabe si se aplicó) y está avisado. Para Franco |
| Compatibilidad | Eliminar desde la lista no mira `finalizacionSinConfirmar` | Se deja: eliminar no mueve stock; borrar una finalizada sin revertir es del backend (fuera de alcance) |
| Esquema y contrato | Los ids llegan como string y el conjunto está tipado `Set<number>` | Se deja: todos los ids que entran y se comparan vienen del servidor (string); el único camino con otro origen (`movimiento-stock.service.getTipoMovimientoComponent`) no tiene llamadores |
| Esquema y contrato | Plan con `soloLectura` y código con `bloqueada` | Plan alineado |
| Autorización | Sin hallazgos introducidos por el diff: no hay menú, botón ni acción nueva; las pantallas de observaciones siguen solo para ADMIN | — |
