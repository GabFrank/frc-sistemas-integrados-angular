# Plan — errores de red en devoluciones (issue #390, PR 6b)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-devoluciones`, desde `origin/develop` **después del
merge de #399** (usa el `errorConf?`/`contexto?` de `onGetById` que agrega #399). Usa `PROPAGAR_ERROR_DE_RED`,
`ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` y `TIMEOUT_POR_DEFECTO_MS`. Relevamiento: auditor de solo
lectura sobre transferencias y devoluciones (2026-10-03), cada suscriptor leído. Todo va al **central**.

## Regla (la de #391–#399)

«Propagar» = solo `networkError`, siempre con contexto explícito y `silenciarAvisoTimeout: true` (si no, el link
avisa por cada consulta vencida y queda el corte de 300 s): constantes `CONSULTA_PANTALLA` (60 s,
`TIMEOUT_POR_DEFECTO_MS`) y `CONSULTA_FONDO` (20 s, paneles del dashboard). Se propaga en el servicio si todos los
suscriptores tienen o reciben su `error:`; si no, opt-in. Con `errorConf` en `onGetById` un error GraphQL emite
`null` (y el servicio ya avisa «Ups…» o «Item no encontrado»): cada llamador lo trata sin duplicar el aviso.

## 1. Editar una devolución (`edit-devolucion`) [verificado — el más grave]

`cargarDatos` (`:200-207`) pide la devolución con `onGetById` y solo actúa si `res != null`: sin respuesta la
pantalla queda en blanco sin aviso. Además `esNuevo` arranca en `true` (`:100`) y solo `aplicarDevolucion` lo baja
(`:212`): con la carga fallida la cabecera queda **editable** (`puedeEditarCabecera = esNuevo || esPendiente`,
`:335`) y «Guardar» (`onGuardarCabecera`, `:398`) **crea una devolución nueva** en vez de editar la que se abrió.

Además (auditoría): `esPendiente` también vale `true` con la carga fallida (`ngOnInit:156` fija PENDIENTE), así
que bajar `esNuevo` no alcanza; «Agregar ítem» (`html:67`, `onAddItem:460`) también crea una devolución nueva; el
título dice «(nueva)»; y `refrescarAlVolver` (`:238`) sale por `id == null` y nunca reintenta.

Cambio:
- `onGetDevolucion` recibe `errorConf`/`contexto` (opt-in: `refrescarAlVolver` ya tiene `timeout(15000)` +
  `catchError` y no cambia);
- en `cargarDatos`: **error de red** → flag `cargaFallo`, aviso propio con «Reintentar» (que llama a
  `cargarDatos(tabData.id)`); **`null`** → `cargaFallo` sin aviso propio (ya avisó el servicio: «Item no
  encontrado» o el error) y sin «Reintentar» si fue no encontrado;
- `computeEstadoFlags`: `puedeEditarCabecera = !cargaFallo && (esNuevo || esPendiente)`; «Guardar» y «Agregar
  ítem» ocultos con `cargaFallo`; el título muestra el id de la pestaña, no «(nueva)»;
- `refrescarAlVolver`: con `cargaFallo` reintenta `cargarDatos` al volver a la pestaña.
- **Ítems** (auditoría): `getDevolucion` no trae los ítems; la tabla depende de `getItems` (`:299`, sin `error:`).
  Si falla, la devolución se ve cargada con la tabla vacía y se puede avanzar o cancelar sin ver los ítems.
  Cambio: opt-in en `onGetDevolucionItemsPorDevolucion` + flag `itemsFallo` que bloquea avanzar, cancelar y
  confirmar el canje, con aviso y «Reintentar».

- `etiquetas.onGetPdf` (`edit-devolucion:679`, botón sin respuesta hasta 300 s, `error:` inalcanzable;
  `historial-colectas:97` sin `error:`) → propagar en el servicio + `error:` nuevo en `historial-colectas`.
- Sin cambio: `onGetMotivosAveriaActivos` (`:171`, B: sin motivos solo se afecta el alta de ítems).

## 2. Dashboard de devoluciones (`devolucion.component`)

- `devolucionConfiguracion.onGet` (`:123`): el dashboard **no arranca** hasta 300 s: `iniciar()` está en un
  `error:` inalcanzable → opt-in (20 s) en el dashboard; si falla arranca con los valores por defecto **sin aviso
  propio** (lo da el de los paneles). `retiro-proveedor:110` y `gestion-compras:511` no cambian (quedan los
  defaults; en compras, bloqueantes).
