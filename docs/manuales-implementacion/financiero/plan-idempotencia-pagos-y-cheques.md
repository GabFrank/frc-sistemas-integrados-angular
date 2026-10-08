# Plan: enviar la clave de idempotencia en el pago de compras/gastos y en la emisión de cheques

Rama: `fix/financiero-idempotencia-pagos-y-cheques` (desde `origin/develop` 19822cbf).
Acompaña al PR del central del mismo nombre (issue `franco-system-backend-servidor#376`, punto 1), que
agrega el argumento opcional `claveIdempotencia` a `pagarSolicitudesMixto` y a `emitirCheque`.
Este archivo es registro de trabajo: se borra en el PR final.

## Qué cambia para el usuario

Hoy (#390), cuando un pago o una emisión de cheque queda **sin respuesta**, el diálogo no deja reintentar:
suelta lo armado (pago) o se cierra (cheque) y pide comparar saldos a mano, porque repetir el pedido lo
registraba dos veces. Con la clave, repetir **ese mismo pedido** es seguro: si el central ya lo había
registrado devuelve lo que creó, y si no, lo registra.

### Pago de compras y de gastos (`pagar-compras-dialog`, modos `COMPRAS` y `GASTOS`)

Ante un «sin respuesta» el pedido queda **pendiente** y el aviso «Un pago quedó sin confirmar» suma dos
botones:

- **Reenviar pago**: manda otra vez exactamente ese pedido, con su clave. Si responde, el diálogo se cierra
  como un pago normal. (No se llama «Reintentar»: ya hay un «Reintentar» en el mismo diálogo que relee la
  lista.)
- **Descartar**: «ya revisé los saldos». Suelta el pedido pendiente y deja el diálogo como hoy, para armar
  otro pago.

**Mientras haya un pedido pendiente no se puede confirmar otro pago** en ese diálogo: «Confirmar» queda
deshabilitado hasta reenviar o descartar. Sin esa regla, un segundo pago con otra clave sobre las mismas
notas se registraría además del primero, y el aviso mezclaría dos pedidos con un solo botón.

«Cancelar» con un pedido pendiente pide confirmación («si cerrás, no vas a poder reenviarlo»).

### Emisión manual de cheque (`emitir-cheque-dialog`)

Ante un «sin respuesta» el diálogo **ya no se cierra**: muestra el aviso y deja solo **Reenviar cheque** y
**Cerrar**. Los campos, «Emitir» y «Cancelar» quedan fuera de alcance hasta resolverlo; Esc y el clic
afuera no cierran. «Cerrar» hace lo de hoy: cierra, deja el aviso de revisar la chequera y el dashboard
se relee.

### Lo que no cambia

Vales, liquidaciones, finiquitos y aguinaldos (modos `VALES` y RRHH del mismo diálogo): sus mutations no
tienen el argumento y el central ya rechaza su repetición. Siguen con el aviso de hoy, sin botones.

## Diseño

- **Clave**: `nuevaClaveIdempotencia()` en `src/app/commons/core/utils/claveIdempotencia.ts`: UUID v4 con
  `crypto.getRandomValues` (no `randomUUID`, que solo existe en contexto seguro, y el desktop también se
  sirve por `http://<ip>`). Si no hay `crypto`, cae a `Math.random`: es una clave de unicidad, no un
  secreto, y no puede lanzar dentro de `onSave`. El archivo no importa nada de la app.
- **El pedido se congela junto con su clave**: `{ clave, variables }` con las variables **copiadas**
  (sin referencias a la selección, a las líneas ni a los controles). El reenvío manda ese objeto tal cual.
- **Una clave por intento del usuario**: cada «Confirmar» / «Emitir» genera una. Solo «Reenviar» la reusa.
- **Un solo pedido pendiente por diálogo** (`pedidoPendiente | null`) y un flag `hayPendiente` que es un
  campo, actualizado en cada transición (sin getters ni funciones en el HTML).
- **GraphQL**: `$claveIdempotencia: String` en `pagarSolicitudesMixtoMutation` y `emitirChequeMutation`.
  `PagarComprasService.onPagarMixto(pagos, claveIdempotencia?, servidor = true)` (el parámetro `servidor`
  no cambia de sentido; hay un solo llamador) y `ChequeService.onEmitirManual(vars)` con el campo nuevo.
- **Resultado del reenvío**:
  - responde con el pago / cheque → éxito, mismo cierre que el alta normal (el pago cierra con el `Pago`,
    el cheque con `true`: quienes abren los diálogos refrescan con cualquier valor verdadero);
  - **rechazo** → se muestra el mensaje del central, se descarta el pendiente, se quita el aviso y se
    relee la lista. Un rechazo de negocio («ya está CONCLUIDO», «excede el saldo») solo puede salir si el
    original **no** se registró: el central busca la clave antes de validar. «Ya se registró y después fue
    anulado» es el único que dice que sí hubo registro, y lo dice el propio mensaje;
  - otra vez sin respuesta → el pedido sigue pendiente.
- **Cierre**: mientras se guarda o se reenvía, y mientras haya pendiente, `disableClose = true`; se baja al
  resolver. (Hoy el pago no lo sube mientras guarda: un Esc en ese momento perdía la respuesta.)
- **Cheque**: el bloqueo es por flag propio, **no** con `formGroup.disable()`: un formulario deshabilitado
  no es `invalid`, y «Emitir» quedaría habilitado para un pedido nuevo con otra clave. El pedido congelado
  guarda también si era diferido y el texto del aviso, para que el éxito del reenvío diga lo correcto.
- **Tiempos de corte** (no se tocan): una mutation al central se corta a los 60 s (`timeout-link`), y a los
  **3 s** si el websocket con el central no está confirmado (`createCentralTimeoutLink`). Cortar del lado
  del desktop no frena al central. Por eso el reenvío converge: cuando el original terminó, el reenvío es
  solo una búsqueda por clave y responde enseguida; si el original sigue corriendo, el reenvío espera
  detrás, puede cortarse otra vez y el pedido sigue pendiente.

## Tabla de datos nuevos

| Dato | Quién lo escribe | Quién lo lee |
|---|---|---|
| variable `claveIdempotencia` de las dos mutations | `PagarComprasDialogComponent.onSave` / `reenviarPago`, `EmitirChequeDialogComponent.onSave` / `reenviar` | central: `PagoProveedorGraphQL.pagarSolicitudesMixto`, `ChequePosGraphQL.emitirCheque` |

## Fases

1. **Clave + GraphQL + servicios** (`claveIdempotencia.ts` con su `.spec.ts`: formato v4, largo ≤ 64,
   unicidad, sin `crypto`; las dos mutations; los dos servicios). Los diálogos mandan la clave; sin botones.
2. **Pedido pendiente en `pagar-compras-dialog`**: Reenviar pago, Descartar, bloqueo de Confirmar,
   confirmación al cancelar, `disableClose` (ts + html + scss).
3. **Pedido pendiente en `emitir-cheque-dialog`**: Reenviar cheque, Cerrar (ts + html + scss).

`npm run check` (AOT) al final de las tres fases; `npm run verificar:imports` antes de cada push.

## Prueba (central local `:8081` con la rama del central, `ng serve -c web`, Chrome)

El «sin respuesta» se provoca sin tocar código: bloquear `/graphql` en DevTools después de enviado, o bajar
el central justo después del clic. El error tiene que tener forma de `ApolloError`, no un stub plano.

- Pago parcial de un gasto → sin respuesta → **Reenviar pago** con el central arriba: un solo pago en la
  caja; el diálogo se cierra con «Pago registrado correctamente».
- Lo mismo cuando el central **no** había llegado a registrar: Reenviar lo registra, una vez.
- Doble clic en Reenviar: un solo pago.
- Con un pedido pendiente, «Confirmar» está deshabilitado; **Descartar** lo habilita y deja armar otro.
- Pago con cheque → sin respuesta → Reenviar: un solo cheque, el correlativo avanza una vez.
- Anular el pago desde la caja y después Reenviar: «ya se registró y después fue anulado»; desaparecen los
  botones y el aviso.
- Cancelar con pendiente: pide confirmación; al aceptar, la caja se relee.
- Websocket caído (bloquear solo `/subscriptions`): el corte llega a los 3 s; Reenviar termina respondiendo.
- Emitir cheque al día y diferido → sin respuesta → **Reenviar cheque**: un cheque. **Cerrar**: aviso de
  revisar la chequera y el dashboard se relee. Esc y clic afuera no cierran.
- Modos VALES y LIQUIDACION: sin botones, sin cambios.
- Pago y cheque normales con respuesta: sin cambios visibles; en la base queda la fila de la clave.
- **Central sin el argumento** (el `develop` del central): confirmar con un POST real cómo responde a una
  mutation con un argumento desconocido y cómo lo muestra el desktop (se espera un rechazo con el texto de
  validación, no un «sin respuesta»).
- Una vez en Electron (`npm run electron:local`): emitir un cheque, para ver la clave bajo `file://`.

## Despliegue

Un desktop que declara `$claveIdempotencia` contra un central que no lo tiene falla por validación de
schema: **no se puede pagar compras ni emitir cheques**. No se degrada (no se reenvía sin la variable):
escondería un despliegue mal ordenado. El orden es central primero, **en cada puerta**:

| Central | Rama | Instalador | Web (Deploy Web, manual, `ref` libre) |
|---|---|---|---|
| alpha, mauro `:8083` | `develop` | canal alpha | `frc-desk-alpha` |
| farmacia `:8082` | `release/beta` | canal beta | `frc-desk-beta` |
| bodega `:8081` | `master` | canal stable | `frc-desk-prod` |

- No se mergea este PR a `develop`, ni se promueve a `release/beta` o a `master`, hasta comprobar el central
  de esa puerta: un POST de prueba a su `/graphql` con el argumento. La evidencia va en el PR.
- No se lanza **Deploy Web** de un canal con un `ref` que contenga este cambio antes que su central. El
  workflow no valida que el `ref` corresponda al canal.
- El central al que apunta una instalación es configurable: lo que se comprueba es el central, no el canal
  del instalador.
- El instalador se actualiza solo a los 5 minutos de publicado el release: el orden lo sostiene el merge.
- Rollback del desktop: inocuo (vuelve a no mandar la clave). Rollback del central con este desktop ya
  instalado: no; se corrige hacia adelante.
- Cliente viejo contra central nuevo (alguien pospone la actualización): sigue como hoy, sin clave.

## Auditoría del plan (paso 5, 2026-10-08)

Dos auditores (contrato y propagación; reversibilidad y estado). No se contradijeron.

| Hallazgo | Qué se hizo |
|---|---|
| Un slot para el pendiente con un aviso que acumulaba dos pedidos: uno quedaba sin poder reenviarse, y un segundo pago con otra clave se sumaba al primero | un solo pendiente y **no se confirma otro pago mientras exista**; salida explícita «Descartar» |
| `formGroup.disable()` dejaba «Emitir» habilitado | bloqueo por flag propio |
| En el cheque, «Cancelar», Esc y clic afuera cerraban sin releer el dashboard | con pendiente solo quedan Reenviar y Cerrar; `disableClose` hasta resolver |
| El orden de despliegue no nombraba la web ni el central configurable | tabla por puerta y regla para Deploy Web |
| Ya existe un «Reintentar» en el diálogo de pagos | los botones nuevos son «Reenviar pago» / «Reenviar cheque» |
| El pago no subía `disableClose` mientras guardaba | se sube al guardar y al reenviar |
| Cancelar con pendiente perdía el pedido sin avisar | pide confirmación |
| Rechazo del reenvío: qué significa y qué se limpia | definido arriba |
| `onPagarMixto(pagos, clave)` pisaba el lugar de `servidor`; la clave sin `crypto` lanzaba | firma con `servidor` al final; fallback |
| Corte de 3 s con el websocket caído: `timeoutMs` no lo mueve | **no se toca** el link compartido: el reenvío converge igual. Documentado y con caso de prueba |
| Mensaje amigable para «central sin el argumento» | no aplicado: depende de comparar el texto del error; se cubre con el orden de despliegue y un caso de prueba |
| Extraer un clasificador de resultado y un reductor del pendiente para testear | no aplicado: el CI no corre Karma y agranda el diff; queda el spec de la clave |
| Vigencia de la clave en el central | no aplica: el central no las vence |

## Queda sin verificar / fuera de alcance

- Si el usuario descarta el pendiente, rearma el mismo pago y confirma, es un pedido nuevo con clave nueva:
  el central lo registra otra vez, igual que hoy. El aviso con los saldos sigue siendo la defensa.
- Cerrar el diálogo no cancela un pedido en vuelo (`apollo.mutate` sigue hasta terminar); no deja nada
  inconsistente en el central, pero el usuario no ve el resultado. Por eso no se puede cerrar mientras se
  reenvía.
- Actualizar el desktop con un diálogo abierto pierde el pedido pendiente (no se persiste).
- Las demás operaciones de la issue no tienen el argumento todavía.
