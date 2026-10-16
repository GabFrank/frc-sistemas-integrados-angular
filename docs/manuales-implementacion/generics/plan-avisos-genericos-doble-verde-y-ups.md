# Plan: doble aviso verde y «Ups!» repetidos (pendientes de #501, PR B)

Rama `fix/mutations-avisos-genericos`, apilada sobre `fix/mutations-pendientes-compras` (#525) para usar `TextosEliminar`; el PR va a `develop` y, cuando #525 se mergee, se rebasa con `git rebase --onto origin/develop fix/mutations-pendientes-compras`.

Decisión de Franco: en un éxito queda **el verde de la pantalla** (más específico) y el genérico se calla; en un bucle, **un solo verde al final**.

## Genérico (`generic-crud.service.ts`)

| # | Cambio | Por qué |
|---|---|---|
| G1 | `onSave(..., usuarioId?, opciones?: { avisarExito?: boolean })` (8.º posicional): con `avisarExito: false` no muestra «Guardado con éxito». No toca «Guardando…» ni los avisos de error | mismo contrato que `onSaveCustom` (81 usos); un objeto y no un booleano para que no caiga en un posicional por error |
| G2 | La rama de rechazo de `onSave` («Ups! Algo salió mal en operacion: …») pasa por `avisarErrorSinRepetir` | N rechazos iguales de la misma mutation en paralelo daban N «Ups!» seguidos (la cola de avisos es secuencial y tapa todo lo demás). La red y la respuesta vacía de `onSave` y todo `onSaveCustom` ya lo usan |
| G3 | La rama de rechazo de `onCustomMutation` («Ups! Algo salió mal: …», solo sin `silentLoad`) pasa por `avisarErrorSinRepetir` | ídem: recepción de mercadería (8 sitios en `forkJoin`/`Promise.all`), distribuciones del rechazo, borrado de ítems de nota, pagos con tarjeta del PDV |

| G4 | `avisarErrorSinRepetir` guarda el último aviso **por mutation** (`WeakMap`) en vez de uno solo | con un solo registro, dos mutations que se alternan en un lote (A, B, A, B) se pisaban y volvían a avisar (auditoría del plan) |

Clave del dedupe: misma mutation (instancia) + mismo texto en 3 s. Riesgo aceptado: repetir a mano la misma acción con el mismo rechazo en menos de 3 s no vuelve a avisar (el observable falla igual y la pantalla se entera). No hay reintentos automáticos sobre estas mutations.

## Doble verde con `onSave` / `onSaveCustom`

Patrón: el servicio agrega `opciones?: { avisarExito?: boolean }` al final de su firma y lo reenvía (en `onSave`, como 8.º posicional; en `GastoService.onSave`, en las dos ramas: `porCliente` y la normal); **solo** la pantalla que suma su verde pasa `{ avisarExito: false }`.

| Pantalla (verde propio) | Servicio → genérico | Otros llamadores (quedan con el genérico) |
|---|---|---|
| `ente-vinculacion-dialog` «Configuración de local guardada», «Vinculación guardada» (forEach: N verdes + 1) | `generic.onSave` directo | — |
| `inmueble-sucursal-dialog` «Inmueble vinculado a la sucursal» | `generic.onSave` directo | — |
| `asignar-horario-dialog` «Horarios asignados correctamente» (N + 1) | `HorarioService.onSaveHorario` | — . El verde de la pantalla hoy sale en el acto, sin esperar respuesta: pasa al final del lote (`forkJoin`) y solo si todo se guardó (auditoría) |
| `list-funcioario` «Horarios asignados correctamente» (un verde por horario y por funcionario + 1) | `HorarioService.onSaveHorario` y `FuncionarioService.onSaveFuncionario` | los demás `onSaveFuncionario` |
| `edit-chequera-dialog` «Chequera creada/actualizada», `gestionar-chequeras-dialog` «Chequera desactivada» | `ChequeraService.onSaveChequera` | — |
| Configuración de factura con venta, venta con tarjeta y transferencia «Configuración guardada correctamente» | `onSaveConfiguracion` de cada servicio | — |
| `configuracion-facturacion-dialog` «Configuración de facturación guardada» | `ConfiguracionFacturacionService.onSaveConfiguracion` | `onToggleActivo` (switch de la fila) |
| `adicionar-gasto-dialog` «Solicitud de gasto registrada» | `GastoService.preGastoGuardar` | `adicionar-pre-gasto` (diálogo y página) |
| `retiro-pre-gasto-dialog` «Retiro registrado en caja correctamente.» | `registrarRetiroPreGastoHibrido` → `GastoService.onSave(gasto, false, { avisarExito: false })` | los demás `GastoService.onSave` |
| Inventario: crear inventario, agregar zona, agregar producto, finalizar y reabrir zona | `onSaveInventario`, `onSaveInventarioProducto`, `onSaveInventarioProductoItem` | — |
| `create-edit-solicitud-pago-dialog` «Solicitud de pago creada/actualizada» | `SolicitudPagoService.onSaveInput`, `onActualizarSolicitudPago` | `crearSolicitudYActivarEdicion` (`onSaveInput`, sin verde propio) |
| `adicionar-proveedor-dialog`, `edit-proveedor`, `edit-proveedor-servicio` «… creado/actualizado exitosamente» | `ProveedorService.onSave`, `ProveedorServicioService.onSave` | — |
| `panel-configuracion-rrhh` «Configuración guardada» | `ConfiguracionRrhhService.onSave` | `edit-configuracion-rrhh-dialog` |
| `agregar-desde-sucursal-dialog` «N impresora(s) agregada(s)…» (concatMap: N + 1) | `ImpresoraService.guardar` | `adicionar-impresora-dialog` |
| `pago-detalle-dialog` cancelar cuota, cuota automática, alta/edición de cuota («Cuota … correctamente») | `PagoDetalleCuotaService.onSavePagoDetalleCuota` | — |
| `pago-detalle-dialog` guardar detalle / cuota automática («Detalle de pago … guardado(s) correctamente») | `PagoDetalleService.save` / `update` → `onSavePagoDetalle` | los demás llamadores de `save`/`update` |
| `list-aguinaldo` «Aguinaldo pagado» (lo muestra al cerrar `pagar-aguinaldo-dialog`) | `AguinaldoService.onPagar` (`onSaveCustom`) | — |
| `liquidacion-detalle-dialog` «Programado: se aplicará…» | `LiquidacionService.onProgramarItem` (`onSaveCustom`) | — (agregar y editar ítem no se tocan: el genérico es su único verde) |

## Bucles: un solo verde al final

| Sitio | Hoy | Cambio |
|---|---|---|
| `list-transferencia` asignar ruta (serie) | N «Guardado con éxito» + «Ruta asignada a N transferencias.» | `onSaveTransferencia(..., opciones)`; el bucle pasa `{ avisarExito: false }` |
| `edit-pago` y `pago-detalle-dialog` cancelar detalle (forkJoin de cuotas) | N verdes + «Detalle de pago y cuotas canceladas correctamente» | `onSavePagoDetalleCuota(entity, { avisarExito: false })` |
| `pago-detalle-dialog` reordenar cuotas (serie, solo después de eliminar una) | N verdes tras «Cuota eliminada correctamente» | `{ avisarExito: false }` por cuota y **sin** verde final: lo avisó la eliminación (auditoría) |
| 8 diálogos de observaciones de caja y de venta (alta) | su verde «Guardado con éxito» repite el del genérico, con el mismo texto | se quita el de la pantalla: el texto que queda es el mismo, sin tocar los 8 servicios (auditoría) |

## Doble verde con `onDelete` (usa `TextosEliminar.exito` de #525)

El servicio pasa el texto de la pantalla como `textos.exito` y la pantalla quita su verde (único llamador en los cuatro):

| Pantalla | Servicio |
|---|---|
| `solicitud-pago-compra` «Solicitud eliminada exitosamente» | `SolicitudPagoService.onDelete` |
| `edit-inventario` «Producto eliminado» | `InventarioService.onDeleteInventarioProductoItem` |
| `list-transferencia` «Transferencia eliminada correctamente» | `TransferenciaService.onDeleteTransferencia` |
| `pago-detalle-dialog` «Cuota eliminada correctamente» (`snackBar`) | `PagoDetalleCuotaService.onDeletePagoDetalleCuota` |

## Fuera de alcance

- `SucursalService.configureSucursal` (verde propio tras `onSaveSucursal`) y `PedidoService.onDeletePedido`: sin llamadores.
- Observaciones (borrar) y presentación: van por apollo directo, un solo verde. Su `if (deleteResponse)` no mira `errors` (otro tema).
- `onEliminarSolicitudPagoDetalle` (editar forma de pago borra y vuelve a crear): sin doble verde (el alta va por `onCustomMutation`); al editar dice «Eliminado con éxito», texto engañoso pero único.
- `edit-chequera-dialog` con ajustes muestra un aviso naranja «Chequera guardada. …» en vez del verde: es un aviso de éxito, queda así.
- Un rechazo con textos distintos por ítem (llevan ids) sigue dando un aviso por texto: el dedupe solo junta los iguales.

## Tests

`generic-crud.on-save.spec.ts`: `avisarExito: false` calla el verde y no el rechazo; dos rechazos iguales seguidos de la misma mutation avisan una vez; A, B, A, B avisa dos veces. Nuevo `generic-crud.on-custom-mutation.spec.ts`: rechazos iguales avisan una vez, `silentLoad` no avisa. `generic-crud.on-delete.spec.ts`: `textos.exito` reemplaza el verde. (Karma no corre en ningún gate; se corre a mano si hay navegador.) Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop estático con el interceptor contra un central propio (8084). Por pantalla: éxito armado (un solo verde, el de la pantalla) y rechazo (un solo «Ups!»); en los bucles, N ítems con éxito armado (un verde) y N rechazos iguales (un «Ups!»). Lo que se cree se restaura.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop.
