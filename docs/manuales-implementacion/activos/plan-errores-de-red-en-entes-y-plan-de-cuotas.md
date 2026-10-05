# Plan — errores de red en entes y plan de cuotas de activos (issue #390, PR 11f-1)

Pieza: **desktop**. Rama: `fix/activos-errores-de-red-en-entes-y-plan-de-cuotas`, desde `origin/develop` (e3c2aab5).
No depende de #416. Usa `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s), `TIMEOUT_POR_DEFECTO_MS` (60 s).
Relevamiento: auditor de solo lectura sobre todo `src/app/modules/activos/` (2026-10-05, leído de `origin/develop`,
con el central para unicidad y validaciones); `ente.service`, `cuotas-detalle.service`, el editor de cuotas y
`list-bienes-sucursal` releídos a mano. Todo va al **central**.

## División del bloque de activos

El módulo no entra en un PR. Cuatro, cada uno con su plan:

| PR | Alcance |
|---|---|
| **11f-1** (este) | Servicio de entes (buscador que crea entes, lista de bienes por sucursal) y plan de cuotas |
| 11f-2 | Formularios de equipo, mueble, inmueble y vehículo (carga, guardado, cuotas al guardar, archivos) |
| 11f-3 | Listas, eliminar y diálogos de vinculación (ente-sucursal, inmueble-sucursal, ente-vinculación) |
| 11f-4 | GPS y mapas |

## Regla (la de #391–#416)

Un `null` (error GraphQL) es un fallo, nunca «no existe» / plan vacío / 0. Un monto o un plan de cuotas que no se
pudo leer o recalcular no se reemplaza por uno vacío ni se deja uno viejo sin avisar. Un stream de búsqueda no
muere con el primer error. Un aviso por flujo.

## 1. Buscador de ente: crea un ente duplicado si la búsqueda falla (fase 1) [verificado]

`EnteService.abrirBuscadorEnte` (lo usan 4 pantallas de activos y **3 de gastos**): tras elegir un bien, pide su
ente con `onGetByReferenciaId` (sin `errorConf`) y, si llega `null`, **crea uno** (`onGuardar`). Con un error del
servidor también llega `null` → se crea un **segundo ente** para un bien que ya tenía. El central no deduplica ni
tiene unicidad (tipo, referencia), y con dos entes para el mismo bien su búsqueda por referencia falla después:
el bien ya no se puede volver a guardar. Con error de red no pasa nada (ni aviso): quien abrió el buscador queda
esperando.

Cambio (sin cambiar la firma de `abrirBuscadorEnte`): `onGetByReferenciaId` gana `errorConf?` / `contexto?`
(opt-in: sus otros 7 llamadores son formularios y diálogos que van en 11f-2 / 11f-3). El buscador lo llama con red
y GraphQL propagados; ante error → aviso «No se pudo consultar el bien: no se seleccionó» y devuelve `undefined`
(lo mismo que cancelar; los llamadores ya lo manejan), **sin crear nada**. Solo un `null` sin error crea el ente.
El alta del ente pasa a propagar el error de red: si falla, aviso y `undefined` (si se había creado, la próxima
búsqueda lo encuentra: no se duplica).

## 2. Lista de bienes por sucursal: stream de búsqueda (fase 1) [verificado]

El constructor de `EnteService` arma la búsqueda con `combineLatest` + `switchMap` sobre `onCustomQuery` sin
`errorConf` ni `error:`. Con error de red `loading` queda en `true` para siempre; con error del servidor
(`if (res)`) queda la **lista y el resumen del filtro anterior** con los filtros nuevos a la vista — y esa pantalla
muestra montos pendientes, cuotas y estado de pago. Además cada emisión abre un modal «Buscando…» que el
`switchMap` no cierra al cancelar.

Cambio: consulta silenciosa (la pantalla ya tiene su `loading$`), con red y GraphQL propagados y `catchError`
**dentro** del `switchMap` (el stream sigue vivo). Ante error: `loading = false`, lista, total y resumen vacíos
(no quedan los del filtro anterior) y un estado `error$` que la pantalla muestra como cartel «No se pudieron cargar
los bienes» con «Reintentar» (`refrescar()`).

