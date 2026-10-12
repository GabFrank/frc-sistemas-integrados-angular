# Plan — errores de red en la caja del POS (issue #390, PR 2b)

Rama creada desde `83eef6c5` (merge de #391). Pieza: **desktop**. Rama: `fix/pdv-errores-de-red-en-caja`, desde `origin/develop` **después del merge de
#391** (usa `PROPAGAR_ERROR_DE_RED`, `TIMEOUT_CONSULTA_MOSTRADOR_MS`, `ContextoConsulta`).
Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`. El PR 2 se partió
(decisión de Franco, 2026-10-02): **2b caja** primero, **2a cobro** (cupones, tarjeta, config del pago) después.

## Regla (la misma de #391)

- Si **todos** los suscriptores del método tienen `error:` (o se les agrega en este PR) → propagar en el
  servicio. Si no → parámetros opcionales `errorConf` / `contexto` y solo el POS los pasa.
- «Propagar» = solo `networkError` (`PROPAGAR_ERROR_DE_RED`); un error GraphQL sigue llegando como `null`.

## 1. Cierre de caja fail-closed (`adicionar-caja-dialog`)

Hoy (verificado):
- Al abrir el diálogo, `ngOnInit` (`:195-226`) lanza tres chequeos y guarda flags:
  `isDeliveryAbierto`, `isSolicitudPendienteOAutorizado`, `hayVentasTarjetaPendientes`.
- `goTo('cierre')` (`:619-698`) lee los dos primeros flags y vuelve a consultar solo las tarjetas
  (`onCountSinRegistrar`, con `error:` que avisa y no avanza, `:694`).
- Si delivery o gastos **no responden** al abrir, sus flags quedan en `false` y el cierre **pasa**
  (fail-open). `hayVentasTarjetaPendientes` no lo lee nadie.
- Con un error GraphQL, `deliveryRes.length` (`:202`) revienta con TypeError.
- Al paso de cierre solo se llega por `goTo('cierre')`: el header del stepper tiene
  `pointer-events: none` (`.scss:5`) y `stepper.next()` solo sale del paso 0.

Cambio (política **mixta**, decisión de Franco 2026-10-02):
- `goTo('cierre')` consulta **en el momento** los tres chequeos, en paralelo y en silencio
  (`silentLoad = true` en los tres; un solo «Verificando…» propio mientras tanto):
  - deliverys abiertos → **filial** (en el POS; `!isVentaTouch` = central en admin), opt-in;
  - ventas con tarjeta sin registrar → **filial** siempre (`servidor = false`, como hoy);
  - solicitudes de gasto pendientes → **central** siempre (`gasto.service:147`, `servidor = true`), opt-in.
- Cada consulta se clasifica por separado (`catchError` por consulta, no un `forkJoin` que falle entero):
  `ok` (con valor), `sin respuesta` (error de red o timeout) o `error del servidor` (un error GraphQL
  llega como `null`).
- Decisión:
  1. alguna consulta **al filial** `sin respuesta` → aviso «No se pudo verificar el cierre: el servidor
     local no responde. Intente nuevamente.» y **no avanza** (sin filial tampoco se guarda el cierre);
  2. si no, lo no verificado (central `sin respuesta`, o cualquier `error del servidor`) → confirmación
     «No se pudo verificar: <solicitudes de gasto / deliverys / tarjetas>. ¿Cerrar igual?». No → no avanza.
     Así una filial sin internet o con un error persistente **nunca queda trabada**;
  3. con lo verificado, el mismo orden de hoy: deliverys abiertos → aviso; solicitudes → aviso; tarjetas
     pendientes → el confirm/motivo de hoy (`:645-682`), sin cambios; si no, al paso de cierre.
- Timeout: `TIMEOUT_CONSULTA_MOSTRADOR_MS` (10 s) para las del filial en el POS; `TIMEOUT_CONSULTA_DE_FONDO_MS`
  (20 s) para la del central y para todas fuera del POS (`isVentaTouch == false`: el diálogo también se
  abre desde list-caja, analisis-diferencia, list-venta, seleccionar-caja, utilitarios).
- `verificandoCierre`: ignora un segundo clic; se resetea en `finalize` (nunca solo en `next`). El
  `subscribe` va con `untilDestroyed(this)`: cerrar el diálogo con la verificación en vuelo no abre el
  confirm de tarjetas sobre un componente destruido.
- Se **sacan** los tres chequeos del `ngOnInit` (`:195-226`) y los tres flags (sin otros lectores,
  verificado con grep). `onCountSinRegistrar` queda con un solo suscriptor (este) → propagar en el servicio.
- Ventana preexistente que se agranda un poco: entre el conteo de tarjetas y el marcado «no completado»
  pasa más tiempo por la verificación en paralelo; un cupón registrado en ese lapso se marcaría igual.

## 2. Últimas cajas (`ultimas-cajas-dialog:56`)

`caja.onGetCajasWithFilters` (`caja.service:77`): `list-caja:193` (admin) no tiene `error:` → **opt-in**.
`ultimas-cajas-dialog` pasa `PROPAGAR_ERROR_DE_RED` + `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s, es un listado);
su `error:` ya existe (`isLoading = false` + aviso). `list-caja` no cambia.

