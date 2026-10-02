# Plan — errores de red en el cobro del POS (issue #390, PR 2a)

Rama creada desde `a6a37773` (merge de #392). Pieza: **desktop**. Rama: `fix/pdv-errores-de-red-en-cobro`, desde `origin/develop` **después del merge de
#392** (decisión de Franco, 2026-10-02). Usa `PROPAGAR_ERROR_DE_RED`, `TIMEOUT_CONSULTA_MOSTRADOR_MS`,
`TIMEOUT_CONSULTA_DE_FONDO_MS`, `ContextoConsulta` (de #391).
Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`.

## Regla (la de #391 y #392)

Si **todos** los suscriptores tienen `error:` → propagar en el servicio. Si no → opt-in. «Propagar» = solo
`networkError`; un error GraphQL sigue llegando como `null`. En este PR **todos** los métodos tienen
`error:` en todos sus suscriptores (relevado y leído): se propaga en el servicio en todos.

## 1. Cupón: `ventaTarjeta.onMotivoCuponNoUsable`

Tres suscriptores, los tres con un `error:` escrito que **falla abierto a propósito** («el backend valida
igual al guardar») y que hoy nunca corre:
- `escanear-cupon-dialog:363` → `continuarTrasChequeo(datos)` (`verificando` se resetea);
- `scan-terminal-pos-dialog:295` → `cerrar()` (`buscando` deshabilita el botón, `html:82`);
- `pago-touch:955` → `evaluarCupon(item, datosCupon)`.

Hoy, con el filial caído: escanear un cupón no hace nada; en `scan-terminal-pos` el botón queda
deshabilitado hasta 300 s; en `pago-touch` la línea queda esperando.

Cambio:
- en el servicio, `PROPAGAR_ERROR_DE_RED` + `{ timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS,
  silenciarAvisoTimeout: true }` (los tres llamadores son el mostrador y van al filial);
- `escanear-cupon-dialog`: su `error:` pasa `{ ...datos, verificado: true }` (hoy pasa `datos` sin marcar y
  `pago-touch.procesarCupon` vuelve a consultar: dos esperas de 10 s con el filial caído, sin aportar nada);
- los tres `error:` avisan «No se pudo verificar el cupón: el servidor no responde. Se valida al guardar.»:
  la falla abierta deja de ser invisible.

## 2. Conciliación de tarjetas

| Método | Suscriptor | `error:` existente | Timeout |
|---|---|---|---|
| `onGetCobrosTarjetaDeVenta` | `registrar-venta-tarjeta-dialog:322` | `procesando = false` + `completar(...)` (registra igual, el backend decide) | 10 s |
| `onGetCompletaPorId` | `ventas-tarjeta-caja-dialog:384` | `buscandoQr = false` + `rechazarQr('No se pudo consultar el cobro… Buscalo a mano en la lista.')` | 10 s |
| `onFiltrarPorCaja` | `ventas-tarjeta-caja-dialog:457` | vacía la tabla y `cargando = false` | 20 s (listado) |

→ propagar en el servicio con esos timeouts, silenciados (los `error:` ya deciden qué mostrar).

`registrar-venta-tarjeta-dialog`: su `error:` hoy llama `completar(datos, advertencias)` **sin vínculo** a un
cobro. Con dos o más cobros con tarjeta del mismo monto el backend no puede desempatar, y el registro queda
COMPLETADO sin poder deshacerse desde la UI (`:303-306`, `:418`). Como ante un error de red no se sabe
cuántos cobros hay, el `error:` pasa a **no completar**: aviso «No se pudo consultar los cobros de la venta:
el servidor no responde. Volvé a escanear el cupón.» y queda para reintentar.
`onFiltrarPorCaja`: su `error:` vacía la tabla **sin aviso** → se agrega «No se pudieron cargar las ventas
con tarjeta: el servidor no responde.».

## 3. Configuración del pago (`pago-touch:235-252`) — bloquear lo afectado

Hoy (auditoría, verificado): las dos configs arrancan en `false` (`:152`, `:160`). El «Buscando…» de la
consulta es la única barrera mientras cargan. Si no cargan (hoy, a los ~5 min cuando el spinner se cierra
solo) el cobro sigue con `false`:
- tarjeta: una línea TARJETA se agrega **sin terminal ni cupón** (`:823`, `:848`) y la venta se guarda
  **sin `venta_tarjeta`** → cobro con tarjeta que no se puede conciliar;
- factura con venta (va al **central**): «Factura (F12)» emite una factura **suelta, sin ligar** (`:1165`).

Cambio (decisión de Franco, 2026-10-02: **bloquear lo afectado**):
- los dos `onGetConfiguracion` propagan en el servicio y aceptan `contexto` opcional;
- `pago-touch` **mantiene el «Buscando…»** (no `silentLoad`) como barrera, acotado:
  `TIMEOUT_CONSULTA_MOSTRADOR_MS` la del filial, `TIMEOUT_CONSULTA_DE_FONDO_MS` la del central, silenciado;
- estado por config: `cargando` → `ok` (respondió, también si dice «deshabilitado») | `fallo` (error de red,
  timeout o `null` de un error GraphQL);
- con `fallo`:
  - tarjeta: `addCobroDetalle` no agrega líneas TARJETA y `onFinalizar` no cierra si ya hay una; aviso «No se
    pudo cargar la configuración de cobro con tarjeta: cerrá y volvé a abrir el cobro para reintentar.»
    Efectivo y las demás formas de pago siguen;
  - factura: `onFactura` no emite; aviso «No se pudo cargar la configuración de factura con venta: cerrá y
    volvé a abrir el cobro para reintentar.»;
  - además un aviso al momento del fallo, para que el cajero lo sepa antes de intentarlo;
- con «deshabilitado» (`ok` con `habilitado = false`) TARJETA sigue como forma de pago normal, igual que hoy.

Otros suscriptores (todos con `error:`): `utilitarios-dialog:77` (venta-tarjeta, filial: `error:` →
`puedeRegistrarCupones = false`) y los dos ABM de configuración (central: `isLoading = false` +
`openAlgoSalioMal`; hoy, sin respuesta, quedan con `isLoading` para siempre). Los ABM no pasan nada nuevo.

Fuera de alcance: `onGetTerminalObligatoria` (ya usa `.fetch` y propaga), `configuracion-transferencia`
(otro servicio), y la captura de cupón (`captura-cupon.consultar`/`onEsperar`): su sondeo con `switchMap`
cada 3 s ya se recupera solo; propagar ahí cortaría el `merge` al primer error.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `contexto` opcional en los dos `onGetConfiguracion` | `pago-touch` | `onCustomQuery` |
| estado `configTarjeta` / `configFactura` (`cargando`/`ok`/`fallo`) | `pago-touch.ngOnInit` | `addCobroDetalle`, `onFinalizar`, `onFactura` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(pdv): no dejar colgado el chequeo del cupon sin filial` | 1 |
| 2 | `fix(pdv): avisar cuando no responde la conciliacion de tarjetas` | 2 |
| 3 | `fix(pdv): no cobrar con tarjeta ni facturar sin la configuracion del pago` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final; prueba de runtime.

## Prueba de runtime

Filial `:8080` congelado (`kill -STOP` + `kill -CONT` de respaldo). Franco loguea. Venta con tarjeta
habilitada en el PDV 3 (si no lo está, los casos 2–4 quedan **no verificados**).

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal: abrir el cobro (F12) con un ítem | igual que hoy; opciones de tarjeta/factura según la config |
| 2 | Filial congelado: abrir el cobro | «Buscando…» a lo sumo ~10 s; después aviso de config de tarjeta; agregar TARJETA → aviso y no la agrega; EFECTIVO sí |
| 2b | Central sin respuesta: «Factura (F12)» | aviso y no emite. **No verificable** (alpha compartido): verificado por código |
| 3 | Filial congelado: escanear un cupón (cadena que acepte `parsearCupon`) | a los ~10 s aviso «No se pudo verificar el cupón…»; sigue el flujo **una sola vez** (sin segunda espera) |
| 4 | Filial congelado: Conciliación de cupones (Utilitarios) | a los ~20 s aviso «No se pudieron cargar las ventas con tarjeta…»; buscar por QR → «No se pudo consultar el cobro…» |
| 5 | Filial congelado: registrar cupón de una venta (registrar-venta-tarjeta) | aviso, **no** completa; se puede volver a escanear |
| 6 | Filial congelado: Utilitarios | abre; «registrar cupones» queda deshabilitado a los ~10 s (default seguro) |

**No se completa ningún cobro** con el filial congelado: se cancela antes de guardar. Escanear un cupón
requiere un QR de cupón real o de prueba; si no hay, el caso 3 queda **no verificado** (verificado por código).

## Riesgos y qué queda sin verificar

- **Falla abierta del cupón**: con el filial caído, el chequeo «este cupón ya se usó» se saltea y la
  validación queda para el guardado (que tampoco anda con el filial caído). Es el diseño documentado en
  el código; este PR solo lo hace alcanzable.
- **Filial lento (>10 s) al abrir el cobro**: la tarjeta queda bloqueada en ese cobro; se reabre el cobro
  para reintentar. Antes esperaba con el «Buscando…» encima hasta 5 min y después dejaba cobrar sin conciliar.
- Los ABM de configuración ahora muestran «Ups! Algo salió mal» cuando el central no responde, en vez de
  quedar cargando.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A/B | Quitar el «Buscando…» abría una ventana en la que se cobraba con tarjeta sin conciliar o se facturaba sin ligar; y si la config no carga pasa lo mismo, hoy a los ~5 min | alta | **Franco decidió bloquear lo afectado**: spinner acotado + `cargando/ok/fallo` + bloqueo de TARJETA y F12 con `fallo` |
| B | Cupón: el `error:` del diálogo no marcaba `verificado` → segunda consulta y doble espera | media | `verificado: true` en el `error:` + aviso visible |
| B | registrar-venta-tarjeta: el `error:` completaba sin vínculo; con 2+ cobros no se puede desempatar ni deshacer | media | ante error de red **no completa**: aviso y reintento |
| A | Todos los suscriptores tienen `error:`; sin wrappers; `onMotivoCuponNoUsable` solo desde el mostrador | — | verificado |
| A | La config de factura con venta va al central desde el POS: sin internet nunca se habilita | baja | documentado; con el plan, «Factura (F12)» queda bloqueada y avisa en vez de emitir suelta |
| B | Timeouts: una respuesta tardía se descarta (el link aborta); solo queries en este PR | — | verificado |

## Auditoría del diff (paso 8, 2026-10-02)

- Fijo 1 y Fijo 2: `N/A porque el diff no agrega resolver, menú, .graphqls, migración ni entidad`.
  Condicionales A y B: ningún glob coincide.
- Fijo 3 (auditor sonnet sobre `a5eef53e`): todas las líneas TARJETA nuevas pasan por `addCobroDetalle`;
  todos los cierres por `onFinalizar`; ninguna otra vía emite factura ligada; sin aviso doble en el cupón;
  sin ciclo de inyección; el reintento de registrar cupón funciona (foto y carga a mano no pasan por ahí);
  `verificado` solo saltea la consulta: verificado.

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| `onFactura` emite la factura ligada y recién después llama `onFinalizar`; si el cierre se bloqueaba por la config de tarjeta, quedaba una factura emitida sin venta | media | **aplicado** (`44a20a0b`): `onFactura` frena antes de emitir; y el bloqueo de `onFinalizar` solo cuenta líneas nuevas, que solo existen con la config en `ok` |
| `onFinalizar` bloqueaba también las líneas TARJETA ya guardadas de un delivery reabierto | media | **aplicado**: solo líneas con `requiereRegistroTarjeta` (la misma marca que la regla de terminal) |
| Aviso inmediato de la config de factura (central) en cada cobro sin internet | baja | **aplicado**: el aviso inmediato queda solo para tarjeta; la de factura avisa al tocar F12 |
| El `return` de `addCobroDetalle` sale antes del reset de `isAumento` | baja | aceptado: combinación TARJETA + aumento sin caso real |
| ABM de configuración: tras fallar la carga, «Guardar» queda habilitado con la config vacía | baja | preexistente (antes quedaba colgado con el mismo botón) → #390 |

## Resultado de la prueba de runtime (paso 9, 2026-10-02)

Desktop `ng serve -c web` sobre `ddd0d69c` (+ el ajuste de Utilitarios), filial `frc-filial` :8080, PDV 3
con venta con tarjeta y factura con venta **habilitadas** (leído del componente), manejado con la extensión
de Chrome y un observador de snackbars.

| # | Resultado |
|---|---|
| 1 | ✅ filial normal: el cobro abre sin avisos; `configTarjeta = ok`, `configFactura = ok` |
| 2 | ✅ filial congelado: «Buscando…» y a los 10 s (17:37:28 → 17:37:38) `configTarjeta = fallo` + aviso «No se pudo cargar la configuración de cobro con tarjeta: cerrá y volvé a abrir el cobro para reintentar.»; Tarjeta (F5) + ✓ **no agrega** la línea y repite el aviso. `configFactura = ok` (el central respondía) |
| 2b | No verificado: central sin respuesta (alpha compartido). Verificado por código y auditoría |
| 3, 5 | **No verificados en runtime**: escanear/registrar un cupón requiere una cadena que acepte `parsearCupon` y una terminal configurada. Verificados por código y auditoría (falla abierta con aviso; registrar no completa sin vínculo) |
| 4 | ✅ conciliación de cupones con el filial congelado: «Buscar» → a los 20 s (17:40:33 → 17:40:53) «No se pudieron cargar las ventas con tarjeta: el servidor no responde.». La búsqueda por QR no se probó (requiere el QR de una seña) |
| 6 | ✅ Utilitarios con el filial congelado: el «Cargando…» se cierra en <10 s y «Conciliación de cupones» queda oculta. Encontrado en la prueba: Utilitarios pedía la config **sin** timeout (hasta 300 s); se acotó en `utilitarios-dialog` |

No se completó ningún cobro: los diálogos se cancelaron.
