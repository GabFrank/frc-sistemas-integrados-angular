# Factura legal emitida desde el central hacia una filial: rechazo o sin confirmar

`AddFacturaLegalDialogComponent` en modo `isServidor` (Lista de facturas → Adicionar) manda la factura con
`saveFacturaLegalToFilial`: el central la reenvía por REST al filial de la sucursal elegida
(`POST http://<ip>:<puerto>/api/facturas-legales`) y devuelve el resultado. Emitir es irreversible: consume un
número del timbrado y genera el DE.

## Cómo llega un fallo

Todo fallo llega como un error GraphQL `"Error al crear factura en servidor filial: <motivo>"`
(`FacturaLegalGraphQL.saveFacturaLegalToFilial`). Desde central#425 trae además `extensions.codigo`, que dice si la
factura pudo haberse emitido. El motivo y el código los arma `FacturaLegalFilialService.crearFacturaLegalEnFilial`:

| Texto después del prefijo | Origen | `extensions.codigo` |
|---|---|---|
| `Error al crear factura legal: …` | 4xx del filial (validación previa: timbrado no disponible, `TIMBRADO_SIN_TELEFONO`, `FACTURA_NO_EMITIBLE`, sin sucursal). El filial deshace la transacción antes del 400 | `FILIAL_RECHAZO` |
| `Sucursal no encontrada…`, `La sucursal no tiene IP configurada`, `Error al preparar la petición…` | el central falla antes de enviar | `FILIAL_RECHAZO` |
| `Error al conectar con el servidor filial: …` con causa `ConnectException`, `NoRouteToHostException` o `UnknownHostException` | el pedido no salió (puerto cerrado con el host vivo) | `FILIAL_RECHAZO` |
| `Error al conectar con el servidor filial: …` con otra causa | corte por tiempo (de conexión a los 10 s o de lectura a los 30 s: con `SimpleClientHttpRequestFactory` solo los separa el texto), conexión cortada, cuerpo del 201 ilegible | `FILIAL_SIN_CONFIRMAR`: en el corte de lectura el filial sigue y commitea |
| `Error del servidor filial: …` | 5xx del filial | `FILIAL_SIN_CONFIRMAR` |
| `Error al crear factura en servidor filial. Código: …` | el filial respondió sin error pero no 201 | `FILIAL_SIN_CONFIRMAR` |
| cualquier otro | excepción que el servicio no clasificó | `FILIAL_SIN_CONFIRMAR` |

La regla «`ConnectException` = no salió» depende de que el `RestTemplate` del central (`FrancoSystemsApplication`)
tenga `outputStreaming` prendido: sin streaming, `HttpURLConnection` reintenta el POST por dentro.

## Qué hace el diálogo (#471)

- `onCustomMutation` (sin `silentLoad`) ya muestra el motivo («Ups! Algo salió mal: …», 3 s).
- `alFallarElEnvioAFilial`: si es rechazo (`esRechazoDelServidor`) y no `esEnvioAFilialSinConfirmar`, solo libera el
  botón, sin otro aviso. Cualquier otra cosa (las tres filas «sí» o «casi nunca», error de red con el central,
  respuesta vacía) va a `onFacturaNoConfirmada`: «No se pudo confirmar la factura. Verifique en la lista de facturas
  si se emitió antes de volver a intentar.»
- `alResponderElEnvioAFilial`: sin `facturaId` también es «no se pudo confirmar».

`esEnvioAFilialSinConfirmar` (`commons/core/utils/graphqlErrorUtils.ts`) decide en este orden:

1. `extensions.codigo` `FILIAL_SIN_CONFIRMAR` → sin confirmar; `FILIAL_RECHAZO` → rechazo. Otros códigos se ignoran.
2. Sin código y con el prefijo del central (central anterior a #425): el texto, anclado al prefijo.
3. Sin código ni prefijo (el central falló fuera de su `catch`, por ejemplo al commitear después del 201): sin
   confirmar.

Es el mismo criterio que el camino de la venta (`alResponderLaEmision`, #470/#478): ante la duda no se libera el
botón sin avisar, y nada se reintenta solo.

## Probar en local

Central y filial de `develop` con perfil `dev` (filial con `--sifen.scheduler.enabled=false`) y el desktop con
`ng serve -c web`. Solo **SUC. KM2** (24) apunta al filial local (`localhost`, puerto por defecto 8082); el resto
de las sucursales de la base local tienen las IP reales de bodega. Para forzar un rechazo: sacar el teléfono del
timbrado detalle 108 y de su cabecera (timbrado 6) en la base `general`, y restaurarlo al terminar.
