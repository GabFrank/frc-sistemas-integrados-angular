# Plan — venta sin nombre de 7.000.000 o más con factura electrónica (#473)

Rama: `fix/pdv-factura-sin-nombre-tope` (desde `develop`, `5842ce47`). Solo desktop.

## Qué resuelve

Una venta sin cliente de 7.000.000 Gs o más no se puede facturar electrónicamente: SIFEN no admite
el receptor innominado desde ese monto. Hoy el cajero se entera por un aviso de 5 segundos y no
tiene, desde el cobro, una forma directa de cargar el cliente y seguir.

Este plan cubre **solo el tope sin nombre**. El ítem a precio cero, que el #473 también menciona,
queda afuera (ver «Fuera de alcance»).

## Lo que se verificó en el código (13/10/2026)

Filial, `develop` (`5.0.0-alpha.44`, PR #172 mergeado el 11/10):

- El tope **solo existe para la factura electrónica**. `FacturaLegalBuilder.build()` ensaya el
  documento electrónico únicamente con `ensayoDeHabilitado && sifenHabilitado && timbradoElectronico`.
  Con timbrado no electrónico no hay tope.
- «Sin nombre» lo decide `SifenReceptorHelper.determinarConfiguracionReceptor(factura.getCliente(), total)`:
  sin cliente, cliente sin persona, nombre vacío o «Sin Nombre», documento vacío o «0».
- El total que se compara es el de la factura: ítems menos el descuento del cobro.
- Ante el tope, el filial **rechaza la venta** con `VentaNoFacturableException`: «No se puede
  facturar sin nombre una venta de 7.000.000 o mas. Cargue un cliente con nombre y documento (CI o
  RUC) y vuelva a intentar.» No guarda nada y libera la reserva del control de ventas duplicadas.
  El rechazo no trae código ni `extensions`: solo el texto.
- Si la venta se factura lo decide `PoliticaFacturacionService.decidirRuta`: en F8 la política
  (`tocaPorPolitica`), en F11 `facturar == true && facturaInmediata(politica, pdvId)`.
- `release/beta` y `master` del filial **no tienen el #172**: ahí el mismo caso sigue respondiendo
  «Transaction silently rolled back…» y pierde la venta.

Desktop, `develop`:

- El PDV no sabe si SIFEN está habilitado, si el timbrado del PDV es electrónico ni qué decide la
  política. No hay ninguna consulta de eso en `venta-touch` ni en `pago-touch`.
- El cobro rápido (`onTicketClick`, F8 y F11) nunca carga cliente. `venta.cliente` solo se llena
  desde el diálogo de pago, y solo si hubo factura manual o convenio
  (`venta-touch.component.ts:1186`, `:1204`).
- El rechazo llega al handler `error` de `onSaveVenta` (`venta-touch.component.ts:1691`) como
  arreglo de errores GraphQL. `GenericCrudService.onCustomMutation` ya mostró «Ups! Algo salió mal
  en operacion: <motivo>» por 5 segundos; el handler no agrega nada y el carrito queda intacto.
- `Venta.toInput()` manda `clienteId` (`venta.model.ts:38`), que es de donde el filial saca el
  cliente de la factura silenciosa y de «Venta + Ticket».

## Decisión de diseño: no validar antes, reaccionar al rechazo

El #473 pide frenar «antes de mandar la venta». No se puede hacer bien desde el desktop: para saber
si el tope aplica hacen falta tres datos que solo tiene el filial (SIFEN habilitado, timbrado
electrónico, y si la política factura esta venta). Un chequeo local bloquearía ventas de 7.000.000
o más que no iban a facturarse, o con timbrado no electrónico.

El filial ya rechaza antes de escribir, así que el rechazo **es** la validación previa: la venta no
existe y el carrito está intacto. Lo que falta es qué hace el desktop con ese rechazo.

Cuando `saveVenta` es rechazada por el tope, el desktop:

1. Abre un diálogo que explica el motivo y pide el cliente (CI o RUC).
2. Con el cliente elegido, reenvía **la misma venta y el mismo cobro** con `venta.cliente` cargado.
3. Si el cajero cancela, deja el carrito como está y avisa que la venta no se guardó.

Reenviar el mismo cobro importa: el cajero ya cobró (puede haber un pago con tarjeta ya pasado por
el POS). Hoy tiene que rehacer el cobro entero.

### Cómo se reconoce el rechazo

Por el texto, con una sola función pura (`esRechazoPorFacturaSinNombre(err)`): es un rechazo del
servidor (`esRechazoDelServidor`) y algún mensaje contiene «facturar sin nombre» (sin distinguir
mayúsculas). Es frágil a propósito y **degrada bien**: si el filial cambia el texto, o es un filial
sin el #172, el desktop no reconoce el rechazo y se comporta exactamente como hoy.

Alternativa descartada: que el filial agregue un código estable. Obliga a un segundo PR en un repo
que despliega solo al mergear, para ganar poco sobre la degradación de arriba.

## Fases

### Fase 1 — diálogo para cargar el cliente

- Componente nuevo `pdv/comercial/venta-touch/cliente-para-factura-dialog/`, declarado en el módulo
  del PDV. Recibe el total y el motivo; devuelve un `Cliente` con `id`, o `null`.
- Campo de documento. Busca con `ClienteService.onGetClientePorPersonaDocumento(documento, false)`,
  **contra el filial**, que es quien después resuelve `clienteId` en `saveVenta`.
  **Cambio respecto del plan aprobado** (prueba de runtime, 13/10): la consulta «detallada» del
  diálogo de factura legal devuelve sin cliente a uno que existe pero no es contribuyente («El
  cliente no es contribuyente de SET»), que es el caso común con cédula. La consulta simple lo
  devuelve, y responde con error cuando el documento no es de un cliente ni de un contribuyente.
- Búsqueda por nombre con `SearchListDialogComponent`, igual que `onClienteSearch` (`:808`). Devuelve
  una **persona**, no un cliente del filial: de ese resultado solo se toma el documento y se vuelve
  a buscar por documento. Nunca se usa su `id`.
- Solo acepta un cliente que el filial vaya a tomar como nominado: con `id`, nombre que no sea vacío
  ni «SIN NOMBRE», y documento que no sea vacío ni «0».
- Si el documento no devuelve un cliente con `id`: mensaje que manda a cobrar con el botón de
  factura del diálogo de pago, que es donde hoy se crea un cliente nuevo. Este diálogo **no crea
  clientes**.
- La búsqueda lleva `timeout` corto y `catchError` (`onCustomQuery` espera hasta 5 minutos): ante
  un error o una demora el diálogo sigue usable. Cancelar está siempre habilitado.
- Reglas del repo: sin funciones en el HTML, tema oscuro, avisos por `NotificacionSnackbarService`,
  `untilDestroyed`, tamaño por `panelClass`.
- Tests (Karma): spec del componente — cliente válido cierra con el cliente; cliente sin documento
  o «SIN NOMBRE» no se acepta; el resultado de la búsqueda por nombre se re-resuelve por documento;
  error de red (con forma de `ApolloError`) y demora no cuelgan el diálogo; cancelar devuelve `null`.

### Fase 2 — reconocer el rechazo y reintentar con el cliente

- `esRechazoPorFacturaSinNombre` en `commons/core/utils/graphqlErrorUtils.ts`: exige
  `esRechazoDelServidor` (un guardado incierto nunca se reintenta) y el texto «facturar sin nombre».
- La decisión va en una función pura aparte, testeable sin el componente:
  `debePedirClienteParaFacturar({ err, venta, facturaLegalId, ventaCreditoInput, isDelivery })`.
  Es `true` solo si es ese rechazo **y** la venta no tiene cliente **y** no hay factura manual
  **y** no es crédito ni convenio **y** no es delivery. En los demás casos queda el aviso de hoy.
- **Venta a crédito o convenio: excluida.** El cliente del crédito viaja aparte en
  `ventaCreditoInput`; cambiar `venta.cliente` dejaría la factura a un cliente y el crédito a otro.
- **El reintento manda una foto, no el carrito vivo.** Hoy `venta.ventaItemList = this.selectedItemList`
  (`venta-touch.component.ts:1184`, `:1479`) es la misma lista que se sigue editando, mientras que
  `totalGs` y el cobro son del primer intento. Antes del primer envío se copia la lista
  (`[...selectedItemList]`); el reintento usa esa copia, el mismo `totalGs` y el mismo cobro.
- **Estado mientras el diálogo está abierto:** `isDialogOpen = true` al abrir y `false` al cerrar,
  con `finalize`. Es lo que ya miran F8/F11 (`:468`) y el foco del buscador. `guardandoVenta` no
  sirve para esto: el `finalize` del guardado (`:1570`) lo baja después del handler `error`.
- El reintento es una llamada nueva a `onSaveVenta` con su propia suscripción dentro del
  componente: `onTicketClick` hace `.subscribe().unsubscribe()` sobre el observable externo.
- Con cliente: `venta.cliente = cliente` y se reenvía. Si vuelve a ser rechazado por el tope, se
  pide de nuevo **una sola vez más**; al segundo rechazo se corta con un aviso que manda a cobrar
  con el botón de factura. Nunca hay reintento sin que el cajero elija algo.
- **Cancelar:** aviso «La venta no se guardó: falta el cliente para facturar» y carrito intacto.
  Si había pagos con tarjeta pendientes (`_pendingTarjetaPagos`, cargados en `:1255` y que hoy solo
  se vacían al guardar), se vacían y se avisa con un diálogo que hay un cobro con tarjeta ya pasado
  sin venta registrada. Sin esto, el pendiente se registraría contra la próxima venta que se guarde.
- No aplica a delivery (cobra por `onSaveVentaDelivery`) ni a la venta con factura manual ya
  emitida (`facturaLegalId != null`, va con `facturar = false`).
- Tests (Karma): spec de las dos funciones puras, con una fila por condición de exclusión, respuesta
  vacía, error de red y «errores + datos». El cableado en `venta-touch.component.ts`, que no tiene
  `.spec.ts`, se cubre con la prueba de runtime.

### Fase 3 — verificación y documentación

- `npm run check` (AOT), leído del log.
- Prueba de runtime en local: desktop con `ng serve -c web`, filial local en `develop` con SIFEN
  habilitado, timbrado electrónico y política que facture siempre.

| Caso | Esperado |
|---|---|
| F8, sin cliente, 7.000.000 o más | aparece el diálogo; con cliente la venta se guarda con factura a su nombre; un solo registro de venta |
| F11, mismo caso | igual, y sale el ticket-factura |
| Diálogo de pago en efectivo, mismo caso | igual, con el cobro original |
| Cancelar el diálogo | carrito intacto, aviso, ninguna venta guardada |
| Menos de 7.000.000 sin cliente | sin diálogo, como hoy |
| 7.000.000 o más con timbrado no electrónico | sin diálogo, como hoy |
| Filial apagado | aviso de «no se pudo guardar… verifique», sin diálogo |

| Pago con tarjeta, rechazo, cliente cargado | el pago se registra una sola vez, contra esa venta |
| Pago con tarjeta, rechazo, cancelar | aviso del cobro sin venta; la venta siguiente no registra ese pago |
| Convenio de 7.000.000 o más | sin diálogo nuevo; aviso del filial como hoy |
| Escanear un producto con el diálogo abierto | no entra al carrito |
| Cliente que el filial vuelve a rechazar | se pide una vez más y después corta con aviso |
- Documentación: nota en `docs/manuales-implementacion/pdv/` sobre el reintento con cliente; este
  plan se borra en el PR final.

### Resultado de la prueba de runtime (13/10/2026)

Desktop de la rama con `ng serve -c web`, filial local en `develop` (`5e66403`, perfil `dev`, SIFEN
habilitado, scheduler apagado), PDV 25 de SUC. KM2 con timbrado electrónico, 120 × 65.000 = 7.800.000.

| Caso | Resultado |
|---|---|
| F8 y F11 con política «a pedido» (la que tenía la sucursal en la base local) | la venta se guarda sin factura y sin diálogo: el filial no factura, no hay rechazo |
| F8 con política «todas», sin cliente | el filial rechaza con el texto completo; aparece el diálogo; carrito intacto |
| Cancelar el diálogo | carrito intacto, aviso «La venta no se guardó…», ninguna venta guardada |
| Documento de un cliente existente no contribuyente | lo encuentra (con la consulta simple) |
| Guardar con ese cliente | una sola venta, con el cliente y factura electrónica a su nombre (con CDC) |

Sin probar en runtime: F11 con política que facture, diálogo de pago, pago con tarjeta, convenio,
timbrado no electrónico, filial apagado, escáner con el diálogo abierto y el segundo rechazo.

## Datos nuevos

Ninguno. No hay campo, columna, query ni mutation nuevos: `clienteId` ya viaja en `VentaInput`.

## Compatibilidad y orden

- Sin migración, sin cambio de contrato GraphQL, un solo PR (desktop → `develop`).
- Desktop nuevo con filial sin el #172 (beta y stable hoy): el rechazo no existe, el código nuevo no
  se activa. El beneficio llega cuando el #172 se promueva.
- Desktop viejo con filial nuevo: ve el aviso de texto, como hoy en alpha.
- Rollback: solo cliente.
- Roles: `N/A para desktop porque` no se agrega ninguna acción que modifique datos; es la misma
  venta que el cajero ya puede guardar.
- Paso 9, batería: `N/A para desktop porque` el CI no corre tests; el gate es `npm run check`.

## Fuera de alcance

- **Ítem a precio cero.** El filial guarda la venta sin factura y no devuelve ninguna señal: el
  desktop no puede avisar sin un cambio en `saveVenta` del filial, y falta la decisión de negocio
  sobre regalos y bonificaciones. Va en un issue propio.
- **Diálogo de factura manual** («Finalizar con Factura»): ya muestra el motivo del rechazo (#470).
- **Delivery**: el filial responde «Delivery no encontrado» en este caso (riesgo anotado en el #172).

## Sin verificar

- Qué responde la búsqueda con un documento que no existe en el filial ni en SET (leído en el
  filial: error; no ejecutado para no consultar SET con un documento inventado).
- Que el reintento inmediato pase el control de ventas duplicadas y recupere el turno de la
  política. Leído en el código (la huella no incluye al cliente y el `catch` libera la reserva),
  no ejecutado; ese `catch` no tiene test en el filial.
- Si la PWA o el mobile pueden recibir este rechazo en su `saveVenta`. No mandan `facturar`, así
  que dependen de la política; ahí solo verían el mensaje del filial.

## Auditoría del plan (paso 5, 13/10/2026)

Dos auditores independientes; cada hallazgo se verificó contra el código antes de aplicarlo.

| Hallazgo | Eje | Verificado | Qué se hizo |
|---|---|---|---|
| Pago con tarjeta pendiente queda cargado si el cajero cancela y se registra contra otra venta | A y B | sí (`:1255`, `:1671`) | fase 2, «Cancelar». El plan decía que no había que tocarlo |
| La búsqueda por nombre devuelve una persona, no un cliente del filial | A | sí (`add-factura-legal-dialog:827-830`) | fase 1: se re-resuelve por documento |
| El reintento relee el carrito vivo con total y cobro viejos | B | sí (`:1184`, `:1479`) | fase 2: foto de los ítems |
| `guardandoVenta` no protege mientras el diálogo está abierto (el `finalize` lo baja) | B | sí (`:1570`) | fase 2: `isDialogOpen` |
| Crédito o convenio: factura a un cliente y crédito a otro | A y B | sí (`:1204`) | fase 2: excluido |
| La búsqueda puede colgar el diálogo 5 minutos; bucle de rechazos | B | parcial (el límite de 5 min se tomó del informe) | fase 1: `timeout`; fase 2: tope de reintentos |
| Los tests no prueban lo crítico | B | sí | decisión en función pura con spec; el cableado sigue en prueba manual |
| El texto del rechazo no tiene dueño en el filial | A | sí | aceptado: decisión 1 |
| PWA y mobile podrían recibir el mismo rechazo | A | no | anotado en «Sin verificar» |

Confirmado por el eje B, leyendo el filial: el rechazo sale antes de cualquier escritura y la
transacción revierte venta, cobro e ítems, así que el reintento no duplica.

## Decisiones (aprobadas por Franco el 13/10/2026)

1. El rechazo se reconoce por texto; no se le pide un código al filial.
2. El diálogo no crea clientes: si el documento no existe, manda al botón de factura.
3. Si el cajero cancela con un cobro con tarjeta ya pasado, se avisa y se descarta el pendiente.
