# Plan — errores de red en los formularios de bienes (issue #390, PR 11f-2)

Pieza: **desktop**. Rama: `fix/activos-errores-de-red-en-formularios-de-bienes`, desde `origin/develop` **después del
merge de #417** (toca los mismos cuatro formularios y `ente.service.ts`; usa `planSinCalcular` y el opt-in de
`onGetByReferenciaId` que agrega #417). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`,
`TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `esRechazoDelServidor`, `esTimeoutDeLink`. Relevamiento: el del bloque de
activos (auditor de solo lectura, 2026-10-05, con el central); el formulario de equipo, su servicio de diálogo, su
servicio, el de vehículo y el panel de archivos releídos a mano. Todo va al **central**.

Alcance: los formularios de **equipo, mueble, inmueble y vehículo** — carga del bien, carga del ente y de las cuotas,
y guardado. El **panel de archivos** va en un PR propio (11f-2b); listas y vinculaciones en 11f-3; GPS en 11f-4.

## Regla (la de #391–#417)

No se guarda sobre datos que no se cargaron. Un `null` por error no es «no hay cuotas». Un alta sin respuesta pudo
haberse aplicado: no se reintenta a ciegas ni se afirma «no se guardó». Un aviso por flujo.

## 1. Abrir un bien que no carga: guardar crea otro (fase 1) [verificado]

Los cuatro formularios hacen lo mismo al abrir un bien existente: `registroGuardado = true` y piden el bien con
`onBuscarPorId` (sin `errorConf`, que no emite ante **ningún** error). Si no llega, el formulario queda **vacío con
los valores por defecto** (costo 0, monto 0, situación «pagado», 1 cuota…) y sin `id` (el id se carga recién con
los datos). Si el usuario completa lo obligatorio y guarda, el `input` sale **sin id** → el central **crea un bien
nuevo**, y como `registroGuardado` ya era `true` el diálogo se cierra como si hubiera editado. En vehículo lo frena
la chapa única del central (queda un error visible).

Cambio: `onBuscarPorId` de los cuatro servicios gana `errorConf?` / `contexto?` (opt-in; un solo llamador cada
uno). El formulario lleva un estado de carga del bien (`nuevo` / `cargando` / `ok` / `error`): mientras `cargando`
o con `error` **no se puede guardar**; con `error` un cartel «No se pudo cargar el bien» con «Reintentar».

## 2. Cuotas que no cargan: guardar regenera el plan (fase 1) [verificado]

`cargarEnteYCuotas` (copiado en los cuatro): pide el ente y, anidado, las cuotas, las dos sin `errorConf` ni
`error:`. Si cualquiera falla, `cuotasDetalle` queda en `[]` sin aviso (y `[]` y `null` se tratan igual). Al
guardar un bien en **«pagando»** con la lista vacía, el formulario manda `cuotasDetalle = undefined` y el central
**regenera todas las cuotas** desde cantidad / monto / pagadas: se pierden los ajustes manuales y las marcas de
pagado que puso Gastos. El mismo riesgo existe **sin fallo**: entre que carga el bien y llegan las cuotas (dos
consultas encadenadas) Guardar ya está habilitado. Además `enteId` queda vacío y el panel de archivos nunca sube
los pendientes.

Cambio: una sola implementación compartida (`EnteService.cargarEnteYCuotas(tipo, referenciaId)`, que propaga red y
GraphQL en las dos consultas y devuelve `{ enteId, cuotas }`; «sin ente» y «sin cuotas» siguen siendo resultados
válidos). El formulario lleva un estado de cuotas (`sin-cargar` / `cargando` / `ok` / `error`): con `cargando` o
`error` no se puede guardar; con `error` un cartel «No se pudieron cargar las cuotas del bien: guardar así
regeneraría el plan» con «Reintentar». Las cuotas cargadas reemplazan siempre a las que hubiera (hoy solo si
vienen no vacías).

## 3. Guardar (fase 2) [verificado]

`onGuardar` de los cuatro servicios usa el `onSave` genérico sin `errorConf`: con error de red **no emite** (el
formulario no se entera; el modal «Guardando…» se cierra y el botón sigue activo) y con error del servidor el
`subscribe` del formulario, sin `error:`, deja una excepción sin capturar. Un bien **nuevo** guardado «sin
respuesta» queda con `form.id` vacío: el reintento **crea otro bien** (el central no tiene unicidad en equipo,
mueble ni inmueble; en vehículo, la chapa). El central tampoco es atómico: si falla la sincronización financiera,
el bien y su ente ya quedaron guardados y el cliente recibe un error → el reintento crea otro.

Cambio: `onGuardar` de los cuatro servicios propaga el error de red (un solo llamador cada uno). El formulario
lleva `guardando` (sin doble Guardar) y `error:`:
- **Rechazo del servidor** (`esRechazoDelServidor`): el genérico ya avisó; queda abierto y se puede corregir.
  **Excepción**: en un alta, el rechazo pudo ocurrir después de guardar el bien (central no atómico) → se trata
  como «sin confirmar» igual que abajo, salvo en vehículo (la chapa única hace seguro el reintento).
- **Edición sin respuesta** (hay id): aviso «No se pudo confirmar el guardado: podés volver a intentar».
- **Alta sin respuesta** (equipo, mueble, inmueble): Guardar queda **bloqueado** con un cartel «No se pudo
  confirmar si el bien se guardó. No vuelvas a cargarlo sin revisar: cerrá y buscalo en la lista» y un botón
  «Cerrar» que cierra refrescando la lista. Sin «verificar»: estos bienes no tienen un dato único por el que
  buscarlos.
- Tras guardar bien, si falla la recarga de ente y cuotas, aplica el punto 2 (cartel y Guardar bloqueado hasta
  reintentar): no se guarda de nuevo con las cuotas sin leer.

Sin cambio: el panel de archivos (11f-2b), los buscadores de modelo / tipo / marca / proveedor / moneda de los
formularios y sus altas auxiliares (11f-3), `pre-registro` de vehículo (11f-3), el editor de cuotas (#417).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Para el issue de **central** ya anotado: guardado
del bien atómico (bien + ente + financiero), y no regenerar las cuotas cuando no vienen en el pedido.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(activos): no guardar un bien que no cargo ni con sus cuotas sin leer` | 1, 2 |
| 2 | `fix(activos): no duplicar un bien cuando el guardado queda sin respuesta` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Con el central vivo se crea **en la base local** un equipo de
prueba en «pagando» (con cuotas) para tener un bien que editar. Casos, sobre equipo y repetidos en vehículo:
1. Abrir el bien con el central congelado → cartel, Guardar bloqueado; reanudar + Reintentar → carga.
2. Abrir con la consulta de cuotas fallida (simulada) → cartel de cuotas, Guardar bloqueado; Reintentar → carga las
   cuotas con sus marcas de pagado.
