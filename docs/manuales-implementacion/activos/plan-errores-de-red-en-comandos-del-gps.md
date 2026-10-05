# Plan — errores de red en GPS y mapas (issue #390, PR 11f-4)

Pieza: **desktop**. Rama: `fix/activos-errores-de-red-en-gps-y-mapas`, desde `origin/develop`. No depende de #420
(no toca los formularios de bienes). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`,
`TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `esRechazoDelServidor`, `esTimeoutDeLink`. Relevamiento: el del bloque de
activos (auditor de solo lectura, 2026-10-05); el diálogo de configuración del GPS, su servicio, el mapa y
`GpsService.enviarComando` del central releídos a mano. Todo va al **central**.

## Regla (la de #391–#420)

Un comando que no se pudo confirmar no se muestra como aplicado. Un resultado negativo del servidor no es un éxito.
Un `null` por error no es «no hay». Un aviso por flujo.

## 1. Comandos al GPS: el corte de motor se muestra como aplicado sin estarlo (fase 1) [verificado]

`gps-config-dialog` envía los comandos (`MOTOR_ON` / `MOTOR_OFF`, modo sueño, intervalo, APN) con
`gpsService.onEnviarComando`. El central devuelve **`false`** cuando el GPS no existe, **no está conectado** o el
comando no se reconoce, y `true` cuando lo **escribió en el socket** (no espera confirmación del equipo). El
diálogo, en `next`, **ignora el resultado**: marca `gps.motorBloqueado`, `gps.modoSueno` o `gps.intervaloReporte`
como si se hubiera aplicado, sin ningún aviso. El interruptor queda en «MOTOR BLOQUEADO» aunque el comando nunca
salió.

Con error:
- **Error de red** (la mutation propaga, sin aviso): el `error:` solo apaga el spinner. No hay aviso y el
  interruptor queda en el valor pedido.
- **Corte propio a los 10 s** (`timeout(10000)` de RxJS): corta la espera del diálogo **pero no el pedido**, que
  sigue vivo hasta 60 s: el comando puede llegar al GPS después, con el diálogo ya mostrando otra cosa. Sin aviso.
- El diálogo se abre con el GPS de la fila de la lista (cargado quizá hace rato): el estado del motor que muestra
  puede estar viejo.

Cambio:
- Un solo camino para los cuatro comandos. Resultado **`true`** → se actualiza el estado y se avisa «Comando
  enviado al GPS» (enviado, no «aplicado»: el central no espera la confirmación del equipo). Resultado **`false`**
  o `null` → **se revierte** el control al último valor conocido y se avisa «No se pudo enviar el comando: el GPS
  no está conectado».
- **Sin respuesta** (red, corte): el comando pudo haber salido. Aviso «No se pudo confirmar si el comando llegó al
  GPS» y se **relee el GPS** del central (que guarda el estado cuando envía) para mostrar lo que consta; si la
  relectura tampoco responde, el control vuelve al último valor conocido y queda un cartel «Estado sin confirmar:
  cerrá y volvé a abrir antes de enviar otro comando», con los botones de comando deshabilitados.
- El corte de 10 s pasa a ser el del link (`timeoutMs` de la mutation), que **sí** cancela la espera del pedido y
  avisa; se quita el `timeout` de RxJS.
- Al abrir, el diálogo relee el GPS; si no puede, cartel «El estado puede estar desactualizado» con «Reintentar».
- Al cerrar, la lista de GPS se refresca.

## 2. Alertas del GPS (fase 1) [verificado]

`onGuardarAlerta` (`onGuardarConfigAlertas`): con error de red, sin aviso y los controles quedan en lo pedido; si
el central devuelve `null`, tampoco avisa. Cambio: mismo criterio — éxito actualiza y avisa; sin resultado o error,
se revierte a lo guardado y se avisa.

## 3. Mapa, lista y formulario de GPS (fase 2) [verificado]

