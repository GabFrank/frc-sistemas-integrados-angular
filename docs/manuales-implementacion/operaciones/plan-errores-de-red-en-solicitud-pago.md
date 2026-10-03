# Plan — errores de red en solicitud de pago (issue #390, PR 7c)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-solicitud-pago`, desde `origin/develop` **después del
merge de #403** (comparte `pedido.service` y usa el `errorConf?`/`contexto?` opcional de
`cambio.getUltimoCambioPorMonedaId` que agrega #403). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`,
`TIMEOUT_CONSULTA_DE_FONDO_MS`, `TIMEOUT_POR_DEFECTO_MS`. Relevamiento: auditor de solo lectura sobre
`operaciones/solicitud-pago/` y `gestion-compras/solicitud-pago-compra` (2026-10-03), cada suscriptor leído; los
puntos de dinero (borrado de detalle, cotización, cheques en cuotas) releídos a mano. Todo va al **central**.
Skill: `frc-financiero-expert` (la `SolicitudPago` es la única verdad de la deuda con el proveedor).

## Regla (la de #391–#403)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`: 20 s dentro de un diálogo
(cotización, monedas, formas de pago), 60 s para listados y la carga de una solicitud. Un fallback que hoy es
inalcanzable y **escribe un valor inventado** (cotización del maestro, «éxito» de un borrado que falló) se
reescribe antes de volverlo alcanzable. Un `null` (error GraphQL) se trata como fallo donde importa.

## 1. Plata (fase 1)

- **Borrar un detalle de pago** (`solicitudPagoService.onEliminarSolicitudPagoDetalle`, `onDelete` genérico con
  `showDialog=false`): el genérico emite `null` **también ante un error de red o GraphQL**, y
  `create-edit-solicitud-pago:427` (`onEditarDetalle`) lo toma como éxito y **agrega el detalle nuevo**: el detalle
  queda **duplicado** y el monto a pagar se dobla. `:488` (`onQuitarDetalle`) saca la fila de la pantalla aunque
  siga en el servidor. Cambio: en ese método del servicio (un solo llamador, dos usos) un resultado distinto de
  `true` pasa a `error` (no se toca el `onDelete` genérico, que usan decenas de pantallas).
- **Editar un detalle = borrar + agregar, no atómico** (`onEditarDetalle`): si el agregar falla, el detalle ya se
  borró y la pantalla sigue mostrando el viejo. Cambio: en ese error se recarga la solicitud
  (`loadSolicitudParaEdicion`) y se avisa «La forma de pago anterior se eliminó pero la nueva no se guardó».
- **Cheques en cuotas** (`adicionar-forma-pago:321`, `forkJoin` de N altas): si falla una, las otras ya quedaron
  creadas, el diálogo sigue abierto y un reintento **duplica** cheques. Cambio: las altas van **en secuencia**
  (`concat`) y, si una falla, el diálogo se cierra devolviendo las ya creadas con aviso «Se guardaron X de N
  cuotas: revisá antes de agregar las que faltan».
- **Cotización de la forma de pago** (`adicionar-forma-pago:188`, `prefillCotizacionMercado`): sin respuesta la
  cotización queda vacía y el `valor` queda con el **monto en guaraníes interpretado como moneda extranjera**; la
  cotización no es requerida y el detalle se guarda sin ella. Con error GraphQL, o con el `error:` hoy
  inalcanzable, cae a `moneda.cambio` (el del maestro, posiblemente viejo) y recalcula el valor **sin avisar**.
  Cambio (patrón de la nota de recepción en #403): opt-in con 20 s silencioso (sin el modal «Buscando…» de
  300 s), descartar la respuesta si la moneda cambió, con error o sin tasa de mercado **ni** manual → cotización
  vacía, `valor` sin recalcular y aviso «No se pudo obtener la cotización: ingresala a mano»; la cotización pasa a
  **requerida y > 1** mientras se muestra (moneda extranjera). El fallback a `moneda.cambio` se elimina solo para el
  caso de error; si el servidor responde con la tasa manual registrada (`valorEnGs`) se sigue usando, como hoy.

## 2. Carga del diálogo de la solicitud (fase 2)

- **Solicitud en edición** (`create-edit:174`, `SolicitudPagoService.onGetById` sin `errorConf`): sin respuesta
  el diálogo queda vacío e inerte (los botones dependen de datos que no llegan: no hay escritura mala). Cambio:
  `errorConf` + 60 s en el servicio (sus suscriptores: `create-edit:174` y `edit-pago:150`, este último sin
  ninguna pantalla que lo abra, con `error:`); `null` tratado como error; el `error:` existente cierra con aviso.
  **No se relajan** los guards de Guardar: el backend reemplaza la lista de notas al actualizar.