## 3. Impresión de balance

`caja.onImprimirBalance` (`caja.service:225`, rama server-side): suscriptores `adicionar-caja-dialog:705` y
`ultimas-cajas-dialog:114`, los dos con `error:` que solo hace `console.error` → **propagar en el
servicio** y en los dos `error:` agregar aviso «No se pudo imprimir el balance: el servidor no responde».

## 4. Diferencia de maletín al abrir

`caja.onGetCajasAnalisisDiferencias` (`caja.service:107`): suscriptores `adicionar-caja-dialog:455`
(poll de 15 intentos tras la apertura; su `error:` reintenta) y `analisis-diferencia:310/:775` (admin; sus
`error:` solo resetean flags y hacen `console.error`) → **propagar en el servicio**. Hoy un intento sin
respuesta mata el poll en silencio y en analisis-diferencia deja `isLoading*` colgado; con el cambio se
resetean, sin aviso nuevo al admin.

## 5. Reimpresiones de delivery, gasto y retiro

Un suscriptor cada uno, ninguno con `error:`:
- `delivery.onReimprimirDelivery` (`delivery.service:106`) → `list-delivery:333` (`.subscribe()` vacío);
- `gasto.onReimprimir` (`gasto.service:111`) → `adicionar-gasto-dialog:872`;
- `retiro.onReimprimirRetiro` (`retiro.service:76`) → `adicionar-retiro-dialog:306` (con `sucId`
  devuelve `undefined`: no se toca esa rama).

→ propagar en el servicio y agregar a cada suscriptor un `error:`. La impresión la hace el servidor, así
que el aviso distingue (`esTimeoutDeLink`):
- timeout → «No se pudo confirmar la reimpresión: revisá la impresora antes de reintentar» (puede haber salido);
- red inmediata → «No se pudo reimprimir: el servidor no responde».

`adicionar-gasto-dialog:872` hace `.subscribe().unsubscribe()`: el `error:` nunca correría. Se cambia por
`.pipe(take(1)).subscribe({ error })` (la reimpresión sigue saliendo igual: `onCustomQuery` no tiene
teardown). Solo la rama server-side; «imprimir desde esta PC» ya propaga. Lo mismo para el balance (punto 3).

## 6. Lista de deliverys del POS

`list-delivery:111` y `:193` (`onDeliveryPorCajaIdAndEstado`, `servidor=false`): sin `error:`; con el
filial caído la lista queda vacía sin aviso, y con un error GraphQL `res` es `null`. Pasan el opt-in del
punto 1 + `error:` con aviso «No se pudieron cargar los deliverys: el servidor no responde», y `res ?? []`.

## 7. Guardar delivery (`edit-delivery-dialog:654`)

`delivery.onSaveDeliveryAndVenta` es una **mutation** (`graphql-query.ts:576`) enviada por `onCustomQuery`.
El link ya la reconoce como mutation por el documento (`timeout-link.ts:tipoDeOperacion`) y su aviso de
timeout dice «pudo haberse aplicado». Pero `onCustomQuery` se traga el error: «Guardar» queda mudo hasta
300 s y no hay traba de doble clic.

