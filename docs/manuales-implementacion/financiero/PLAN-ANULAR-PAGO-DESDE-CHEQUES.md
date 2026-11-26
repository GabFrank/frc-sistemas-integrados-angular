# Plan — Anular el pago desde el dashboard de cheques (desktop #809)

Rama `fix/cheques-anular-pago-desde-dashboard` desde `develop` (`98a02ba0`). Solo desktop: el central ya tiene todo
(`anularPagoCpp`, `chequesAAnular`, `detalleDePago`, `imprimirChequeAnulado`). Este archivo se borra en el PR.

## Problema

Un pago hecho **solo con cheques diferidos** no se puede anular: no tiene fila de efectivo en la caja mayor (no movió
caja) ni fila de banco (el diferido solo reserva; el débito nace al cobrar). En Cheques, el ⋮ Anular de sus cheques está
deshabilitado con «Es del pago #N: anulá el pago desde la caja mayor», y el central rechaza anular suelto un cheque de
un pago (#601).

## Cambio (`cheques-dashboard.component`)

- Para un cheque de un pago (`pagoId`) no anulado (incluye COBRADO: el central revierte su débito): ⋮ **«Anular el pago
  #N»**, con el permiso de la caja y el banco: `TESORERIA_GESTIONAR` o `TESORERIA_CPP_PAGAR` (flag propio en
  `ngOnInit`, no `puedeGestionar`). El rol acotado TESORERIA CAJA no lo ve: el central igual le rechaza los pagos con
  cheque («Lo anula tesorería»). Sin permiso queda el «Anular» deshabilitado con su aviso, como hoy.
- **Un pago en curso bloquea todas sus filas**: `pagosEnCurso` (por `pagoId`) se toma al hacer clic, antes del primer
  diálogo, y se suelta en toda salida (volver, lectura fallida, fin). Mientras dura, ninguna fila de ese pago ofrece
  acciones. Así un doble clic o la otra fila del mismo pago no abren otra cadena de diálogos.
- Flujo (como la fila de banco):
  1. `detalleDePago(pagoId)` para el aviso: qué documentos se reabren. Si alguno es de RRHH: «La liquidación / el
     finiquito vuelve a quedar aprobado, sin pagar (el funcionario sigue de baja); para anularlo, hacerlo desde RRHH».
     Si la lectura falla, aviso genérico (no bloquea: la anulación es la misma).
  2. `MotivoDialogComponent`: motivo del pago, con ese aviso («Se anula el pago completo: todos sus movimientos de caja y
     de banco, y sus cheques…»).
  3. `motivoParaChequesDe({ pagoId })`: motivo de la lista para sus cheques (#807). «Volver» o lectura fallida → no se
     anula nada. Si no queda ningún cheque vivo (el pago ya se anuló por otra vía), sigue y el central responde «El
     pago ya está anulado».
  4. `onAnularPago(pagoId, motivo, anulacionCheque)`. Éxito → aviso, comprobantes de los cheques del paso 3 (no del
     resultado, que es un `Pago`), relectura. Rechazo del central (límite de antigüedad, gasto cancelado, ya anulado)
     → su mensaje y relectura. **Sin respuesta (corte del link)** → la fila sigue bloqueada y se relee a los
     `RECARGA_TRAS_CORTE_MS` (5 s), como el resto de la app, para no mostrar «Diferido» mientras el central aplica.
- Un pago por lote se anula entero (el central reabre todas sus solicitudes, `PagoProveedorService` ~944-966): el
  aviso del paso 1 las nombra. Es el mismo comportamiento que desde la caja y el banco.

## Fases

| Fase | Contenido | Tests |
|---|---|---|
| 1 | flag de permiso, `_anularPago`, `pagosEnCurso`, `onAnularPago` con el flujo de arriba | spec nuevo `cheques-dashboard-anular-pago.spec.ts` (sin TestBed, 8 stubs): éxito llama `onAnularPago(pagoId, motivo, anulacion)` e imprime los cheques; «Volver» en el motivo del pago o del cheque → no anula; lectura de cheques fallida → no anula; segundo clic del mismo pago mientras corre → una sola llamada; rechazo → relee; corte → relee a los 5 s; flag según permiso, `pagoId` y estado; aviso RRHH con `detalleDePago`. Karma a mano con tsconfig acotado. `npm run check` |

## Pruebas de runtime

Central local 8081 + desktop web, base local:

1. Pago solo con cheques diferidos (pago #39, cheques 700027–700029): Cheques → ⋮ «Anular el pago #39» → motivo →
   motivo del cheque → pago CANCELADO, cheques ANULADO con su motivo, reserva liberada, aviso de comprobante (web).
2. «Volver» en cada diálogo: no se anula nada. Mientras está abierto, las otras filas del pago no ofrecen acciones.
3. Pago con efectivo + cheque (y uno con cheque al contado): se anula desde el cheque; caja y banco revertidos.
4. Pago de RRHH (liquidación pagada con cheque): el aviso lo dice; la liquidación queda APROBADA.
5. Pago por lote (dos solicitudes): el aviso nombra las dos; las dos se reabren.
6. Usuario solo con `TESORERIA VER`: no ve el ítem.
7. Pago ya anulado desde la caja con la lista vieja: el central rechaza y la lista se relee.
8. Pago más viejo que el límite de antigüedad: se muestra el rechazo del central.

## Riesgo y reversa

Riesgo de código bajo: agrega una entrada a una anulación que ya existe (caja/banco), sin cambios de API ni de base;
revertir el commit lo quita. **Una anulación hecha es irreversible**: el pago queda CANCELADO, las solicitudes
reabiertas, los cheques ANULADO y la reserva liberada; revertir el código no la deshace (igual que desde la caja).
