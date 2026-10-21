# Plan — motivo del rechazo en el resto de los módulos (issue #488, tanda 4)

Rama `fix/generics-motivo-rechazo-resto`, sale de `develop` (ya con #496, #498 y #500 en revisión). Anteriores:
#496 (recepción de mercadería), #498 (gestión de compras), #500 (solicitud de pago).

## Alcance (decidido por Franco el 2026-10-15)

Cerrar #488: los **19 llamadores con doble aviso o motivo perdido** que quedan fuera de compras, las **2 llamadas
silenciosas** que anotó la issue y **`mensajeDeError` movido a `graphqlErrorUtils.ts`**.

Queda para una issue nueva: 58 llamadas a `onCustomMutation` sin manejo de error (en un corte nadie avisa) y 25 por
`await`/pipe que hay que revisar una por una.

## Regla (la de las tandas 1 a 3)

- **`onCustomMutation`**, rechazo: el genérico ya mostró el motivo; el componente no suma aviso. Corte: el genérico no
  avisa; `avisoTrasMutacion(error, '<qué>')` (null en el timeout del link, que ya avisó).
- **`onSave`**: avisa los dos casos; el componente no suma aviso.
- **Altas sin id** (repetir duplica): tras un corte no se deja reintentar a ciegas; se cierra el diálogo con `true` para
  que el padre recargue, o se bloquea el guardado con un aviso, según el caso.
- **Acciones idempotentes**: tras un corte, aviso y el diálogo queda abierto (reintentar no duplica; si ya se aplicó,
  el central lo rechaza con un mensaje que lo dice).
- **Listas**: tras un corte, recarga a los 5 s (`RECARGA_TRAS_CORTE_MS`).

## Fase 1 — helper y silenciosas

| # | Dónde | Hoy | Cambio |
|---|---|---|---|
| 22 | `financiero/venta-tarjeta/qr-pos/mensaje-error.ts` (24 usos en 13 archivos, spec de 6 casos) | helper local | se mueve a `graphqlErrorUtils.ts` con la misma firma y comportamiento, su spec pasa a `graphqlErrorUtils.spec.ts`, se actualizan los imports y se borra el archivo. No se le agrega `limpiarMensajeGraphQL` (cambiaría lo que ven 24 llamadores) |
| 22b | `ultimas-ventas-dialog.component.ts:199` | usa `mensajeDeError` sin mirar si es rechazo: en un corte muestra el texto crudo de Apollo | se guarda con `erroresDeRechazo`, como `list-venta:481` y `generic-list-venta:561` |
| 20 | `venta-tarjeta.service.ts` `onCancelarPorVentaId` (silenciosa) y sus 5 llamadores (`list-venta` 466 y 503, `generic-list-venta` 546 y 583, `ultimas-ventas-dialog` 185) | un fallo solo deja `console.error`: la venta queda cancelada y su cobro con tarjeta pendiente sin que nadie se entere | aviso: «La venta se canceló, pero no se pudo cancelar su cobro con tarjeta: <motivo o «no se pudo confirmar»>. Revisalo en ventas con tarjeta.» (`motivoDelRechazo` en un rechazo, porque es silenciosa) |
| 21 | `reconocimiento-facial-helper.service.ts:~310` (`onIncorporarEmbeddingMarcacion`, silenciosa) | todo error se muestra como «error de conexión» | en un rechazo, «No se pudo actualizar el perfil facial: <motivo>»; lo demás igual |

Commit `fix(generics): mover mensajeDeError a graphqlErrorUtils y avisar los fallos silenciosos`.

## Fase 2 — los 19 llamadores

| # | Dónde | Hoy | Cambio |
|---|---|---|---|
| 1 | `list-impresoras:274` prueba de impresión | «No se pudo imprimir en X» también en un rechazo (sin motivo) | rechazo: nada; corte: «No se pudo confirmar si se imprimió en X: revisá antes de repetir.» |
| 2 | `setup-replication-dialog:256` + `logical-replication.service.ts:275-291` | el `catchError` del service avisa «ERROR AL CONFIGURAR REPLICACIÓN» y el log dice «Error desconocido»: triple aviso en un rechazo | en el service: en un rechazo, sin aviso propio y `message` = motivo; en un corte, `message` = «No se pudo confirmar si se configuró: es una operación larga, revisá el estado antes de repetir.» y aviso |
| 3 | `edit-factura-legal-dialog:331` actualizar | segundo aviso con el motivo en un rechazo; texto crudo de Apollo en un corte | rechazo: nada; corte: `avisoTrasMutacion`; el diálogo queda abierto (editar es idempotente) |
| 4 | idem `:361` nominar | «Factura actualizada pero error al nominar: » sin motivo | rechazo: «Factura actualizada, pero no se nominó: <motivo>»; corte: «Factura actualizada, pero no se pudo confirmar si se nominó en SIFEN: revisá antes de repetir.»; sigue cerrando con `true` |
| 5 | `adicionar-caja-dialog:872` marcar tarjetas no completadas | texto fijo además del motivo | rechazo: nada; corte: `avisoTrasMutacion` (idempotente, queda) |
| 6 | `transferir-caja-dialog:58` | `openWarn(err.message)`: vacío en un rechazo; con respuesta falsa no avisa nada | rechazo: nada; corte: `avisoTrasMutacion` (si se aplicó, repetir lo rechaza el filial); respuesta falsa: «No se pudo transferir la caja.» |
| 7 | `adicionar-retiro-dialog:230` (**alta**) | «Ocurrió un error al guardar el retiro» y el diálogo abierto: reintentar crea otro retiro y descuenta dos veces | rechazo: nada, queda abierto; corte: «No se pudo confirmar si se guardó el retiro: revisá la caja antes de repetir.» y cierra con `true` (el padre recarga) |
| 8 | `add-timbrado-detalle-dialog:281` | «Error al guardar: [object Object]» | rechazo: nada; corte en alta: aviso y cierra con `true`; corte en edición: aviso y queda |
| 9, 10 | `edit-inventario:262` y `:404` finalizar y reabrir zona (`onSave`) | «No se pudo finalizar/reabrir la zona» encima del aviso del genérico | sin aviso propio |
| 11, 19 | `list-stock-lote:636`, `lotes-producto-dialog:186` cambiar estado del lote | texto fijo; en un corte la lista no se recarga | rechazo: nada; corte: `avisoTrasMutacion` y recarga a los 5 s |
| 12, 15 | `adicionar-proveedor-dialog:403`, `edit-proveedor:427` alta de persona (`onSave`) | «Error al crear la persona» encima del genérico; tras un corte reintentar crea otra persona | sin aviso propio; tras un corte se bloquea Guardar con «No se pudo confirmar si se creó la persona: cerrá y buscala antes de repetir.» |
| 13, 16 | idem `:444` y `:462` guardar proveedor (`onSave`) | «Error al guardar el proveedor» encima del genérico | sin aviso propio en el `error:` (el caso «sin id en la respuesta» del central queda como está y va a issue) |
| 14 | `edit-proveedor:399` actualizar persona (`onSave`) | «Error al actualizar la persona» encima del genérico | sin aviso propio |
| 17 | `ajustar-costo-dialog:182` (**alta**) | «No se pudo guardar el ajuste de costo.»; reintentar duplica la fila y la notificación | rechazo: nada; corte: «No se pudo confirmar si se guardó el ajuste de costo: revisá antes de repetir.» y cierra con `true` |
| 18 | `ajustar-stock-lote-dialog:454` | «No se pudo guardar el ajuste.» | rechazo: nada; corte: `avisoTrasMutacion` y queda (cantidad absoluta: si ya se aplicó, repetir lo rechaza el central) |

Commit `fix(generics): no tapar el motivo del rechazo en el resto de los modulos`. Cada fase: `npm run check`,
`npm run verificar:imports`, spec de `graphqlErrorUtils` en verde y `git status` limpio antes del push.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **12, 15 (alta de persona):** `persona.documento` es UNIQUE en el central (`persona_un_documento`): reintentar no
  duplica, lo rechaza la restricción. Se saca el bloqueo de Guardar. Tras un corte se vuelve a verificar el documento
  (`onDocumentVerification`, donde exista), que ofrece usar la persona si quedó creada. El `error:` de esa
  verificación no se usa para desbloquear nada.
- **20 (cobro con tarjeta al cancelar una venta):** el central ya cancela las `venta_tarjeta` al cancelar la venta; la
  llamada del desktop al filial es un respaldo. Avisar un corte haría saltar el aviso en cada cancelación de un desktop
  sin filial. Solo se avisa un **rechazo**, con el motivo (es silenciosa): «La venta se canceló, pero la sucursal
  rechazó cancelar su cobro con tarjeta: <motivo>.» (8 s). El corte queda en `console.warn`. `ok === false` (venta sin
  tarjeta) no es un fallo. Se tocan las 5 llamadas (dos copias en `list-venta` y `generic-list-venta`).
- **7 (retiro):** el diálogo lo abre `utilitarios-dialog`, que no recarga nada: `close(true)` sirve para sacar al cajero
  del diálogo y que no reintente. Aviso de 8 s.
- **4 (nominar):** en un rechazo el genérico ya mostró el motivo: «Factura actualizada, pero no se nominó.» sin repetirlo.
- **2 (replicación):** con timeout del link no se suma aviso (ya avisó); solo el texto en el log del diálogo. Tras un
  corte `closeAfterResult` devuelve `true` para que la lista recargue. Los otros ~14 `catchError` iguales del servicio
  van a la issue nueva.
- **8 (timbrado):** `esAlta` se calcula antes de la mutación (`onGuardar` muta el objeto).
- **Recargas diferidas (11, 19 y 9/10):** con el patrón de `programarRecargaTrasFallo` (flag `destruido`, set de timers
  limpiado en `ngOnDestroy`). En `edit-inventario`, tras un corte, se relee el inventario a los 5 s con la consulta que
  ya existe.
- **6 (transferir caja):** el aviso del corte dice que, si se transfirió, la pestaña ya no corresponde.
- **1 (impresora):** rechazo o timeout del link: nada; corte: «No se pudo confirmar si se imprimió en X.» (una prueba
  repetida solo gasta papel).
- **21 (perfil facial):** solo un rechazo (`erroresDeRechazo`) muestra el motivo; el timeout de rxjs y lo demás siguen
  como «error de conexión».
- **13, 14, 16:** la rama «respuesta sin id» (`else`) queda como está en todos (va a la issue del central).
- **22:** son 25 usos en 15 archivos más el spec; no tocar el método privado homónimo de
  `list-control-stock-negativo.component.ts`.
- **Líneas:** las del inventario están desfasadas (+9 a +28); se ubica cada punto por su método al implementar.

| Hallazgo | Severidad | Qué se hizo |
|---|---|---|
| Bloquear Guardar en el alta de persona (la persona no se duplica) | alta/media | re-verificación del documento, sin bloqueo |
| Aviso de cobro con tarjeta falso tras un corte | media | solo rechazo |
| El padre del retiro no recarga | media | texto y propósito del cierre corregidos |
| Nominar repite el motivo | media | texto sin motivo |
| Replicación: aviso doble en timeout, sin recarga tras corte, catchError hermanos | media | sin aviso en timeout, `true` al cerrar, hermanos a issue |
| `close(true)` recarga antes de que el central termine | media | aceptado: el aviso dice «revisá»; las listas con recarga propia usan 5 s |
| Inventario sin recarga tras corte | baja | relectura a los 5 s |
| Timers sin guarda de destrucción | baja | patrón `programarRecargaTrasFallo` |
| Resto de detalles (impresora, perfil facial, `else`, conteo, líneas) | baja | anotados arriba |

## Fuera de alcance (a issues nuevas)

- **Nominar una factura electrónica desde «Editar» falla siempre** (verificado leyendo el código, no ejecutado):
  `updateFacturaLegal` guarda el cliente en su transacción y después `nominarFacturaElectronica` rechaza porque la
  factura ya tiene cliente («La factura ya está nominada»). Toca el central.
- `ProveedorGraphQL.saveProveedor` traga las excepciones que no sean `proveedor_un` y devuelve la entidad sin guardar:
  el genérico muestra «Guardado con éxito» y la pantalla después «Error al guardar el proveedor».
- Doble aviso verde en éxito (`edit-inventario`, proveedor): el genérico y la pantalla.
- Las 58 + 25 llamadas sin aviso en un corte.

## Tests

- Spec de `mensajeDeError` movida (6 casos) dentro de `graphqlErrorUtils.spec.ts`, en verde.
- `npm run check` y `npm run verificar:imports` antes de cada push.

## Prueba de runtime

Central 8084 (worktree de `develop`) y desktop 4201; filial local 8082 para los puntos que van al filial (5, 6, 7, 20);
usuario 608 con ADMIN temporal. Interceptor de XHR (rechazo con campo inexistente, corte a un puerto cerrado). Casos:
7 (retiro con corte: cierra, sin segundo intento), 8 (timbrado con rechazo: sin «[object Object]»), 11 (lote con
corte: recarga a los 5 s), 12 (persona con corte: Guardar bloqueado), 17 (costo con corte), 2 (replicación con
rechazo: un solo aviso; **sin** ejecutar de verdad la replicación), 20 (cancelar venta con la cancelación de tarjeta
rechazada: aviso), 1 (impresora con corte).

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop; no cambia operaciones GraphQL ni el genérico.