Cambio, mínimo y sin tocar el camino de ítems de delivery (deshabilitado por fraude; los argumentos de
`onGuardar` no cambian, verificado: lo usan «Nuevo delivery» desde el carrito y «editar datos»):
- opt-in `errorConf` en `onSaveDeliveryAndVenta`; el diálogo pasa `PROPAGAR_ERROR_DE_RED` con
  `TIMEOUT_POR_DEFECTO_MS` (60 s; no se acorta: un guardado lento que termina después del corte es justo
  el caso de duplicado).
- flag `guardando`: ignora el segundo «Guardar» mientras hay uno en vuelo; se resetea en `finalize`.
- Respuesta `null` (error GraphQL): hoy el diálogo queda abierto sin decir nada → aviso «No se pudo guardar
  el delivery» y queda editable.
- `error:` de red:
  - timeout → **sin aviso propio**: el link ya avisa «pudo haberse aplicado. Verificá antes de reintentar»
    (no duplicar);
  - red inmediata (conexión rechazada: el servidor no recibió nada) → «No se guardó el delivery: el servidor
    no responde. Podés reintentar.»
- El carrito no se vacía si no se confirmó el guardado (list-delivery ignora un cierre sin delivery,
  `:357`, `:401`): correcto.
- No se pasa a `onCustomMutation`: cambia el manejo de errores GraphQL del diálogo y no hace falta.