- **Diálogo de configuración** (`configuracion-devolucion-dialog:58-68`, auditoría): al fallar muestra el
  formulario con los defaults del código y «Guardar» (`html:136`) los **escribiría sobre la configuración real**.
  Cambio: opt-in (60 s), error o `null` → flag `cargaFallo`, «Guardar» deshabilitado, aviso y «Reintentar».
- Paneles (`dashboard-devolucion.service.query()`, 6 suscriptores en `devolucion.component:226-296`;
  `onGetPorEstado` no tiene llamadores): resumen con `cargando` trabado, tops/serie/estancadas vacíos sin aviso.
  Cambio: `query()` con `errorConf = { networkError: { propagate: true, show: false }, graphError: { propagate:
  true, show: false } }` y `CONSULTA_FONDO`; `error:` en los 6 suscriptores (bajan su `cargando`); **un solo
  aviso por recarga**: helper `avisarFallo()` con un flag que se resetea al iniciar cada recarga (`cargar()` y
  `onCambioDiasEstancado`).

## 3. Retiros y colectas

- `onGetRetiros` (`historial-retiros:64`) y `onGetColectas` (`historial-colectas:62`): `cargando` trabado, sin
  `error:` → propagar (60 s) + `error:`; con error se vacían los datos, **no** se avanza la página y se muestra «No
  se pudo cargar» con «Reintentar» en vez del «no hay…» (`html:20-24`).
- `onGetRemitoRetiro` (`historial-retiros:106`, sin aviso) → propagar + `error:`.
- `onGetAcreditacionPreview` (`acreditar-retiro-dialog:66`): `cargando` trabado y Confirmar deshabilitado;
  `error:` escrito → propagar (`puedeConfirmar` ya falla cerrado con `lineas` vacío).
- `retiro-proveedor`: consolidado (`:205`, `buscando` trabado; si falla el refresco tras retirar queda el
  consolidado viejo) y remito (`:331`, `imprimiendo` trabado: botón bloqueado hasta recargar la pestaña), los dos
  con `error:` ya escrito → `errorConf` + contexto en esas dos llamadas directas; con error el consolidado se
  **vacía** (`buildGrupos(null)`) y se muestra «No se pudo cargar», no «sin grupos».
- `onGetDevolucionesConFiltros`: `colecta:100` (`cargando` trabado) y `list-devolucion:137` (lista vacía sin
  aviso) → opt-in + `error:`; en `list-devolucion` con `silencioso` (reactivación) el error se ignora y se
  conservan los datos.
- `onGetAllSucursales` en `colectar-dialog:34` (`cargando` trabado, selector vacío) y `colecta:58` → opt-in +
  `error:`; en `edit-devolucion:158` y `list-devolucion:81` un `null` hace `res.filter` → TypeError: `res ?? []`.
- `etiquetas.onGetPdf` (`edit-devolucion:679` con `error:`; `historial-colectas:97` sin) → propagar + `error:`.
- `gestion-compras:1925` `onGetDevolucionesPendientesPorProveedor` (fail-open, un llamador) → opt-in (20 s,
  silencioso) + aviso no bloqueante «No se pudo verificar si el proveedor tiene devoluciones pendientes».

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no editar como nueva una devolucion que no cargo` | 1 |
| 2 | `fix(operaciones): avisar cuando no carga el dashboard de devoluciones` | 2 |
| 3 | `fix(operaciones): avisar cuando no cargan retiros, colectas y listas de devoluciones` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` (y antes de **cada** push, encadenado con `&&`).

## Prueba de runtime

Central local `:8081` (rama local de pruebas, sin perfil, replicación apagada y verificada en *Negative
matches*), congelado con `kill -STOP` y un respaldo `kill -CONT`. Casos: abrir una devolución existente (aviso,
cabecera no editable, «Reintentar»), dashboard (arranca con los defaults y avisa una vez), historial de retiros
y colectas, lista de devoluciones, retiro a proveedor (consolidado). **No se guarda, acredita ni retira nada**
con el central congelado. Casos `null`: verificados por código.

## Riesgos y qué queda sin verificar

- Con el central lento, una devolución no se puede editar hasta que cargue («Reintentar»).
- Tras un fallo de recarga del dashboard, los KPIs y tops anteriores quedan a la vista (sin marca de
  desactualizado), con el aviso.
