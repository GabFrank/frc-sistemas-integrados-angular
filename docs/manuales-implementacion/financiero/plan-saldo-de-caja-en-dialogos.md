# Plan — saldo de caja mayor en los diálogos (issue desktop #656)

## Qué pasa

En Caja mayor, el «Saldo Actual» del diálogo de egreso no coincide con las cards de saldo. Las cards
leen `cajaVirtualSaldos` (tabla `caja_virtual_saldo`, fuente de verdad, se relee con cada cambio). Los
diálogos muestran `cajaVirtual.saldoGs/Rs/Ds`: la columna *shim* del objeto que llegó al abrir la
pestaña (o la fila de la lista), que nunca se refresca y solo cubre Gs/R$/US$.

Lugares afectados (verificado en `develop` f34373de, `git grep saldo(Gs|Rs|Ds)`):

| Componente | Uso | Lo abre |
|---|---|---|
| `add-movimiento-caja-virtual-dialog` (html 37/65/93) | «Saldo Actual» por moneda en Egreso de Efectivo y Ajuste de Saldo | `registrar-egreso-dialog` y `registrar-ingreso-dialog` (el ingreso oculta el saldo) |
| `add-movimiento-caja-virtual-dialog.ts:115` | aviso de límite de caja chica en un ingreso (`nuevoSaldoGs`) | idem |
| `transferencia-caja-virtual-dialog` (html 49/77/103) | «Saldo Origen» | dashboard `onTransferir` |
| `historial-movimientos-caja-virtual` (html 13/19/25) | cards «Saldo Gs./R$/U$D» | `list-caja-virtual.onHistorial` |

## Solución

Cada uno de los tres componentes relee `cajaVirtualSaldos` al abrirse (`CajaVirtualService.onGetSaldos`,
ya existe, `fetchPolicy: 'no-cache'`, propaga el error de red). Sin backend nuevo.

- `caja-virtual.model.ts`: se mudan acá, exportadas, dos funciones chicas:
  - `formatoDe(moneda)` — hoy privada en `caja-virtual-dashboard.component.ts`; el dashboard la importa.
  - `saldoDeMoneda(saldos, moneda)` — saldo de esa moneda en la lista (0 si la caja no tiene fila de esa
    moneda: así lo muestra el central), `null` si los saldos no cargaron. Compara ids con `+a === +b`
    (`ID` de GraphQL llega como string).
- `add-movimiento` y `transferencia`: campos `saldoGs/saldoRs/saldoDs` (null hasta que carguen las monedas
  **y** los saldos; se recalculan cuando llega cualquiera de los dos). El template muestra el campo, o
  «No disponible» si es null. La moneda de cada fila es la que el diálogo ya usa para enviar el monto
  (`monedaGs/Rs/Ds`), así lo que se muestra y lo que se mueve son la misma moneda.
- Aviso de límite de caja chica: usa `this.saldoGs`; si el saldo no está, no avisa (es solo un aviso, el
  límite no bloquea).
- `historial`: muestra una card por moneda de `cajaVirtualSaldos` con `formatoDe`, igual que el dashboard
  (cubre otras monedas). Si falla: «No se pudieron cargar los saldos». Los gradientes `.gs/.rs/.ds` se
  asignan por posición (`i % 3`).
- No se toca: `CajaVirtual.saldoGs/Rs/Ds` del modelo y la query (siguen en `toInput`, y los usan la lista
  y RRHH).

## Fases

1. **Fase 1 (único commit de código)** — `fix(financiero): mostrar en los diálogos de caja mayor el saldo de las cards`.
   Archivos: `caja-virtual.model.ts`, dashboard (solo el import de `formatoDe`), los tres componentes (.ts + .html).

## Tabla de datos nuevos

N/A — no nace ningún campo, columna ni clave: se lee una query existente.

## Tests

