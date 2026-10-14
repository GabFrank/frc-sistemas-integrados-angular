# Plan: motivo del rechazo al emitir una factura legal desde el central hacia una filial (#471)

Repo: desktop. Sin cambios en el central ni en el filial.
Rama `fix/factura-legal-filial-motivo-rechazo` desde `origin/develop` (`47494c19`).

## 1. El problema [verificado leyendo, no reproducido en la UI]

`AddFacturaLegalDialogComponent.onSaveFacturaToFilial` (modo `isServidor`) manda la factura con
`FacturaLegalService.onSaveFacturaToFilial` → `GenericCrudService.onCustomMutation`.

| Paso | Qué pasa | Dónde |
|---|---|---|
| El filial rechaza (timbrado no disponible, `TIMBRADO_SIN_TELEFONO`, sin timbrado activo…) | responde 4xx/5xx con `mensaje` | filial `/api/facturas-legales` |
| El central lo pasa a error GraphQL | `"Error al crear factura en servidor filial: Error al crear factura legal: <motivo>"` | central `FacturaLegalFilialService.java:110-122`, `FacturaLegalGraphQL.java:1540` |
| El genérico avisa el motivo (3 s) y emite el arreglo de errores | `"Ups! Algo salió mal: …<motivo>"`; `obs.error([...])` | `generic-crud.service.ts:388-397` |
| El diálogo lee `error.message` del arreglo → `undefined` | segundo aviso (4 s): `"…en el servidor filial: Error desconocido"` | `add-factura-legal-dialog.component.ts:997-1001` |

Los avisos se encolan (`app.component.ts:98`): el cajero ve el motivo y enseguida otro aviso que lo contradice.

Además, el mismo `error:` libera el botón ante **cualquier** error, incluido un error de red entre el desktop y el
central. Ahí la factura pudo haberse emitido; volver a tocar «Guardar» puede emitir otra con otro número. Es el caso
que #470/#478 resolvió en el camino de la venta con `onFacturaNoConfirmada`.

## 2. Cambio

Mismo criterio que #478 (`alResponderLaEmision`): un aviso por flujo, y ante la duda no se libera a ciegas.

