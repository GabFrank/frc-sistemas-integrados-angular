# Plan — fix #207: mensaje de error de GraphQL sin el envoltorio de graphql-java

> Plan de trabajo del ciclo de 12 pasos. **Muere al cierre**: se borra en el PR final (paso 11).
> Rama: `fix/generics-errores-graphql-observable` (desde `origin/develop` @ `e6ee4f88`).

## Estado del issue al 2026-09-14 (paso 3)

El issue #207 pedía tres cosas y un comentario de Gabriel sumó una cuarta. Verificado contra
`origin/develop`, que coincide con `master` y `release/beta` en estos puntos:

| Pedido | Estado | Evidencia |
|---|---|---|
| `onSaveCustom` emite ante `res.errors` (no deja el observable colgado) | **Resuelto** | `88532efc` (PR #249, 2026-08-27), en tags desde `v4.2.0-alpha.11`; `generic-crud.service.ts:549-554` |
| Quitar el `+ res` que imprimía `[object Object]` | **Resuelto** | `generic-crud.service.ts:545` ya no concatena `res` |
| `onCustomQuery` con el mismo defecto | **Resuelto** | `5925394c` (2026-09-01); `generic-crud.service.ts:163-167` |
| Sanear el prefijo `Exception while fetching data (/data) : ` | **PENDIENTE** — alcance de este plan | solo lo limpia `pagar-compras.service.ts:200-203` |
| Revisar callers sin handler de `error` | Fuera de alcance (decisión del usuario) | ver «Hallazgos fuera de alcance» |

Alcance elegido por el usuario: **«Limpiar mensaje»**.

## Qué se cambia

1. **Helper puro** `limpiarMensajeGraphQL(msg: string): string` en
   `src/app/commons/core/utils/graphqlErrorUtils.ts` (junto a `dateUtils.ts`, `rucUtils.ts`).
   - Quita el prefijo que agrega graphql-java: `^Exception while fetching data \(<path>\) : `.
     El `<path>` varía (`/data`, `/data/0`, alias), así que se matchea `\([^)]*\)`.
   - Mensaje sin ese prefijo → se devuelve igual (solo `trim`).
   - Cualquier valor que **no sea string** (`null`, `undefined`, número, objeto) o string vacío →
     se devuelve tal cual (el llamador ya tiene su fallback). Guarda con `typeof msg !== 'string'`,
     no solo falsy: un `replace` que revienta dentro del `subscribe` sería peor que el bug.
   - No toca otros formatos (p. ej. `Validation error (FieldUndefined@…)`): son errores de
     desarrollo, no de negocio, y el detalle sirve para diagnosticar.
   - Y `limpiarErroresGraphQL(errors)`: devuelve un array nuevo con copias de cada error
     (`{ ...e, message: limpiarMensajeGraphQL(e?.message) }`); si `errors` no es array, lo
     devuelve tal cual. Lo usan los payloads de `obs.error` del punto 2.
2. **`GenericCrudService`** (`src/app/generics/generic-crud.service.ts`):
   - Los 15 armados de snackbar `... + res.errors[0].message` pasan el mensaje por el helper.
   - Los payloads de `obs.error(...)` que llevan errores de GraphQL mantienen **la misma forma**
     pero con `message` limpio:
     - `onSaveCustom`: `{ graphQLErrors, message }` → `graphQLErrors` como copia con cada
       `message` limpio, y `message` limpio. **Motivo:** 10 componentes muestran
       `err?.graphQLErrors?.[0]?.message` antes que `err?.message`
       (p. ej. `configurar-caja-virtual-dialog.component.ts:113`,
       `pagar-compras-dialog.component.ts:956`); limpiar solo `message` no les llega.
     - `onCustomMutation` y `onSave`: `obs.error(res.errors)` → el mismo array, con copias de
       cada error y `message` limpio.
     - `onGetByTexto` (`propagate`): `{ message, errors }` → los dos limpios.
   - Sin cambios de flujo: no se agrega ni se quita ningún `next`/`error`/`complete`.
3. **`pagar-compras.service.ts`**: el `limpiarError` privado usa el helper compartido (con su
   fallback `'Error al registrar el pago'`), y se corrige el comentario de `onPagarMixto`
   (líneas 170-173), que afirma que `onSaveCustom` deja el observable colgado — ya no es cierto.
   **No** se vuelve a `onSaveCustom`: cambiaría la UX (abre «Guardando...» y agrega un snackbar
   genérico antes del warn del diálogo).

## Fases

| Fase | Contenido | Commit | Test |
|---|---|---|---|
| 0 | Este plan, al aprobarse | `docs(generics): plan del fix del mensaje de error de graphql` | — |
| 1 | Helper + uso en `GenericCrudService` | `fix(generics): quitar el prefijo de graphql-java de los mensajes de error` | script esbuild + node sobre el helper real (ver abajo) |
| 2 | `pagar-compras.service.ts` usa el helper + comentario corregido | `refactor(financiero): usar el helper compartido para limpiar el error del pago` | mismo script (el helper ya cubre el caso) + prueba de UI |
| 3 | Cierre: borrar este plan | `docs(generics): retirar el plan del fix del mensaje de error` | — |

Cada fase: `npm run check` leído del log al final de la implementación (skill `frc-desktop`:
AOT solo al final), `git status` limpio de archivos ajenos, push de la rama.

### Test de la fase 1

Karma no corre en este repo (memoria `karma-desktop-inejecutable`), así que: script fuera del
repo (`$CLAUDE_JOB_DIR/tmp`) que importa `graphqlErrorUtils.ts` real, bundle con `esbuild
--platform=node`, y `node`. Casos:

1. `Exception while fetching data (/data) : El funcionario tiene una liquidacion final BORRADOR (#7). Anulala antes de revertir el egreso.` → sin prefijo.
2. Path distinto `(/data/0)` y alias `(/pagarLote)` → sin prefijo.
3. Mensaje de negocio con `:` adentro (`Saldo insuficiente: faltan 1.000 Gs`) sin prefijo → intacto.
4. Mensaje con prefijo **y** `:` en el cuerpo → solo cae el prefijo.
5. `Validation error (FieldUndefined@[data/x]) : ...` → intacto.
6. `null`, `undefined`, `''`, `42`, `{}` → devueltos tal cual, sin lanzar.
7. Copia de un error `{ message, locations, path, extensions }` con el helper de arrays
   (`limpiarErroresGraphQL`) → conserva `locations`/`path`/`extensions` y no muta el original.

Rojo → verde: correr primero contra un helper identidad (`return msg`) y ver fallar 1, 2 y 4.

**Cableado** (el test del helper no lo cubre): antes del commit,
`grep -c "errors\[0\]\.message" generic-crud.service.ts` sin envolver tiene que dar 0 y cada uno de
los 15 sitios originales tiene que pasar por el helper — se verifica con `git diff` línea a línea.
El paso del ciclo lo marca `N/A para desktop` (no hay batería en CI); se hace igual porque
cuesta poco y es la única evidencia automatizada.

## Datos nuevos

N/A: no nace ningún campo, columna, clave de configuración ni valor de enum. Solo cambia el
texto de mensajes que ya se mostraban.

## Persistencia, backend, replicación

N/A para central y filial porque el cambio es solo de presentación en el cliente: no toca
`.graphqls`, resolvers ni migraciones. El prefijo lo agrega graphql-java en el servidor; limpiarlo
en el servidor cambiaría el contrato para mobile-pwa y mobile, así que no se toca.

## Prueba de runtime (paso 9)

Local, sin mergear: central en 8081 con perfil `dev` + `npm run ng:serve` desde Chrome.
Provocar un error de negocio conocido y ver el snackbar sin prefijo:
- **pagar compras con saldo insuficiente en la caja virtual** (camino `mutar`, fase 2), y
- un camino `onSaveCustom` de RRHH, p. ej. **revertir egreso con finiquito BORRADOR**
  (el mensaje literal del comentario de Gabriel), si la base local tiene el caso.
Los datos concretos se eligen consultando la DB local antes de proponer la prueba.

## Qué queda sin verificar

- Los ~24 llamadores de `onSaveCustom` sin handler de `error` (relevamiento por subagente; ~la
  mitad marcados «por patrón», sin inspección individual). No cambian con este fix.
- Formato del prefijo: verificado en el bytecode de graphql-java 18.5 (central). El del filial
  (graphql-java 14.1) no se re-verificó. Las excepciones que implementan `GraphQLError` llegan sin
  prefijo (el central las desenvuelve) y cualquier otro formato queda intacto: no se limpia, pero
  tampoco rompe.
- Electron: el cambio no toca IPC ni `app/`; se prueba en web.

## Hallazgos fuera de alcance (para issues aparte, si el usuario quiere)

1. `onGetAll`, `onGetById`, `onGetByFecha`, `onCustomSub` no emiten ante `res.errors`, y
   `onDelete`/`onDeleteWithSucId` con `showDialog=false` emiten `next(null)` sin `complete`.
   `onCustomQuery` ante error de red sin `propagate` tampoco emite.
2. `panel-configuracion-rrhh.component.ts:128-144`: `campo.guardando` solo se apaga en `next`;
   `ConfiguracionRrhhService.onSave` → `GenericCrudService.onSave` emite `error` si no hay `data`
   → el campo queda trabado.
3. ~24 subscripciones a wrappers de `onSaveCustom` sin `error` (sobre todo `rrhh/*`): con RxJS
   7.8 el error termina como excepción no capturada en consola.
4. Doble snackbar: los diálogos que muestran `graphQLErrors[0].message` en su `error` se suman
   al snackbar genérico de `onSaveCustom` (p. ej. `configurar-caja-virtual-dialog`).

## Auditoría del plan (paso 5)

### Eje B — Reversibilidad y estado

Sin migraciones ni estado persistido; un revert alcanza; sin problema de versiones mezcladas
cliente/backend; el corte en fases no deja estado inconsistente. Hallazgos:

| # | Hallazgo (severidad del auditor) | Verificación | Qué se hizo |
|---|---|---|---|
| B1 | Copiar `GraphQLError` con spread podría perder `extensions`/`path`/`locations` (media) | Apollo `3.7.14` entrega `res.errors` como objetos planos del JSON (`parseAndCheckHttpResponse.js`, sin `new GraphQLError`); en `graphql 16.6.0` esas props son propias. Nadie en `src/` usa `instanceof GraphQLError` ni `.extensions`. **Baja a baja.** | Caso 7 del test igual (barato) |
| B2 | `message` no-string haría reventar el helper dentro del `subscribe` (media) | Válido: el plan solo contemplaba falsy | Guarda `typeof !== 'string'` + caso 6 ampliado |
| B3 | El test del helper no prueba el cableado de los 15 sitios (media) | Válido; conteo 15 confirmado | Chequeo de cableado por `grep` + `git diff` |

### Eje A — Contrato y propagación

Sin cambio de schema ni coordinación con central/filial/mobile/mobile-pwa; ningún consumidor
parsea el texto del mensaje (solo lo muestra); el único strip duplicado es el de pagar-compras, que
la fase 2 migra. Hallazgos:

| # | Hallazgo (severidad del auditor) | Verificación | Qué se hizo |
|---|---|---|---|
| A1 | Dos consumidores tratan el error de `onSave`/`onCustomMutation` como array: `mensaje-error.ts:16` y `edit-factura-legal-dialog.component.ts:242` (baja) | Verificado por `grep` | La copia devuelve un array nuevo (`Array.isArray` sigue `true`) con `.message`; caso 7 del test |
| A2 | Cobertura incompleta silenciosa: un mensaje con otro formato no se limpia (media) | `GraphqlExceptionHandler.java:34-42` del central desenvuelve las excepciones que implementan `GraphQLError` (llegan **sin** prefijo): el helper es no-op ahí, correcto. No rompe, solo no limpia | Aceptado; ya consta en «Qué queda sin verificar» |
| A3 | El regex coincide con lo que emite graphql-java (sin riesgo) | `unzip -p graphql-java-18.5.jar graphql/ExceptionWhileDataFetching.class \| strings` → `Exception while fetching data (%s) : %s` (versión del central). Filial usa 14.1 vía kickstart: **afirmado por el auditor, no re-verificado** | Regex del plan sin cambios |
