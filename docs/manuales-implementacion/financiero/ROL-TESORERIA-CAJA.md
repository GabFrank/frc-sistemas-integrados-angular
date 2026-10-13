# Rol `TESORERIA CAJA` en el desktop

El rol acotado de tesorería: un operador (típicamente un gerente de sucursal) que maneja solo las
cajas a las que tiene acceso y no ve nada global. Las reglas, la puesta en marcha y la guía de
prueba manual están en el repo del central, en
`docs/manuales-implementacion/financiero/ROL-TESORERIA-CAJA.md`. Acá va lo propio del desktop.

## El central manda

Todo lo que el rol no puede hacer lo rechaza el central. El desktop solo evita **mostrar** lo que
va a fallar: una opción que se escape acá termina en un «No autorizado», no en una fuga.

## Los tres predicados

En `src/app/modules/financiero/caja-virtual/rol-tesoreria-caja.ts`, espejo de
`TesoreriaSecurityService` del central:

| Función | Verdadera si tiene `TESORERIA CAJA` y no tiene… | Dónde se usa |
|---|---|---|
| `esSoloTesoreriaCaja` | ningún rol amplio de tesorería | lo que se **ve**: en el dashboard de la caja no se piden la configuración ni el resumen bancario, y se ocultan las cuentas, el selector de fuente y el detalle de operaciones |
| `operaAcotadoCaja` | `TESORERIA GESTIONAR` | selectores de ingreso y egreso, operación financiera, retiros, conteo |
| `pagaAcotadoCaja` | `TESORERIA CPP PAGAR` ni `GESTIONAR` | diálogo de pago: solo efectivo, en la moneda de la deuda, sin cheques |

Son distintos a propósito: con `CAJA` + `VER` el usuario ve lo global pero sigue operando y
pagando como acotado. No reemplazar uno por otro.

`puedeOperarCaja` (`GESTIONAR` o `CAJA`) habilita los botones de Ingreso, Egreso y Operaciones
Financieras del dashboard de la caja.

## Menú

`TESORERIA CAJA` está en el grupo `Financiero`, en `Caja y Operativa` y en `Tesorería`
(`list-caja-virtual`). No se agrega a ninguna otra entrada: el rol no puede leer lo que esas
pantallas piden.

## Consultas nuevas, aparte de las existentes

- `cuentasBancariasParaDeposito(cajaVirtualId)`: cuentas habilitadas para depositar desde una
  caja. Solo la pide la operación financiera en modo acotado, al elegir la caja de origen.
- `solicitudPago { cajaVirtualAsignadaId cajaVirtualAsignadaNombre }` y
  `asignarSolicitudPagoACaja`: solo las pide el diálogo «Asignar a caja» de la lista de
  solicitudes de pago (roles `TESORERIA CPP PAGAR` o `GESTIONAR`).

- `cajasVirtualesReceptoras`: cajas marcadas «recibe envíos», solo con id, nombre y sucursal. La pide
  la operación financiera para armar el destino de «Transf. entre Cajas»: las cajas del usuario más las
  receptoras, que se muestran con el sufijo «(recibe envíos)» y nunca como origen.
- `cajaVirtual { recibeEnvios }` y `marcarCajaRecibeEnvios`: solo las pide la acción «Recibe envíos…»
  del menú de la lista de cajas (responsable de la caja con `TESORERIA GESTIONAR`).

- `cajaVirtual { sucursal sucursalesAdicionales }` y `guardarSucursalesDeCaja`: las pide el diálogo
  «Sucursales que cubre…» del menú de la lista de cajas (responsable de la caja con
  `TESORERIA GESTIONAR`). La consulta también la usa el ingreso de retiros del rol acotado para armar
  el filtro «Sucursal de origen»: una sola sucursal queda fija; con varias se elige entre ellas.
- `retirosFlotantes(cajaVirtualDestinoId)`: documento aparte (`retirosFlotantesDeCajaQuery`) que solo
  manda el rol acotado, para que el central le liste únicamente lo que esa caja puede recibir.

La caja asignada y la marca «recibe envíos» **no** se agregaron a los listados existentes (solicitudes,
pendientes de pago, cajas): un desktop nuevo contra un central que todavía no los conoce rompería esas pantallas para
todos. En su consulta propia, lo peor que pasa es que el diálogo avise que no pudo leer la
asignación.
