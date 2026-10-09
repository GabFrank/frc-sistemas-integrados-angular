# Idempotencia del pago de compras/gastos y de la emisión de cheques

El central acepta una **clave de idempotencia** en `pagarSolicitudesMixto` y en `emitirCheque`
(`franco-system-backend-servidor`, `ARQUITECTURA-MODULO-FINANCIERO.md` §7.1): un pedido repetido con la misma
clave devuelve lo que ya se registró en vez de registrarlo otra vez. El desktop es quien genera la clave.

## Reglas

- **Una clave por intento del usuario.** Cada «Confirmar pago» / «Emitir» genera una con
  `nuevaClaveIdempotencia()` (`commons/core/utils/claveIdempotencia.ts`, UUID v4 con `getRandomValues`).
- **El pedido se congela junto con su clave.** Las variables se copian al enviar; reenviar es mandar ese mismo
  objeto, sin rearmarlo desde el formulario.
- **Solo «Reenviar» reusa una clave.** Un pedido nuevo —después de un rechazo o de descartar— lleva otra.
- **Un solo pedido pendiente por diálogo, y mientras exista no se confirma otro.** Un segundo pago con otra
  clave sobre las mismas notas se registraría además del primero.

## Qué ve el usuario ante un «sin respuesta»

| Diálogo | Queda | Salidas |
|---|---|---|
| `pagar-compras-dialog`, modos COMPRAS y GASTOS | el aviso «Un pago quedó sin confirmar», con «Confirmar» y «Siguiente» deshabilitados | **Reenviar pago**; **Descartar** (con confirmación: vuelve a permitir el pago doble); **Cancelar** (con confirmación) |
| `emitir-cheque-dialog` | solo el aviso; el formulario se oculta y Esc / clic afuera no cierran | **Reenviar cheque**; **Cerrar** (aviso de revisar la chequera; el dashboard se relee) |

Resultado de un reenvío:

- responde con el pago / cheque → éxito, igual que un alta normal;
- **rechazo** → se muestra el mensaje y el pedido pendiente se descarta. Un rechazo de negocio significa que el
  original no se había registrado (el central busca la clave antes de validar), salvo «ya se registró y después
  fue anulado», que lo dice el propio mensaje;
- otra vez sin respuesta → sigue pendiente.

Los modos de vales y de RRHH no llevan clave: sus mutations no tienen el argumento y el central ya rechaza su
repetición. Conservan el aviso sin botones.

## Lo que no cubre

- Descartar, rearmar el mismo pago a mano y confirmar es un pedido nuevo: el central lo registra otra vez.
- Cerrar el diálogo no cancela un pedido en vuelo, y el pedido pendiente no se persiste: se pierde si la app se
  cierra o se actualiza.
- Con el websocket del central sin confirmar, cada intento se corta a los 3 s (`createCentralTimeoutLink`). El
  reenvío converge igual: cuando el original terminó, es una búsqueda por clave.

## Despliegue

Un desktop que declara `$claveIdempotencia` contra un central que no tiene el argumento falla por validación de
schema y **no deja pagar compras ni emitir cheques**. El central de cada puerta va primero, y lo que se
comprueba es el central (un POST a su `/graphql` con el argumento), no el canal del instalador ni la rama. Vale
también para **Deploy Web**, que no valida que el `ref` corresponda al canal.

## Para sumar otra operación

Cuando el central agregue el argumento a otra mutation: variable `$claveIdempotencia: String` en su documento,
clave nueva al confirmar, pedido congelado, y el mismo patrón de pendiente / reenviar en su diálogo.

## Movimientos y transferencias de caja mayor en varias monedas

Los diálogos `add-movimiento-caja-virtual-dialog` (ingreso, egreso, ajuste) y
`transferencia-caja-virtual-dialog` cargan Gs, Rs y Ds a la vez. Mandan **un solo pedido** con todos los montos
(`registrarMovimientosCajaVirtual`, `realizarTransferenciasCajaVirtual`) y su `claveIdempotencia`; el central lo
registra entero o no lo registra (franco-system-backend-servidor#376). Antes iba un pedido por moneda, en serie
(`enviar-en-serie.ts`, eliminado), y un rechazo de la segunda dejaba la primera adentro.

- **Rechazo:** no entró ninguna moneda; el formulario queda para corregir y el próximo intento usa otra clave.
- **Sin respuesta:** el diálogo pasa a «No se pudo confirmar» con *Reintentar* (el mismo pedido, con su clave) y
  *Cerrar* (cierra con `true`, para que la caja se relea). No se vuelve al formulario.
- El usuario del movimiento lo pone el central (el de la sesión); el desktop ya no lo manda.
- El ajuste de egreso manda el monto negativo, como antes.
- El ajuste por conteo (`conteo-caja-dialog`) sigue con `saveMovimientoCajaVirtual`, de una moneda y sin clave.
- Hoy ningún botón abre el diálogo de transferencia (`onTransferencia` del dashboard no está en el template):
  quedó actualizado igual, para cuando se vuelva a enlazar.
