# Plan: aviso tras un corte en escrituras de bajo impacto (issue #501, tanda 4b)

Rama `fix/mutations-corte-bajo-impacto`, sale de `develop`. Segunda parte de la tanda 4 («el resto de bajo riesgo»); la 4a (efecto externo) es #522. Todo lo de acá es idempotente: repetirlo deja lo mismo, así que alcanza con avisar y, donde hay una lista, recargar.

## Regla

Decide `erroresDeRechazo(err)`:

- **Rechazo:** el genérico ya mostró el motivo; sin aviso propio.
- **Sin respuesta:** `avisoTrasMutacion` (null en el timeout del link, que ya avisó) y recarga a los 5 s (`RECARGA_TRAS_CORTE_MS`) donde hay una lista.
- **`false` del backend** (varios resolvers atrapan la excepción y devuelven `false`): aviso «No se pudo…», hoy silencio.

## Cambios

| # | Dónde | Backend | Hoy | Cambio |
|---|---|---|---|---|
| 1 | `list-marcacion` ajustar jornada a 8 h y guardar observación (central) | idempotentes; devuelven `null` si la jornada no existe | sin `error`: corte en silencio; `null` en silencio | corte: aviso y recarga a los 5 s; `null`: «No se pudo ajustar/guardar…» |
| 2 | `notificaciones-tablero.service` `setTokenFcm` (central) | idempotente, nunca rechaza (devuelve `false`) | abre «Guardando…» en cada login y al abrir la campana, algo que el usuario no pidió | `silentLoad`. Sin aviso propio: es de fondo. Con el central colgado 60 s el link igual avisa el timeout (`onCustomMutation` no pasa `silenciarAvisoTimeout`); se acepta, callarlo pide tocar el genérico (auditoría del plan) |
| 3 | ídem `marcarComoLeida` | idempotente, nunca rechaza | spinner «Guardando…» al abrir una notificación; corte: error sin capturar | `silentLoad`; en el tablero, `error` sin aviso (la tarjeta queda sin leer, se ve) |
| 4 | `notification-board.changeEstadoTablero` (menú de la tarjeta) | idempotente, nunca rechaza | sin `error`; un `false` deja la tarjeta como estaba sin decir nada | corte o `false`: aviso y recarga de las dos columnas (a los 5 s tras un corte) |
| 5 | ídem `drop` (arrastrar) | ídem | `error` revierte (bien) pero no avisa ni recarga, y el servidor pudo aplicarlo; un `false` recarga las columnas (la tarjeta vuelve sola) sin avisar | `false`: aviso (la recarga ya la devuelve; revertir a mano además chocaría con la recarga); corte: revierte, avisa y recarga a los 5 s (auditoría del plan) |
| 6 | `default.component.marcarTodasComoLeidas` | idempotente, nunca rechaza | `subscribe()` vacío: corte en silencio | corte: aviso y refresco a los 5 s; `false`: aviso |
| 7 | `producto.component.onFileInput` (imagen de la presentación) | sobrescribe el archivo: idempotente | sin `error`; `res2 != null` también toma `false` como éxito | éxito solo con `true`; `false`: «No se pudo guardar la imagen. Volvé a subirla.» (el central borra la anterior antes de copiar: no hay que decir que se mantiene, auditoría del plan); corte: «No se pudo confirmar si se guardó la imagen: podés volver a subirla.» |
| 8 | `vizualizar-imagen-dialog.onFileInput` | ídem | la vista previa toma la imagen **antes** de guardar, y al cerrar devuelve la entidad con esa imagen aunque haya fallado (también con el recorte cancelado) | la imagen se asigna solo con `true`; `false` y corte avisan |
| 9 | `sugerencias-imagen-panel.recortarYGuardar` | ídem | un error corta la cadena sin aviso; `false` en silencio | corte: aviso; `false`: «No se pudo guardar la imagen» |
| 10 | `cambio.component.onActualizarCotizaciones` | nunca rechaza (devuelve `false`, ya avisado) | en un corte recarga al instante y sin aviso | corte: aviso y recarga a los 5 s |
| 11 | `list-terminal-pos.onDesasignarFormato` | idempotente; bloquea la venta con tarjeta de la terminal | sin `error`: la fila sigue mostrando el formato aunque se haya quitado; `false` (terminal inexistente) en silencio | corte: aviso y recarga a los 5 s; `false`: aviso |
| 12 | `formato-terminal-pos.onDesactivar` | idempotente; rechaza si hay terminales con el formato | sin `error`; cualquier respuesta, también `false` (id inexistente), dice «Formato desactivado» | corte: aviso y recarga a los 5 s; éxito solo con `true`, `false` avisa (auditoría del plan) |

Las recargas diferidas van con `timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this))`.

## Fuera de alcance

- `formato-qr-pos` y `producto.onQrCode()`: sin puerta en la UI.
- Llamadores ya resueltos en `develop` (detalle en el plan de la 4a).

## Tests

Sin helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop servido estático con el interceptor (corte, rechazo, respuesta armada, aplicado, colgado), central propio en el 8084 con `replication.sync/refresh` apagados. Todo es idempotente y vive en la base local, así que el «aplicado» se puede probar de verdad donde sume; los datos que se toquen se restauran. En imágenes, el aplicado borra y reescribe el archivo de la presentación: se respalda antes; el `false` se arma en el interceptor.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop.