- **Monedas y formas de pago** (`create-edit:228, :237`, `onGetAll` genérico, que nunca emite si falla; 38 y 9
  suscriptores): opt-in con métodos propios (`MonedaService.onGetAllEnSegundoPlano`, que ya existe, y uno nuevo
  para formas de pago, 20 s); si faltan, aviso con «Reintentar» y **«Agregar forma de pago» bloqueado** (el diálogo
  recibe esas listas por copia al abrirse y los totales en Gs usan `moneda.cambio`).
- **Guardar sin respuesta** (`onSave` genérico, que en error de red no emite): `saving` queda en `true` para
  siempre. Cambio: `timeout` + aviso «No se pudo confirmar el guardado: revisá la lista antes de reintentar» (pudo
  haberse guardado).
- **Agregar notas a la solicitud** (`create-edit:279-321`): la nota se muestra y suma antes de la mutación; si
  falla, queda a la vista. Cambio: si la mutación falla, se quita de la pantalla y se avisa.

## 3. Listados (fase 3)

Propagar en el servicio (todos sus suscriptores están en este PR y tienen `error:`), 60 s:
- `onGetSolicitudesPorPedido` (`solicitud-pago-compra:94`): `loading` trabado (overlay y «Crear» deshabilitado);
  con `null` TypeError dentro del `map` del servicio y `loading` no baja → `loading` en `finalize`, `null` → error.
- `onGetNotasDisponiblesParaPago` (`solicitud-pago-compra:116`): «Crear solicitud» deshabilitado sin explicación →
  aviso, `?? []`.
- `onGetSolicitudesPagoPaginated` (`list-solicitud-pago:132`, `solicitud-pago-dashboard:73`): en la lista quedan
  **las filas del filtro anterior** bajo los filtros nuevos; en el tablero el spinner no termina → al fallar se
  vacía la tabla con «No se pudo cargar» + «Reintentar»; el tablero baja su spinner.
- `onGetNotasDisponiblesParaPagoPorProveedorPaginated` (`adicionar-nota:74`): `loading` trabado; en una recarga
  fallida quedan filas viejas con la página nueva → aviso y la página no avanza.
- `pedido.onGetNotaRecepcionById` (`list-solicitud-pago:286`, «Ver nota»): sin respuesta, modal «Buscando…» hasta
  300 s; con `null` abre la nota **vacía** con valores por defecto (cotización 1) como si fuera real → propagar
  (un llamador), sin modal, `null` → aviso y no se abre.
- **Borrar una solicitud** (`solicitud-pago-compra:201`, `onDelete` genérico con su propia confirmación): pide
  confirmar **dos veces**; si se rechaza la segunda, `loading` queda trabado; si falla, avisa «eliminada
  exitosamente» igual → un solo confirm, resultado distinto de `true` = error con aviso.

