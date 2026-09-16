# Plan — fix #304: el corte de 60 s no aborta la request y no hay timeout HTTP

Issue: GabFrank/frc-sistemas-integrados-angular#304. Rama `fix/core-timeout-http-real` desde `origin/develop` `9009a39c`.

## Decisión (usuario, 2026-09-16)

- **Timeout real en la cadena de links**: 60 s por defecto para toda operación HTTP (queries y mutations, central y local);
  cada llamada puede pedir más en el contexto. Las subscriptions no se tocan.
- **Aviso único desde el link** al cortar: distinto para queries y mutations; sin avisos duplicados de los llamadores.
- **`CargandoDialogService`**: se saca el `AbortController`/`signal` muerto; el timer queda como red de seguridad que cierra
  el spinner **sin** anunciar «Tiempo de espera superado».

## Análisis (paso 3)

| Hecho | Evidencia |
|---|---|
| El `signal` de `CargandoDialogService` no llega a ningún lado: el `HttpLink` de apollo-angular manda con `HttpClient` y no lee `fetchOptions`, y `createAbortableLink` lo pisa con su propio controller | `ngApolloLinkHttp.mjs:129-180`; `graphql-connection.service.ts:350-383` |
| **El corte real es desuscribirse**: el teardown del `HttpLink` desuscribe el `HttpClient`, que hace `xhr.abort()` | `ngApolloLinkHttp.mjs:175-179`; `@angular/common/fesm2020/http.mjs:1955` |
| Único timeout real hoy: `createCentralTimeoutLink` (3 s, solo central y solo si el WebSocket central **no** está confirmado online). Central online pero lento: sin límite. **Servidor local (filial): ningún timeout** | `graphql-connection.service.ts:399-444,214-240` |
| El aviso «Tiempo de espera superado» solo sale del timer del diálogo (60 s), que no corta nada | `cargando-dialog.service.ts:54-57` |
| `GenericCrudService`: 12 métodos abren el diálogo y pasan `fetchOptions: { signal }`; **todos cierran el spinner en sus handlers** `next`/`error` (ninguno depende del timer) | `generic-crud.service.ts` |
| `onCustomQuery` tiene `timeout(300000)` de rxjs (5 min): lo usan reportes (`producto.service.ts:238`) y la vista previa de liquidación final | `generic-crud.service.ts:150` |
| Ante un error de red, la mayoría de los métodos cierran sin avisar; avisan `onGetById` («Problema al realizar esta operación»), `onSaveCustom` (`mensajeErrorTransporte`, siempre) y `onCustomQuery`/`onGetByTexto`/`onSave` («Error de red» solo con `errorConf.networkError.show`) | `generic-crud.service.ts:180,363,423,503,595` |
| ~24 archivos usan Apollo directo (sin `GenericCrudService`): p. ej. pago mixto de tesorería (`pagar-compras.service.ts` `mutar()`), replicación (`replication-table.service.ts`, contra el local). Un timeout en la cadena de links los cubre a todos | relevamiento |
| Fuera de `GenericCrudService`, solo `list-productos-vencidos.component.ts:205,219` usa el `signal`; ninguna otra llamada a `openDialog` pasa duración | relevamiento |
| `NotificacionSnackbarService` ya está inyectado en `GraphqlConnectionService`; los snackbars se encolan (`app.component.ts:98-125`) | código |
| Karma no corre en esta máquina (ver memoria); el CI solo hace `build:prod` | `src/karma.conf.js`, `ci.yml` |
| Con `queryDeduplication` (default `true`), dos queries idénticas comparten un `Concast` y una sola ejecución del link: el error del timeout llega a todos los observadores y se aborta un solo XHR | `@apollo/client/core/ApolloClient.js:18`, `QueryManager.js:580-612`, `Concast.js:20-34` |
| El error del link pasa igual por `errorLink` (envuelve el `split`), que lo loguea; no hay `RetryLink` en la cadena | `@apollo/client/link/error/index.js:30-48`; grep |
| **`generarLiquidacionesMes`/`generarLiquidacionesLote`** (RRHH, todos los activos) van por `onSaveCustom`; en el central es un loop síncrono por funcionario con N+1: con nómina grande puede superar 60 s | `liquidacion.service.ts:73-81`; central `LiquidacionSueldoService.java:699-748` |
| Todos los `timeout(` de rxjs del cliente son ≤ 60 s salvo `onCustomQuery` (300 s); reportes/recibos Jasper van por `onCustomQuery` (111 usos); SIFEN no se envía desde el desktop (scheduler del backend); sin multipart; Electron `main.ts` sin Apollo | grep |
| Más llamadores leen `.requestId` del retorno de `openDialog` (`tab.service.ts:117`, `adicionar-conteo-dialog`, `adicionar-caja-dialog`, `list-producto.component.ts:638`); ninguno usa `.signal` salvo `GenericCrudService` y `list-productos-vencidos`. `closeAll()` solo al cerrar sesión | grep |