- `retiro-proveedor:110` y `gestion-compras:511` siguen sin enterarse de un fallo de la configuración (quedan los
  defaults, que en compras bloquean): se dejan como están.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Bajar `esNuevo` no bloquea la cabecera: `esPendiente` también es `true`; «Agregar ítem» y «Guardar» seguían creando una devolución nueva | alta | `puedeEditarCabecera` con `!cargaFallo`; botones ocultos |
| A | Diálogo de configuración: al fallar, «Guardar» escribiría los defaults del código sobre la configuración real | alta | `cargaFallo` deshabilita Guardar, «Reintentar» |
| A | Sin contexto explícito quedaban 300 s y un aviso del link por consulta | alta | `CONSULTA_PANTALLA` / `CONSULTA_FONDO` con `silenciarAvisoTimeout` |
| B | Aviso único del dashboard: sin `graphError` silenciado, «Ups» por cada panel | alta | `errorConf` de paneles con red y GraphQL silenciados + flag por recarga |
| A | Ítems: si fallan, se puede avanzar o cancelar sin verlos | media | `itemsFallo` bloquea avanzar/cancelar/canje |
| A | `null` en `onGetById`: el servicio ya avisa; «Reintentar» no sirve para no encontrado | media | `null` sin aviso propio ni reintento |
| A | Título «(nueva)» y sin reintento al volver a la pestaña | media | id de la pestaña; reintento en `refrescarAlVolver` |
| A | Historial y retiro a proveedor muestran «no hay…» tras un fallo; la página avanza | media | «No se pudo cargar» + «Reintentar», sin avanzar |
| A | Dashboard: 6 suscriptores (no 7), varios sin `error:` | baja | contados y con `error:` |
| A | Faltaba `colecta:58` | baja | sumado |
| B | `list-devolucion` silencioso no debería vaciar ni avisar | baja | se ignora el error |
| B | `gestion-compras:1925` fail-open | baja | aviso no bloqueante (aceptado) |
| B | KPIs viejos sin marca tras un fallo | baja | aceptado, en riesgos |
| A/B | Llamadores de lo que propaga en servicio; `refrescarAlVolver` ya protegido; flags `procesando`; streams | — | verificado |

## Ajustes durante la implementación

- **Ventana de carga** (encontrado en la prueba): mientras se cargaba una devolución existente (hasta 60 s), `esNuevo`
  seguía en `true` y la cabecera editable: con el central lento, «Guardar» en esa ventana también creaba otra
  devolución. Se agregó `cargandoDevolucion`: al abrir una existente no es «nueva» ni editable hasta que carga.
- `acreditar-retiro-dialog`: además de propagar, su `error:` avisa (sin eso, con `silenciarAvisoTimeout`, no avisaba
  nadie).

## Prueba de runtime (paso 9, 2026-10-03)

Central local `:8081` (rama local de pruebas, sin perfil, replicación apagada y verificada en *Negative
matches*), congelado con `kill -STOP` y un respaldo `kill -CONT`. **No se guardó, acreditó ni retiró nada.**

| # | Caso | Resultado |
|---|---|---|
| 1 | Abrir el dashboard con el central congelado | arranca (con los defaults) y sale **un solo** aviso «No se pudieron cargar algunos datos del dashboard» (no uno por panel); `cargando` baja |
| 2 | Abrir la devolución 7 (PENDIENTE) congelado | **durante la carga** no es editable (solo «Lista»); al fallar (~60 s) «No se pudo cargar la devolución: no se puede editar» con «Reintentar» y «Lista»; título «#7» (no «(nueva)») |
| 3 | Descongelar → «Reintentar» | carga la 7 como existente (`esNuevo = false`) con sus acciones (Agregar producto, Marcar como separado, Guardar datos, Cancelar devolución) |

**Verificado por código:** diálogo de configuración, historiales, retiro a proveedor, colecta, acreditación,
listas, compras y los casos `null`.

## Auditoría del diff (paso 8, 2026-10-03)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Llamadores de todo lo tocado; devolución nueva no se bloquea; sin atajos a Guardar/Agregar; aviso único; config; historiales; compras | — | verificado |
| Acreditación: el error de red ya no avisaba nadie (Confirmar deshabilitado sin mensaje) | media | aviso en su `error:` |
| Avisos «el servidor no responde» también ante `null` (el servicio ya avisó) | baja | con `null` solo se marca el fallo |
| Al volver a la pestaña durante un reintento, dos cargas en paralelo | baja | no reintenta si ya está cargando |
| Canje y acreditación sin el resguardo de `itemsFallo` | baja | agregado |
| Orden de imports y constantes (estilo) | baja | sin cambio: compila |
