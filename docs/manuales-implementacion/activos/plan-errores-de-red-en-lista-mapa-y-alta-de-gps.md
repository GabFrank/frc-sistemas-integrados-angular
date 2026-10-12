# Plan: errores de red en la lista, el mapa y el alta de GPS (PR 11f-4b)

Parte de #390. Repo: desktop. Rama: `fix/activos-errores-de-red-en-lista-mapa-y-alta-de-gps` desde `origin/develop`
(no depende del #421: toca otros archivos, salvo `gps.service.ts`, en métodos distintos).

Sigue al 11f-4 (diálogo de configuración, PR #421). Queda afuera el código sin llamadores (PR de limpieza).

## Regla (la de #391–#421)

Una lectura que falla no se muestra como «no hay»; un guardado sin respuesta pudo haberse aplicado; un aviso por
flujo; respuestas viejas se descartan.

## 1. Lista de GPS (`gps.service.refrescar` + `list-gps`) [verificado leyendo]

- `refrescar()` usa `onSearch` → `onGetByTexto` sin `errorConf`. Ante un error de red **no emite nada**; ante un
  error del servidor muestra «Ups» y **tampoco emite**. Resultado: la lista queda como estaba (vacía en la primera
  carga: se lee «no hay GPS») sin aviso de red, y `loading$` queda en verdadero para siempre (hoy nadie lo mira).
- Al filtrar, una respuesta lenta de un texto anterior puede pisar a la del texto nuevo (no hay contador).

**Cambio**
- `onSearch(texto, errorConf?)`; `refrescar()` pide con red y GraphQL propagados (sin aviso del genérico: avisa el
  cartel) y lleva un contador para aplicar solo la última respuesta.
- Estado nuevo en el servicio: `listaEstado$`: `'cargando' | 'ok' | 'error'` y `listaDesactualizada$`.
  - Falla con **el mismo texto** que lo mostrado (refresco tras guardar, eliminar, cerrar la configuración): se
    conservan las filas y aparece el cartel «No se pudo actualizar la lista: puede estar desactualizada» + Reintentar.
  - Falla con **otro texto** (filtro nuevo) o en la primera carga: la tabla se vacía y el cartel dice «No se pudo
    cargar la lista de GPS» + Reintentar (no mostrar resultados de otra búsqueda como si fueran de esta).
- `list-gps`: el cartel va arriba de la tabla, con campos del componente (sin funciones en el HTML).

## 2. Mapa (`list-mapas`) [verificado leyendo]

- **Posiciones iniciales** (`cargarPosicionesIniciales` → `onSearch('')`): con error de red o del servidor no llega
  nada y el mapa queda **vacío sin aviso**, como si ningún vehículo tuviera posición.
- **Filtrar por vehículo** (`onVehiculoSelect` → `onGetByVehiculoId` → `onCustomQuery` sin `errorConf`):
  - error de red: nunca emite. El campo ya muestra el vehículo elegido y el filtro del websocket ya cambió, pero
    en el mapa siguen los marcadores de **todos** los vehículos: se lee como «este es el vehículo» y no lo es;
  - error del servidor: llega `null`; el código borra todos los marcadores y después revienta (`null.forEach`):
    mapa vacío.
  - sin contador: elegir dos vehículos seguidos puede dejar los marcadores del primero.

**Cambio**
- Las dos lecturas con red y GraphQL propagados, corte de fondo (20 s) y contador.
- Posiciones iniciales fallidas: cartel sobre el mapa «No se pudieron cargar las últimas posiciones: solo se ven
  los vehículos que reporten ahora» + Reintentar. (El websocket sigue agregando marcadores en vivo: el cartel lo
  dice en vez de ocultarlos.)
- Filtro por vehículo fallido: **se vuelve a la selección anterior** (campo, filtro del websocket y marcadores
  quedan como estaban) con el aviso «No se pudo cargar la posición del vehículo». Los marcadores se borran recién
  cuando la respuesta llegó bien.
- `onGetByVehiculoId(vehiculoId, errorConf?, contexto?)` en el servicio.

## 3. Alta y edición de GPS (`gps.component.onGuardar`) [verificado leyendo]

- `gpsService.onSave` → `onSave` genérico sin `errorConf`: el error de red **se traga**. El modal «Guardando…» se
  cierra, no hay aviso y el formulario queda abierto: el usuario no sabe si se guardó.
- El botón Guardar no se deshabilita mientras se guarda: doble clic manda dos altas (la segunda la rechaza el
  central por IMEI repetido, con un «Ups» que parece un fallo del alta).
- El IMEI es único en la base (`dispositivo_gps_imei_key`): un alta repetida **no duplica**. Por eso acá no hace
  falta bloquear el reintento (como en familia, PR #416).

**Cambio**
- `guardando` (botón deshabilitado), `take(1)`, `finalize`, `PROPAGAR_ERROR_DE_RED`.
- Rechazo del servidor: sin aviso propio (el genérico ya mostró el motivo).
- Sin respuesta (red; el corte del link ya avisa solo):
  - **alta**: «No se pudo confirmar si el GPS se guardó. Si al reintentar el servidor dice que el IMEI ya existe,
    ya estaba guardado»; al cancelar después de eso, la lista se refresca;
  - **edición**: «No se pudo confirmar si se guardó. Probá de nuevo» (repetir es inocuo).
- `gpsService.onSave(input, errorConf?)`.

## 4. Eliminar GPS (`gpsService.onDelete`) [verificado leyendo]

El `onDelete` genérico devuelve `null` tanto ante un error de red (**sin aviso**) como ante un rechazo (con «Ups»):
con la red caída el usuario confirma, no pasa nada y no se le dice nada.

**Cambio**: no se toca el genérico (lo usan muchos módulos). `gpsService.onDelete` pasa a confirmar con
`DialogosService.confirm` y borrar con `onCustomMutation`, que sí distingue:
- `true`: «GPS eliminado» y refresco; `false`: «El servidor no eliminó el GPS»;
- rechazo: sin aviso propio; corte del link: sin aviso propio, refresco;
- error de red: «No se pudo confirmar si el GPS se eliminó» y refresco de la lista.

## 5. Hallazgo aparte, no es de red: ids como texto y como número en el mapa [a confirmar en runtime]

GraphQL entrega los ids como texto (`"3"`) y el websocket como número (`3`). En `list-mapas`:
- con un vehículo elegido, `telemetria.vehiculoId !== selectedVehiculo.id` es siempre verdadero: **se descarta
  toda la telemetría en vivo** del vehículo filtrado (el mapa no se mueve);
- los marcadores se guardan por `gpsId`: el de la carga inicial queda con clave `"1"` y el de la telemetría con
  clave `1` → **dos marcadores para el mismo GPS**, uno quieto en la posición vieja.

**Propuesta (recomendada)**: incluirlo en este PR como fase aparte y chica (normalizar los ids a número en los dos
puntos), porque es el mismo componente y el arreglo del filtro (sección 2) queda a medias sin esto. Se confirma
antes en runtime inyectando telemetría simulada; si no se reproduce, no se toca.

## Persistencia, migraciones, replicación, multi-repo

Solo desktop. Sin migraciones ni cambios de schema GraphQL. Sin impacto en replicación.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(activos): avisar cuando la lista de gps no se pudo cargar` |
| 2 | `fix(activos): no dejar el mapa de gps vacio o con otro vehiculo ante un error de red` |
| 3 | `fix(activos): avisar cuando un gps no se pudo guardar o eliminar` |
| 4 | `fix(activos): no descartar la telemetria en vivo del vehiculo filtrado en el mapa` (si se confirma) |

`npm run check` antes de cada push.

## Prueba de runtime

Central local :8081 (schedulers de replicación apagados y verificados), desktop en el navegador, GPS de prueba
id 1 (sin posición: las posiciones se simulan reemplazando la respuesta del servicio; no hay acceso directo a la
base local).

1. Lista: central congelado en la primera carga → cartel «No se pudo cargar»; Reintentar con el central vivo.
   Central congelado al refrescar con filas → filas + «puede estar desactualizada». Filtro nuevo con fallo → vacía.
2. Mapa: posiciones iniciales con fallo → cartel + Reintentar. Filtro por vehículo con fallo de red y con error del
   servidor (simulado) → vuelve a la selección anterior, marcadores intactos. Dos selecciones seguidas → gana la última.
3. Alta: central congelado → aviso, formulario abierto; reintento con central vivo. Doble clic → un solo pedido.
   IMEI repetido → rechazo del central (se anota el mensaje real). Edición con central congelado.
4. Eliminar: cancelar, eliminar real (un GPS de prueba nuevo), error de red simulado.
5. Hallazgo de ids: telemetría simulada por `telemetria$` con un vehículo elegido y con la carga inicial hecha.

## Riesgos y qué queda sin verificar

- No hay equipo GPS real: la telemetría en vivo se simula.
- `onGetByTexto` abre el modal «Buscando…» en cada búsqueda; no se cambia.
- Editar un GPS borra su estado en el central (confirmado en el 11f-4): va al issue de central; el desktop no lo
  puede evitar porque el input no lleva esos campos.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Lecturas: por `onCustomQuery`, con un solo aviso
- `onGetByTexto` no acepta corte propio ni silencia el aviso del corte, y siempre abre «Buscando…». No se toca (es
  compartido). Las lecturas de este PR pasan a `onCustomQuery(gpsSearchGQL, { texto }, …)`:
  - **mapa**: en silencio, corte de 20 s, aviso del corte silenciado;
  - **lista**: con el modal «Buscando…» como hoy, corte de 20 s.
- En todas: red y GraphQL propagados **sin aviso del genérico** (`show: false`): avisa solo el cartel o el aviso del
  componente.

### Lista
- Un solo estado en el servicio (`estadoLista$`: `cargando | ok | error | desactualizada`), con el contador ahí.
- «Texto mostrado» = el de la **última respuesta buena**; contra ese se decide conservar o vaciar.
- `refrescar(texto?)` explícito. Se corrigen de paso tres caminos de `list-gps`: «Limpiar filtro» y Enter buscaban
  con el texto viejo (el nuevo llegaba 500 ms después), y un filtro nuevo no volvía a la primera página.
- Guardar refrescaba la lista dos veces (en `onSave` y al cerrar el formulario): queda solo el del cierre.
- `list-gps` es OnPush: `markForCheck` en la suscripción al estado.

### Mapa
- **Los ids primero (pasa a ser la fase 1)**: queda confirmado leyendo (GraphQL `ID` → texto; el websocket manda
  `Long` → número). Sin eso el filtro por vehículo no se puede probar. Se normaliza a número en `procesarTelemetriaWs`,
  en la clave de los marcadores y al armar el dato desde la lista. No toca el central.
- **Filtro por vehículo con «candidato»**: el vehículo elegido se asigna (campo, filtro del websocket, marcadores)
  recién cuando su lectura llegó bien. Si falla, nada cambió y solo hay un aviso. Vale también para **quitar el
  filtro** («Mostrar todos»), que el plan no cubría.
- **No retroceder marcadores**: una carga desde la base (inicial o Reintentar) no pisa un marcador que ya recibió
  telemetría más nueva (se guarda la fecha por marcador), y solo reencuadra el mapa en la primera carga buena.

### Alta y edición
- El texto ante IMEI repetido **no se promete**: el central no valida antes y lo más probable es un mensaje técnico
  de la base. El aviso del alta sin respuesta dice: «No se pudo confirmar si el GPS se guardó. Si al reintentar el
  servidor lo rechaza por un dato repetido, ya estaba guardado». El mensaje real se anota en la prueba y va al
  issue de central (validar el IMEI con un mensaje legible).
- Tras un alta sin confirmar, **Cancelar cierra con un valor que hace refrescar la lista** (hoy solo refresca si se
  guardó).

### Eliminar
- El `onDelete` genérico, además, **deja el modal «Eliminando…» abierto ~65 s cuando se cancela** la confirmación.
  El reemplazo lo evita: cancelar no llama al servidor ni abre nada.
- Se repiten el título y el mensaje actuales de la confirmación; el modal durante el pedido dirá «Guardando…».
- `false` es casi inalcanzable: con telemetría asociada lo esperable es un rechazo con texto técnico (clave
  foránea). Ante un rechazo se agrega un aviso propio claro: «No se pudo eliminar el GPS (puede tener telemetría
  registrada)». Es el único caso con dos avisos, a propósito: el del genérico es ilegible.

## Fases (reemplaza la tabla de arriba)

| Fase | Commit |
|---|---|
| 1 | `fix(activos): no descartar la telemetria en vivo del vehiculo filtrado en el mapa` |
| 2 | `fix(activos): avisar cuando la lista de gps no se pudo cargar` |
| 3 | `fix(activos): no dejar el mapa de gps vacio o con otro vehiculo ante un error de red` |
| 4 | `fix(activos): avisar cuando un gps no se pudo guardar o eliminar` |

## Prueba de runtime: casos que se agregan
«Limpiar filtro», Enter y página fuera de rango; cancelar la confirmación de eliminar (sin modal colgado);
telemetría de otro vehículo durante una selección fallida (el filtro no cambió); Reintentar posiciones con un
marcador más nuevo (no retrocede); un solo refresco tras guardar. Eliminar un GPS **con telemetría** no se puede
preparar en local (sin acceso a la base ni equipo): el rechazo se simula y queda dicho.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | `onGetByTexto` no admite corte de 20 s ni silenciar su aviso | alta | lecturas por `onCustomQuery` |
| A | Tras un alta sin confirmar, cancelar no refrescaba la lista | media | cierre con valor que refresca |
| A | «Limpiar», Enter, página fuera de rango y «Mostrar todos» del mapa sin cubrir | media | incluidos |
| B | Recargar posiciones podía mover un marcador hacia atrás y reencuadrar | media | fecha por marcador; encuadre solo la primera vez |
| A | Mensajes del central por IMEI repetido y por eliminar con telemetría: supuestos | media | textos propios que no los prometen; se anotan en la prueba |
| B | Doble aviso en lecturas (GraphQL y corte) | media | sin aviso del genérico |
| B | «Volver a la selección anterior» dejaba una ventana con el websocket filtrando por el candidato | media | patrón candidato |
| A | Cancelar eliminar deja el modal ~65 s | media | lo resuelve el reemplazo |
| B | Los ids no dependen de la prueba y condicionan la fase del mapa | media | fase 1, confirmada leyendo |
| A/B | Doble refresco al guardar; dos estados de lista; OnPush | baja | uno solo; un estado; `markForCheck` |
| A | Hechos de red de las secciones 1 a 4 | — | verificados |

## Implementación: desvíos (2026-10-05)

- **Mapa**: al elegir un vehículo o quitar el filtro la lectura muestra el modal «Buscando…» (es una acción del
  usuario y hasta que llega el campo sigue mostrando la selección anterior); la carga inicial y Reintentar son
  silenciosas, como decía el plan.
- **Lista**: el filtro con debounce usa el valor actual del campo, no el emitido: un texto que quedó esperando se
  volvía a aplicar después de «Limpiar filtro» (apareció en la prueba).
- **IMEI repetido**: el central devuelve el texto técnico de la base (ver la prueba). Ante un rechazo por
  restricción se agrega un aviso legible que no afirma la causa. Lo mismo al eliminar.
- `gpsService.onSearch` se quitó (quedó sin llamadores y no emitía ante errores).
- No tocado: `GpsDialogService.onGuardar` / `onCancelar` (sin llamadores) quedan para el PR de limpieza. La
  reconexión del websocket no recarga posiciones (previo).

## Prueba de runtime (2026-10-05)

Central local :8081 (schedulers de replicación apagados, verificado), desktop en el navegador. No hay equipo GPS
ni acceso a la base local: las posiciones, la telemetría y los errores se simularon reemplazando métodos del
servicio en el navegador, salvo donde dice «real».

| Caso | Cómo | Resultado |
|---|---|---|
| Lista: búsqueda nueva con el central congelado | real (`kill -STOP`) | corte a los 20 s, tabla vacía, cartel «No se pudo cargar la lista de GPS» |
| Lista: refresco fallido con filas | simulado | filas conservadas + «puede estar desactualizada» |
| Lista: Reintentar, «Limpiar filtro» | real | una sola búsqueda, con el texto actual |
| Lista: «Limpiar» con un texto esperando el debounce | real | el filtro queda vacío (falló en la primera pasada; corregido) |
| Lista: respuesta vieja después de la nueva | simulado | se descarta |
| Lista: página fuera de rango y filtro nuevo | simulado | vuelve a la primera página |
| Mapa: posiciones iniciales fallidas | simulado | cartel + Reintentar; al reintentar aparecen los marcadores |
| Mapa: ids | simulado | un marcador por GPS (clave numérica); la telemetría en vivo lo mueve |
| Mapa: Reintentar con un marcador más nuevo | simulado | no retrocede |
| Mapa: elegir vehículo con fallo | simulado | selección, campo y marcadores como estaban; aviso; la telemetría de otros vehículos sigue entrando |
| Mapa: vehículo elegido | simulado | entra su telemetría, se descarta la de otros |
| Mapa: dos selecciones seguidas | simulado | gana la última |
| Mapa: quitar el filtro con fallo / bien | simulado | sigue el filtro + aviso / todos los marcadores |
| Mapa: lectura de posiciones | real | sin error |
| Alta: doble clic | simulado | un solo pedido; botón deshabilitado |
| Alta sin respuesta | simulado | aviso, formulario abierto; Cancelar refresca la lista |
| Alta | real | se guarda, un solo refresco |
| Alta con IMEI repetido | real | el central responde «could not execute statement; … constraint [null]; … ConstraintViolationException»; se agrega el aviso legible |
| Eliminar: cancelar | real | no llama al servidor ni deja modal |
| Eliminar | real | «GPS eliminado», lista refrescada |
| Eliminar: error de red y rechazo | simulado | «No se pudo confirmar…» + refresco / aviso de rechazo |

Sin probar: un equipo real (telemetría real por websocket); eliminar un GPS con telemetría; el corte real de 20 s
en el mapa y al guardar (se probó el de la lista); la edición sin respuesta (mismo camino que el alta).

## Auditoría del diff (paso 8, 2026-10-05)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| El aviso por IMEI repetido salía ante cualquier restricción y afirmaba la causa | media | texto que no la afirma |
| El aviso «puede tener telemetría» salía ante cualquier rechazo al eliminar | media | solo ante una restricción de la base |
| Reintentar posiciones con un cambio de filtro en vuelo lo descartaba en silencio | baja | el reintento se ignora hasta que llegue |
| La fecha «yyyy-MM-dd HH:mm» no se entiende en todos los navegadores | baja | se parsea con «T» |
| El modal al elegir vehículo no era «en silencio» | baja | anotado como desvío |
| Fecha del websocket que no se puede leer | baja | sin cambio: se toma la hora de llegada |
| `GpsDialogService.onGuardar` sin llamadores | baja | PR de limpieza |
