# Plan — errores de red en tesorería: dinero (issue #390, PR 5a)

Pieza: **desktop**. Rama: `fix/tesoreria-errores-de-red-en-dinero`, desde `origin/develop` **después del merge de
#395** (usa los parámetros opcionales que #395 agregó a `ventaCreditoService.onGetPorCliente`). Usa
`PROPAGAR_ERROR_DE_RED`, `ContextoConsulta` (#391) y `TIMEOUT_POR_DEFECTO_MS` (`timeout-link`).
Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`. Skill: `frc-financiero-expert`.

## Por qué se divide el PR 5

El relevamiento de financiero (dos auditores, cada suscriptor leído; el de #390 lo había hecho por patrón) dio
~50 métodos. **5a** (este): las pantallas donde un dato que no cargó **mueve o muestra mal plata**, con
criterio fail-closed. **5b** (siguiente): listas y spinners trabados sin riesgo de dinero, notificaciones,
comentarios, bancos, maletín, operaciones financieras, entradas varias, impresiones.

## Regla (la de #391–#395)

«Propagar» = solo `networkError`, con `{ timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }` (pantallas
del central). Se propaga en el servicio cuando todos los suscriptores tienen (o reciben en este PR) su `error:`; si
no, opt-in. Un `null` (error GraphQL) se interpreta **por método**: en este PR solo `onGetConfiguracion` de la caja
virtual devuelve `null` legítimo (caja sin configuración); en el resto `null` es error.

## 1. Cobro masivo de clientes (`list-clientes.component.ts:247-345`) [verificado]

`procesarAccionMasiva` arma un `forkJoin` de `onGetPorCliente` por cliente. Hoy: sin red, el `forkJoin` no emite
(el `error:` con aviso es inalcanzable) y el clic queda mudo. Con un error GraphQL de **un** cliente llega `null`,
ese cliente se **omite en silencio** y se finalizan (cobran) las ventas del resto con «Se cobraron las ventas de N
cliente(s) correctamente».

Cambio: opt-in `PROPAGAR_ERROR_DE_RED` + contexto en esa llamada; si **algún** resultado es `null`, no se cobra ni
se imprime nada: aviso «No se pudieron consultar las ventas de N cliente(s): no se procesó ninguno. Intentá de
nuevo.». El error de red llega al `error:` que ya existe.

`list-venta-credito.component.ts:291` (`onFiltrar` envuelto en Promise; `onCobrarTodo` hace `await`): opt-in; con
error o `null` la Promise **resuelve** con la tabla vacía y aviso (hoy queda colgada y con `null` `.forEach`
revienta). `onFiltrar` resuelve `true`/`false` y `onCobrarTodo` (`:438`) corta si la carga falló (si no,
seleccionaría la tabla vacía y seguiría).

## 2. Retiro de pre-gasto (`gasto.service.ts:232-302`, `retiro-pre-gasto-dialog`) [verificado]

- `registrarRetiroPreGastoHibrido`: `montosRetiroDesdeLineas` con `null` (error GraphQL) arma el gasto con
  `retiroGs/Rs/Ds = 0`, lo **guarda en la caja del filial** y después **ejecuta el retiro en el central** con
  las líneas reales: caja descuadrada. Cambio: propagar en el servicio y `null` → `throwError` **antes** del
  `onSave` («No se pudieron calcular los montos del retiro: no se registró nada.»). Sin red hoy se cuelga con
  `cargandoRetiro` en `true`.
- `preGastosParaRetiro` (`:104`), `qrRetiroPreGasto` (`:151`), `lineasRetiroSugeridas` (`:316`): sus `error:` con
  aviso ya existen y son inalcanzables (`cargandoLista`/`cargandoQr`/`cargandoFilasMonto` trabados) → propagar en
  el servicio. Ojo: el `error:` de `lineasRetiroSugeridas` agrega una fila libre editable (diseño existente: el
  backend recalcula los montos desde las líneas); no se cambia.
- `preGastoRetiroConfirmado` (poll `interval(4000)` + `switchMap`, `:272`): **no se propaga** (el poll moriría sin
  `catchError` interno; hoy sobrevive porque el `switchMap` cancela la consulta colgada). Fuera de 5a.

## 3. Saldos de la caja mayor y conteo (`caja-virtual-dashboard`) [verificado]

`cargarSaldos` (`:248`) solo actualiza con `if (res)`. Tras anular, ingresar o transferir, `recargar()` vuelve a
pedir saldos; si falla, las tarjetas **conservan el saldo anterior**, y «Conteo» (`onConteo`, `:288`) pasa ese
saldo como `saldoSistema`: el AJUSTE se postea por `contado − saldo viejo` (`conteo-caja-dialog:126/207`).

Cambio: `onGetSaldos` propaga; con error o `null` las tarjetas se **vacían**, flag `saldosNoCargados` (se baja
en el siguiente `next` bueno) y aviso con «Reintentar» en la sección de saldo. **Conteo** sigue disponible (es un
arqueo local en `localStorage`), pero sin saldo cargado el diálogo **no ofrece registrar el AJUSTE**: se le pasa
`saldoSistema = null` y el botón de ajustar queda deshabilitado con la explicación. En el mismo dashboard (un
suscriptor cada uno): `onGetMovimientosFilter` (`:363`, `isLoading` trabado → `error:` lo baja + aviso) y
`onGetResumenBancario` (`:307`) → propagar. `onGetConfiguracion` propaga **en el servicio** (sus dos
suscriptores reciben `error:` en este PR); como el resumen bancario se pide dentro del `next` de la
configuración (`:304-317`), en el `error:` se vacían `bancoCards`/`resumenBancario` y se reconstruyen las fuentes
(si no, quedarían las cuentas de antes), con aviso «no se pudieron cargar las cuentas bancarias».

## 4. Configurar caja virtual (`configurar-caja-virtual-dialog:46-55`) [verificado]

`forkJoin` de `cuentaBancaria.onGetAllOperables` + `onGetConfiguracion`, sin `error:`: sin red el diálogo queda
cargando para siempre; con `null` en cuentas (error GraphQL) se arma la configuración vacía y **Guardar
sobrescribe** las cuentas visibles y el orden. Cambio: opt-in de `onGetAllOperables` en esta llamada (tiene otros
suscriptores sin `error:` → 5b); `onGetConfiguracion` ya propaga (punto 3). `error:` y `cuentas == null` → flag
`cargaFallo`, aviso, **Guardar deshabilitado**. `config == null` sigue siendo «sin configuración»
(`CajaVirtualGraphQL.java:83`, `orElse(null)`). **Riesgo residual:** un error GraphQL en la configuración también
llega como `null` y no se distingue; el `onCustomQuery` lo avisa con «Ups! Algo salió mal», pero Guardar quedaría
habilitado sobre defaults. Se acepta (sin red, el caso real de #390, sí se bloquea).

## 5. Pagar compras / gastos / RRHH (`pagar-compras-dialog:332-343`)

`cargar()` pide las pendientes del modo (compras, vales, liquidaciones, finiquitos, aguinaldos, gastos) — un
suscriptor cada método. Sin red: `isLoading` trabado; tras crear un gasto o vale (`:512`, `:566`) la recarga
fallida deja la lista **vieja** con filas pagables. Cambio: propagar en el servicio; error o `null` → `isLoading =
false`, la lista se **vacía** (nada pagable), aviso con «Reintentar». `onGetDetalleDePago` (`detalle-pago-dialog:67`,
«Cargando…» eterno) → propagar + aviso.

## 6. Dashboard financiero (`financiero-dashboard:67-80`)

`forkJoin` de saldo consolidado, vencimientos, aging CPP y cajas activas con un solo `next`: una fuente sin red
cuelga las cuatro (`cargando` y «Actualizar» deshabilitado para siempre); con `null` muestra KPIs en **0 como
reales**. Cambio: `catchError` **por fuente dentro** del `forkJoin` (las demás se muestran), flag por fuente →
«No disponible» en vez de 0, `cargando` siempre baja. Métodos de `tesoreria-reporte.service` (un suscriptor) →
propagar en el servicio. `cajaVirtual.onGetActivas` tiene otros dos suscriptores sin `error:`
(transferencia, operación financiera: selector vacío, sin riesgo) → opt-in acá; ellos van a 5b.

## 7. Análisis de diferencias (`analisis-diferencia.component`)

- `caja.onCajaBalancePorIdAndSucursalId` en `cargarBalancesYCalcularEstados` (`:857-885`) y `loadCajaBalanceReal`
  (`:943-963`): **ya** marcan `SIN_DATOS` con `null` o `error:` (con su chip); el problema es que sin red el
  `error:` es inalcanzable: `cajasProcesadas` no llega a `totalCajas` y el spinner queda eterno. Cambio: el método
  recibe `errorConf?`/`contexto?` (sigue silencioso por defecto) y estas llamadas hacen opt-in. Como ahora un
  balance de una carga anterior **sí** puede terminar (por timeout) mientras corre otra, `verificarCompletado`
  (`:853`, campo compartido) pasa a un contador **local por carga** para no cerrar la carga nueva antes de tiempo.
  `loadCajaBalance` (`:633`) solo hace `console.warn`: sin cambio. Los otros suscriptores (`detalle-caso-dialog:194`,
  `list-venta:217`, `generic-list-venta:352`) no cambian; los dos de venta van a 5b.
- `caja.onGetCajasAnalisisDiferencias` (`:310`, `:775`, ambos con `error:` inalcanzable): pendiente del PR 2b —
  el poll del POS (`adicionar-caja-dialog:430`) la reintenta y abriría «Buscando…» en cada intento. Se le
  agregan `errorConf?`/`silentLoad?`/`contexto?` opcionales y se propaga **solo** desde estas dos llamadas.
- Carga inicial (`:122-126`, `forkJoin` de sucursales (central) + monedas (filial) con `error:`):
  `catchError` **por fuente** dentro del `forkJoin` (`onGetAllSucursales` tiene >60 suscriptores → opt-in acá;
  `moneda.onGetAll` usa el `onGetAll` genérico, que no propaga → `timeout` + `catchError`, como el cliente en
  #395). El overlay baja siempre y avisa. Si faltan las monedas, las cajas en otra moneda se marcan `SIN_DATOS`
  en vez de usar las cotizaciones por defecto (130 / 7000) que inventa `calcularEstadoDiferencia`.

## 8. Ingresar retiros a caja mayor y lector QR

- `retiro.onGetFlotantes` (`ingresar-retiro-caja-mayor-dialog:123`, único suscriptor, `error:` inalcanzable):
  propagar. Hoy un `null` se ve como «no hay retiros flotantes»: `null` → aviso de error, no lista vacía.
- `retiro.onFilterRetiro` en `qr-lector-dialog:166` (`resolviendo` trabado, input en solo lectura): opt-in desde
  el lector (el otro suscriptor, `list-retiro:101`, va a 5b); `null` → «No se pudo consultar el documento», no
  «no se encontró».
- `retiroVerificacion.onGetVerificacion` (`caja-virtual-dashboard:674`, anular retiro: clic mudo, `error:`
  inalcanzable, dentro de `switchMap` de un clic, no un stream largo) → propagar en el servicio. Su `null` es
  legítimo (schema) y sigue diciendo «No se encontró la verificación».

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `saldosNoCargados` | `caja-virtual-dashboard.cargarSaldos` | sección de saldo, botón Conteo |
| `cargaFallo` (configurar caja) | `configurar-caja-virtual-dialog.ngOnInit` | botón Guardar |
| lista vaciada + `cargaFallo` (pagar compras) | `pagar-compras-dialog.cargar` | template, «Reintentar» |
| fuentes no cargadas del dashboard financiero | `financiero-dashboard` | KPIs |
| estado SIN DATOS por caja | `analisis-diferencia` | tabla de cajas |
| contador por carga (`verificarCompletado` local) | `analisis-diferencia.cargarBalancesYCalcularEstados` | cierre de la carga |
| `saldoSistema = null` → ajuste deshabilitado | `caja-virtual-dashboard.onConteo` | `conteo-caja-dialog` |
| `errorConf?`/`silentLoad?`/`contexto?` opcionales en `onGetCajasAnalisisDiferencias`, `onCajaBalancePorIdAndSucursalId`; `errorConf?`/`contexto?` en `onGetAllOperables`, `onGetActivas`, `onGetAllSucursales`, `onFilterRetiro` | llamadas de este PR | `onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(financiero): no cobrar ni registrar retiros con datos que no cargaron` | 1, 2 |
| 2 | `fix(financiero): no contar ni configurar la caja mayor sin datos del servidor` | 3, 4, 8 |
| 3 | `fix(financiero): avisar cuando no cargan pagos pendientes, dashboard y diferencias` | 5, 6, 7 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final.

## Prueba de runtime

Central local `:8081` (rama local `chore/central-local-pruebas-390`, actualizada a la última `develop`, sin
perfil y con la replicación apagada por argumento, verificada en *Negative matches*), congelado con `kill -STOP`
y un solo respaldo `kill -CONT`. Casos: dashboard de caja mayor (saldos, Conteo), configurar caja, pagar compras,
dashboard financiero, análisis de diferencias, ingresar retiros, cobro masivo de clientes (cancelado antes de
confirmar si los datos cargan), lector QR. El retiro de pre-gasto exige un pre-gasto aprobado y la caja del
filial: si no hay datos, **verificado por código**. El caso `null` (error GraphQL) no se puede provocar a mano:
verificado por código.

## Riesgos y qué queda sin verificar

- Cobro masivo: un cliente que falla bloquea el lote entero (antes se cobraba al resto en silencio).
- Caja mayor: sin saldos se puede contar pero no ajustar hasta que carguen.
- Configurar caja: un error GraphQL en la configuración sigue viéndose como «sin configuración» (aceptado).
- 5b queda con las listas y spinners trabados de tesorería, gastos, bancos, notificaciones y comentarios.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `onCajaBalancePorIdAndSucursalId` y `onGetCajasAnalisisDiferencias` no reciben `errorConf`: sin eso no hay opt-in | alta | se agrega `errorConf?` además de `silentLoad?`/`contexto?` |
| A | Análisis de diferencias: `SIN_DATOS` ya existe; el bug es solo el `error:` inalcanzable (el plan decía «se pinta verde») | media | punto 7 corregido, sin lógica nueva de estado |
| B | `verificarCompletado` compartido: con timeouts que ahora sí emiten, un balance viejo puede cerrar la carga nueva | media | contador local por carga |
| B | Dashboard caja mayor: el resumen bancario va anidado en la configuración; si esta falla quedan las cuentas viejas | media | `error:` vacía `bancoCards` y reconstruye las fuentes |
| B | Carga inicial de análisis: las monedas (filial) tampoco propagan; sin monedas se inventan cotizaciones | media | `catchError` por fuente; sin monedas → `SIN_DATOS` |
| B | `list-venta-credito`: resolver la Promise no basta, «cobrar todo» seguiría sobre la tabla vacía | media | resuelve `true`/`false`, `onCobrarTodo` corta |
| B | Configurar caja: `null` de un error GraphQL en config no se distingue de «sin config» | media | riesgo residual aceptado y documentado |
| A | `onGetConfiguracion`: propagar en servicio vs opt-in era inconsistente | baja | propaga en el servicio, los dos suscriptores con `error:` |
| B | Ocultar Conteo bloqueaba también el arqueo local | baja | Conteo disponible, solo el AJUSTE se bloquea |
| A | Citas de línea de análisis de diferencias | baja | corregidas |
| A | Suscriptores de los métodos que propagan en el servicio; streams que morirían (solo el poll de pre-gasto, excluido) | — | verificado |
