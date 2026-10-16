# Plan: pendientes sueltos de #501, parte Compras (PR A)

Rama `fix/mutations-pendientes-compras`, sale de `develop`. Los «pendientes sueltos» del final de #501 van en dos PRs por decisión de Franco: este (A) junta lo de Compras y los métodos muertos de replicación; el B, el doble aviso verde (queda el texto de la pantalla) y los «Ups!» repetidos de mutations en paralelo, en el genérico.

## Cambios

| # | Pendiente | Hoy | Cambio |
|---|---|---|---|
| 1 | Métodos sin llamador de `LogicalReplicationService` (`setupReplication`, `setupBranchReplication`, `removeReplication`, `removeBranchReplication`, `dropRemotePublication`) | `catchError` viejo («ERROR AL …», `error.message` de un arreglo); ningún componente los llama | se borran, con sus GQL y sus documentos si no los usa nadie más |
| 2 | PDF del pedido vacío (`list-compra` y `gestion-compras`, «PDF en la app» y «Guardar PDF») | `if (pdfBase64)` sin `else`: un PDF vacío no avisa nada | `else`: «El servidor devolvió un PDF vacío: no se generó el reporte.» |
| 3 | Ticket del pedido (los dos sitios) | «Ticket enviado a impresora» sin mirar el Boolean | con `false`: «No se pudo enviar el ticket a la impresora.» (hoy el central siempre devuelve `true`; queda cubierto si cambia) |
| 4 | Borrar un ítem del pedido (`gestion-compras.onDeleteItem`) | el central atrapa cualquier excepción y devuelve `false` (`CrudService.deleteById`); el desktop no avisa ni recarga | `false`: «No se pudo eliminar el ítem: puede que ya no exista o tenga datos asociados.» y recarga los ítems. En la práctica el `false` casi no llega: `CrudService.deleteById` atrapa la excepción dentro de la transacción y el commit falla con `rollback-only`, que llega como rechazo (el «Ups!» del genérico con ese texto). En ese rechazo también se recargan los ítems, porque el registro ya no existe (auditoría del plan) |
| 5 | Cancelar pedido (`list-compra.onCancelar` → `onDelete` del genérico) | corte: «No se pudo confirmar si se **eliminó**»; rechazo: «…problema al eliminar»; éxito: «Eliminado con éxito» más «Pedido cancelado correctamente» (doble verde) | `onDelete` y `eliminar` aceptan textos opcionales (`{ exito, rechazo, sinConfirmar }`); cancelar pedido pasa los suyos y la pantalla deja de sumar su verde. Los demás llamadores de `onDelete` no cambian. Reintentar es seguro: el central rechaza «El pedido ya está cancelado» |
| 6 | `asignarItemsANota` (gestión de compras y diálogo de nota) | `apollo.mutate` a mano: sin «Guardando…»; la pantalla muestra el motivo del rechazo | la GQL pasa a `Mutation` y el servicio a `onCustomMutation`: «Guardando…» y el «Ups!» con el motivo lo da el genérico. Los llamadores quitan su aviso de rechazo (en el diálogo de nota queda un aviso corto de contexto: «La nota se creó, pero no se asignaron los ítems.»). El `success: false` del resultado sigue igual |
| 7 | `desvincularProductoProveedor` (gestión de compras y los dos diálogos de producto-proveedor) | `GQL.mutate` directo: sin «Guardando…»; los diálogos dicen «Error al desvincular» en rechazo y en corte por igual; un `false` en silencio | `ProductoProveedorService.onDesvincular` por `onCustomMutation`. Rechazo: el «Ups!» del genérico; corte: `avisoTrasMutacion` y recarga; respuesta `null` (el central devuelve el vínculo o `null`, no un Boolean): «No se pudo desvincular…». Los diálogos pasan a ir explícitamente al central (`onCustomMutation` fuerza `servidor`) (auditoría del plan) |
| 8 | Rechazo completo de un ítem con nota nueva (`rechazar-item-dialog`) | si el ítem falla, queda una nota vacía (y la nota vacía cuenta para la etapa y la conciliación) | solo en un rechazo del ítem, se relee la nota y, **si quedó sin ítems**, se borra (`onDeleteNotaRecepcion`); con `true` el diálogo cierra y recarga avisando que no quedó una nota vacía; con `false`, error o nota con ítems, el aviso de hoy. Un rechazo no garantiza que el ítem no se haya guardado: `saveNotaRecepcionItem` no es transaccional y puede fallar después de guardar el ítem (auditoría del plan), y la FK es `ON DELETE CASCADE`. En un corte **no** se toca. `isLoading` vuelve a `false` en todas las ramas |
| 9 | Rechazar un ítem desde Recepción Documental con nota nueva (hallazgo de la prueba) | la lista de pendientes trae `pedido { id }` sin moneda y el diálogo corta con «No se conoce la moneda del pedido» (guarda de #390): la nota nueva no se podía crear nunca desde ahí | `onRechazarItem` le pasa al diálogo el pedido cargado en la pantalla (`currentPedido`), que sí trae la moneda |

## Fuera de alcance

- Otros `apollo.mutate` a mano (`entrada`, `salida`, los `delete*Observacion`, `replication-table.service`): van fuera de los listados en la issue.
- El doble aviso verde general y el dedupe de «Ups!»: PR B.

## Tests

Sin helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop servido estático con el interceptor, central propio en el 8084 con `replication.sync/refresh` apagados. Pedidos y notas de la base local; lo que se cree o cambie se restaura.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop.

## Resultado de la prueba (2026-10-16)

Bundle `web-production` servido estático contra el central propio (8084), con el interceptor (corte, rechazo con una consulta inválida que el servidor no ejecuta, respuesta armada, colgado hasta el timeout del link). Notas creadas de verdad donde el flujo lo pide; todo lo creado o cambiado se restauró.

| # | Caso | Resultado |
|---|---|---|
| 1 | Pantalla de Replicación Lógica: lista y abre el diálogo de configurar | ✓ |
| 2 | PDF vacío (Ver PDF y Guardar PDF), en lista de compras y en gestión | ✓ aviso, sin pestaña ni descarga |
| 3 | Ticket con `false`, en los dos sitios | ✓ «No se pudo enviar el ticket a la impresora.» |
| 4 | Borrar ítem: `false` / rechazo `rollback-only` / corte | ✓ aviso y recarga / un solo «Ups!» y recarga / «No se pudo confirmar si se eliminó el ítem…» y recarga a los 5 s |
| 5 | Cancelar pedido: corte / rechazo / timeout / éxito armado | ✓ «…si se canceló el pedido» y recarga / «…problema al cancelar el pedido» / solo el aviso del link / un solo verde |
| 6 | Asignar a nota (gestión): corte / rechazo / colgado / éxito armado | ✓ aviso y recarga / un solo «Ups!» / «Guardando…» y solo el aviso del link / verde con el mensaje |
| 6 | Asignar desde el diálogo de nota nueva: rechazo / corte | ✓ «Ups!» y «La nota se creó, pero no se asignaron los ítems.» / aviso y relectura de los ítems a los 5 s |
| 7 | Desvincular en gestión de compras, diálogo del proveedor y diálogo del producto: rechazo / corte / `null` / éxito armado | ✓ un solo «Ups!» / «No se pudo confirmar si se desvinculó…» y recarga / «No se pudo desvincular: no se encontró el vínculo.» (gestión conserva su «No se pudo desvincular el producto») / verde |
| 8 | Rechazar ítem con nota nueva, ítem rechazado y nota vacía | ✓ la nota se borró en la base; «…se deshizo la nota nueva: no quedó una nota vacía…» |
| 8 | Ídem con la nota con ítems (lista armada) | ✓ no se borra; «La nota nueva se creó, pero no se guardó el ítem rechazado…» |
| 8 | Ídem con el borrado en `false` / rechazado / cortado | ✓ «…no se pudo deshacer la nota nueva: quedó vacía…» / el «Ups!» y el mismo aviso / «No se pudo confirmar si se deshizo la nota nueva…» |
| 8 | Corte del ítem | ✓ no relee ni borra la nota; «No se pudo confirmar si se guardó el ítem rechazado en la nota nueva…» |
| 9 | Crear nota nueva desde Recepción Documental | ✓ se crea (antes «No se conoce la moneda del pedido») |

Fuera de alcance, visto en la prueba: el central no guarda `esNotaRechazo` (`NotaRecepcionInput.java` no tiene el campo, el schema sí), así que una «Nota de Rechazo» queda como nota común; y las notas que crea el diálogo de rechazo quedan con `creado_en` nulo.