## Cambios

### Fase 1 — desktop

1. **`src/app/shared/services/timeout-link.ts`** (nuevo, puro, sin Angular):
   - `TIMEOUT_POR_DEFECTO_MS = 60000`.
   - `crearTimeoutLink(avisar: (tipo: 'query' | 'mutation') => void, porDefectoMs = TIMEOUT_POR_DEFECTO_MS): ApolloLink`.
     Lee `operation.getContext().timeoutMs` (número > 0) o usa el default; el tipo sale de `getMainDefinition`. Al vencer:
     marca terminado, **desuscribe el `forward`** (aborta el XHR), llama `avisar(tipo)` y emite `observer.error(err)` con
     `err.esTimeout = true`. Resultados tardíos se ignoran. Teardown limpia el timer.
   - `esTimeoutDeLink(error)`: `error?.esTimeout || error?.networkError?.esTimeout` (Apollo envuelve en `ApolloError`).
   - `MENSAJE_TIMEOUT_QUERY` = «El servidor no respondió a tiempo.»; `MENSAJE_TIMEOUT_MUTATION` = «El servidor no respondió a
     tiempo: la operación pudo haberse aplicado. Verificá antes de reintentar.»
2. **`graphql-connection.service.ts`**:
   - `crearTimeoutLink` al **inicio** de las cadenas HTTP `http` (local) y `http2` (central, antes de `createCentralTimeoutLink`).
     Subscriptions (WebSocket) fuera.
   - `avisar`: snackbar `warn` con el mensaje del tipo, **sin repetir** el mismo mensaje dentro de 5 s (varias queries
     cortadas a la vez dan un solo aviso).
   - `createAbortableLink`: se quitan el `AbortController` y el `setContext({ fetchOptions })`; queda la normalización del
     resultado vacío.
3. **`generic-crud.service.ts`**:
   - Se quita `fetchOptions: { signal }` de los 12 métodos.
   - `onCustomQuery`: sale el `timeout(300000)` de rxjs; pasa `context.timeoutMs = 300000` y `openDialog(..., duracion)` con
     ese valor más margen.
   - Los avisos de error de red (`onGetById`, `onSaveCustom`, `onCustomQuery`/`onGetByTexto`/`onSave` con `errorConf`) se omiten
     si `esTimeoutDeLink(error)`: el link ya avisó. El resto del manejo (cerrar diálogo, propagar) no cambia.
   - `onSaveCustom(..., opciones)`: nuevo `opciones.timeoutMs` → `context.timeoutMs` y duración del diálogo (auditoría A-1).
4b. **`liquidacion.service.ts`**: `onGenerarMes` y `onGenerarLote` pasan `timeoutMs: 300000`.
4c. **`pagar-compras-dialog.component.ts`**: en el `error` del pago, no repetir el aviso si `esTimeoutDeLink(err)` (el link ya lo
   mostró). Resto de llamadores Apollo directos: el mensaje del `Error` es el mismo del snackbar, así que un duplicado es
   cosmético (riesgo aceptado).
4. **`cargando-dialog.service.ts`**: sin `AbortController`; `openDialog` devuelve `{ requestId }`; el timer por defecto pasa a
   `TIMEOUT_POR_DEFECTO_MS + 5000` y **solo cierra el spinner** (sin `openWarn`). `closeDialog`/`closeAll` sin `abort()`.
5. **`list-productos-vencidos.component.ts`**: sin `signal`/`fetchOptions`.

Sin cambios en el central ni en `assets/configuracion*.json`.

### Tests

Karma no corre: script `esbuild` + `node` fuera del repo sobre `timeout-link.ts` real, con un link `forward` falso:

