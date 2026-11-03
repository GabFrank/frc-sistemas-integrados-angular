# Lector QR de caja mayor

El tablero de una caja mayor tiene un botón de escaneo (`qr_code_scanner`) que abre el carrito de
escaneo (`shared/qr-lector/`). Se usa con un lector de códigos HID: escribe como teclado y termina
con Enter. No usa cámara.

## Códigos que lee

El formato es el de la transferencia: ocho segmentos separados por `-`, que
`QrLectorService.parse` lee por posición. Los emite `QrTicket` en el filial y en el central.

| Papel | Código | Qué hace al escanearlo |
|---|---|---|
| Ticket de retiro | `frc-{suc}-RETIRO-{retiroId}-{suc}-IngresarRetiroCajaMayor-{cajaId}-null` | Suma el retiro con sus montos por moneda. Si su caja del PDV tiene otros retiros pendientes, pregunta «¿Quiere traer los demás retiros vinculados a esta caja?». |
| Ticket de cierre de caja | `frc-{suc}-PDVCAJA-{cajaId}-{suc}-IngresarRetiroCajaMayor-null-null` | Suma todos los retiros pendientes de esa caja sin preguntar. |

- La sucursal va en el código porque los ids de retiro y de caja se repiten entre sucursales: la PK
  es `(id, sucursal_id)`.
- La caja del retiro sale del central (`retiro.cajaSalida`). La del código es solo de respaldo.
- **Pendiente** quiere decir que el retiro no ingresó a ninguna caja mayor, no fue enviado a una y
  no está `EN_PROCESO` ni `CANCELADO`. Es lo que devuelve `retirosFlotantes`.
- El lector manda teclas físicas en distribución EE.UU. Con Windows en español, el `-` llega como
  `'`. Por eso el input usa `frcLectorTeclado`, y si el código crudo no se lee, se reintenta con
  `alternativa()`.

## Procesar

En «Ingresar retiro de PDV», el botón **Procesar** hace la misma pregunta si la caja del retiro
tiene otros pendientes. Si la respuesta es Sí, `VerificarRetiroDialogComponent` los muestra
apilados, un `VerificarRetiroBloqueComponent` por retiro. Cada bloque tiene su conteo, su borrador
y su caso si hay diferencia.

- La confirmación llama a `verificarRetiro` de a uno y en orden.
- Ante cualquier falla se vuelven a consultar los pendientes de la caja. Lo que ya no está
  pendiente sale del diálogo y se informa aparte. Eso cubre que otra PC lo haya verificado o que
  la red se haya caído después de que el central guardó.
- Si tampoco se puede reconsultar, el diálogo no deja reintentar.
- El central rechaza una verificación sin ningún conteo cuando el retiro tiene declarado
  (`RetiroVerificacionService.verificar`).

## Puertas

- La lectura va por `retirosFlotantes`, con `requireVerCaja` y el filtro por sucursales del rol
  acotado. El lector y Procesar pasan `cajaVirtualDestinoId` cuando opera TESORERIA CAJA.
- La escritura va solo por `verificarRetiro`, con `requireEscrituraCaja` y las sucursales que
  cubre la caja.

## Orden de despliegue

El desktop con este lector va antes que el filial que imprime los QR, en cada canal.

Un desktop anterior a este lector escanea el QR de retiro y abre la verificación sin el detalle
por moneda. El central rechaza esa confirmación, así que no se acredita mal, pero el escaneo no
sirve. Un desktop anterior rechaza el código `PDVCAJA` con un mensaje.
