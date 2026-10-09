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

## Ajustes de saldo: conteo de caja y cuenta bancaria

Los dos ajustes se calculaban acá, con el saldo que se veía en pantalla. Ahora el pedido dice contra qué saldo se
hizo, y el central rechaza si ya no es ese (franco-system-backend-servidor#376).

- **Conteo de caja** (`conteo-caja-dialog`): manda `saldoEsperado` (el saldo del sistema que se veía) y `contado`
  a `ajustarCajaVirtualPorConteo`; la diferencia la calcula el central y deja el saldo exactamente en lo
  contado. No lleva clave: es absoluto, y repetido responde que el saldo ya coincide con lo contado.
- **Saldo bancario** (`ajustar-saldo-cuenta-dialog`): manda `saldoEsperado` y `claveIdempotencia`. Es relativo
  (suma o resta un monto), así que el saldo esperado solo no alcanza: lleva también la clave y el patrón de
  pendiente / *Reintentar* de pagos y cheques.
- **Rechazo por saldo** (`esRechazoPorSaldo`, en `financiero/rechazo-por-saldo.ts`): el saldo «cambió» o «ya
  coincide con lo contado». El que se ve en el diálogo quedó viejo y otro intento volvería a rechazarse, así
  que el diálogo **cierra** con `true` para que quien lo abrió relea. Se reconoce por el texto del mensaje: el
  error de GraphQL no trae código. Los demás rechazos dejan el diálogo abierto para corregir.
- Lo contado sigue guardado en `localStorage` por caja y moneda: reabrir el conteo no lo pierde.
