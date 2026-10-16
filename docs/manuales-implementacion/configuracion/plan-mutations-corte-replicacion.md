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
| 7 | `list-replication-tables` | toggle sin respuesta: bloquea los toggles y recarga a los 5 s; el bloqueo lo libera solo esa recarga, no otra (el buscador puede recargar antes de que el central termine, auditoría del diff), y nunca emite error (el servicio devuelve una página vacía). Borrar sin respuesta: recarga a los 5 s. `false` en toggle, borrar o actualizar: aviso «No se pudo …» (hoy silencio). Los `timer` con `untilDestroyed` |
| 8 | `edit-replication-table-dialog` | el texto de error usa el motivo o el «no se pudo confirmar»; sin respuesta, «Cancelar» cierra con `true` |

## Fuera de alcance

- Doble aviso verde al guardar una tabla de replicación (servicio y diálogo): ya está anotado en la issue como pendiente de doble aviso en un éxito.
- Los mensajes de `success: false` del central vienen en inglés («Failed to…»): se muestran como llegan.
- Las recargas de `list-replication` no cancelan una en vuelo (sin `switchMap`): preexistente.
- Métodos sin llamador de `LogicalReplicationService` (`setupReplication`, `setupBranchReplication`, `removeReplication`, `removeBranchReplication`, `dropRemotePublication`): conservan el `catchError` viejo. Si se llegan a usar, tienen el mismo defecto.
- Visto en la prueba, preexistente: «Nueva Suscripción» remota abre con «Crear» deshabilitado en modo de conexión central (los campos manuales nacen obligatorios) hasta apagar y prender ese interruptor; y en los diálogos de publicación remota el texto de error queda tapado por el título.

## Tests

Sin helper nuevo en `graphqlErrorUtils`. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Central propio en el 8084 con `replication.sync/refresh` apagados y desktop servido estático, con el interceptor de XHR. Lo que replica de verdad sale a las filiales de producción (IP reales en `sucursal`), así que:

- **corte** (no sale del navegador) y **rechazo** (consulta inválida, el central no la ejecuta) en cada llamada;
- **falla informada** (`success: false`) con una respuesta armada por el interceptor, sin llegar al central;
- **aplicado** solo en lo que queda en la base local: las mutations de `replication_table`. Se restaura después;
- el modo remoto de la lista (que consulta la filial elegida por JDBC) se prueba con una sucursal apuntada por SQL al Postgres local, y se restaura. No se abre el diálogo de configurar (consulta el estado en la filial), que esta tanda no cambia;
- además del corte, el timeout del link en alguna llamada.

### Resultado (2026-10-16)

Central propio en el 8084 (base `bodega` local, `replication.sync/refresh` apagados), desktop en modo solo central, usuario `MR`. Interceptor con cinco modos: corte, rechazo, respuesta armada (`success: false` o `false`, sin llegar al central), aplicado y colgado (un socket que nunca responde, para el timeout del link). El modo remoto, con «SUC. KM2», que en la base local apunta al Postgres local.