- El `error:` de `onSaveFacturaToFilial` pasa a un método público `alFallarElEnvioAFilial(error)`:
  - **rechazo del filial**: `esRechazoDelServidor(error)` **y** ningún mensaje empieza con «Error al crear factura
    en servidor filial: Error al conectar con el servidor filial» ni «…: Error del servidor filial». El genérico ya
    mostró el motivo → solo `guardando = false`, sin segundo aviso.
  - **cualquier otra cosa**: `onFacturaNoConfirmada()` («No se pudo confirmar la factura. Verifique en la lista…»),
    que también libera el botón, como en #478. Incluye:
    - error de red desktop↔central, respuesta vacía;
    - **corte central↔filial** (`RestClientException`, incluido el timeout de lectura de 30 s del central,
      `FrancoSystemsApplication.java:67`): el filial puede terminar y commitear igual;
    - **5xx del filial**: el guardado del filial es una sola transacción y SIFEN se captura adentro
      (`FacturaLegalApiService.java:168, 309-338`), así que un 500 casi siempre es rollback; pero en `release/beta`
      y `master` del filial los rechazos de validación (`GraphQLException`) también salen como 500
      (`FacturaLegalController.java`, sin el catch de `develop`). Ante la duda, se avisa. El motivo igual se ve:
      el genérico lo muestra antes.
  - Reconocer el corte por el texto es acoplarse a los mensajes del central (`FacturaLegalFilialService.java:110-127`),
    como ya hace `esRechazoPorFacturaSinNombre` (#473). Si el central cambia el texto, se vuelve al comportamiento de
    hoy (liberar). Lo correcto es que el central marque el error: issue aparte.
- El `next` sin `facturaId` (hoy «Error al guardar la factura en el servidor filial», sin motivo): el schema lo marca
  `SaveFacturaLegalToFilialResponse!` y el central siempre llena `facturaId` o lanza, así que no debería pasar; si pasa,
  no hay confirmación → `onFacturaNoConfirmada()`. Se extrae a `alResponderElEnvioAFilial(res, deseaImprimir)`.

## 3. Lo que no cambia

- Central y filial. El texto del rechazo sigue con los dos prefijos del central («Error al crear factura en servidor
  filial: Error al crear factura legal: …»): quitarlos desde el desktop sería parsear texto del central.
- El genérico `onCustomMutation` y sus otros llamadores (issue aparte: inventario).
- El botón se libera también en «no se pudo confirmar» (criterio de #478): el cajero tiene que mirar la lista antes
  de reintentar. Bloquearlo sería otro cambio de comportamiento.
- El aviso del motivo dura 3 s (genérico, `generic-crud.service.ts:388-397`), igual que en el camino de la venta.
- Respuesta vacía: dos avisos (el genérico dice «Respuesta vacía del servidor» y el diálogo «No se pudo confirmar»),
  igual que en #478.
- Desktop viejo contra backend nuevo, o al revés: sin cambio de contrato, cada versión se comporta como hoy.
- Trabados ya existentes y fuera de alcance (auditoría eje B): `onVerificarFacturaSimilar` / `confirm` que no emiten
  dejan `guardando=true`; cerrar el diálogo durante `esperarReplicacionEImprimir` corta la impresión.
- `extractErrorMessage` del mismo diálogo (consulta de cliente, línea ~421): mismo defecto de leer `.message` de un
  arreglo, otro flujo; va al inventario.

## 4. Datos nuevos

N/A para desktop porque el cambio no agrega campos, columnas ni claves [ev: el diff solo toca el manejo del error].

## 5. Fases

| Fase | Commit |
|---|---|
| 0 | `docs(financiero): plan para mostrar el motivo del rechazo al emitir hacia una filial` (este archivo) |
| 1 | `fix(factura-legal): mostrar el motivo cuando la filial rechaza la factura emitida desde el central` (diálogo + spec) |
| 2 | `docs(financiero): registrar auditoria y prueba del motivo del rechazo de la filial` |
| 3 | cierre: borrar el plan (ciclo paso 11) |

Build por fase: `npm run check`, leído del log entero.

## 6. Tests

Casos nuevos en `add-factura-legal-dialog.component.spec.ts` (Karma; el CI no los corre, se corren a mano):

| Caso | Esperado |
|---|---|
| rechazo 4xx con el texto real del central (`Error al crear factura en servidor filial: Error al crear factura legal: El timbrado detalle no está disponible: …`) | `guardando=false`, ningún aviso del diálogo, no cierra |
| corte: `…: Error al conectar con el servidor filial: Read timed out` | aviso «No se pudo confirmar», `guardando=false` |
| 5xx: `…: Error del servidor filial: …` | aviso «No se pudo confirmar» |
| error de red (ApolloError con `networkError`, forma real: `instanceof Error`) | aviso «No se pudo confirmar», `guardando=false` |
| respuesta vacía `[{ message: 'Respuesta vacía del servidor' }]` | aviso «No se pudo confirmar» |
| `next` sin `facturaId` | aviso «No se pudo confirmar», no cierra |
| `next` con `facturaId`, sin imprimir | cierra con `facturado: true`, aviso de guardado |

El spec construye el componente con argumentos posicionales: hay que sumar `openGuardadoConExito` al stub de
`args[4]`. Solo casos con `deseaImprimir=false` (el `true` arranca un `setTimeout` y el sondeo de la factura).

Revertir el fix y comprobar que los de rechazo / red fallan (el ciclo lo da N/A para desktop; se hace igual porque
es barato).

Comando: `npx ng test --watch=false --include='src/app/modules/financiero/factura-legal/add-factura-legal-dialog/*.spec.ts'`.

## 7. Prueba de runtime

Central local 8081 (`dev`), filial local 8082 (`dev`, `--sifen.scheduler.enabled=false`), desktop `ng serve -c web`.
Factura legal en modo servidor hacia la sucursal del filial local:

| Caso | Esperado |
|---|---|
| Timbrado sin teléfono en detalle y cabecera (base local; restaurar después) | un solo aviso con el motivo; botón habilitado; ninguna factura nueva |
| Filial apagado | aviso del motivo «…Error al conectar con el servidor filial…» y después «No se pudo confirmar…»; botón habilitado |
| Central apagado con el diálogo abierto | «No se pudo confirmar la factura…»; botón habilitado |
| Todo arriba y teléfono restaurado | se emite una sola factura y cierra |

## 8. Sin verificar

- El corte central↔filial con la factura ya guardada en el filial (timeout de 30 s): no se reproduce en local sin
  inyectar latencia en el filial; queda cubierto por test con el texto real y documentado en la issue aparte.
- Un 5xx del filial: no se fuerza en runtime; cubierto por test.

## 9. Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| ALTA: «error GraphQL = rechazo» es falso: timeout central↔filial y 5xx llegan igual y liberaban el botón | A y B | §2: se reconocen por el prefijo del central y van a «no se pudo confirmar»; tests con el texto real |
| MEDIA: en beta/stable del filial los rechazos de validación salen como 500 | A | aceptado: ahí se ve el motivo y además «no se pudo confirmar» (lado seguro); anotado en §2 |
| MEDIA: el plan descansa en que el genérico avise (sin `silentLoad`) | A | comentario en el código y test que fija «sin aviso del diálogo» en el rechazo |
| MEDIA: aviso del motivo de 3 s, con dos prefijos largos | B | sin cambio: mismo criterio que #478; anotado en §3 |
| MEDIA: respuesta vacía da dos avisos | B | descripción corregida en §3 |
| MEDIA: el spec necesita `openGuardadoConExito` | B | anotado en §6 |
| MEDIA: trabados ya existentes (`confirm` sin emitir, cierre durante la impresión) | B | fuera de alcance, anotado en §3 |
| BAJA: `next` sin `facturaId` puede ser un 201 sin `id`, con factura creada | A | ya va a «no se pudo confirmar» |
| BAJA: falta el caso timeout en runtime | A | §8: no reproducible en local sin tocar el filial; cubierto por test |
| BAJA: versiones desalineadas | B | línea en §3 |

## 10. Auditoría del diff (paso 8)

Tres fijos; ningún condicional (el diff no toca release, migraciones ni replicación).

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Sin superficie nueva de autorización ni de datos | Fijo 1 | — |
| BAJA, preexistente: en un corte, el motivo que muestra el genérico trae la URL del filial (`http://<ip>:<puerto>/api/facturas-legales`) | Fijo 1 | fuera de alcance; se informa por privado (el repo del central es público) |
| BAJA: el texto no estaba anclado; un rechazo que mencionara «Error del servidor filial» contaba como corte | Fijo 2 | anclado al prefijo del central (commit `23c4351e`) |
| BAJA: una respuesta del filial que no es 201 ni error («… Código: 200») se trataba como rechazo | Fijo 2 | reconocida como sin confirmar (`23c4351e`) |
| BAJA: faltaban tests del helper aislado | Fijo 2 | 4 casos en `graphqlErrorUtils.spec.ts` |
| Textos iguales en `develop`, `release/beta` y `master` del central; en beta/stable del filial una validación por `GraphQLException` sale como 500 y se ve «No se pudo confirmar» además del motivo | Fijo 3 | aceptado (lado seguro), ya anotado en §2 |

## 11. Verificación

- Karma (a mano, el CI no lo corre): 26 de 26 en el spec del diálogo y en `graphqlErrorUtils.spec.ts`. Con la lógica
  vieja dentro de los métodos nuevos fallan los 6 casos que cambian. «Some of your tests did a full page reload» sale
  igual en `develop` sin el cambio (15 de 15): preexistente.
- `npm run check` limpio sobre cada SHA pusheado; `npm run verificar:imports` OK.
- Runtime el 14/10/2026: desktop de la rama (`ng serve -c web`), central y filial locales en `develop` (perfil `dev`,
  scheduler de SIFEN apagado). Lista de facturas → Adicionar, SUC. KM2, timbrado 18270044-001 (detalle 108), un ítem,
  «Imprimir» → «No»:

| Caso | Avisos | Botón | Base del filial |
|---|---|---|---|
| Timbrado sin teléfono en detalle y cabecera | uno: «…Error al crear factura legal: El timbrado detalle no está disponible: TIMBRADO_SIN_TELEFONO…» | habilitado | sin factura nueva, `numero_actual` sin avanzar |
| Filial apagado | el motivo «…Error al conectar con el servidor filial… Connection refused» y luego «No se pudo confirmar la factura…» | habilitado | — |
| Central apagado con el diálogo abierto | uno: «No se pudo confirmar la factura…» | habilitado | — |
| Teléfono restaurado, todo arriba | «Guardado con éxito», cierra | — | una factura (n.º 14418) |

Antes del cambio, el primer caso terminaba en «Error desconocido» y los otros dos liberaban el botón sin avisar de la duda.
