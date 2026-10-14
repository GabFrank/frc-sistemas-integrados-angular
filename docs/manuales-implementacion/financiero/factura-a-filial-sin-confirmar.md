# Factura legal emitida desde el central hacia una filial: rechazo o sin confirmar

`AddFacturaLegalDialogComponent` en modo `isServidor` (Lista de facturas → Adicionar) manda la factura con
`saveFacturaLegalToFilial`: el central la reenvía por REST al filial de la sucursal elegida
(`POST http://<ip>:<puerto>/api/facturas-legales`) y devuelve el resultado. Emitir es irreversible: consume un
número del timbrado y genera el DE.

## Cómo llega un fallo

El central devuelve **todo** fallo con la forma de un rechazo: un error GraphQL
`"Error al crear factura en servidor filial: <motivo>"` (`FacturaLegalGraphQL.saveFacturaLegalToFilial`). El
motivo lo arma `FacturaLegalFilialService.crearFacturaLegalEnFilial`:

| Texto después del prefijo | Origen | ¿Pudo emitirse? |
|---|---|---|
| `Error al crear factura legal: …` | 4xx del filial (validación previa: timbrado no disponible, `TIMBRADO_SIN_TELEFONO`, `FACTURA_NO_EMITIBLE`, sin sucursal) | no |
| `Error del servidor filial: …` | 5xx del filial | casi nunca (el guardado es una transacción y SIFEN se captura adentro), pero en `release/beta` y `master` del filial una validación por `GraphQLException` también sale como 500 |
| `Error al conectar con el servidor filial: …` | `RestClientException`: filial caído, o corte de lectura a los 30 s del `RestTemplate` del central | **sí**: en el corte el filial sigue y commitea |
| `Error al crear factura en servidor filial. Código: …` | el filial respondió sin error pero no 201 | sí |
| `Sucursal no encontrada…`, `La sucursal no tiene IP configurada` | el central falla antes de enviar | no |

## Qué hace el diálogo (#471)

- `onCustomMutation` (sin `silentLoad`) ya muestra el motivo («Ups! Algo salió mal: …», 3 s).
- `alFallarElEnvioAFilial`: si es rechazo (`esRechazoDelServidor`) y no `esEnvioAFilialSinConfirmar`, solo libera el
  botón, sin otro aviso. Cualquier otra cosa (las tres filas «sí» o «casi nunca», error de red con el central,
  respuesta vacía) va a `onFacturaNoConfirmada`: «No se pudo confirmar la factura. Verifique en la lista de facturas
  si se emitió antes de volver a intentar.»
- `alResponderElEnvioAFilial`: sin `facturaId` también es «no se pudo confirmar».

`esEnvioAFilialSinConfirmar` (`commons/core/utils/graphqlErrorUtils.ts`) reconoce el texto del central anclado a
su prefijo. Si el central cambia esos textos, devuelve false y el diálogo vuelve a tratar todo como rechazo. La
solución de fondo (un código en `extensions` del error) está en GabFrank/franco-system-backend-servidor#425.

Es el mismo criterio que el camino de la venta (`alResponderLaEmision`, #470/#478): ante la duda no se libera el
botón sin avisar, y nada se reintenta solo.

## Probar en local

Central y filial de `develop` con perfil `dev` (filial con `--sifen.scheduler.enabled=false`) y el desktop con
`ng serve -c web`. Solo **SUC. KM2** (24) apunta al filial local (`localhost`, puerto por defecto 8082); el resto
de las sucursales de la base local tienen las IP reales de bodega. Para forzar un rechazo: sacar el teléfono del
timbrado detalle 108 y de su cabecera (timbrado 6) en la base `general`, y restaurarlo al terminar.