| Caso | Esperado | Con el código viejo |
|---|---|---|
| Responde antes del timeout | pasa el resultado, sin aviso | — (no existe) |
| No responde (`timeoutMs` 20 ms) | error `esTimeout`, el `forward` queda desuscrito, `avisar('query')` una vez | la request sigue |
| Mutation que no responde | `avisar('mutation')` | — |
| Resultado tardío | no se emite | se aplicaba |
| Sin `timeoutMs` en el contexto | usa el default | — |
| `esTimeoutDeLink` con `ApolloError`-like (`networkError.esTimeout`) | `true` | — |

`npm run check` (AOT) al final, leído del log.

## Prueba de runtime (paso 9) — gate antes del PR

`npm run ng:serve` + central local, sesión del usuario:
1. Desde la consola, el `Apollo` de la app (`ng.getInjector`) con una query y `context: { clientName: 'servidor', timeoutMs: 5 }`
   → error de timeout, snackbar «El servidor no respondió a tiempo.», y la request **cancelada** en red
   (`read_network_requests`).
2. Navegación normal (listados, dashboard de caja) sin avisos espurios.
3. Varias queries cortadas a la vez → un solo snackbar.
4. Reporte de productos (`list-producto` → `onCustomQuery`, diálogo anidado): responde normal, sin aviso espurio.

## Datos nuevos / persistencia / replicación

N/A: solo cliente.

## Orden de despliegue

Un PR (desktop). Independiente del central. Al mergear a `develop` sale una alpha del desktop.

## Riesgos conocidos

- **Cortar del lado cliente no deshace lo que el servidor ya escribió**: una mutation lenta que se corta a los 60 s puede
  haberse aplicado. Por eso el aviso de mutation lo dice explícito. Pagos/liquidaciones que tarden más de 60 s hoy se
  mostraban como «Tiempo de espera superado» igual.
- Operaciones legítimas de más de 60 s fuera de `onCustomQuery` y de la generación masiva de liquidaciones (sin override)
  pasan a cortarse. La auditoría no encontró otras (reportes por `onCustomQuery`, SIFEN por scheduler, finiquito acotado a un
  funcionario). Si aparece una, se le pasa `timeoutMs`.
- Operaciones no-GraphQL (IPC, impresión, HTTP de actualización) que tarden más de 65 s ya no muestran aviso: el spinner se
  cierra en silencio.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| A-1 | A · alta | `generarLiquidacionesMes`/`Lote` por `onSaveCustom` sin override; loop síncrono por funcionario en el central | Confirmado | **Aplicado**: `opciones.timeoutMs` en `onSaveCustom` y 300 s en `onGenerarMes`/`onGenerarLote` |
| A-2 | A | Finiquito acotado a un funcionario | Confirmado | Sin cambio |
| A-3 | A · baja | `add-edit-item-dialog.component.ts:1927` usa `timeout(60000)`, igual al default | Hoy ya compiten; el rxjs local desuscribe igual | Sin cambio |
| A-4..A-10 | A | Reportes por `onCustomQuery`; SIFEN por scheduler; sin multipart; sin Apollo en Electron; `signal` solo en 2 lugares; remover el `AbortController` es seguro; filial sin operaciones POS > 60 s detectadas | Confirmado | Sin cambio |
| B-1 | B | Teardown llega al XHR; con deduplicación el error llega a todos los observadores | `node_modules` | Anotado en el análisis |
| B-2/B-3 | B | Orden (timeout antes de `auth`) correcto; el timeout pasa por `errorLink`; el contexto `timeoutMs` llega al link desde `fetch`/`mutate`/`query` | `node_modules` | Sin cambio |
| B-4 | B · media | Llamadores Apollo directos que muestran `err.message` duplican el aviso (p. ej. `pagar-compras-dialog.component.ts:954-957`) | Correcto | **Aplicado** en pagos; resto aceptado como cosmético |
| B-5 | B · baja | Más llamadores leen `.requestId`; diálogo anidado del reporte de productos | Compatibles | Anotado + caso de runtime |
| B-6 | B | Test esbuild+node: importar de `@apollo/client/core` y `/utilities` (la raíz trae React) | Confirmado | Se aplica |
| B-7 | B | Sin `RetryLink`: el corte no duplica escrituras desde el cliente | Confirmado | Sin cambio |
