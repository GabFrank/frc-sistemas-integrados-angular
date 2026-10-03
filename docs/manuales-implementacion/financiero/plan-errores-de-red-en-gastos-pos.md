# Plan — errores de red en gastos y retiros del POS (issue #390, PR 5c)

Pieza: **desktop**. Rama: `fix/pdv-errores-de-red-en-gastos-y-retiros`, desde `origin/develop` **después del merge
de #397** (comparte `gasto.service.ts`). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`,
`TIMEOUT_CONSULTA_MOSTRADOR_MS`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (#391) y `TIMEOUT_POR_DEFECTO_MS`.
Relevamiento: el del PR 5 (auditor de gastos/retiros), releído suscriptor por suscriptor. Skill: `frc-financiero-expert`.

## Alcance

Lo que el cajero usa en el POS para registrar gastos y retiros, contra el **filial**, más la lista de gastos y
el sondeo de confirmación del retiro de pre-gasto (central). Fuera: `edit-delivery.calcularVueltoPara` (pendiente
del PR 2b; va con operaciones/delivery), `list-venta`/`generic-list-venta` (operaciones).

## Regla (la de #391–#397)

Lo que espera el cajero de pie: `TIMEOUT_CONSULTA_MOSTRADOR_MS` (10 s) contra el filial; consultas del POS al
central: `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s). **Controles de plata, fail-closed**: si no se pudo verificar, no
dejar pasar.

## 1. Saldo de la caja al registrar un gasto o un retiro [verificado — no estaba en el relevamiento]

`adicionar-gasto-dialog:160-167` y `adicionar-retiro-dialog:96-100` piden el balance de la caja con
`cajaService.onCajaBalancePorId` (`onGetById`: **no emite nada si falla**, ni con error de red ni con error
GraphQL). `verficarValores` (`gasto:729`, `retiro:249`) compara el monto contra `balance.diferenciaGs/Rs/Ds`:
si el balance no cargó, `balance` es `undefined` → **TypeError**, «Guardar» no hace nada y no avisa; o, si el
objeto de caja traía un balance anterior, valida contra un saldo viejo.

Además (auditoría): `data.caja` llega de `utilitarios-dialog:104/122/141` y es la caja **compartida** de
`cajaService`; los diálogos le escriben `balance` encima, así que un saldo de una apertura anterior **persiste** y
se valida contra él si la carga nueva falla.

Cambio:
- el balance se guarda en un **campo propio del diálogo** (no se muta la caja compartida) y arranca sin valor;
- `onCajaBalancePorId` recibe `silentLoad` opcional: con un error GraphQL `onGetById` **no cierra** «Buscando…»
  (la rama de `res.errors` no llama `closeDialog`) y el modal quedaría 65 s; se carga silenciosa;
- corte de **10 s** (`TIMEOUT_CONSULTA_MOSTRADOR_MS`, el cajero está de pie) con `timeout` + `catchError` (como
  el cliente en #395: `onGetById` no emite si falla); una respuesta tardía de un intento anterior se descarta
  (contador de carga);
- el balance cuenta como cargado solo si `diferenciaGs/Rs/Ds` son **números**: el filial devuelve un
  `CajaBalance` no nulo con todo en `null` si la caja no existe (`PdvCajaService.getBalance:562-604`), y una caja
  abierta sin movimientos los trae numéricos (`generarBalance:535-539`) → no se bloquea nada legítimo;
- `verficarValores` sin balance cargado devuelve `false` con aviso («Todavía se está verificando el saldo de la
  caja» / «No se pudo verificar el saldo de la caja»), y el diálogo ofrece «Reintentar»: **no se registra un gasto
  ni un retiro sin saber cuánto hay en caja**.

## 2. Gastos y retiros ya registrados en la caja

- `gastoService.onGetByCajaId` (`adicionar-gasto-dialog:153` y `:788`, filial) y `retiroService.onGePorCajaSalidaId`
  (`adicionar-retiro-dialog:91`, filial), ambos `onGetById`: sin respuesta la lista queda vacía sin aviso y el
  cajero puede volver a cargar un gasto o un retiro que ya cargó. Cambio: `silentLoad` opcional en los dos métodos
  (mismo problema del modal), corte de 10 s con `timeout` + `catchError` y **un solo** aviso «No se pudo cargar la
  lista de … de la caja: revisá antes de cargar otro» (`onGetById` ya avisa «Problema al realizar esta operación»
  en el error de red: se le pasa `warningText` propio para no duplicar). No bloquea: la lista es informativa.

## 3. Solicitudes de gasto en el POS

- `gastoService.preGastoFilter` en `adicionar-gasto-dialog:890` (central): `cargandoSolicitudes` trabado; su
  `error:` ya existe → opt-in (`PROPAGAR_ERROR_DE_RED`, 20 s, los parámetros ya existen) + aviso.
- Sondeo de confirmación del retiro de pre-gasto (`retiro-pre-gasto-dialog:272`, `interval(4000)` + `switchMap`,
  central, único llamador): `preGastoRetiroConfirmado` **sin `silentLoad`** abre «Buscando…» cada 4 s, no tiene
  `catchError` interno (si propagara, el sondeo moriría) y, con el central más lento que 4 s, `switchMap` cancela
  cada consulta antes de que responda: **la confirmación no llega nunca**. Cambio: parámetros opcionales en el
  servicio; el sondeo usa `silentLoad`, `exhaustMap` (no lanza otra consulta mientras hay una en vuelo) y
  `catchError(() => of(false))` dentro.
- Sondeo de solicitudes procesadas de `venta-touch:1898-1925` (cada 3 min, `silentLoad`, `catchError` interno):
  **sin cambio** — una consulta colgada la cancela el siguiente intervalo y no traba nada.

## 4. Maletín en la apertura de caja (`adicionar-caja-dialog`)

- `verificarMaletin` (`:280-315`, `maletin.onGetPorDescripcion` vía `onGetByTexto`): sin respuesta el clic queda
  mudo y el maletín no se verifica (no se puede abrir con él: fail-closed ya), sin aviso. Cambio: `onGetByTexto`
  ya acepta `errorConf` → parámetro opcional en el servicio, opt-in con aviso «No se pudo verificar el maletín: el
  servidor no responde. Intentá de nuevo.».
- `maletin.onGetPorId` (`:239`, `onCustomQuery`; carga el maletín de una caja existente): campo vacío sin aviso → opt-in + aviso.

## 5. Lista de gastos (`list-gastos.component:69-85`, central)

`gastos$` = `combineLatest` + `switchMap(onFilterGasto)` sin `catchError`: hoy, sin red, la tabla queda con lo
anterior; si se propagara, **el stream moriría**. Cambio: opt-in en esta llamada (parámetros opcionales en
`onFilterGasto`; su otro uso, `registrarDevolucionSaldoHibrido`, no tiene llamadores) con `catchError` **dentro**
del `switchMap`, aviso y total del paginador a 0 (también con `null`).

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| balance propio del diálogo + estado (`cargando`/`ok`/`fallo`) + contador de carga | carga del balance en `adicionar-gasto-dialog` y `adicionar-retiro-dialog` | `verficarValores`, «Reintentar» |
| `silentLoad?` opcional en `onCajaBalancePorId`, `onGetByCajaId`, `onGePorCajaSalidaId` | los dos diálogos | `onGetById` |
| `errorConf?`/`silentLoad?`/`contexto?` opcionales en `preGastoRetiroConfirmado`, `onFilterGasto`, `maletin.onGetPorDescripcion`, `maletin.onGetPorId` | llamadas de este PR | `onCustomQuery` / `onGetByTexto` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(pdv): no registrar gastos ni retiros sin verificar el saldo de la caja` | 1, 2 |
| 2 | `fix(pdv): avisar cuando no responden las solicitudes de gasto y el maletin` | 3, 4 |
| 3 | `fix(financiero): no dejar muerta la lista de gastos sin servidor` | 5 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final.

## Prueba de runtime

Filial `:8080` **congelado** con `kill -STOP` y un respaldo `kill -CONT` (como en #391–#394; el filial es el de esta
máquina, no compartido). El login lo hace Franco. Casos: registrar gasto (abrir el diálogo, el balance no carga →
aviso; Guardar no registra), registrar retiro (ídem), listas de gastos/retiros de la caja, verificar maletín en la
apertura. **No se guarda ningún gasto ni retiro con el filial congelado.** Lo que va al central (solicitudes,
sondeo de confirmación, lista de gastos): central local `:8081` congelado, como en 5a/5b, si alcanza el tiempo;
si no, verificado por código.

## Riesgos y qué queda sin verificar

- Con el filial lento (>10 s), Guardar queda bloqueado hasta «Reintentar».
  Hoy, en ese caso, Guardar fallaba en silencio (TypeError) o validaba contra un saldo viejo.
- Los casos `null` (error GraphQL) se verifican por código.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `onGetById` no cierra «Buscando…» con un error GraphQL: las cargas del constructor dejarían el modal 65 s | alta | `silentLoad` opcional en los tres métodos; cargas silenciosas |
| A | `data.caja` es la caja compartida: el `balance` de una apertura anterior persiste y se valida contra él | media | balance en campo propio del diálogo, sin mutar la caja |
| A | Sondeo de confirmación: con el central >4 s, `switchMap` cancela cada consulta y la confirmación no llega | media | `exhaustMap` |
| B | El filial devuelve un `CajaBalance` con todo `null` si la caja no existe; `monto > null*-1` rechaza cualquier monto sin aviso claro | media | balance válido solo con diferencias numéricas |
| B | 65 s de espera para el cajero | media | 10 s (`TIMEOUT_CONSULTA_MOSTRADOR_MS`) |
| A | `onGetById` ya avisa en error de red: dos avisos | baja | `warningText` propio |
| B | Respuesta tardía de un intento anterior pisa el balance | baja | contador de carga |
| A | `list-gastos`: `null` deja el total viejo | baja | total a 0 también con `null` |
| A | Referencias de línea (`adicionar-caja:239`, `onGetPorId` es `onCustomQuery`) | baja | corregidas |
| A/B | `onCajaBalancePorId` solo tiene estos dos llamadores; sondeo de `venta-touch` correcto sin cambio; `verificarMaletin` sin flag trabado; `cargandoSolicitudes` ya baja en `error:` | — | verificado |
