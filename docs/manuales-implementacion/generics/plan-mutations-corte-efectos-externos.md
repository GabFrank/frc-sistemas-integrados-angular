# Plan: aviso tras un corte en escrituras con efecto externo (issue #501, tanda 4a)

Rama `fix/mutations-corte-resto`, sale de `develop`. Tandas anteriores: #515 (dinero y stock), #517 (PDV), #520 (replicación). La tanda 4 («el resto de bajo riesgo») va en dos PRs por pedido de Franco: este (4a) junta lo que imprime, manda algo afuera o duplica un alta; el 4b, lo idempotente de bajo impacto.

## Fuera de la tanda (relevamiento del paso 3)

- Ya resueltos en `develop`: `onCancelarPorVentaId` (los 5 sitios, con `avisarCancelacionTarjetaRechazada`), `onActualizarCotizacionesMercado` desde compras, `probarEnBackend` de impresoras, el alta de detalle de timbrado y `onIncorporarEmbeddingMarcacion`.
- Sin puerta en la UI: `formato-qr-pos` (`onDesactivar`) y `producto.onQrCode()` (dentro de un bloque comentado del template; además sin `subscribe`).
- Van por HTTP directo, no por el genérico: `instalarSmbEnServidorPorIp` y `compartirColaEnServidorPorIp` de impresoras.

## Regla

Decide `erroresDeRechazo(err)`:

- **Rechazo:** el genérico ya mostró el motivo y no se aplicó nada; sin aviso propio (hoy varios suman un segundo aviso).
- **Timeout del link:** ya avisó; sin aviso propio (`esTimeoutDeLink`), pero los diálogos con efecto externo se cierran igual.
- **Sin respuesta:** pudo aplicarse. Se avisa «No se pudo confirmar si…» (salvo el timeout del link, que ya avisó). Lo que tiene efecto externo (papel, correo, push) **no se deja repetir a ciegas**: se cierra el diálogo. Lo idempotente se puede repetir, y donde hay una lista se recarga a los 5 s (`RECARGA_TRAS_CORTE_MS`).

## Cambios

| # | Dónde | Backend y reintento | Hoy | Cambio |
|---|---|---|---|---|
| 1 | `adicionar-impresora-dialog.instalarEnBackend` → `instalarImpresoraCups` (filial o central) | `lpadmin`: idempotente, crea una cola CUPS real | corte: silencio. Además la query no tiene el alias `data:` que lee el genérico: el resultado llega `undefined` y la pantalla siempre dice «No se pudo instalar», aunque la cola se haya creado (auditoría del plan) | corte: «No se pudo confirmar si se instaló la cola: revisá la lista de colas antes de repetir.» Se agrega `data:` a la query |
| 2 | ídem `instalarRecursoSmb` → `instalarImpresoraSmb` | idempotente | `mensajeSmb` = «No se pudo instalar la cola.» en los dos casos (doble en rechazo, engañoso en corte) | rechazo: sin mensaje propio; corte: «No se pudo confirmar si se instaló la cola: revisá la lista antes de repetir.» |
| 3 | `list-impresoras.reactivar` → `reactivarCola` | idempotente, pero libera los trabajos retenidos (sale papel) | «No se pudo imprimir en X: no se pudo reactivar la cola» (texto de imprimir, doble en rechazo) | rechazo: nada; corte: «No se pudo confirmar si se reactivó la cola…» y recarga del estado de colas a los 5 s (si se reactivó, el botón desaparece) |
| 4 | `enviar-factura-correo-dialog.enviar` → `enviarFacturaLegalPorCorreo` (central) | **no mira si ya se envió: repetir manda otro correo** | corte: silencio y el botón queda habilitado | corte: «No se pudo confirmar si se envió el correo: revisá antes de reenviarlo.» y se cierra el diálogo |
| 5 | `imprimir-en-sucursal-dialog.confirmar` → `imprimirTicket/PdfFacturaEnImpresora` (central → filial) | **repetir imprime otra vez** | «No se pudo imprimir en la sucursal.» en los dos casos y el diálogo queda listo para repetir. El `false` del central también puede ser un corte entre el central y el filial (`PrintRouterService.proxyImprimir`), y hoy deja repetir (auditoría del plan) | rechazo: nada; corte o `false`: «No se pudo confirmar la impresión: revisá la impresora antes de repetir.» y se cierra el diálogo. El `false` mezcla ese corte con «impresora o factura no encontrada»: cerrar es el lado seguro, se vuelve a abrir si hace falta |
| 6 | `ultimas-ventas-dialog.reimpresionVenta` → `reimprimirVenta` (filial) | repetir imprime otra vez | sin `error`: corte en silencio | corte: «No se pudo confirmar si se reimprimió la venta X: revisá la impresora antes de repetir.» El éxito sigue siendo `res != null`: el filial devuelve `false` al reimprimir una factura aunque imprima (`VentaGraphQL.reimprimirVenta`), cambiarlo daría un falso fallo. Ese mismo `false` sale si la venta no existe y hoy se muestra como éxito: queda anotado, no se toca |
| 7 | `add-timbrado-dialog` → `saveTimbrado` (central) | **un alta repetida inserta otro timbrado** | sin `error`: corte en silencio con el diálogo abierto | el patrón de `add-timbrado-detalle-dialog`: aviso y, si era alta, se cierra con `true` para que la lista recargue |
| 8 | `notificacion-personalizada.enviar` → `enviarNotificacionPersonalizada` (central) | **repetir manda otro push a todos** | «Error al enviar la notificación» en los dos casos (doble en rechazo, engañoso en corte) | rechazo: nada; corte: «No se pudo confirmar si se envió la notificación: revisá antes de reenviarla.» y se cierra el diálogo |
| 9 | `reconocimiento-facial-helper.guardarFotoPerfilConEmbeddingMaestro` → `saveUsuarioImage` (central) | reemplaza la foto y el embedding: repetir es seguro | «Error al guardar la foto de perfil» en los dos casos (doble en rechazo, engañoso en corte). Y un `false` del central (`saveUserImage` devuelve `saved`) se muestra como éxito (auditoría del plan) | rechazo: nada; corte: «No se pudo confirmar si se guardó la foto de perfil. Podés volver a intentarlo.»; `false`: «No se pudo guardar la foto de perfil.» En los tres devuelve `false`. La galería se arma fuera del `try`, así un error local no se toma por un corte |

## Tests

Sin helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop servido estático e interceptor de XHR (corte, rechazo, respuesta armada, aplicado, colgado). Central propio en el 8084 con `replication.sync/refresh` apagados; filial propio en el 8082 con SIFEN apagado para la reimpresión. Lo que tiene efecto externo se prueba **cortado o rechazado** (no sale del navegador, o el servidor rechaza la consulta inválida sin ejecutarla) y sus respuestas `true`/`false` se arman en el interceptor: nunca llega al backend un pedido que instale una cola, mande un correo o un push, o imprima. El central local tiene IP reales de las sucursales y tokens de push válidos (auditoría del plan). Para la foto de perfil, la cámara se reemplaza por un `canvas` con una foto si el modelo facial la acepta; si no, se pregunta antes de informar.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop.