- Batería: `N/A para desktop porque su CI no corre tests y no hay batería confiable [ev: ciclo §1 paso 9]`.
- Gate: `npm run check` (AOT), leído del log.
- Prueba por pantalla (central local 8081 + `ng serve -c web`, usuario MR):
  1. Abrir una caja mayor desde la lista, anotar las cards.
  2. Sin cerrar la pestaña, hacer un ingreso de efectivo: las cards cambian.
  3. Egreso → Egreso de Efectivo: «Saldo Actual» = card de cada moneda. Lo mismo en Ajuste de Saldo.
  4. Transferir: «Saldo Origen» = cards.
  5. Lista → Historial de esa caja: una card por moneda con los mismos montos que el dashboard.
  6. Error: cortar el central con el diálogo por abrirse → «No disponible», el diálogo sigue usable
     (un rechazo GraphQL muestra además el snackbar «Ups! Algo salió mal»).
  7. Caja chica con límite: ingreso que lo supera → aviso con el saldo real.

## Fuera de alcance (lo dice la issue en «Qué se espera», punto 2)

- `list-caja-virtual` (columnas Saldo Gs/R$/US$) y `financiero-dashboard` (card «Gs.» por caja) siguen
  con el shim. Ahí el dato se relee en cada búsqueda (no queda viejo), pero puede estar desfasado si un
  movimiento no pasó por `aplicarSaldo`. Pasarlo a `caja_virtual_saldo` en una lista necesita que el
  central devuelva los saldos por caja en la misma consulta: es otro cambio, con backend.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Contrato: `cajaVirtualSaldos` existe (`caja-virtual.graphqls:64`), la query del desktop coincide; el resolver exige `requireVer` + `requireLecturaCaja`, y quien abre estos diálogos (escritura o caja visible en la lista) puede leer | Sin cambio |
| A | mobile-pwa y mobile no usan `cajaVirtualSaldos`; no hay orden de despliegue (la query ya está en todos los canales) | Sin cambio |
| A | Riesgo medio: elegir moneda por `denominacion.includes(...)` podría tomar otra moneda si hubiera nombres parecidos | Verificado en bodega local: `GUARANI`, `REAL`, `DOLAR`, `PESO ARG`, sin ambigüedad. Es el criterio que el diálogo ya usa para **enviar** el monto; no se cambia acá |
| A | Guarda si `cajaVirtual.id` faltara | Se agrega `if` antes de `onGetSaldos` |
| B | Rechazo GraphQL emite `next(null)`, red/timeout emite `error` | Subscribe con `next` (`res == null` → no disponible) **y** `error`, como `cargarSaldos` del dashboard |
| B | El spinner «Buscando…» aparece sobre el diálogo | `onGetSaldos(id, silentLoad?)`; los diálogos pasan `true`, el dashboard sigue igual |
| B | Con saldo «No disponible» se puede confirmar igual | Igual que hoy: el front nunca validó el egreso contra el saldo (`onSave` no lo lee). El negativo lo decide el central (CN2). No se agrega bloqueo |
| B | No hay specs en `caja-virtual/`; revertir el commit alcanza (sin localStorage, `no-cache`, sin migración) | Sin cambio |

## Resultado de las pruebas (04/11, central local 8081 de `develop` + `ng serve -c web`, usuario MR, caja 20)

| Caso | Resultado |
|---|---|
| Ingreso con la pestaña abierta → Egreso de Efectivo | «Saldo Actual» 7.300.000 / 6.090,00 / 100,00 = cards (el objeto de la pestaña seguía en 7.290.000 / 1.090) |
| Ajuste de Saldo | igual a las cards |
| Transferir | igual a las cards. **El diálogo no tiene llamador en `develop`** (`onTransferencia()` del dashboard no se usa; las transferencias van por Operaciones Financieras): se abrió desde la consola de Angular |
| Historial desde la lista | una card por moneda, mismos montos que el dashboard |
| Error de red (XHR cortado) | diálogo: «No disponible», usable; historial: «No se pudieron cargar los saldos de la caja.» |
| Rechazo GraphQL | snackbar «Ups! Algo salió mal: …» + lo mismo que el error de red |
| Caja chica (tipo y límite puestos por SQL y restaurados) | 1.er ingreso bajo el límite sin aviso; 2.º ingreso avisa con el saldo real (el código viejo no avisaba: usaba el saldo de cuando se abrió la pestaña) |
| `npm run check` | sin errores (`EXIT=0`) |

## Sin verificar

- Si existe en producción alguna caja con el shim desfasado de `caja_virtual_saldo` (no hace falta para el
  fix: con este cambio los diálogos dejan de leer el shim).
