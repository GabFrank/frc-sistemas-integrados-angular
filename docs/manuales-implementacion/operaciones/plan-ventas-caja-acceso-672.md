# Plan — Ventas de la caja: Verificar con el rol y avisos sin acceso (#672)

Pieza: desktop. Rama `fix/ventas-caja-acceso-sin-rol` desde `develop`. Sin cambios de central, filial,
esquema ni migraciones: el central ya responde «No autorizado» (central #561, mergeado).

## Qué pasa hoy (`list-venta.component.ts`)

1. El botón **Verificar / Anular verif.** (`isCustom` del `app-generic-list`) se muestra siempre.
2. `onGetBalance()` manda `sucId = selectedCaja.sucursal?.id`. Movimientos de stock y Control de stock
   negativo abren la pestaña con una caja que trae `sucursalId` pero no `sucursal`. Si la lectura de la
   caja (`onGetByIdSimp`) falla, queda esa caja y el balance sale con `sucId` nulo: el central lo rechaza
   antes de ejecutar, y el aviso dice «el servidor no responde».
3. Un usuario sin acceso a la caja (p. ej. solo `VER INVENTARIO`) ve el «Ups! Algo salió mal: No
   autorizado» de la caja y después el aviso del balance.

## Fase única — `list-venta` + `CajaService.onGetByIdSimp`

- **Verificar**: `puedeVerificarCaja = tieneAlgunRol([ANALISIS_DE_CAJA])` en `ngOnInit` (ADMIN pasa por
  el bypass) y `[isCustom]="puedeVerificarCaja"`.
- **`onGetByIdSimp`** recibe un `errorConf` opcional, que pasa a `onGetById` en su posición (12), con
  `undefined` en los lugares intermedios. `silentLoad` sigue sin reenviarse, como hoy: los otros 3
  llamadores no cambian.
- **Lectura de la caja con `LECTURA_ESTRICTA`** (sin snackbar del genérico). El error se clasifica con
  `erroresDeRechazo(e?.errors ?? e)`: con `propagate` el genérico emite `{ message, errors }`, que
  `erroresDeRechazo(e)` no reconoce (auditoría A1/B1). Se sigue usando `terminarSiFalla(error => …)`:
  - **rechazo** → `sinAccesoCaja = true`, **un** aviso «No tenés acceso a la caja N: se muestran sus
    ventas, sin el balance.», se cargan las ventas si hay sucursal y no se pide nada más.
  - **sin respuesta** → igual que hoy (aviso «No se pudo cargar la caja…» si no hay sucursal; si la hay,
    ventas + balance).
  - **`res == null`** (caja inexistente; el genérico ya avisa «Item no encontrado») → mismo camino que
    «sin respuesta», en vez de dejar la lista vacía sin consultar (B5).
- **`onGetBalance` / `cargarReaperturas`**: si `sinAccesoCaja`, no consultan (también se llaman al
  cancelar una venta) (B2). `sucId = sucursalId ?? sucursal?.id`; sin sucursal no se consulta.
  Balance con `LECTURA_ESTRICTA`; en el `error:` se clasifica igual:
  - rechazo → aviso «No se pudo leer el balance de la caja: <motivo del servidor>.»
  - sin respuesta → el aviso de hoy («el servidor no responde»).
- **Resumen**: el texto «— (…)» de los 4 paneles pasa a `textoBalanceNoDisponible`, que se recalcula en
  cada resultado (B3): «sin acceso a esta caja» (caja o balance rechazados) o «no se pudo leer el balance
  de la caja».
- **Sin acceso**: con `sinAccesoCaja` se ocultan Conteo, Retiros y Gastos (pestañas que la piden de nuevo
  y dan más «No autorizado»), y `abrirConteo` usa `sucursal?.nombre` (B4).

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `puedeVerificarCaja` | `ngOnInit` | template (`isCustom`) |
| `sinAccesoCaja` | `ngOnInit` (rechazo de la caja) | `onGetBalance`, `cargarReaperturas`, template |
| `textoBalanceNoDisponible` | `ngOnInit`, `onGetBalance` | template (4 paneles) |
| `errorConf` de `onGetByIdSimp` | list-venta | `GenericCrudService.onGetById` |

## Pruebas (por pantalla, desktop web `isLocal:false` contra el central local de develop)

- `MR` (ADMIN): Cajas → ventas de una caja: Verificar visible, balance completo, verificar y anular.
- `PRUEBAVERIF` con solo `VER INVENTARIO`: Movimientos → venta → Ir a VENTA: sin Verificar, **un** aviso,
  ventas cargadas, resumen «— (sin acceso a esta caja)», sin Conteo/Retiros/Gastos.
- `TESORERO1` (`TESORERIA GESTIONAR`): Control de retiros → casos → Ir a ventas: balance visible, sin
  Verificar.
- Sin respuesta: bajar el central con la pestaña abierta y recargar el balance (cancelar) → «el servidor
  no responde».
- Build: `npm run check`.

## Canales

Contra un central sin #561 (beta/stable hoy) la caja y el balance no se rechazan. El único cambio visible
es que Verificar se oculta sin `ANALISIS DE CAJA`; antes ese usuario podía verificar ahí (A4). La issue
pide ocultarlo, y el central nuevo ya lo exige.

## Auditoría del plan (paso 5)

| Hallazgo | Qué se hizo |
|---|---|
| A1/B1 `erroresDeRechazo` no reconoce `{message, errors}` | Aplicado: `e?.errors ?? e` |
| B2 `onGetBalance` se llama también al cancelar | Aplicado: control dentro del método |
| B3 texto del balance pegado | Aplicado: se recalcula en cada resultado |
| B4 Conteo/Retiros/Gastos sin `sucursal` | Aplicado: ocultos sin acceso; `sucursal?.nombre` |
| B5/A5 `res == null` deja la lista vacía | Aplicado: mismo camino que «sin respuesta» |
| A2/B7 `silentLoad` ignorado por `onGetByIdSimp` | No se toca (cambiaría los otros 3 llamadores) |
| A4 central viejo pierde Verificar sin el rol | Aceptado: lo pide la issue |
| A3 Control de retiros (lista) manda la caja sin `sucursalId` | Fuera de alcance: camino previo, no lo toca #672 |
| A6 otras lecturas (ventas, monedas, lotes) | Sin cambio: no las rechaza #561 |

## Auditoría del diff (paso 8)

Fijo 2 y condicionales: N/A, el diff no toca esquema, migraciones, release ni replicación.

| Hallazgo | Qué se hizo |
|---|---|
| F1-H1 / F3 media: cualquier rechazo de la caja se marcaba «sin acceso» | Aplicado: solo si el motivo empieza con «No autorizado»; otro rechazo avisa el motivo y sigue con la caja de la pestaña |
| F3: «se muestran sus ventas» sin sucursal | Aplicado: el texto depende de si hay sucursal |
| F3: «Conteo … de undefined» | Aplicado: `?? ""` |
| F1-H2: Conteo/Retiros/Gastos visibles para el dueño sin los roles de esas operaciones | No se toca: previo a #672 |
| F1-H3: el motivo del servidor se muestra tal cual | Aceptado: igual que el aviso genérico de siempre |
| F1: ventas por caja sin control en el central | Fuera del desktop: issue central #562 |

## Prueba por pantalla (05/11, central local de develop, desktop web `isLocal:false`)

- ADMIN (MR): Cajas → caja 2666 → Ventas: Verificar visible, balance completo; verificar y anular aplicaron en la base.
- Solo `VER INVENTARIO` (+ `CANCELACION DE VENTA`): Movimientos → Ir a VENTA: sin Verificar ni accesos a conteo, retiros y gastos; un solo aviso; resumen «sin acceso a esta caja»; un solo rechazo en el log del central (no se pidió el balance). Cancelar y reactivar la venta: sin aviso de balance.
- `TESORERIA GESTIONAR`: balance visible, accesos visibles, sin Verificar, sin avisos.
- Caja cortada (red): el balance sale con `sucId` 7 de la pestaña y carga. Caja y balance cortados: un aviso «el servidor no responde».
- Balance rechazado: aviso con el motivo del servidor. Caja rechazada por otro motivo: aviso con el motivo, balance y accesos visibles.

Visto de paso, sin tocar: tras «Anular verif.» el resumen sigue diciendo «Verificado: Sí» (`onVerificado` guarda la respuesta `true` como estado).

## Sin verificar

- Karma/e2e: no corren en CI (N/A desktop). Se verifica por pantalla.
