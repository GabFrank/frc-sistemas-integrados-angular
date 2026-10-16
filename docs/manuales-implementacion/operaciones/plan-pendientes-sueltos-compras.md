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

## Fuera de alcance

- Otros `apollo.mutate` a mano (`entrada`, `salida`, los `delete*Observacion`, `replication-table.service`): van fuera de los listados en la issue.
- El doble aviso verde general y el dedupe de «Ups!»: PR B.

## Tests

Sin helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Desktop servido estático con el interceptor, central propio en el 8084 con `replication.sync/refresh` apagados. Pedidos y notas de la base local; lo que se cree o cambie se restaura.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo desktop.