- **Mapa** (`list-mapas`): `onSearch('')` y `onGetByVehiculoId` sin `errorConf` ni `error:`. Con `null`,
  `gpsList.filter` / `gpsList.length` → TypeError (en `onVehiculoSelect`, después de **borrar todos los
  marcadores**: el mapa queda vacío); con error de red no pasa nada y no avisa. Cambio: propagar, `error:` con
  aviso «No se pudieron cargar las posiciones» y **sin borrar** los marcadores que había; `null` = fallo.
- **Lista de GPS** (`gpsService.refrescar` → `onSearch`, `onGetByTexto`): el `error:` es inalcanzable → `loading`
  queda en `true`; con `null` la lista queda vacía («no hay GPS»). Cambio: propagar red y GraphQL; ante error,
  `loading = false`, se conserva la lista y un estado de error que la pantalla muestra con «Reintentar».
- **Alta / edición de GPS** (`gps.component` y `gps-dialog-service`): `onSave` genérico sin propagar → con error de
  red el diálogo queda abierto sin aviso; con rechazo, excepción sin capturar. El IMEI es único en la base →
  reintentar es seguro. Cambio: propagar + `error:` + `guardando`; sin respuesta, aviso «podés volver a intentar:
  si ya se había guardado, el servidor rechaza el IMEI repetido».
- **Eliminar GPS** (`onDelete`): con error de red emite `null` sin ningún aviso. Cambio: aviso «No se pudo
  confirmar la eliminación» y se refresca la lista.

## 4. Código sin llamadores (fase 3)

Se borra, en vez de arreglarlo: `gpsService.onGetList` y `onGetByImei`; en `vehiculo.service`,
`onBuscarTodosVehiculosSucursal`, `onBuscarVehiculosPorSucursal`, `onBuscarVehiculoSucursalSearchPage`,
`onBuscarVehiculoSucursalPorVehiculo` y `onFiltrarModelos`; en `ente.service`, `onBuscarPagina` y `onEliminar`. Se
confirma con `git grep` que no tienen llamadores (ni en templates) y se quitan también los GQL que queden sin uso.