## 3. Plan de cuotas (fase 2) [verificado]

`CuotasDetalleService.calcularCuotas` (un solo llamador: el editor de cuotas, incrustado en los 4 formularios):
con un error del servidor convierte el `null` en `{ cuotas: [], montoTotal: lo tipeado o 0 }` y el editor lo emite
como **plan válido**: tabla vacía, `cuotasChange([])` y `montoTotalChange` al formulario. Si venía de editar una
cuota a mano, **se pierden los ajustes**. Con error de red no emite: la tabla queda con lo anterior sin recalcular
y sin aviso. Cada recálculo abre el modal «Buscando…».

Cambio: `calcularCuotas` propaga (red y GraphQL, silencioso, 20 s) y un `null` es error, no plan vacío. En el
editor, `catchError` **dentro** del `switchMap` (el recálculo sigue funcionando después de un fallo); ante fallo
**no se emite nada** (las cuotas y los ajustes que estaban se conservan), se muestra un cartel «No se pudo
recalcular el plan de cuotas: los montos de la tabla pueden no coincidir con lo cargado» con «Reintentar», y el
editor emite por un `@Output` nuevo (`planSinCalcular`) que el plan no está al día, para que el formulario no deje
guardar así (los formularios lo conectan en 11f-2; en este PR el editor ya lo emite y el cartel ya se ve).

## 4. Acciones de la lista de bienes por sucursal (fase 3) [verificado]

- **Editar** (`onEditar` → `getEnteSucursalByEnteId`): con `null`, `[0]` de `null` → TypeError; con error de red no
  pasa nada. La rama «sin asignación» usa `onBuscarPorId` sin `errorConf` → no emite ante ningún error.
- **Retirar de la sucursal** (`onRetirarDeSucursal` → `getEnteSucursalByEnteAndSucursal`): `.find` sobre `null` →
  TypeError; no retira ni avisa.
- **Estado «Pagado» por falta de datos** (`armarFila`): `montoPendiente || 0` y `cuotaPagada = … ||
  montoPendiente <= 0 || cuotasFaltantes <= 0` → si el monto pendiente no viene, la fila dice **Pagado**. Se
  verifica en la auditoría si la consulta puede traer esos campos en `null` para una fila legítima; si puede, un
  dato ausente se muestra como «—», no como pagado.

Cambio: los dos métodos del servicio ganan `errorConf?` / `contexto?` y dejan de romper con `null`; la lista los
llama propagando y con `error:` → aviso «No se pudo consultar la asignación del bien».

