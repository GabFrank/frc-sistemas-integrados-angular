# Plan — motivo del rechazo en recepción de mercadería (issue #488, tanda 1)

Pieza: **desktop**. Rama: `fix/generics-motivo-rechazo-llamadores`, desde `origin/develop` (`ad437a9a`, con #489).
Todo va al **central**; no toca GraphQL, esquema ni backend.

## Qué pasa

Cuando el central rechaza una mutation, `GenericCrudService.onCustomMutation` (`generic-crud.service.ts:355-405`)
avisa «Ups! Algo salió mal: <motivo>» y emite por `error` el **arreglo** de errores GraphQL. En un corte de red
emite el error de Apollo y **no avisa**. Los avisos se encolan (`app.component.ts:98-125`), no se pisan.

Los `error:` de recepción leen `error.message` del arreglo, que da `undefined`:

- **en el rechazo**, detrás del motivo aparece «Error al verificar ítem: Error desconocido», que lo contradice; en
  los `Promise.all(...).catch` sale literalmente «Error al deshacer verificación: undefined»;
- **en el corte de red**, el mismo texto genérico, cuando lo que corresponde es decir que la operación pudo haberse
  aplicado (#390).

## Regla de #488 para `onCustomMutation` sin `silentLoad`

| Caso | Cómo se reconoce | Quién avisa |
|---|---|---|
| Rechazo del central | `erroresDeRechazo(error) != null` | el genérico, con el motivo. El llamador **no** suma otro aviso |
| Corte por tiempo | `esTimeoutDeLink(error)` | el timeout link («…pudo haberse aplicado. Verificá antes de reintentar.»). El llamador no suma otro |
| Corte de red, central offline, respuesta vacía | lo demás | **el llamador**: «No se pudo confirmar si <qué>: revisá antes de repetir.» |

La respuesta vacía llega como arreglo y el genérico ya avisó «Respuesta vacía del servidor». `erroresDeRechazo` la
trata como «sin respuesta» y el llamador agrega el «no se pudo confirmar», que es lo que el primer aviso no dice.

Helper nuevo en `commons/core/utils/graphqlErrorUtils.ts`, junto a `erroresDeRechazo`:

```ts
/** Lo que el `error:` de quien llamó a `onCustomMutation` sin `silentLoad` tiene que avisar, o `null` si ya avisó otro (#488). */
export function avisoTrasMutacion(error: any, queSeHizo: string): string | null
```

Devuelve `null` en el rechazo y en el corte por tiempo, y `No se pudo confirmar si ${queSeHizo}: revisá antes de
repetir.` en lo demás. Importa `esTimeoutDeLink` de `shared/services/timeout-link.ts`, que solo importa de Apollo:
no arma ciclo con el genérico. **No se toca la forma del error en el genérico**: la ven 42 services y el CI no
corre tests.

## Inventario (`recepcion-mercaderia.component.ts`, anclado por símbolo)

Los 13 manejadores de mutaciones del componente; todas son `onCustomMutation` sin `silentLoad` de
`pedido.service`. Las cargas de la pantalla ya las trató el #390 (`plan-errores-de-red-en-recepcion-compras.md`) y
no cambian.

| # | Dónde | Mutation | Hoy | Fase |
|---|---|---|---|---|
| 1 | verificar ítem (`:1113`) | `onSaveRecepcionMercaderiaItem` | `error.message \|\| 'Error desconocido'` | 1 |
| 2 | rechazar ítem (`:1892`) | `onRechazarItem` | idem | 1 |
| 3 | `ejecutarRecepcionTodo` (`:2914`) | `onRecepcionarTodoPorNota` | idem; baja `loading` | 1 |
| 4 | recepcionar selección (`:2973`) | `onRecepcionarTodoPorNota` | idem; baja `loading` | 1 |
| 5 | deshacer verificación de la nota (`:3058`) | `onDeshacerVerificacionTodoPorNota` | idem; baja `loading` | 1 |
| 6 | verificar ítems, `forkJoin` (`:1025`) | `onSaveRecepcionMercaderiaItem` × N | idem | 2 |
| 7 | verificación detallada, `Promise.all` (`:1825`) | `onSaveRecepcionMercaderiaItem` × N | idem | 2 |
| 8 | recepción automática del restante tras un rechazo parcial, `Promise.all` (`:2000`) | `onSaveRecepcionMercaderiaItem` × N | «Rechazo registrado, pero…: » + `error.message` | 2 |
| 9 | `ejecutarCancelacionVerificacion` (`:1475`) | `onCancelarVerificacion` × sucursales | `'…: ' + error.message` → «undefined» | 2 |
| 10 | `ejecutarCancelacionRechazo` (`:1515`) | `onCancelarRechazo` × sucursales | idem | 2 |
| 11 | `ejecutarDeshacerSeleccion` (`:3143`) | `onCancelarVerificacion` × ítems × sucursales | idem | 2 |
| 12 | deshacer rechazo de la selección (`:3249`) | `onCancelarRechazo` × ítems × sucursales | idem | 2 |
| 13 | deshacer rechazo (`:3355`) | `onCancelarRechazo` × ítems × sucursales | idem | 2 |

### Fase 1 — operaciones de un solo pedido (1 a 5)

`error:` → `console.error` como hoy, se baja `loading` donde ya se bajaba y
`avisoTrasMutacion(error, '<qué>')`; si no es `null`, `openWarn(aviso, 8)`. Textos de «qué»: «se verificó el
ítem», «se registró el rechazo», «se recepcionaron los ítems», «se recepcionaron los ítems seleccionados», «se
deshizo la verificación». En el corte de red además se recargan los ítems de la nota (y el pedido y la etapa donde
el camino feliz ya los recarga): la pantalla muestra lo que de verdad quedó y el usuario revisa antes de repetir.

### Fase 2 — operaciones múltiples (6 a 13)

`forkJoin` y `Promise.all` cortan en el **primer** fallo, pero las otras operaciones ya salieron y pueden haberse
aplicado. Hoy la pantalla no se recarga y queda mostrando el estado de antes. Cambio:

- mismo aviso por la misma regla. En el rechazo el motivo ya lo dio el genérico, pero se agrega un aviso propio
  **solo si había más de una operación**: «Algunas operaciones pudieron haberse aplicado: se recargan los ítems.»;
- **siempre** se recargan los ítems de la nota (y pedido y etapa donde el camino feliz lo hace), sea rechazo o
  corte;
- #8 conserva la primera parte de su texto («Rechazo registrado, pero no se pudo marcar la cantidad restante como
  recibida») sin el `error.message`, y sigue actualizando la fila como hoy.

No se cambia `Promise.all` por `allSettled` ni se reintenta: es un cambio de comportamiento que no pide #488.

## Tests

- `graphqlErrorUtils.spec.ts`: `avisoTrasMutacion` con un rechazo (arreglo), un rechazo con `networkError`, la
  respuesta vacía, un `ApolloError` de red, el error del central offline (`networkError: true`) y un timeout del
  link (`esTimeout` directo y envuelto en `networkError`). Se revierte el helper para ver que fallan.
- Karma no corre en CI (`N/A para desktop` como gate [ev: ci.yml]); se corre a mano el spec:
  `npx ng test --watch=false --include='src/app/commons/core/utils/graphqlErrorUtils*.spec.ts'`.
- `npm run check` antes de cada push, leído del log.

## Prueba de runtime

Central local propio, con perfil `dev` y replicación apagada; desktop `ng serve -c web` en un puerto propio (otra
sesión puede tener 4200/8081: se mira el cwd del proceso antes). Pedido en recepción física de la base local (el 4,
según #390; si ya no está en esa etapa, se arma uno: la base local puede crear datos).

- **Rechazo**: los rechazos de recepción no se provocan fácil desde la pantalla. Se intercepta `fetch` en el
  navegador para la mutation de turno y se devuelve `{ data: null, errors: [{ message: 'Exception while fetching
  data (/data) : PRUEBA rechazo' }] }`: es la forma real que recibe Apollo. Esperado: un solo aviso «Ups! Algo salió
  mal: PRUEBA rechazo».
- **Corte de red**: central detenido (`kill -STOP`, con `kill -CONT` de respaldo) o `fetch` que rechaza. Esperado:
  «No se pudo confirmar si …», y la recarga avisa por su cuenta.
- **Múltiples** (fase 2): interceptar solo la segunda llamada de un deshacer en 2 sucursales: la primera se aplica,
  la segunda se rechaza → motivo, «Algunas operaciones pudieron haberse aplicado», y la tabla recargada muestra la
  primera deshecha.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Sin datos nuevos.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no tapar el motivo del rechazo al verificar o recepcionar` | helper + spec + 1–5 y 14 |
| 2 | `fix(operaciones): recargar los items cuando falla una operacion multiple de recepcion` | 6–13 |

## Tandas siguientes de #488 (cada una con su plan)

1. **Esta**: recepción de mercadería.
2. Gestión de compras y sus diálogos de notas, `list-compra`, `solicitud-pago-compra`.
3. Pagos y solicitud de pago (`onSave`: ahí el genérico avisa también el corte de red, así que el llamador no
   avisa nada).
4. El resto, por módulo, incluidas las 2 silenciosas (`venta-tarjeta.onCancelarPorVentaId` y
   `onIncorporarEmbeddingMarcacion`) y `mensajeDeError` movido a `graphqlErrorUtils.ts`.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

Hechos del central que los sostienen (`RecepcionMercaderiaItemService`): cada mutation es **una** transacción, así
que un rechazo de una sola = no se aplicó nada; en los puntos múltiples cada llamada es la suya y el éxito parcial
es real. `cancelarVerificacion`, `cancelarRechazo` y `deshacerVerificacionTodoPorNota` son idempotentes;
`recepcionarTodoPorNota` lo es en secuencia pero no si corren dos a la vez; `saveRecepcionMercaderiaItem` y
`rechazarItem` **suman** sin tope (repetirlos duplica).

- **Punto 14 · `validarYFinalizarRecepcion`** (llamadas `:2403` y `:2421`, `catch` `:2459`): mismo defecto («Error
  al validar finalización: undefined»), en la operación más delicada de la pantalla. Va a la fase 1. Se registra
  en qué paso falló: en la **validación** el texto es «No se pudo validar la finalización: …» (no escribe, se
  reintenta); en la **finalización** es `avisoTrasMutacion(error, 'se finalizó la recepción física')` y, si no es
  rechazo, se recargan notas y etapa. `loading` lo sigue bajando el `finally`.
- **Cuándo recargar tras un corte** (alto): el corte más probable no es el de 60 s, sino el de 3 s del central no
  confirmado online (`graphql-connection.service.ts:48, :433-440`, `networkError: true`). La operación puede seguir
  corriendo en el central, y una recarga inmediata mostraría «pendiente» lo que se está aplicando: el usuario
  repetiría y `recepcionarTodoPorNota`/`saveRecepcionMercaderiaItem` sumarían doble. Por eso, en todo caso que no es
  rechazo (red, offline, respuesta vacía, timeout del link), la recarga va **a los 5 s**, no al instante, y el texto
  de `avisoTrasMutacion` pasa a «No se pudo confirmar si ${queSeHizo}: puede seguir aplicándose. Esperá unos
  segundos y revisá antes de repetir.». Bloquear los botones durante la espera queda fuera (es previo a este
  cambio): se anota en riesgos.
- **Recarga solo de la nota afectada**: se captura el `notaId` al lanzar la operación y se recarga solo si sigue
  seleccionada; si el usuario cambió de nota, al volver se carga sola (`onSelectNotaRecepcion`).
- **Selección** (#4, #11, #12, #13): en la rama de fallo se limpian `selectedItems` y `selectAllItems` antes de
  recargar, como en el éxito. Si no, los botones siguen habilitados sobre objetos viejos y un reintento reenvía
  cancelaciones ya aplicadas («No se pudo deshacer… de ningún item» aunque sí se deshizo).
- **Punto 8**: su `catch` ya recarga vía `actualizarUIDespuesRechazo` (`recargarDesdeBackend = true`) y además
  muestra en verde «Rechazo parcial registrado exitosamente. Cantidad pendiente: X», que contradice el aviso de
  error y puede dar una X falsa. No se suma otra recarga; `actualizarUIDespuesRechazo` recibe un parámetro para no
  mostrar ese verde en esta rama. #8 queda fuera de la regla del aviso extra: su texto propio ya lo dice.
- **«Más de una operación»** = largo del arreglo de llamadas lanzadas (`itemsToSave`, `promesas`,
  `promesasRecepcion`, `cancelaciones`). En un rechazo, un solo aviso extra «Algunas operaciones pudieron haberse
  aplicado: se recargan los ítems.». En un corte, un solo aviso combinado (el de `avisoTrasMutacion` ya lo dice),
  no dos.
- **Pedido y etapa** se recargan en el fallo solo donde el camino feliz lo hace: #1, #3, #4, #6, #7 y la
  finalización del #14.
- **Líneas**: las citadas son de la **llamada**; los manejadores están en `1050`, `1140`, `1495`, `1535`, `1854`,
  `1924`, `2046`, `2459`, `2939`, `3003`, `3074`, `3189`, `3287` y `3401`.
- **Tests**: la prueba de rojo se hace con `avisoTrasMutacion` devolviendo siempre `null` (sin la función el spec no
  compila y no prueba nada). Casos agregados: `null`/`undefined`, `[]`, rechazo con forma `{ graphQLErrors }`, un
  arreglo que mezcla respuesta vacía con otro error, `ApolloError` con `networkError` HTTP 401/500, el objeto exacto
  del central offline, y que el texto interpole `queSeHizo`. La prueba de runtime cubre además #6, #7 y #8.

## Ajustes durante la implementación

- **Operaciones múltiples: la recarga va a los 5 s también tras un rechazo.** `forkJoin` y `Promise.all` cortan en el
  primer error, pero las otras mutations siguen en vuelo (el `Observable` de `onCustomMutation` no cancela el pedido
  al desuscribirse). Recargar al instante podía mostrar a medias lo que todavía se está aplicando.
- **Punto 8:** su recarga de 500 ms (vía `actualizarUIDespuesRechazo`) se reemplaza por la de 5 s, por la misma
  razón. En un «sin respuesta» el texto dice «no se pudo confirmar si se marcó la cantidad restante…».
- **Punto 14, validación sin respuesta:** «No se pudo validar la finalización: el servidor no respondió. No se
  finalizó nada; podés reintentar.». En un rechazo no se suma nada: el motivo lo mostró el genérico.

## Auditoría del plan (paso 5, 2026-10-14)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Recargar al instante tras el corte de 3 s del central offline puede mostrar «no se aplicó» lo que se está aplicando; repetir suma doble | alta | recarga a los 5 s y texto «puede seguir aplicándose» |
| A | Falta `validarYFinalizarRecepcion` en el inventario | media | punto 14, fase 1, verificado (`:2459`) |
| B | La selección vieja sigue habilitando botones tras la recarga | media | se limpia en la rama de fallo |
| B | #8 ya recarga y muestra un éxito verde contradictorio | media | sin recarga extra; se silencia el verde |
| B | «Más de una operación» sin definir | media | largo del arreglo; #8 fuera; un aviso combinado en corte |
| B | Recarga de la nota equivocada si se cambió de nota | baja | `notaId` capturado al lanzar |
| A/B | El aviso de timeout del link se descarta dentro de 5 s del anterior | baja | riesgo anotado |
| A | Un HTTP 401/403/500 cae en «no se pudo confirmar» | baja | aviso conservador a propósito, anotado |
| B | El motivo del genérico dura 3 s (antes el aviso propio duraba 4) | baja | riesgo anotado; no se toca el genérico |
| B | Backport a un canal sin el genérico de develop dejaría el rechazo sin motivo | baja | condición anotada |
| B | Revertir el helper no prueba nada; faltan casos | baja | stub `null` y casos agregados |
| A | Ciclo de imports, clasificación de las formas de error, métodos de `pedido.service`, otros llamadores | — | verificado sin hallazgos |

## Riesgos y qué queda sin verificar

- Durante la espera de un corte los botones de recepcionar o deshacer siguen habilitados (es previo): el usuario
  puede lanzar otra operación sobre la misma nota antes de la recarga de los 5 s.
- Si dos mutations vencen por timeout dentro de 5 s, el link avisa una sola vez y la segunda queda sin aviso.
- Un error HTTP con respuesta (401, 403, 500) se trata como «no se pudo confirmar»: es conservador a propósito.
- El motivo del central queda en el aviso del genérico, que dura 3 s; un motivo largo puede no alcanzar a leerse.
- Este cambio supone el genérico de `develop` (aviso del motivo, `esTimeoutDeLink`). Un backport a un canal sin esas
  piezas dejaría el rechazo sin motivo: no se backportea suelto.

- Con un rechazo el usuario ve un aviso menos que hoy: si alguien se guiaba por «Error al verificar ítem» para saber
  qué operación falló, ahora tiene solo el motivo del central.
- La recarga tras un fallo múltiple suma una consulta; si el central no responde, avisa la recarga (ya tratado en
  #390).
- Si el central rechaza dentro de un `Promise.all` de N, las otras N−1 ya salieron: la recarga muestra el estado
  real, pero no se dice cuáles se aplicaron.
