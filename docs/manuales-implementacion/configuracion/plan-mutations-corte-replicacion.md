# Plan: aviso tras un corte en las escrituras de replicación (issue #501, tanda 3)

Rama `fix/mutations-corte-replicacion`, sale de `develop`. Tanda 1 (dinero y stock): #515. Tanda 2 (PDV): #517.

## Alcance

Las 12 llamadas de `configuracion/logical-replication` que listó la issue, más las del mismo módulo que la issue no vio porque van por `apollo.mutate` a mano (`ReplicationTableService`).

Las 12 de la issue figuran «sin `error:`», pero el error no llega al llamador: `LogicalReplicationService` lo atrapa con un `catchError` que avisa «ERROR AL …» y devuelve `{ success: false }`. Lo que está mal es eso:

- **Rechazo:** el genérico ya mostró el motivo y el servicio suma otro aviso rojo (doble aviso).
- **Sin respuesta:** «ERROR AL …» da a entender que no se aplicó, y pudo aplicarse.
- **Falla informada por el central:** el resolver atrapa la excepción y devuelve `success: false` con el mensaje (`LogicalReplicationGraphQL`, en `develop`). En la lista de replicaciones nadie lo muestra: el `tap` solo avisa el éxito. Los diálogos sí lo muestran en su texto.

Quedan fuera los métodos sin llamador en la app (`setupReplication`, `setupBranchReplication`, `removeReplication`, `removeBranchReplication`, `dropRemotePublication`): no hay pantalla que los ejercite. `setupReplicationAdvanced` ya sigue la regla (tanda 4 de #488).

## Regla (la de #488 y las tandas anteriores)

Decide `erroresDeRechazo(err)`:

- **Rechazo:** no se aplicó nada. Si la mutation va por el genérico, el motivo ya salió; si va por `apollo.mutate` a mano, lo muestra el servicio con `motivoDelRechazo`.
- **Sin respuesta:** aviso «No se pudo confirmar si …» (`avisoTrasMutacion`, null en el timeout del link, que ya avisó) y recarga a los 5 s (`RECARGA_TRAS_CORTE_MS`). Lo que no es idempotente no se deja repetir hasta recargar.

## Reintento en el central (revisado en `develop`)

| Mutation | Reintento |
|---|---|
| `toggleReplication` de suscripción, `toggleRemoteSubscription` | idempotente: manda el estado final |
| `toggleReplication` de publicación, activar | `CREATE PUBLICATION` sin `IF NOT EXISTS`: repetirlo tras un aplicado da `success: false` (auditoría del plan) |
| `refresh*`, `syncPublicationsWithReplicationTable` | idempotente |
| `createRemotePublication` / `createRemoteSubscription` | idempotente: si ya existe devuelve `true` (auditoría del plan) |
| `editRemotePublication` / `editRemoteSubscription` | **no es atómica**: DROP + CREATE, o DISABLE + ALTER + ENABLE. Un corte a mitad puede dejar la filial sin publicación o con la suscripción apagada; repetirla la completa (auditoría del plan) |
| `removeReplicationAdvanced` | idempotente o falla informada |
| `saveReplicationTable` | edición idempotente; alta repetida la rechaza el `UNIQUE (table_name)` |
| `deleteReplicationTable`, `updateReplicationServiceTables` | idempotente (el borrado repetido devuelve `false`) |
| `toggleReplicationTableEnabled` | **invierte el estado**: repetirlo lo deshace |

## Cambios

| # | Dónde | Cambio |
|---|---|---|
| 1 | `LogicalReplicationService`, los 12 métodos con llamador | el `catchError` pasa a un helper `estadoTrasError(error, textoSinRespuesta)`. Rechazo: sin aviso propio, `message` = motivo. Sin respuesta: aviso con el texto (salvo timeout del link) y `sinConfirmar: true`. El texto depende del reintento: toggles, refresh, sync y eliminar, «No se pudo confirmar si …: revisá el estado antes de repetir» (la lista recarga); crear remoto, «… es seguro repetirlo»; editar remoto, «… puede haber quedado a medias: repetila para completarla» |
| 2 | ídem, los 7 que usa la lista (toggles, refresh, sync) | si el central devuelve `success: false`, aviso con su mensaje (hoy silencio) |
| 3 | `list-replication` | con `sinConfirmar`, recarga suscripciones y publicaciones a los 5 s |
| 4 | `edit-remote-publication-dialog`, `edit-remote-subscription-dialog` | con `sinConfirmar`, el texto del diálogo lo dice y «Cancelar» cierra con `true` para que la lista recargue |
| 5 | `remove-replication-dialog` | con `sinConfirmar`, cerrar tras el resultado recarga la lista (como `setup-replication-dialog`) |
| 6 | `ReplicationTableService` (delete, toggle, update) | helper `avisarFallo(error, queSeHizo)`: rechazo, aviso con el motivo (hoy nadie lo muestra); sin respuesta, `avisoTrasMutacion`. Reemite el error. En `save` el servicio deja de avisar («ERROR AL GUARDAR»): el diálogo muestra el texto, así no hay doble aviso (auditoría del plan) |
| 7 | `list-replication-tables` | toggle sin respuesta: bloquea los toggles y recarga a los 5 s; el bloqueo se libera cuando vuelve la recarga, que nunca emite error (el servicio devuelve una página vacía). Borrar sin respuesta: recarga a los 5 s. `false` en toggle, borrar o actualizar: aviso «No se pudo …» (hoy silencio). Los `timer` con `untilDestroyed` |
| 8 | `edit-replication-table-dialog` | el texto de error usa el motivo o el «no se pudo confirmar»; sin respuesta, «Cancelar» cierra con `true` |

## Fuera de alcance

- Doble aviso verde al guardar una tabla de replicación (servicio y diálogo): ya está anotado en la issue como pendiente de doble aviso en un éxito.
- Los mensajes de `success: false` del central vienen en inglés («Failed to…»): se muestran como llegan.
- Las recargas de `list-replication` no cancelan una en vuelo (sin `switchMap`): preexistente.

## Tests

Sin helper nuevo en `graphqlErrorUtils`. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Central propio en el 8084 con `replication.sync/refresh` apagados y desktop servido estático, con el interceptor de XHR. Lo que replica de verdad sale a las filiales de producción (IP reales en `sucursal`), así que:

- **corte** (no sale del navegador) y **rechazo** (consulta inválida, el central no la ejecuta) en cada llamada;
- **falla informada** (`success: false`) con una respuesta armada por el interceptor, sin llegar al central;
- **aplicado** solo en lo que queda en la base local: las mutations de `replication_table`. Se restaura después;
- el modo remoto de la lista (que consulta la filial elegida por JDBC) se prueba con una sucursal apuntada por SQL al Postgres local, y se restaura. No se abre el diálogo de configurar (consulta el estado en la filial), que esta tanda no cambia;
- además del corte, el timeout del link en alguna llamada.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop.