Sin cambio: mutaciones que ya propagan (`onActualizarEstado`, `onCancelar`, `onAgregar*`, `onRemover*`,
`onImprimir*`), el buscador de proveedores (diálogo compartido, fuera de alcance), `edit-pago` (sin pantalla que lo
abra; hereda el cambio del servicio).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no duplicar formas de pago ni guardarlas sin cotizacion` | 1 |
| 2 | `fix(operaciones): avisar cuando no carga el dialogo de solicitud de pago` | 2 |
| 3 | `fix(operaciones): avisar cuando no cargan los listados de solicitudes de pago` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. La base local puede crear datos: con el central **vivo** se arma
una solicitud de prueba en PENDIENTE (no se paga). Con el central **congelado**: editar/quitar una forma de pago
(no se duplica ni desaparece), agregar una en dólares (cotización vacía y requerida), abrir la solicitud
(monedas, formas, carga), listados y «Ver nota». El caso «borrado falla y agregar no» y el de cheques parciales
se fuerzan congelando entre una mutación y la siguiente si es viable; si no, por código. **Nada se paga.**

## Riesgos y qué queda sin verificar

- Con el central lento, agregar una forma de pago en moneda extranjera exige tipear la cotización.
- Un guardado sin respuesta puede haberse hecho en el servidor: se avisa que se revise antes de reintentar.
- Las altas de cheques en secuencia tardan N idas y vueltas en vez de una tanda.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Mutación sin respuesta = resultado incierto** (el link corta a los 60 s y el servidor pudo haberla aplicado). Por
  eso, ante **cualquier** fallo de una mutación de detalle o de nota (borrar, agregar, quitar, editar, notas, cheques
  parciales) la solicitud se **recarga desde el servidor** en vez de corregir la pantalla a mano, con aviso «revisá
  antes de reintentar».
- **Recarga confiable**: `loadSolicitudParaEdicion(recarga = true)` asigna siempre `notas = sp.notasRecepcion ?? []`
  y `detalles = sp.detalles ?? []` (hoy no limpia si vienen vacías), no pisa el formulario si el usuario lo editó,
  y si la recarga falla avisa **sin cerrar** el diálogo.
- **Guardados** (`onSave` genérico ya acepta `errorConf`): `onSaveInput` y `onActualizarSolicitudPago` reciben
  `{ networkError: { propagate: true } }`; sin `timeout` de rxjs (el link ya corta y avisa «pudo haberse
  aplicado»). Los **3** llamadores (`create-edit:803` crear desde «Agregar nota/forma», `:837`, `:847`) bajan
  `saving` en su `error:`. En `:803`, si no hubo respuesta, la solicitud **pudo haberse creado** y `solicitudPagoId`
  queda vacío: la siguiente acción crearía **otra solicitud (deuda duplicada)**. Se marca `creacionIncierta`, se
  bloquean «Agregar nota», «Agregar forma de pago» y «Guardar», y se avisa «No se pudo confirmar si la solicitud se
  creó: cerrá y revisá la lista antes de seguir».
- **Cotización de la forma de pago**:
  - `cambio == null` (error GraphQL, indistinguible de «sin cambio») ya **no** cae a `moneda.cambio` etiquetado
    «manual»: se trata como falla. La tasa manual (`valorEnGs`) se usa solo si vino del servidor.
  - Al fallar se **vacía `valor`** (requerido), además de la cotización; y al tipear la cotización a mano en una
    forma nueva el `valor` se recalcula desde el monto sugerido en Gs (hoy solo se actualiza el display).
  - Al cambiar de moneda se vacía la cotización anterior antes de consultar.
  - La exigencia «requerida y > 1» se aplica en altas; un detalle existente sin cotización se puede editar con aviso.
- **Monedas y formas de pago**: `null` o lista vacía cuentan como «faltan» (mismo aviso y «Reintentar»).
  `FormaPagoService` no tiene variante que propague: se agrega `onGetAllFormaPagoParaDialogo` (`onCustomQuery` con
  `PROPAGAR_ERROR_DE_RED`, 20 s) sin tocar `onGetAllFormaPago`.
- **Notas agregadas a una solicitud guardada**: contador por nota y recarga al final (hoy el primer fallo baja
  `saving` y el contador nunca llega a N).
- **`solicitud-pago-compra`**: `finalize` para `loading` y `loadingNotas`.
- **Cheques en cuotas**: tras un cierre parcial (incluido 0 creadas) el padre **recarga** la solicitud en vez de
  confiar en las filas devueltas; el aviso dice «puede haber alguna más».

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Crear la solicitud desde «Agregar nota/forma» sin respuesta deja el id vacío: la próxima acción crea otra solicitud | alta | `creacionIncierta` bloquea y avisa |
| B | Cotización vacía o tipeada a mano deja `valor` en Gs interpretado como moneda extranjera | alta | se vacía `valor` al fallar; al tipear se recalcula |
| B | `cambio == null` (error GraphQL) seguía cayendo a `moneda.cambio` como «manual» | alta | se trata como falla |
| B | La recarga propuesta no limpia notas/detalles vacíos, pisa el formulario y cierra al fallar | alta | recarga propia |
| B | Una mutación sin respuesta es incierta en borrar/quitar/editar, no solo en agregar | alta | recarga en todo fallo de mutación |
| A | `timeout` de rxjs sobre `onSave` sería inadecuado (el link ya corta; la mutación seguiría viva) | media | `errorConf` de `onSave`, sin `timeout` |
| A | `saving` trabado en los 3 llamadores de guardar | media | baja en su `error:` |
| A | Monedas/formas con `null` o `[]` pasaban como cargadas | media | cuentan como faltantes |
| A | Notas en lote: el contador no llega a N tras un fallo | media | contador por nota + recarga |
| B | Cheques: cierre parcial (o 0) confía en filas devueltas | media | el padre recarga |
| B | Notas optimistas: quitar a mano es ambiguo | media | recarga |
| A | `finalize` faltaba en `loadingNotas` | baja | agregado |
| B | Cotización > 1 bloquearía editar detalles viejos sin cotización | baja | solo en altas; edición con aviso |
| A | `onSave` con error GraphQL y `data` emite `next` | baja | se verifica al implementar |
| A/B | Líneas citadas, mecánica de `onDelete`/`onCustomQuery`/`onCustomMutation`, `onGetAllEnSegundoPlano`, suscriptores, integración de cheques con el padre | — | verificado |

## Implementación: desvíos respecto del plan (2026-10-03)

- **Bloqueo común** (`accionBloqueada`): con un guardado en vuelo, una creación sin confirmar o la pantalla
  desactualizada (una mutación sin confirmar y la recarga sin llegar) se bloquean guardar, agregar nota/forma,
  quitar y editar; Guardar reemplaza notas y formas de pago con lo que se ve.
- **Editar una forma de pago** también se bloquea sin monedas o formas de pago (el diálogo no mostraría la
  cotización y el detalle volvería sin ella).
- **Creación incierta**: un error de red, o la «Respuesta vacía del servidor», cuentan como inciertos; un error de
  negocio (el servidor respondió que no) no.
- **Cotización al editar un detalle existente**: no se consulta al abrir (se respeta la guardada; antes se pisaba
  con la de hoy); se consulta si el usuario cambia la moneda.
- **Cheques**: «Confirmar» no admite doble clic mientras se guardan en secuencia.
- **Cotización con modal**: `getUltimoCambioPorMonedaId` sigue abriendo «Buscando…» (ahora hasta 25 s, no 300):
  mientras tanto no se puede tocar el diálogo, lo que además evita confirmar con el valor de la moneda anterior.
- **Listas y tablero**: al fallar se vacía la tabla y se avisa (sin botón «Reintentar»: se reintenta con
  «Buscar»/«Filtrar»). En «Adicionar nota» la página sí avanza; la tabla queda vacía con aviso.
- **Borrar una solicitud**: sin el confirm propio del genérico (había dos); un fallo recarga la lista.

## Prueba de runtime (paso 9, 2026-10-03)

Central local `:8081` (worktree de pruebas, sin perfil, `ReplicationPublicationSyncScheduler` y
`ReplicationRefreshScheduler` en *Did not match*), congelado con `kill -STOP` + respaldo `kill -CONT`; desktop
`ng serve -c web`. Con el central vivo se creó en la base local la solicitud **10** (pedido 3, una nota, efectivo
60.000 Gs, PENDIENTE). No se pagó nada.

| Caso | Resultado |
|---|---|
| Crear la solicitud de prueba (vivo) | se creó la 10 con la forma de pago; monedas 4, formas 5 |
| Eliminar la forma de pago 1 congelado | a los 61 s aviso del link + «No se pudo confirmar que la forma de pago se eliminó»; la fila **queda**; recarga fallida → «no está al día», Guardar y Agregar bloqueados con aviso (antes: «éxito» y la fila desaparecía) |
| Reanudar y reabrir | el detalle 1 sigue en el servidor; pantalla al día |
| Forma de pago en DOLAR congelado | cotización vacía al instante, a los 20 s aviso «ingresala a mano», valor vacío, formulario inválido; cotización 1 → `cotizacionInvalida`; 5880 → válido (58.800 Gs) |
| Lista filtrada (CONCLUIDO) congelado | tabla vacía (no quedó la fila PENDIENTE del filtro anterior) + aviso |
| «Ver nota» congelado | aviso, no se abre una nota vacía |

No probado en runtime (por código): editar = borrar + agregar con el agregar fallido, cheques en cuotas parciales,
creación incierta, notas en lote, `solicitud-pago-compra` y tablero, casos `null`.

## Auditoría del diff (paso 8, 2026-10-03)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Editar una forma de pago con monedas caídas la guardaba sin cotización | alta | «Editar» bloqueado sin monedas/formas |
| Segunda creación posible mientras la primera estaba en vuelo | media | bloqueo con `saving` |
| Recarga fallida dejaba Guardar activo con datos viejos (Guardar reemplaza notas y formas) | media | `pantallaDesactualizada` bloquea las acciones |
| «Respuesta vacía del servidor» se tomaba como error de negocio al crear | media | cuenta como incierta |
| El modal de cotización se redujo pero no se quitó | media | documentado (mitiga confirmar con el valor de la moneda anterior) |
| Al abrir un detalle existente se pisaba su cotización con la de hoy | baja | no se consulta al abrir |
| Respuesta tardía de cotización sin descartar con sugerido nulo | baja | el contador se incrementa siempre |
| Doble clic en Confirmar durante las altas en secuencia | baja | flag `guardando` |
| `edit-pago` (sin pantalla) falla mudo; doble aviso al fallar el borrado de solicitud; listas sin «Reintentar»; avisos repetidos de listas | baja | aceptado / documentado |
| Suscriptores de todo lo que cambió, `null`, recarga, notas en lote, `creacionIncierta`, cotización, cheques, `finalize` | — | verificado sin hallazgos |