| Punto | Llamada | Corte | Rechazo | Falla informada | Otros |
|---|---|---|---|---|---|
| 1-3 | pausar suscripción (local) | aviso y recarga a los 5 s | solo el «Ups!» | aviso con el mensaje del central | |
| 1-3 | pausar publicación (local) | aviso y recarga a los 5 s | | | |
| 1-3 | refrescar (local) | aviso y recarga | «Ups!» | aviso | **timeout del link**: solo el aviso del link y recarga a los 5 s |
| 1-3 | refrescar todas (local) | aviso y recarga | «Ups!» | aviso | |
| 1-3 | sincronizar publicaciones | aviso y recarga; el botón vuelve | «Ups!» | aviso | |
| 1-3 | pausar, refrescar y refrescar todas (remoto) | aviso y recarga de la lista remota | «Ups!» | aviso | |
| 1, 5 | eliminar (diálogo) | texto en el diálogo y aviso; cerrar recarga | motivo en el diálogo y «Ups!»; cerrar no recarga | | |
| 1, 4 | editar suscripción remota | texto «a medias… volvé a guardarla» | motivo en el diálogo | solo en el diálogo, sin aviso | Cancelar recarga tras un corte y no tras un rechazo |
| 1, 4 | crear suscripción remota | «Es seguro volver a guardarla» | motivo | | Cancelar recarga |
| 1, 4 | editar y crear publicación remota | texto correcto | motivo | solo en el diálogo | Cancelar recarga |
| 6, 7 | toggle de tabla | | «Ups!» con el motivo, sin bloqueo | `false`: «No se pudo cambiar el estado» | **aplicado**: se invirtió en la base, aviso, toggles bloqueados y liberados por la recarga de los 5 s; una búsqueda a los 2 s no los liberó |
| 6, 7 | borrar tabla | aviso y recarga a los 5 s | «Ups!» | `false`: «No se pudo eliminar» | |
| 6, 7 | actualizar servicio | aviso | «Ups!» | `false`: «No se pudo actualizar» | **timeout del link**: solo el aviso del link |
| 6, 8 | guardar tabla (diálogo) | texto en el diálogo, sin aviso | motivo en el diálogo, sin aviso | | guardar real cierra igual que antes; Cancelar tras un corte recarga |

Se restauró el `enabled` de `configuraciones.actualizacion`, que el modo aplicado había invertido.

## Ajustes de pantalla (pedido de Franco, 2026-10-16)

Tras probar la tanda, en la misma pantalla:

- **Lista de replicaciones:** con una conexión remota elegida, el botón de eliminar caía a una segunda fila: la tabla es de ancho fijo y reparte igual las columnas. Estado pasa a 120px y Acciones a 240px (los 4 botones en una fila), las dos centradas.
- **Diálogo de crear/editar suscripción remota:** se ordena el bloque de conexión. El título va con ícono y subtítulo, el interruptor en su propia fila con una línea que explica qué hace, y la cadena de conexión en un área de texto que se ve entera, en monoespaciada y sin pasar a mayúsculas. Los campos manuales van en grilla de dos columnas. El marco y el aviso de error toman el tema oscuro (antes, borde y fondo claros). El diálogo pasa de 550 a 600px. Para que se lea hubo que anular, solo en este diálogo, tres reglas globales: `styles.scss` deja en 0 el alto de la línea de ayuda/error (las ayudas pisaban el campo siguiente) y fija el alto del campo (la cadena quedaba cortada), y el `.error-message` de MDBootstrap va con `position: absolute` (el aviso tapaba el título).

Probado por pantalla con el modo remoto en «SUC. KM2»: los 4 botones entran en una fila (ancho de la celda igual al contenido, 240px) y «INACTIVA» se ve entera. El diálogo se revisó en crear y editar, en conexión central y manual, y con el aviso de un corte.

### Validadores del diálogo de suscripción remota (pedido de Franco, 2026-10-16)

Los validadores de conexión solo los ponía el interruptor, así que:

- al abrir «Nueva Suscripción» en modo central, los campos manuales nacían obligatorios y «Crear» no se habilitaba;
- en modo manual, la cadena oculta seguía obligatoria: crear a mano era imposible;
- al editar en modo manual pedía la contraseña y después ignoraba los campos (la cadena solo se armaba al crear).

Ahora un solo método (`aplicarValidadoresDeConexion`) los pone al abrir y al cambiar el interruptor. Al crear: central exige la cadena; manual exige los campos y arma la URI. Al editar nada es obligatorio: en manual, con la contraseña vacía la conexión no se cambia, y con contraseña se arma la URI. Usuario y contraseña van con `encodeURIComponent`.

Probado por pantalla con las mutations cortadas en el navegador (se registran las variables y nada llega al central): crear en central (habilitado al abrir, manda la cadena del central), crear en manual (exige la contraseña, manda `postgresql://postgres:p%40ss%3A1@localhost:5432/postgres`), editar en manual sin contraseña (no manda `connectionString`) y con contraseña (manda la URI).

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop.