Sin cambio: `gps-websocket.service` (posiciones en vivo por STOMP; no pasa por el genérico), el buscador de
vehículo del mapa y del formulario (compartido), listas y vinculaciones de activos (11f-3), archivos (11f-2c).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Para el issue de **central**: `enviarComando`
devuelve `false` por tres motivos distintos sin decir cuál; marca el estado (motor bloqueado, sueño, intervalo) al
**escribir** en el socket, sin esperar la confirmación del equipo; y la clave del equipo está fija en «0000».

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(activos): no mostrar como aplicado un comando al gps que no se envio` | 1, 2 |
| 2 | `fix(activos): avisar cuando no cargan las posiciones ni la lista de gps` | 3 |
| 3 | `refactor(activos): quitar consultas de gps, vehiculo y ente sin llamadores` | 4 |

(La fase 3 es `refactor`: no cambia comportamiento y no libera versión.)

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. En local no hay ningún GPS conectado: **ningún comando llega a
un equipo real** (el central responde `false` por «no conectado», que es justo el caso a probar). Si la base local
no tiene GPS, se crea uno de prueba con el central vivo.
1. Configuración: enviar corte de motor con el GPS desconectado → aviso «no está conectado», el interruptor vuelve
   a su valor, `motorBloqueado` no cambia. Resultado `true` simulado → «Comando enviado», estado actualizado.
2. Comando sin respuesta (congelado y simulado): aviso, relectura; con la relectura fallida, cartel y botones
   deshabilitados.
3. Alertas con error simulado: se revierten y avisa.
4. Mapa: elegir un vehículo con la consulta fallida → los marcadores no se borran, aviso; lista de GPS congelada →
   cartel + Reintentar.
5. Alta de GPS sin respuesta (simulada) → aviso y reintento; eliminar con error de red simulado → aviso.

## Riesgos y qué queda sin verificar

- No se puede probar un comando contra un equipo real desde esta máquina: el camino `true` se simula.
- «Enviado» sigue sin ser «aplicado»: el desktop solo puede mostrar lo que el central informa. Queda anotado para
  el central.
- El mapa en vivo (websocket) no se toca ni se audita acá.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### División: este PR es solo el diálogo de configuración del GPS

| PR | Alcance | Plan |
|---|---|---|
| **11f-4** (este) | Comandos y alertas del diálogo de configuración del GPS (secciones 1 y 2) | este documento |
| 11f-4b | Mapa, lista de GPS, alta / edición y eliminar (sección 3; incluye una vista de error que hoy no existe) | propio |
| limpieza | Código sin llamadores (sección 4), como `refactor` en un PR aparte: son bajas en servicios compartidos y un revert del fix no debe arrastrarlas | propio |

Rama de este PR: `fix/activos-errores-de-red-en-comandos-del-gps`.

### Qué informa el central (corrige la sección 1)
- `enviarComando` devuelve `false` por **cuatro** motivos: GPS inexistente, no conectado, comando no reconocido, o
  una excepción — y esa excepción envuelve también la actualización del estado, así que **puede devolver `false`
  con el comando ya escrito**. `true` sale tras una escritura asíncrona: tampoco prueba que el comando salió.
- El central marca el estado (motor, sueño, intervalo) al **enviar**; después, si el equipo responde OK a motor o
  sueño, lo vuelve a marcar. **Nunca lo revierte** si el equipo no responde. Intervalo y APN no se confirman. La
  telemetría no trae el estado de corte.
- Conclusión: el estado guardado es «lo último enviado o confirmado», nunca «falló». El desktop no puede saber si
  el motor está realmente cortado; puede dejar de afirmar lo que no sabe.

### Qué muestra el diálogo
- **Estado que consta en el servidor, aparte del interruptor**: una línea por control («En el servidor: motor
  bloqueado / encendido / sin dato») y, mientras el interruptor difiere de eso, una marca «sin enviar». Hoy el
  interruptor se mueve antes de apretar el botón de enviar y se lee como si fuera el estado.
- **`null` es «sin dato», no «encendido»**: hoy `!motorBloqueado` muestra «MOTOR ENCENDIDO» cuando el campo viene
  vacío (ver el hallazgo de abajo), el sueño cae en «apagado» y el intervalo en 30.
- El diálogo trabaja sobre una **copia** del GPS (hoy muta el objeto de la fila de la lista) y relee el GPS al
  abrir; al cerrar refresca la lista.

### Resultado de un comando
| Resultado | Qué hace |
|---|---|
| `true` | aviso «Comando enviado al GPS»; el estado del servidor pasa a lo enviado |
| `false` / `null` | aviso «El servidor no pudo enviar el comando (el GPS puede no estar conectado)»; el interruptor vuelve a lo que consta en el servidor |
| rechazo del servidor (arreglo) | sin aviso propio (el genérico ya avisó); el interruptor vuelve |
| corte del link | sin aviso propio (el link ya avisa «pudo haberse aplicado»); estado **sin confirmar** |
| error de red | aviso «No se pudo confirmar si el comando llegó al GPS»; estado **sin confirmar** |

- **Sin relectura automática**: como el central marca al enviar, releer no distingue «salió» de «no salió» (y el
  pedido puede seguir en vuelo). En «sin confirmar» queda un cartel fijo y un botón «Actualizar estado» que relee
  y muestra lo leído solo como «consta en el servidor».
- **No se deshabilitan los comandos** en «sin confirmar» (tiene que poder repetirse un corte de motor en una
  urgencia): el botón pasa a pedir una confirmación explícita antes de reenviar.
- **Corte**: 20 s por el link (`timeoutMs` de la mutation), que sí cancela la espera y avisa; se quita el
  `timeout` de RxJS. Queda el modal «Guardando…» del genérico durante el pedido; los spinners por botón siguen.
- Revertir un control se hace emitiendo el cambio (las etiquetas salen de `valueChanges`); nada se envía solo.

### Alertas
`updateConfigAlertas` solo escribe en la base (reintentar es inocuo) y puede devolver `null` si el GPS se borró. El
desktop manda siempre los cinco valores juntos: ante `null` o error se revierten **los cinco** controles a lo
guardado.

### Hallazgo para el issue de central (no es de red; se confirma en la prueba de runtime)
**Editar un GPS borra su estado**: `saveGps` arma un GPS nuevo con los seis campos del formulario y guarda encima,
dejando en vacío motor bloqueado, modo sueño, intervalo, alertas y última posición. Después de editar un GPS, un
motor cortado se muestra «MOTOR ENCENDIDO» y el central deja de emitir las alertas (las compara contra verdadero).
Sale de leer el código; se comprueba en local con un GPS de prueba. El desktop solo puede dejar de mostrar el vacío
como «encendido».

### Correcciones para el 11f-4b y la limpieza (ya anotadas)
- La lista usa `onGetByTexto`, que ante un error del servidor **no emite nada** (no `null`); `loading$` no lo
  consume nadie; propagar ahí requiere red **y** GraphQL. El TypeError del mapa está en `onVehiculoSelect`. Ante un
  fallo al filtrar por vehículo conviene **volver a la selección anterior** (conservar marcadores de otros
  vehículos engaña, y el websocket filtra por el vehículo elegido).
- Alta / edición de GPS: el único camino es `gps.component.onGuardar`; `gpsDialogService.onGuardar` / `onCancelar`
  no tienen llamadores. El mensaje del central por IMEI repetido no está verificado.
- Eliminar: error de red y rechazo llegan los dos como `null`; no se puede avisar distinto.
- Limpieza: tres nombres de `vehiculo.service` estaban mal (los reales: `onBuscarVehiculosSucursalPorVehiculo`,
  `…PorSucursal`, `…SearchPage`); quedan sin uso `GpsListGQL`, `GpsByImeiGQL`, `DeleteEnteGQL` y sus consultas.

## Fases de este PR

| Fase | Commit |
|---|---|
| 1 | `fix(activos): no mostrar como aplicado un comando al gps que no se envio` (resultado del comando, estado del servidor aparte, sin confirmar, corte por el link) |
| 2 | `fix(activos): avisar cuando no se guardan las alertas del gps` (alertas; relectura al abrir; copia y refresco) |

## Prueba de runtime de este PR

Los casos 1 a 3 de arriba, más: abrir un GPS con los campos de estado vacíos → «sin dato», no «encendido»;
«sin confirmar» → el reenvío pide confirmación; «Actualizar estado». Y la comprobación del hallazgo del central:
con el central vivo, marcar el estado de un GPS de prueba en la base local, editarlo desde el formulario y ver si
el estado queda vacío.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Editar un GPS deja vacío su estado en el central; el desktop muestra el vacío como «encendido» | alta | «sin dato»; al issue de central; se comprueba en runtime |
| A | `false` tiene cuatro motivos y puede venir con el comando ya escrito; `true` no prueba que salió | alta | textos que no afirman lo que no se sabe |
| A | El central confirma motor y sueño si el equipo responde, pero nunca revierte | alta | descripción corregida |
| B | Releer tras un comando sin respuesta no distingue nada | alta | sin relectura automática; «Actualizar estado» manual |
| B | El interruptor se lee como estado; revertirlo sin emitir no repinta las etiquetas | alta | estado del servidor aparte + «sin enviar»; se emite |
| A | Doble aviso en el corte del link y en el rechazo | media | sin aviso propio en esos dos |
| B | Deshabilitar los comandos bloquea una urgencia; 10 s es justo | media | confirmación explícita; 20 s |
| A | El diálogo muta la fila de la lista | media | copia + refresco al cerrar |
| A | Alertas: `null` posible; se mandan las cinco juntas | media | se revierten las cinco |
| B | El PR era grande; el borrado de código muerto en un fix | media | dividido en tres |
| A | Lista, mapa, formulario, eliminar y nombres de la limpieza | media | corregido para sus PRs |
| A/B | El diálogo ignora el resultado; el `timeout` de RxJS no cancela el pedido; `timeoutMs` del link sí; `gpsById` trae los campos; el websocket no pasa por el genérico | — | verificado |