Fuera de este PR: `delivery-dialog:376` (`onGetDeliverysByEstadoList`, central), `adicionar-pre-gasto`,
`list-pre-gastos`, `list-caja` (admin), captura de cupón (su sondeo ya se recupera), y todo lo de 2a.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| opt-in `errorConf`/`contexto` en `onDeliveryPorCajaIdAndEstado`, `preGastoFilter`, `onGetCajasWithFilters`, `onSaveDeliveryAndVenta` | `adicionar-caja-dialog`, `list-delivery`, `ultimas-cajas-dialog`, `edit-delivery-dialog` | `onCustomQuery` |
| `verificandoCierre` | `goTo('cierre')` | `goTo('cierre')` |
| `guardando` (edit-delivery) | `onGuardar` | `onGuardar` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(pdv): no cerrar la caja sin verificar deliverys, solicitudes y tarjetas` | 1 |
| 2 | `fix(pdv): avisar cuando no responde la impresion o la lista de la caja` | 2, 3, 5, 6 |
| 3 | ~~`fix(pdv): no cortar el aviso de diferencia de maletin sin respuesta`~~ | 4 — **revertida** en la auditoría del diff |
| 4 | `fix(pdv): avisar y no duplicar al guardar un delivery sin respuesta` | 7 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final; prueba de runtime.

## Prueba de runtime

Filial `:8080` congelado con `kill -STOP` (+ `kill -CONT` de respaldo). Franco loguea. Caja abierta en PDV 3.

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal: Utilitarios → Cerrar caja → «Conteo Cierre» | llega al paso de cierre como hoy (o avisa deliverys/solicitudes si los hay) |
| 2 | Filial congelado: «Conteo Cierre» | a los ~10 s aviso «No se pudo verificar el cierre: el servidor local no responde», **no** pasa; descongelar y volver a tocar → pasa |
| 2b | Central sin respuesta (simular: si no se puede congelar el central compartido, **no verificado**) | confirmación «No se pudo verificar: solicitudes de gasto. ¿Cerrar igual?» |
| 2c | Cerrar el diálogo de caja con la verificación en vuelo | no aparece nada después |
| 3 | Doble clic en «Conteo Cierre» con el filial congelado | una sola verificación, un solo aviso |
| 4 | Filial congelado: «Imprimir» balance (rama servidor) | aviso «No se pudo imprimir el balance…» |
| 5 | Filial congelado: Últimas cajas | a los ~20 s aviso, sin spinner infinito |
| 6 | Filial congelado: lista de deliverys | aviso; la lista no queda «muda» |
| 7 | Filial congelado: reimprimir delivery / gasto / retiro | a los 60 s «No se pudo confirmar la reimpresión…» en cada uno |
| 7b | Filial apagado (puerto cerrado): reimprimir | «No se pudo reimprimir: el servidor no responde» al instante |
| 8 | Filial normal: nuevo delivery y Guardar | se guarda como hoy |
| 9 | Filial congelado: nuevo delivery, Guardar dos veces | un solo envío; a los 60 s el aviso del link «pudo haberse aplicado…»; el botón vuelve a estar habilitado |
| 9b | Filial apagado: Guardar delivery | «No se guardó el delivery… Podés reintentar» al instante |

El **central es compartido** (alpha `:8083`, lo usa todo el equipo): **no se congela**. El caso 2b queda
sin verificar en runtime salvo que haya forma de cortar solo esta PC. «Filial apagado» = `kill -9` (systemd lo
relanza en 10-20 s); si el control de permisos lo bloquea, queda sin verificar.

**No se cierra ninguna caja real**: el caso 1 llega al paso de cierre y se sale sin confirmar «Cerrar
Caja». Si hace falta probar con deliverys o solicitudes abiertos, se usan los que haya en la base local.

## Riesgos y qué queda sin verificar

- **Cierre más estricto con el filial**: si el filial está lento (>10 s), «Conteo Cierre» no deja avanzar
  hasta que responda. Con el central lento o un error del servidor, pide confirmación en vez de pasar en
  silencio. Hoy pasaba sin verificar. Es el cambio buscado.
- La query de tarjetas (`countVentasTarjetaSinRegistrar`) está en `develop`, `release/beta` y `master` del
  filial desde el 2026-07-23 (`c53e7df`, verificado). Un filial que no se haya actualizado daría error
  GraphQL → confirmación, no bloqueo.
- Cerrar la caja con el filial caído ya no era posible (el guardado del cierre también va al filial); el
  cambio solo cierra el caso de caída **transitoria**.
- Delivery: un guardado que termina después de los 60 s sigue pudiendo duplicarse si el cajero ignora el
  aviso; el aviso lo dice explícitamente. No se agrega deduplicación en el servidor.
- Analisis-diferencia (admin) cambia: sus `error:` pasan a ser alcanzables; no se prueba en runtime.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Tratar el error GraphQL como «no verificado» trababa el cierre para siempre en un filial sin la query de tarjetas | crítica | **política mixta** (decisión de Franco): filial sin respuesta bloquea; central sin respuesta o error del servidor → confirmación. La query está en los tres canales del filial (verificado) |
| B | `preGastoFilter` va al **central** (`gasto.service:147`), no al filial: un filial sin internet no podría cerrar | alta | **verificado**; cubierto por la política mixta (confirmación) |
| A | `adicionar-gasto-dialog:872` hace `.subscribe().unsubscribe()`: un `error:` nunca correría | alta | **verificado**; se cambia por `take(1)` + `error:` |
| A/B | `guardando` del delivery podía quedar trabado (error GraphQL emite `null`, no error) | alta | `finalize` + aviso con `null` |
| B | «Puede haberse guardado» es falso ante una conexión rechazada; el link ya avisa en el timeout | media | se distingue con `esTimeoutDeLink`; sin aviso duplicado en el timeout |
| B | Reimpresión: en un timeout el ticket puede haber salido | media | aviso «no se pudo confirmar, revisá la impresora» en timeout |
| A | El diálogo de caja también se abre fuera del POS contra el central; 10 s es poco | media | 10 s solo en el POS al filial; 20 s el resto |
| A | Tres diálogos «Buscando…» encimados en el forkJoin | baja | `silentLoad` en los tres + un «Verificando…» propio |
| B | `untilDestroyed` y `finalize` en la verificación del cierre | media | aplicado |
| B | Fase 2 mezclaba el poll de diferencias (toca admin) con las impresiones | baja | fase 3 separada |
| A | analisis-diferencia: sus `error:` solo resetean flags, sin aviso | baja | texto corregido |
| A/B | Firmas opcionales sin conflicto posicional; ningún camino nuevo de edición de ítems de delivery | — | verificado |

## Auditoría del diff (paso 8, 2026-10-02)

- Fijo 1 y Fijo 2: `N/A porque el diff no agrega resolver, menú, .graphqls, migración ni entidad`.
  Condicionales A y B: ningún glob coincide.
- `npm run check` encontró dos errores de tipos en `chequeo` (`defaultIfEmpty` con un genérico):
  corregidos en `58e7e49c`.
- Fijo 3 (auditor sonnet sobre `58e7e49c`): política mixta, `forkJoin`/`finalize`/`untilDestroyed`,
  flujo de tarjetas idéntico, ramas «imprimir desde esta PC» intactas, `EMPTY` sin romper suscriptores,
  sin inyección circular, firmas compatibles y sin vía nueva de edición de ítems de delivery: verificado.

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Error GraphQL del filial en tarjetas + «Cerrar igual» salteaba el motivo auditable (`venta_tarjeta.no_completado_*`) | media | **Franco decidió**: confirmar y pedir el motivo. Con error, «Cerrar igual» abre el diálogo de motivo (`cuantos: null` → «Los cobros con tarjeta sin registrar de esta caja») y marca con `onMarcarNoCompletadas`; si eso falla, avisa y no avanza |
| Poll de diferencia de maletín: con el error propagado reintenta hasta 15 veces y cada intento abre «Buscando…» (el método no admite `silentLoad`); además bajaba de 300 s a 60 s una consulta pesada del admin | media | **fase 3 revertida** (`8d73dd8e`). Pendiente en #390: dar `silentLoad`/contexto al método antes de propagar |
| Delivery: un error de red que no es timeout también puede llegar después de que el filial guardó | baja | aviso neutro «No se pudo confirmar el guardado del delivery: revisá la lista antes de reintentar» |
| El aviso de timeout del link se deduplica 5 s: si otro timeout de mutation saltó justo antes, el diálogo de delivery calla | baja | aceptado (preexistente del link) |
| `onFiltrarDeliverys` sin respuesta deja la lista anterior bajo el filtro nuevo | baja | aceptado: hay aviso |

## Resultado de la prueba de runtime (paso 9, 2026-10-02)

Desktop `ng serve -c web` sobre `ad38de45`, filial `frc-filial` :8080, PDV 3 con la caja abierta (maletín
M4), manejado con la extensión de Chrome y un observador de snackbars.

| # | Resultado |
|---|---|
| 1 | ✅ filial normal: «Conteo Cierre» llega al paso «Conteo Final» sin avisos. No se tocó «Cerrar Caja» |
| 2 | ✅ filial congelado: a los 10 s (17:01:32 → 17:01:42) «No se pudo verificar el cierre: el servidor local no responde. Intente nuevamente.»; el diálogo **no avanza** |
| 3 | ✅ doble clic en «Conteo Cierre» con el filial congelado: un solo aviso |
| 2b | No verificado: el central (alpha :8083) es compartido y no se congela |
| 2c | No se probó (cerrar el diálogo con la verificación en vuelo): verificado por código (`untilDestroyed` + `finalize`) |
| 4, 7, 7b | **No verificados en runtime**: imprimir el balance o reimprimir manda trabajos reales a la impresora térmica del filial. Verificados por código |
| 5 | ✅ Últimas cajas con el filial congelado: a los ~20 s «No se pudieron cargar las cajas: el servidor no responde.», sin spinner infinito |
| 6 | ✅ lista de deliverys con el filial congelado: «No se pudieron cargar los deliverys: el servidor no responde.» al abrir (17:04:07) y con «Buscar» (17:04:54 → 17:05:14) |
| 8 | No se probó: guardar un delivery con el filial normal deja uno ABIERTO en la caja y bloquea «Conteo Cierre» |
| 9 | ✅ filial congelado, doble clic en «Guardar» del delivery: **una sola** mutation (un solo error en consola, 17:07:16), aviso del link «pudo haberse aplicado. Verificá antes de reintentar.», «Guardar» vuelve a estar habilitado. Al descongelar, el filial **no** procesó el guardado abortado (lista vacía) |
| 9b | No se probó (filial apagado con `kill -9`): el control de permisos lo bloqueó en una prueba anterior |

Preexistente, visto en la prueba (no es de este PR): al abrir «Nuevo delivery» con el filial congelado,
`EditDeliveryDialogComponent.calcularVueltoPara` tira `TypeError: Cannot read properties of undefined
(reading 'valor')` porque `selectedPrecio` no cargó.
