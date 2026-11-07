# Plan: «Anular» en caja mayor solo donde el central lo acepta, y por qué no en el resto

Repo: desktop. Sin cambios en el central. Rama `fix/caja-mayor-anular-por-origen` desde `origin/develop` (ya con #694).
Pendiente que quedó de #692.

## 1. El problema [verificado leyendo]

En *Movimientos de caja mayor*, toda fila activa que no sea AJUSTE muestra «Anular» habilitado (`esAnulable`). Las filas
que no tienen rama propia en `onAnular` van a `anularMovimientoCajaVirtual`, y `TesoreriaService.anular` (central) solo
acepta origen `MANUAL`, `MALETIN`, `VUELTO` o sin origen: al resto responde «anúlelo desde su módulo de origen». El
usuario confirma y recibe un error.

Qué pasa con cada origen sin rama, según el central de `develop`:

| Origen | ¿Hay otra forma de anularlo? |
|---|---|
| `RRHH_VALE` | Sí: `anularVale` revierte la caja (R.R.H.H. → Anticipos → Vales, rol RRHH GESTIONAR; no si ya se descontó) |
| `RRHH_LIQUIDACION_SUELDO` | Sí, si se pagó como egreso directo: `anularLiquidacion` (R.R.H.H. → Liquidaciones, detalle; rol RRHH PAGAR) |
| `RRHH_LIQUIDACION_FINAL` | Sí: `anularLiquidacionFinal` (R.R.H.H. → Liquidaciones → Finiquito, o el legajo; rol RRHH PAGAR) |
| `RRHH_PRESTAMO` (desembolso y cobro de cuota), `RRHH_AGUINALDO` | No hay anulación en ningún lado |
| `GASTO` (no consolidado) | No: `cancelarGasto` no toca la caja |
| `VENTA_CREDITO_COBRO` | No llega a la caja mayor (el cobro va al banco); igual queda cubierto por «no se puede» |
| `DEVOLUCION` (merma) | No: revertir la devolución o su nota no revierte la caja |
| `CHEQUE`, `ACREDITACION_POS` | No (no hay quién escriba esos orígenes en caja) |

Lo pagado por el hub de tesorería (pago consolidado) ya se anula entero desde la fila; no cambia.

## 2. Cambio (una fase)

`caja-virtual-dashboard.component.ts`:
- `motivoNoAnulable(m)`: `null` si la fila tiene rama propia (la clave de `claveAnulacion` no es `MOVIMIENTO:`) o si el
  origen es de los que el central acepta (`MANUAL`, `MALETIN`, `VUELTO`, sin origen; espejo de `TesoreriaService.anular`).
  Si no: el texto de la tabla con la pantalla y el rol («Se anula en R.R.H.H. → Anticipos → Vales (rol RRHH
  GESTIONAR)», «… → Liquidaciones (rol RRHH PAGAR)», «… → Liquidaciones → Finiquito (rol RRHH PAGAR)») o «Este movimiento
  no se puede anular». La lista de orígenes aceptados lleva un comentario: espejo de `TesoreriaService.anular`.
- `esAnulable` llama a `motivoNoAnulable(m)` (no lee el campo de la fila: en la primera carga todavía no existe).
- El motivo depende solo de los datos de la fila (origen, ids, `activo !== false`, no AJUSTE), no de permisos ni de
  anulaciones en curso: sin permiso o con la anulación en vuelo se sigue viendo «Anular» gris. Se calcula una vez al
  armar la fila.
- HTML: «Anular» deshabilitado con el motivo en un `matTooltip` al pasar el mouse (pedido de Franco el 07/11, en lugar
  de reemplazar el texto). Va en un contenedor, como en la tabla de banco: un ítem deshabilitado no recibe el hover.

Decidido por Franco (07/11): deshabilitar y explicar según el caso; no abrir vías nuevas de anulación (en RRHH rompería
la separación liquida/paga).

## 3. Lo que no cambia
- El central. Las ramas existentes de `onAnular` (retiro, pago, operación financiera, transferencia, entrada varia).
- «Ir al origen» (vale ya lo tiene).

## 4. Datos nuevos
Ninguno.

## 5. Tests
- Batería: N/A para desktop (CI no corre Karma; el dashboard no tiene spec). Gate: `npm run check`.
- Por pantalla (central de `develop` 8081 + desktop web), base local: hay filas `RRHH_VALE`, `RRHH_PRESTAMO`,
  `RRHH_LIQUIDACION_SUELDO`, `GASTO` y `RETIRO_CAJA` activas.
  1. Vale y liquidación (y finiquito si hay fila; si no, por SQL de una copia): gris con su pantalla y rol; vale sigue
     con «Ir a Vales».
  2. Préstamo (desembolso y cuota) y gasto suelto: gris con «Este movimiento no se puede anular».
  3. Regresión, siguen anulables: manual, transferencia manual (las dos patas), sin origen, maletín, vuelto, entrada
     varia, retiro, operación financiera y pago consolidado.
  4. Ya anulada con origen de vale o préstamo: «Anular» gris sin motivo.
  5. Anulación en vuelo (respuesta demorada con el parche de XHR): la fila queda «Anular» gris sin motivo y vuelve al
     releer.
  6. Rol acotado (`GERENTE12`): ve los mismos motivos; en filas anulables sin permiso, «Anular» gris sin motivo.

## 6. Auditoría del plan (paso 5)
- Eje A: tabla confirmada; préstamo y aguinaldo no tienen anulación; el cobro de crédito no llega a la caja. Mayor: el
  texto tiene que decir el rol que hace falta (RRHH GESTIONAR / RRHH PAGAR), que un cajero no suele tener.
  Incorporado. Menores: comentario del espejo con el central, finiquito sin menú propio. Incorporados.
- Eje B: sin regresiones; Mayor: el motivo se calcula antes de `esAnulable` y no depende del estado dinámico.
  Incorporado, con las pruebas que faltaban (transferencias, maletín, vuelto, en vuelo, rol acotado).

## 7. Sin verificar
- Filas `CHEQUE` / `ACREDITACION_POS` reales: no hay en local ni quién las escriba.
- Devolución: si cancelar una devolución con merma ya generada toca la caja (la lectura indica que no se puede cancelar después de colectar).
- Anular un vale por su pantalla devuelve la caja: lo dice el código del central, no se prueba en este PR.