3. Editar y guardar normal → las cuotas guardadas no cambian (se compara antes y después).
4. Guardado sin respuesta (mutation reemplazada por un error; no se envía nada): en edición, aviso y reintento; en
   alta, bloqueo + cartel + Cerrar; un segundo Guardar no envía nada.
No se guarda nada con el central congelado.

## Riesgos y qué queda sin verificar

- Son cuatro formularios casi iguales: el cambio se hace una vez y se replica; mueble e inmueble se prueban por
  lectura del diff y un caso cada uno.
- Tratar un rechazo del servidor en un alta como «sin confirmar» bloquea también ante un error de validación
  legítimo (el usuario tiene que cerrar y volver a cargar). Se revisa en la auditoría qué rechazos puede devolver
  el central antes de guardar, para no bloquear de más.
- Depende de #417: si cambia en la revisión, este plan se ajusta.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### División: este PR es la carga; el guardado va aparte

Cuatro formularios × (estados + carteles + guardado) no entran en un PR. Se parte, con la lógica común en un solo
lugar:

| PR | Alcance | Plan |
|---|---|---|
| **11f-2** (este) | Carga del bien y de sus cuotas en los 4 formularios; bloqueo de Guardar | este documento, secciones 1 y 2 |
| 11f-2b | Guardado: error de red, alta sin confirmar, cierre refrescando | propio (la sección 3 queda como insumo) |
| 11f-2c | Panel de archivos de ente | propio |

**Lógica común en `activos/shared/`** (hoy está copiada cuatro veces): una clase de estado del formulario de bien
(sin Angular Material ni `MatDialogRef`: vehículo se abre en diálogo **o** en pestaña, así que recibe callbacks)
que lleva los estados y calcula el bloqueo, y un componente chico para el cartel con sus variantes. Cada formulario
queda con pocas líneas propias.

### Cuándo bloquean las cuotas
- **Según la situación con la que se CARGÓ el bien, no la del control actual.** Si el bien era «pagando» y sus
  cuotas no cargaron, también hay que impedir que el usuario lo pase a «pagado» y guarde: el central **borra todas
  las cuotas** (incluidas las pagadas) cuando el bien deja de estar en «pagando». El cartel dice «guardar perdería
  las cuotas del bien».
- **Si el bien cargado no era «pagando», no hay cuotas que leer**: no se piden ni se bloquea. Si después se elige
  «pagando», el plan arranca vacío (correcto: no había).
- **La consulta del ente solo sirve para el panel de archivos** (`enteId`): si falla, se avisa pero **no** bloquea
  el guardado. Solo bloquea la falla de las cuotas de un bien que era «pagando».
- `cargarEnteYCuotas` compartido devuelve `{ enteId: número | null, cuotas: lista | null }` (`cuotas = null` si no
  se pidieron). «Sin ente» en un bien ya guardado es válido (el central pudo no haberlo creado): no es error.

### Un solo campo para el botón
`[disabled]="form.invalid || guardarBloqueado"`, con `guardarBloqueado` recalculado en cada cambio de estado (regla
del repo: sin funciones en el HTML; los formularios son OnPush). Bloquean: bien `cargando` o `error`; cuotas
`cargando` o `error` **solo si el bien cargado era «pagando»**; `planSinCalcular` de #417 (con el control en
«pagando»). Un bien nuevo nunca queda bloqueado por carga.

