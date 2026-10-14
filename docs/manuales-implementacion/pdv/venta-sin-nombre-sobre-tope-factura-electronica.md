# Venta sin nombre de 7.000.000 o más con factura electrónica

SIFEN no admite una factura electrónica sin nombre desde 7.000.000 Gs. El filial (desde el
`5.0.0-alpha.44`) rechaza esa venta antes de guardar nada, con el mensaje «No se puede facturar sin
nombre una venta de 7.000.000 o mas…» (`VentaNoFacturableException`). El PDV reacciona a ese rechazo:
pide el cliente y reenvía la misma venta con el mismo cobro (#473).

## Por qué no se valida antes de enviar

Que el tope aplique depende de tres cosas que solo sabe el filial: SIFEN habilitado, timbrado
electrónico en el PDV y que la política de facturación (`financiero.configuracion_facturacion`)
facture esa venta. Con política «a pedido», por ejemplo, ni el F8 ni el F11 facturan y no hay rechazo.
Un chequeo en el desktop bloquearía ventas que no iban a facturarse.

## Cómo funciona

- `esRechazoPorFacturaSinNombre` (`commons/core/utils/graphqlErrorUtils.ts`) reconoce el rechazo **por
  el texto**: el filial no manda un código. Si el texto cambia, o el filial es anterior, da `false` y
  el cajero ve el aviso de siempre.
- `debePedirClienteParaFacturar` decide si se pide el cliente. No se pide con factura manual ya
  emitida, en crédito o convenio (el cliente viaja también en el crédito) ni en delivery.
- `VentaTouchComponent.pedirClienteYReintentar` abre `ClienteParaFacturaDialogComponent` y, con el
  cliente, vuelve a llamar a `onSaveVenta`. La venta lleva una copia de los ítems tomada antes del
  primer envío, no el carrito vivo. Si el filial rechaza también con el cliente, se pide una vez más
  y después se corta con un aviso.
- Mientras el diálogo está abierto no se vende ni entran productos al carrito
  (`isDialogOpen`, `pidiendoClienteParaFacturar`). El diálogo toma el foco con un retardo: se abre
  mientras se cierra el de «Guardando…», que al terminar se lo devuelve al buscador.
- Si el cajero cancela, la venta no se guarda. Un pago con tarjeta pendiente se descarta con un
  aviso aparte: de lo contrario se registraría contra la próxima venta.

## El diálogo de cliente

- Busca con `ClienteService.onGetClientePorPersonaDocumento(documento, false)`, contra el filial. La
  consulta «detallada» del diálogo de factura legal no sirve acá: a un cliente que existe pero no es
  contribuyente lo devuelve sin cliente («El cliente no es contribuyente de SET»).
- La consulta puede actualizar al cliente desde SET, como ya hace en el filial.
- Solo acepta lo que el filial factura con nombre (`esClienteNominado`, espejo de
  `SifenReceptorHelper`): con `id`, nombre que no sea vacío ni «SIN NOMBRE» y documento que no sea
  vacío ni «0».
- No crea clientes: si el documento no existe, manda a cobrar con el botón de factura.
- La búsqueda por nombre devuelve una persona; de ella solo se usa el documento.

## Sin cubrir

- El ítem a precio cero lo frenan el PDV y el catálogo antes de vender: ver
  [item-precio-cero.md](item-precio-cero.md).
- Delivery: el filial responde «Delivery no encontrado» en este caso.
- El cableado en `venta-touch.component.ts` no tiene spec; se probó en runtime.
