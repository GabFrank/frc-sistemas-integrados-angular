# Plan — motivo del rechazo en solicitud de pago (issue #488, tanda 3)

Rama `fix/pagos-motivo-rechazo`, sale de `develop` (ya con #496). Tanda 1: #496 (recepción de mercadería). Tanda 2: #498
(gestión de compras).

## Alcance (decidido por Franco el 2026-10-15)

Solo **solicitud de pago** (`src/app/modules/operaciones/solicitud-pago/`): 15 escrituras, puntos 17 a 31 del inventario.

Las pantallas de **pago** (`EditPago`, `PagoDetalleDialog`, `ListPago`, `PagoGeneral*`, `ModificarSucursalPagoDetalle`)
quedan fuera: no hay menú, pestaña, ruta ni selector que las abra (solo están declaradas en `operaciones.module.ts`;
`list-pago` navega a `/operaciones/pagos/detalle`, que no existe). Ahí estaban las otras 16 escrituras y casi todas
las fallas graves del inventario. Van a una issue aparte, para decidir si se borran o se rehabilitan.

## Qué hace el genérico en cada camino

| Método | Rechazo | Corte de red |
|---|---|---|
| `onCustomMutation` | avisa «Ups! Algo salió mal: <motivo>» y emite el arreglo | **no avisa**, emite el error de Apollo |
| `onSave` | avisa el motivo y emite el arreglo | avisa «No se pudo confirmar si se guardó…» (salvo `show: false`) |
| `onDelete` | avisa el motivo y emite `null` | avisa «No se pudo confirmar si se eliminó…» y emite `null` |

`onEliminarSolicitudPagoDetalle` convierte el `null` en un `Error`: su `error:` llega **ya avisado** en los dos casos y
no distingue rechazo de corte.

## Regla

- **Rechazo** (`erroresDeRechazo(error) != null`): el componente no suma aviso; queda el motivo del genérico. Si la
  pantalla ya mostraba el cambio antes de la respuesta, se recarga sin aviso.
- **Corte** en `onCustomMutation`: `avisoTrasMutacion(error, '<qué>')` (null en el timeout del link, que ya avisó) y se
  recarga lo que recarga el camino feliz. La recarga de la solicitud se hace **en el momento y otra vez a los 5 s**
  (`RECARGA_TRAS_CORTE_MS`): la primera saca las filas que se mostraron de antemano y la segunda muestra lo que el
  central terminó de aplicar (el link de central offline corta a los 3 s sin cancelar el pedido).
- **`onDelete`** (ya avisó, no se sabe cuál de los dos): sin aviso propio; recarga en el momento y a los 5 s.
- **Impresiones**: en un rechazo, nada extra; en un corte, «Error al … : el servidor no respondió.»; sin recarga.
- **Cambios de estado en un diálogo** (solicitar, reabrir, gestionar): en un rechazo el diálogo queda abierto; en un
  corte se avisa y el diálogo cierra con `true`, para que la lista recargue y muestre el estado real. Repetir tras un
  cambio que sí se aplicó da «Transición de estado inválida de X a X», que ya dice lo que pasó.
- El recargado a los 5 s corre solo si el diálogo sigue abierto (flag `destruido` y set de timers, como en las
  tandas 1 y 2).

## Puntos

`CE` = `create-edit-solicitud-pago-dialog.component.ts`.

| # | Dónde | Hoy | Cambio |
|---|---|---|---|
| 17 | CE `onAgregarNota` (N `agregarNotaASolicitudPago` en paralelo) | cualquier fallo: «No se pudo confirmar X de N nota(s)…» y recarga; en un rechazo contradice al genérico | contar aparte rechazadas y sin respuesta. Con alguna sin respuesta: «No se pudo confirmar si se agregaron N nota(s)…» y recarga ahora y a los 5 s. Solo rechazos: recarga sin aviso (las notas se mostraron antes de la respuesta) |
| 18 | CE `onQuitarNota` | «No se pudo confirmar que la nota se quitó…» también en un rechazo | rechazo: nada (la fila se quita recién en el `next`); corte: aviso y recarga ahora y a los 5 s |
| 19 | CE `onEditarDetalle`, paso 1 (`onDelete`) | suma «No se pudo confirmar el cambio…» al aviso del genérico | sin aviso propio; recarga ahora y a los 5 s |
| 20 | CE `onEditarDetalle`, paso 2 (`agregarSolicitudPagoDetalle`) | «La forma de pago anterior se eliminó, pero no se pudo confirmar la nueva…» también en un rechazo | rechazo: «La forma de pago anterior se eliminó y la nueva se rechazó: se recarga la solicitud.» y recarga; corte: el texto de hoy y recarga ahora y a los 5 s |
| 21 | CE `onQuitarDetalle` (`onDelete`) | suma «No se pudo confirmar que la forma de pago se eliminó…» | sin aviso propio; recarga ahora y a los 5 s |
| 22 | CE `onSolicitar` | «No se pudo solicitar» (en un corte afirma que no se hizo; en un rechazo es un segundo aviso) | rechazo: nada; corte: `avisoTrasMutacion(…, 'se solicitó el pago')` y `close(true)` |
| 23 | CE `onReabrir` | «No se pudo reabrir» (igual que 22) | rechazo: nada; corte: aviso y `close(true)` |
| 24-26 | CE alta y guardado (`onSave`) | ya correcto: el alta apaga el aviso del genérico y bloquea con `creacionIncierta`; la edición deja el del genérico | sin cambio |
| 27 | `adicionar-forma-pago-dialog` `guardarEnSecuencia` | cualquier fallo: «Se confirmaron X de N… (puede haber alguna más)» o «No se pudo confirmar…», y cierra con `recargar` | rechazo sin nada guardado: el diálogo queda abierto para corregir; rechazo con k guardadas: «Se guardaron k de N formas de pago y la siguiente se rechazó.» y cierra con `recargar`; corte: igual que hoy. El padre (CE) recarga ahora y a los 5 s |
| 28 | `asignar-caja-solicitud-dialog` `onGuardar` | corte: sin aviso, el diálogo queda abierto | corte: `avisoTrasMutacion(…, 'se asignó la caja')`; el diálogo queda abierto (asignar es idempotente y bloquea en el central) |
| 29 | `gestion-pago-dialog` `onGuardar` | «Error al actualizar estado» (igual que 22) | rechazo: nada; corte: aviso y `close(true)` (la lista recarga) |
| 30 | `list-solicitud-pago` y `solicitud-pago-dashboard` `onImprimir` | «Error al generar PDF» también en un rechazo | regla de impresiones |
| 31 | ídem `onImprimirTicket` | «Error al imprimir ticket» | regla de impresiones |

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **27 (alta):** en el rechazo sin nada guardado se baja `guardando` (el botón Confirmar depende de él: sin eso queda
  muerto). Reintentar es seguro: no se guardó nada y `onConfirmar` rearma los detalles del formulario.
- **Ventana de 5 s (media-alta):** la recarga «ahora y a los 5 s» deja `pantallaDesactualizada = true` hasta que corre
  la segunda (la primera no la apaga mientras quede un timer pendiente). Todas las acciones del diálogo pasan por
  `accionBloqueada()`, así que nadie lanza otra mutación ni abre un diálogo hijo con datos viejos durante la ventana.
  Se suman `accionBloqueada()` a `onSolicitar` y `onReabrir`, que hoy no lo chequean.
- **CE no tiene ciclo de vida:** se agregan `OnDestroy`, `destruido` y el set de timers; `recargarSolicitud` pasa a
  aceptar aviso opcional y la segunda recarga.
- **17:** el aviso del corte se omite si todas las sin respuesta fueron timeout del link (ya avisó); `saving = false`
  antes de recargar, como hoy.
- **21:** `onQuitarDetalle` no marca `saving`: un doble clic mandaba dos borrados. Se marca y se baja en `next` y `error`.
- **22, 23:** en un rechazo, además, recarga silenciosa de la solicitud (un rechazo por estado viejo dejaba el
  diálogo con el estado desactualizado y cada reintento fallaba igual).
- **31 (ticket):** en un corte, «No se pudo confirmar si se imprimió el ticket: revisá antes de repetir.» (repetir
  imprime doble); en las dos impresiones el aviso se omite con timeout del link.
- **Alcance:** `solicitud-pago-compra` (compra/) ya lo cubre la tanda 2 (#498: cambio de estado, cancelar, imprimir).
  Las escrituras de tesorería sobre solicitudes (`pagar-compras-dialog`: devolver, pagar en lote) quedan para la
  tanda 4.
- **Conteo:** 12 puntos con cambio (17-23, 27-31) en 6 archivos. La prueba suma 19 y 23.

| Hallazgo | Severidad | Qué se hizo |
|---|---|---|
| 27: `guardando` no se baja si el diálogo queda abierto | alta | se baja en esa rama |
| Recarga a los 5 s puede pisar otra acción o un diálogo hijo | media-alta | `pantallaDesactualizada` toda la ventana + `accionBloqueada` en solicitar/reabrir |
| CE sin `ngOnDestroy` ni timers | media | se agregan |
| 17: aviso duplicado con timeout del link | media | se omite |
| 21: doble clic manda dos borrados | baja-media | `saving` |
| 22/23: rechazo por estado viejo se repite | media | recarga silenciosa |
| 31: «no respondió» invita a reimprimir | baja | texto «no se pudo confirmar… revisá antes de repetir» |
| `solicitud-pago-compra` y tesorería fuera del plan | media/baja | anotado en alcance |
| Tabla del genérico sin la salvedad del timeout | baja | `onSave`/`onDelete` no avisan el corte por tiempo: lo avisa el link |

## Fases

Una sola fase (12 puntos con cambio en 6 archivos):
- commit `fix(compras): no tapar el motivo del rechazo en la solicitud de pago`;
- antes del push, `npm run check`, `npm run verificar:imports` y `git status` limpio.

## Fuera de alcance (a issues nuevas)

- Pantallas de pago sin acceso desde la UI (código muerto con fallas graves si se rehabilitan: verde antes de la
  respuesta, operaciones paralelas que se pisan, altas que se duplican al reintentar).
- `saveSolicitudPago` y `actualizarSolicitudPago` del central corren el servicio principal y `sincronizarDetalles` en
  transacciones separadas: un fallo en la segunda deja la solicitud a medias.
- `agregarNotaASolicitud` del central no recalcula `montoTotal`.
- El central no valida el estado de la solicitud en `agregarSolicitudPagoDetalle` ni en `eliminarSolicitudPagoDetalle`.
- N avisos «Ups!» casi iguales cuando se rechazan varias notas en paralelo (punto 17).

## Prueba de runtime

Central propio en 8084 (worktree de `develop`, perfil `dev`), desktop `ng serve -c web --port 4201`, usuario 608 con
ADMIN temporal (se borra al final), interceptor de XHR (rechazo con campo inexistente, corte a un puerto cerrado,
respuesta perdida). Casos:
- 17: una nota rechazada y una cortada, con recarga a los 5 s;
- 18 y 21: corte;
- 20: rechazo de la nueva forma de pago;
- 22 y 29: rechazo (el diálogo queda abierto, un solo aviso) y corte (aviso, cierra, la lista recarga);
- 27: rechazo de la primera y de la segunda;
- 28: corte;
- una impresión rechazada.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop; no cambia operaciones GraphQL ni el genérico.
