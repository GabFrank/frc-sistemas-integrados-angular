# Timeout de operaciones GraphQL

Desde el issue #304. Cómo se corta una operación que no responde y qué ve el usuario.

## Cómo funciona

- `src/app/shared/services/timeout-link.ts` (`crearTimeoutLink`) va **al inicio de las cadenas HTTP** de
  `graphql-connection.service.ts`: central (`http2`) y local/filial (`http`). Las subscriptions (WebSocket) no pasan por
  ahí.
- **60 s por defecto** (`TIMEOUT_POR_DEFECTO_MS`). Una llamada pide más con `context: { timeoutMs }`.
- Al vencer, el link **se desuscribe** del resto de la cadena: el `HttpLink` de apollo-angular desuscribe su `HttpClient`,
  que hace `xhr.abort()`. Recién entonces avisa y emite un error con `esTimeout = true` (`esTimeoutDeLink(error)`). Una
  respuesta que llegue después se descarta.
- **Aviso único** desde `GraphqlConnectionService.avisarTimeout`, sin repetir el mismo tipo dentro de 5 s:
  - query: «El servidor no respondió a tiempo.»
  - mutation: «El servidor no respondió a tiempo: la operación pudo haberse aplicado. Verificá antes de reintentar.»
- `createCentralTimeoutLink` (3 s, solo con el central **offline**) sigue igual y gana en ese caso; su error no es
  `esTimeout`.

## Por qué no sirve un `signal`/`AbortController` ni un `timeout` de rxjs

- El `HttpLink` de apollo-angular manda con `HttpClient` y **no lee `context.fetchOptions`**: un `signal` ahí no corta
  nada. Cortar es desuscribirse.
- Un `timeout` de rxjs en el llamador también desuscribe, pero cada pantalla avisaría distinto y no cubre las llamadas
  Apollo directas. El corte vive en un solo lugar: la cadena de links.

## Pedir más tiempo

| Dónde | Cómo | Usado en |
|---|---|---|
| `GenericCrudService.onCustomQuery` | fijo 300 s | reportes, recibos PDF, vistas previas |
| `GenericCrudService.onSaveCustom(gql, data, servidor, { timeoutMs })` | opcional | `onGenerarMes`/`onGenerarLote` (RRHH) |
| `GenericCrudService.onCustomMutation(gql, data, servidor, silentLoad, { timeoutMs })` | opcional | finalizar inventario, avanzar etapa de transferencia |
| Apollo directo | `context: { timeoutMs }` | — |

Toda operación nueva que recorra muchos registros en el servidor (nómina, stock, ítems) necesita override.

## Diálogo de carga

`CargandoDialogService.openDialog` devuelve `{ requestId }`. Su timer (65 s por defecto, o la duración pedida) es solo una
**red de seguridad**: cierra el spinner sin avisar. El aviso de tiempo agotado lo da el link, cuando de verdad cortó.
`GenericCrudService` le pasa al diálogo la duración del override más 5 s.

## Avisos duplicados

- En `GenericCrudService`, los avisos de error de red se omiten si `esTimeoutDeLink(error)`.
- Un componente que muestre su propio error de una mutation debería hacer lo mismo (ejemplo:
  `pagar-compras-dialog.component.ts`). Hoy la mayoría de los llamadores de `onCustomMutation` no lo hace: ante un timeout
  el usuario ve el aviso del link y el «Error al…» de la pantalla.

## Riesgo

Cortar del lado cliente **no deshace** lo que el servidor ya escribió. Tras un timeout de mutation el botón queda
habilitado: por eso el aviso pide verificar antes de reintentar.

## Pruebas

Karma no corre en esta máquina: el link se prueba con un script `esbuild` + `node` que importa `timeout-link.ts` desde
`@apollo/client/core`. Para simular un servidor colgado en runtime, pausar el proceso del central local con `kill -STOP`
(nunca el alpha de `/opt`) y reanudar con `kill -CONT`.