Sin cambio (van en sus PRs): formularios de bienes, diálogos de vinculación, listas de equipos / muebles /
inmuebles / vehículos, archivos de ente, GPS. El código sin llamadores (`onBuscarPagina`, `onEliminar` de ente)
se anota y se borra en 11f-4.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Para un issue de **central** (no se toca acá):
unicidad (tipo de ente, referencia) y `saveEnte` idempotente; `syncFromAsset` recalcula los vencimientos desde hoy
en cada guardado y regenera las cuotas pisando las marcadas como pagadas desde Gastos.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(activos): no crear un ente duplicado ni dejar la lista de bienes con datos de otro filtro` | 1, 2 |
| 2 | `fix(activos): no reemplazar el plan de cuotas por uno vacio cuando falla el calculo` | 3 |
| 3 | `fix(activos): avisar cuando no se puede consultar la asignacion de un bien` | 4 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos:
1. Bienes por sucursal, vivo y congelado: filtrar → cartel, sin la lista del filtro anterior, sin «cargando»
   eterno; recuperar con Reintentar y seguir filtrando (el stream no murió).
2. Buscador de ente desde un gasto o desde bienes por sucursal: con la consulta del ente fallida (simulada) **no
   se crea ningún ente** (se cuenta que el alta no se llama); con el bien ya con ente, lo devuelve.
3. Editor de cuotas en un formulario de bien: cambiar cantidad / monto con el central vivo (recalcula); con el
   cálculo fallido (congelado y simulado) la tabla **conserva** las cuotas, aparece el cartel y, al reanudar,
   Reintentar y un nuevo cambio recalculan.
4. Editar / retirar de la sucursal con la consulta fallida: aviso, sin TypeError.
No se guarda ningún bien ni ente con el central congelado.

## Riesgos y qué queda sin verificar

- Hasta el 11f-2, un formulario de bien todavía deja guardar con el cartel «no se pudo recalcular» a la vista (el
  editor ya avisa y ya emite el estado; falta que el formulario lo use).
- `abrirBuscadorEnte` lo usan tres pantallas de gastos: no cambia su firma ni lo que devuelve en el camino normal;
  ante error devuelve `undefined`, igual que al cancelar.
- El efecto visual del modal «Buscando…» huérfano se dedujo del código; se observa en la prueba.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Fases reordenadas

| Fase | Commit | Qué |
|---|---|---|
| 1 | `fix(activos): no crear un ente duplicado cuando falla la consulta del bien` | buscador de ente |
| 2 | `fix(activos): no mostrar como pagado ni con datos de otro filtro un bien que no se pudo leer` | lista de bienes por sucursal: stream, `armarFila`, editar y retirar |
| 3 | `fix(activos): no guardar un bien con el plan de cuotas sin recalcular` | servicio y editor de cuotas + bloqueo mínimo en los 4 formularios |

### Buscador de ente
- Lo llaman 4 lugares en 3 pantallas de activos y 3 pantallas de gastos; todos hacen `if (ente)` y ninguno limpia
  un campo ya cargado ante `undefined`.
- **Avisos**: la consulta va con `networkError` y `graphError` propagados y `show: false` (avisa el buscador, una
  vez). En el alta del ente, `onSave` ya avisa los errores del servidor: el buscador solo agrega su aviso si el
  error **no** es un arreglo y no fue el corte del link.
- **Cortes**: 20 s para la consulta del ente (hoy sin contexto son 300 s con el modal).
- El central ya crea el ente al guardar el bien: el alta desde el buscador solo ocurre con bienes viejos sin ente.
- `saveEnte` devuelve el ente sin `descripcion` y los llamadores la usan: se agrega `descripcion` a la selección
  de esa mutation (el central la llena).

### Lista de bienes por sucursal
- **Nadie consume `loading$`, `summary$` ni `sucursalId$`**: hoy el único indicador de carga es el modal
  «Buscando…» y lo que se ve ante un fallo es la lista vieja. Se corrige la descripción. La consulta pasa a
  silenciosa **y** la pantalla gana una barra de progreso ligada a `loading$`; 60 s de corte (la consulta recorre
  todos los candidatos).
- `error$` se limpia al empezar cada carga (junto con `loading = true`). Vaciar lista, total y resumen ante error
  no rompe nada (no hay selección ni exportación en esa pantalla).
- **«Pagado» por falta de datos es un bug real, con el servidor sano**: el central deja `montoPendiente` en `null`
  a propósito cuando el bien no tiene monto total (comodato, donado, o «pagando» sin monto). Hoy `null || 0` → `0
  <= 0` → la fila dice **Pagado** y «Pendiente Gs. 0». Cambio: `cuotaPagada` solo si la situación es `PAGADO` o si
  el pendiente **viene** y es ≤ 0; monto, pendiente y cuotas nulos se muestran «—».
- **Editar**: `entesSucursalesByEnteId` devuelve `[]` legítimo (sin asignación): eso no es error. `onBuscarPorId`
  sin `errorConf` ya avisa pero no emite; pasa a opt-in con `error:`. **Retirar**: se corrige la consulta previa;
  el borrado en sí (`onEliminarEnteSucursal`, silencioso ante red) va en 11f-3.

### Plan de cuotas: el bloqueo del guardado entra en este PR
- Los cuatro formularios mandan al guardar **las cuotas de la tabla**, y el central, si la lista no viene vacía, la
  guarda tal cual y calcula el total como pagado + suma. Una tabla sin recalcular se guardaría con la cantidad y
  el monto nuevos. Además, al silenciar el modal «Buscando…» el botón Guardar quedaría libre durante el recálculo
  (300 ms de pausa + hasta 20 s) aun con el central sano. Por eso **no** se deja para 11f-2:
  - El editor lleva un estado (`al día` / `calculando` / `error`) y emite `planSinCalcular` (`true` mientras
    calcula o si falló). Se emite solo desde el `subscribe` o desde un clic, nunca sincrónico en `ngOnChanges`
    (el componente es OnPush y dispararía `ExpressionChangedAfterItHasBeenChecked` en el padre).
  - Los 4 formularios (equipo, mueble, inmueble, vehículo) lo escuchan, deshabilitan Guardar y cortan en
    `onGuardar` con un aviso. Es lo único que este PR toca de los formularios.
- El error del cálculo lleva la `version` y se descarta si ya hay una más nueva (igual que el éxito): un error
  viejo no pinta el cartel sobre un plan recién cargado. Cuando llegan cuotas del servidor por el `@Input`
  (apertura de un bien), se limpia el estado de error: esas cuotas mandan.
- Abrir un bien con el central caído no muestra el cartel por sí solo (el primer recálculo se emite antes de que
  exista la suscripción y se pierde: ya es así).
- **Editar una cuota o agregar una extra** cambian la tabla antes de recalcular y el formulario no se entera: si
  el cálculo falla, la tabla y el formulario quedan distintos — lo cubre el bloqueo. «Reintentar» repite el último
  pedido con el mismo criterio de conservar ajustes.
- `calcularCuotasDetalle` nunca devuelve `null` cuando sale bien (con cantidad 0 devuelve `[]` y el monto del
  pedido): se quitan los dos valores de reemplazo y `null` es error.
- Anotado, sin tocar: si el monto total recalculado es igual al que ya estaba, un flag interno queda prendido y se
  traga el siguiente cambio de monto (ya es así).

### Para los PRs siguientes (asignado)
- 11f-2: archivos de ente (`EnteArchivoService`, panel de archivos, documentos) y `cargarEnteYCuotas` de los
  formularios (si fallan las cuotas, guardar regenera el plan en el central y pisa las pagadas).

### Riesgos (reemplaza el primero de arriba)
- El bloqueo del guardado toca los 4 formularios de bienes: solo un flag, el `[disabled]` del botón y la guarda en
  `onGuardar`.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Nadie consume `loading$`: el síntoma descrito no era el real; silenciar dejaría la pantalla sin indicador | alta | barra de progreso + descripción corregida |
| A | «Pagado» y «Pendiente 0» para un bien sin monto, con el servidor sano | alta | regla nueva en `armarFila`; «—» |
| A/B | Sin bloqueo, una tabla de cuotas sin recalcular se guarda tal cual; silenciar el modal libera Guardar durante el cálculo | alta | bloqueo mínimo en los 4 formularios en este PR |
| A | Un error viejo del cálculo pintaría el cartel sobre un plan recién cargado | media | error con versión; se limpia al llegar cuotas |
| A | Editar o agregar una cuota deja tabla y formulario distintos si falla el cálculo | media | lo cubre el bloqueo; Reintentar conserva el criterio |
| A | `planSinCalcular` emitido en `ngOnChanges` rompería la detección de cambios | media | solo desde el `subscribe` o un clic |
| A | Cortes sin definir (300 s) y doble aviso | media | 20 s / 60 s; `show: false` |
| A | `saveEnte` no devuelve la descripción | baja | se agrega a la selección |
| B | Fases que tocaban dos veces el mismo componente | baja | reordenadas |
| A/B | `enteByReferenciaId` devuelve `null` legítimo; con dos entes da error; `saveEnte` no deduplica; sin unicidad en la base; `calcularCuotasDetalle` nunca devuelve `null`; los llamadores del buscador toleran `undefined` | — | verificado |