### Cuotas que llegan tarde
Cuando el formulario le pasa cuotas al editor, el editor las toma como buenas y cancela un recálculo pendiente. Si
el usuario ya cambió cantidad o monto y la carga llega después, quedaría la tabla vieja con los valores nuevos.
Mientras las cuotas están `cargando` (carga inicial y recarga tras el primer guardado de un alta), los campos de
cantidad, pagadas y montos y el editor quedan **deshabilitados**, además de Guardar.

### Otras precisiones
- No hay otras consultas de carga sin manejar: propietario, modelo, tipo, proveedor y moneda vienen en la misma
  consulta del bien (todo o nada). El central no borra el propietario si llega vacío.
- La prueba 3 se acota a **abrir y guardar sin tocar**: recalcular por cambio de cantidad o monto no conserva las
  marcas de pagado por cuota (las deriva de «cuotas pagadas»); eso es del editor, no de este PR.
- Vehículo: cuatro diferencias (diálogo o pestaña, control «nuevo», `input` plano, cuotas al tope del `input`);
  la carga es igual.

### Para el issue de central (se suma a lo anotado)
- Cada guardado de un bien «pagando», aun sin tocar nada, **borra y vuelve a insertar todas las cuotas** y
  recalcula los vencimientos como hoy + n meses: se pierden las fechas de vencimiento y los ids de cuota. El
  desktop ni siquiera recibe la fecha de vencimiento para devolverla.
- Pasar un bien de «pagando» a otra situación borra todas sus cuotas, incluidas las pagadas.
- Inmueble: el desktop no manda `esPropio` y el central lo pone en verdadero y limpia los datos de alquiler →
  editar un inmueble alquilado lo resetea (no es de red; no se toca acá).

### Lo que queda para el 11f-2b (guardado)
- En un alta de equipo, mueble o inmueble, **cualquier** error (rechazo o sin respuesta) es «sin confirmar»: el
  central guarda el bien, después crea el ente y después sincroniza lo financiero, en transacciones separadas, y
  casi todos sus errores salen como «No se pudo guardar…» aunque el bien ya esté guardado. Única excepción segura:
  el mensaje exacto «El proveedor seleccionado no es válido» en mueble, inmueble y vehículo (se valida antes de
  guardar). En vehículo el rechazo es recuperable (chapa única).
- «Cerrar refrescando»: en diálogo, cerrar con `true`; en la pestaña de vehículo nadie refresca la lista → hay que
  llamar al refresco antes de quitar la pestaña.
- Sin «verificar»: identificador y nombre no son únicos y las búsquedas son por texto parcial.
- Si el guardado devuelve datos junto con un error, se toma el id como confirmado.

## Fases de este PR

| Fase | Commit |
|---|---|
| 1 | `fix(activos): no guardar un bien que no cargo` (estado de carga del bien, clase común, cartel) |
| 2 | `fix(activos): no guardar un bien en cuotas con sus cuotas sin leer` (carga compartida de ente y cuotas, bloqueo según la situación original) |

## Prueba de runtime de este PR

Los casos 1 a 3 de arriba (el 4 va con 11f-2b), más: bien que **no** era «pagando» con la consulta de cuotas
«fallida» → no bloquea; bien «pagando» con cuotas sin cargar → no deja pasarlo a «pagado» y guardar; campos de
cuotas deshabilitados mientras cargan. En el caso 3 se comparan cuotas (número, monto, pagado) y monto total antes
y después de guardar sin tocar.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Con las cuotas sin leer, pasar el bien a «pagado» y guardar borra todas las cuotas | alta | bloqueo según la situación original |
| A | Un bien que no era «pagando» no tiene cuotas: bloquearlo no tiene sentido; la falla del ente no debe bloquear | alta | regla explícita |
| A | En un alta, un rechazo del central no garantiza que no se guardó (transacciones separadas) | alta | pasa al 11f-2b con la regla |
| A | «Cerrar refrescando» no existe en la pestaña de vehículo | alta | pasa al 11f-2b |
| B | Tres estados más en un `[disabled]` sin funciones en el HTML | alta | un campo `guardarBloqueado` recalculado |
| A | Cuotas que llegan tarde pisan la tabla y cancelan el recálculo | media | campos de cuotas deshabilitados mientras cargan |
| A | Guardar sin tocar ya resetea vencimientos e ids de cuota en el central | media | anotado para el issue de central; prueba acotada |
| B | Tamaño | media | carga acá, guardado en 11f-2b, archivos en 11f-2c; lógica común en `shared/` |
| A | Sin otras consultas de carga; `esPropio` del inmueble; diferencias de vehículo | baja | anotado |
| A/B | Los 4 formularios abren igual; `form.id`, `cerrar` y `registroGuardado` como dice el plan; regla del central para las cuotas; sin unicidad en equipo, mueble e inmueble | — | verificado |
