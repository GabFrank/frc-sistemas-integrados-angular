# Plan — errores de red en tesorería: listas, bancos y notificaciones (issue #390, PR 5b)

Pieza: **desktop**. Rama: `fix/tesoreria-errores-de-red-en-listas`, desde `origin/develop` **después del merge de
#396** (comparte `caja-virtual.service`, `cuenta-bancaria.service`, `gasto.service`, `pagar-compras-dialog`).
Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (#391) y `TIMEOUT_POR_DEFECTO_MS`.
Relevamiento: el del PR 5a (dos auditores, cada suscriptor leído). Skill: `frc-financiero-expert`.

## División del resto de #390 en financiero

- **5b** (este): pantallas **administrativas del central** donde un spinner o un flag queda trabado o la lista
  queda vacía sin aviso, sin riesgo de dinero; más **notificaciones y comentarios** (también central).
- **5c** (siguiente): gastos y retiros **del POS** (filial): `adicionar-gasto-dialog`, `adicionar-retiro-dialog`,
  `list-gastos`, el poll de pre-gastos de `venta-touch`, verificar maletín en la apertura de caja. Se prueba
  congelando el filial.
- Fuera: reportes PDF de la caja vía `ImpresionService` (compartido por todo el desktop: va con los reportes),
  `list-venta`/`generic-list-venta` (operaciones).

## Regla (la de #391–#396)

«Propagar» = solo `networkError`, `{ timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }` (pantallas
del central). Se propaga en el servicio si todos los suscriptores tienen o reciben su `error:`; si no, opt-in.
En listas, `null` (error GraphQL) se trata igual que el error de red: aviso y estado de carga abajo, **no** «no
hay datos».

## 1. Notificaciones (`notificaciones-tablero.service.ts`) [verificado]

- **El refresco solo funciona una vez por sesión, con o sin red** (`:108-120`): `_refreshTrigger$` es
  `Subject<void>` y pasa por `distinctUntilChanged()`; como emite siempre `undefined`, a partir del segundo
  disparo se descarta. Lo disparan el push de Electron, cambiar el estado de una notificación y enviar una
  personalizada. Cambio: quitar `distinctUntilChanged` (el `debounceTime(500)` ya junta ráfagas).
- **`isRefreshing` trabado**: se resetea solo en el `next` de `obtenerConteoNoLeidas` (`:116-118`); sin red no
  emite y su `catchError(of(0))` es inalcanzable → no se refresca más en la sesión. Cambio:
  `obtenerConteoNoLeidas` propaga con `{ timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }`
  (es de fondo: nadie la espera), su `catchError` existente pasa a ser alcanzable (devuelve el último valor, no
  0), e `isRefreshing` se baja en `finalize`. Con `null` el contador **no se pone en 0** (hoy `count || 0`
  borra el badge): `count == null` conserva el último valor.
- **Disparos perdidos mientras refresca**: con `isRefreshing` en `true` (ahora hasta ~20 s si el central no
  responde) un push que llega se descarta. Se anota un flag `pendiente` y, al bajar `isRefreshing`, se relanza
  **un** disparo. Sin bucle: `refrescarTodas`, `cargarNotificaciones` y `actualizarConteo` no disparan el
  trigger (verificado); solo lo hacen el push, `actualizarEstadoTablero` y `enviarNotificacionPersonalizada`.
- `cargarNotificaciones` (`:204`): `silentLoad`, `loading` por columna solo se baja en el `tap`; su `error:` ya
  existe → propagar con el mismo contexto de fondo. Con `null`, el `tap` hace `data.content` sobre `null`
  (TypeError que hoy «resetea» por accidente): se trata explícitamente como error.

## 2. Comentarios de notificación (`comentarios.service`, `comentarios-notificacion-dialog`)

- `obtenerComentarios`: la carga inicial (`dialog:103`, `cargando` trabado), la recarga tras crear un comentario
  (`dialog:484`, `enviando` trabado: el comentario ya se guardó) y su reintento (`:489`) pasan todas por
  `cargarComentarios` (`:161`); el poll cada 3 s (`dialog:189`, `interval` + `switchMap`, sin `catchError`
  interno: **moriría** si se propaga) llama al servicio directo. Cambio: opt-in **dentro de
  `cargarComentarios`** (parámetros opcionales en el servicio), `error:` en los subscribes de `:103` y `:489`, y
  `null` tratado como error (hoy `comentarios.map` sobre `null` revienta en el `tap` y deja `cargando` en
  `true`); el servicio **no cachea** un `null`. El poll queda igual.
- `obtenerUsuariosConAcceso` (`dialog:540`, `cargandoUsuarios` trabado, `error:` inalcanzable) → propagar.

## 3. Caja virtual (administración)

| Método | Suscriptor | Hoy | Cambio |
|---|---|---|---|
| `onGetFilter` | `list-caja-virtual:94` | `isSearching` trabado | propagar + `error:` |
| `onGetMovimientos` / `PorFecha` | `historial-movimientos-caja-virtual:80/88` | `isSearching` trabado | propagar + `error:` |
| `onGetAccesos` | `gestionar-accesos-caja-dialog:88` | `isLoading` trabado; la tabla dice «Nadie más tiene acceso»; «Agregar» (upsert) puede **pisar el `puedeEscribir`** de alguien que ya tiene acceso; si falla la recarga tras guardar o revocar, la tabla queda vieja | propagar + `error:`; flag `accesosCargados` (en `false` al iniciar cada carga, `true` solo con respuesta): sin él, Agregar deshabilitado y sin toggle de escritura ni revocar; mensaje de error con «Reintentar» en vez de «Nadie más tiene acceso» |
| `onGetActivas` | `transferencia-caja-virtual-dialog:69`, `add-operacion-financiera-dialog:140` | selector de cajas vacío sin aviso | opt-in (5a le dio los parámetros) + aviso |
| `pagarCompras.onGetChequerasPorCuenta` | `pagar-compras-dialog:795` | no ofrece cheque, sin aviso (seguro) | propagar + aviso |

## 4. Bancos

- `cuentaBancaria.onGetAll` (`cuenta-bancaria.component:63`, `isSearching` trabado) → propagar + `error:`.
- `cuentaBancaria.onGetAllOperables` (`edit-chequera-dialog:61`, `add-operacion-financiera-dialog:144`,
  `pagar-compras-dialog:320`): combos de cuenta vacíos sin aviso → opt-in (5a le dio los parámetros) + aviso.
- `banco.onGetAll` (`banco.component:43` `isSearching` trabado; `add-cuenta-bancaria-dialog:72` combo vacío) →
  propagar + `error:` en los dos.

## 5. Operaciones financieras y entradas varias

- `operacionFinanciera.onGetOperaciones` (`list-operacion-financiera:61`), `onGetOperacion`
  (`operacion-financiera-detalle-dialog:51`, «Cargando…» eterno; Anular ya está protegido por `!this.op`),
  `onGetMovimientosBancarios` (`caja-virtual-dashboard:388`, `list-movimientos-bancarios-dialog:38`) → propagar
  + `error:` (baja el flag y avisa).
- `operacionFinanciera.onGetCategorias` (`add-operacion-financiera-dialog:137`) y `entradaVaria.onGetCategorias`
  (`add-entrada-varia-dialog:76`): combo vacío → propagar + aviso (un suscriptor cada uno).
- `entradaVaria.onGetEntradasVarias` (`list-entradas-varias-dialog:58`, `isSearching` trabado) → propagar.

## 6. Maletín, retiros y gastos (lado central)

- `maletin.onGetValor` (`maletin-tesoreria-dialog:90`, «Calculando…» eterno; `error:` ya escrito) → propagar.
- `retiroVerificacion.onGetCasos` (`list-retiro-casos:108`, `isLoading` trabado, `error:` inalcanzable) → propagar.
- Gastos (administración en el central):
  - `tipoGastoFilter` (`list-tipo-gastos:79`) y `preGastoFilter` en `list-pre-gastos:135`: el `catchError`
    dentro del `switchMap` está bien puesto pero es inalcanzable, y hoy devuelve `null` que se pinta como lista
    vacía → opt-in (`preGastoFilter` ya tiene los parámetros desde #396; `tipoGastoFilter` los recibe; sus
    suscriptores del POS van a 5c) y, en el `catchError` y ante `null`, aviso + flag de error en vez de «no hay
    datos».
  - `obtenerModulos` (`modulo-gasto.service`, 3 llamadores: `list-tipo-gastos:47`, `solicitud-gasto-simple-dialog:99`,
    `adicionar-tipo-gasto-dialog:85`): la caché guarda el **Observable** armado con la configuración del primer
    llamador, y hoy un error GraphQL se convierte en `[]` y queda cacheado toda la sesión. Cambio: la caché guarda
    el **valor** (`of(cache)` si existe; si no, consulta y guarda solo una respuesta no nula); propaga con
    `error:` en los tres llamadores (los diálogos avisan y siguen sin catálogo). En `list-tipo-gastos`,
    `catalogoModulos$` entra al `combineLatest` por fuera del `switchMap`: lleva su propio `catchError(of([]))`
    con aviso, para que la lista de tipos siga viva sin catálogo.
  - `preGastoImprimir` (`adicionar-pre-gasto:319/330`, clic mudo) → opt-in + aviso.
- `ventaCredito.onImprimirVentaCredito` (`list-venta-credito:433`, clic mudo) → opt-in + aviso.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `isRefreshing` en `finalize`; conteo conservado ante fallo | `notificaciones-tablero.service` | refresco, badge |
| accesos cargados (ACL) | `gestionar-accesos-caja-dialog` | botón otorgar |
| `pendiente` (disparo recibido mientras refresca) | `notificaciones-tablero.service` | al bajar `isRefreshing` |
| caché de módulos por valor | `modulo-gasto.service.obtenerModulos` | sus 3 llamadores |
| `errorConf?`/`contexto?` opcionales en `obtenerComentarios`, `tipoGastoFilter`, `preGastoImprimir`, `onImprimirVentaCredito` | llamadas de este PR | `onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(notificaciones): no dejar muerto el refresco del tablero ni los comentarios sin servidor` | 1, 2 |
| 2 | `fix(financiero): avisar cuando no cargan las listas de caja, bancos y operaciones` | 3, 4, 5 |
| 3 | `fix(financiero): avisar cuando no cargan maletin, casos de retiro y gastos del central` | 6 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final.

## Prueba de runtime

Central local `:8081` (rama local de pruebas, sin perfil y con la replicación apagada, verificada en *Negative
matches*), congelado con `kill -STOP` y un solo respaldo `kill -CONT`. Casos: tablero de notificaciones
(refresco repetido con el central normal — antes solo el primero —, y con el central congelado: el siguiente
refresco vuelve a andar al descongelar), lista de cajas, historial, accesos, cuentas bancarias, bancos,
operaciones financieras, entradas varias, maletín, casos de retiro, tipos de gasto y pre-gastos.

## Riesgos y qué queda sin verificar

- Quitar `distinctUntilChanged` hace que **cada** disparo refresque (con `debounceTime(500)`): más consultas que
  hoy, que es lo que el código pretendía.
- Sin `distinctUntilChanged`, cambiar de columna una notificación refresca el tablero dos veces (el board ya
  recarga solo y el trigger hace `refrescarTodas` a los 500 ms): sin bucle, puede parpadear tras un drag.
- Los casos `null` (error GraphQL) se verifican por código.
- Las líneas de `pagar-compras-dialog` se revalidan tras el merge de #396.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `obtenerModulos`: la caché guarda el Observable del primer llamador; con opt-in en uno, los otros heredan una fuente que propaga sin `error:` | alta | caché por valor; `error:` en los 3 llamadores |
| A | `list-tipo-gastos`: el catálogo entra al `combineLatest` fuera del `switchMap`; si propaga, mata la lista | alta | `catchError` propio del catálogo, la lista sigue viva |
| A | Accesos de caja: «Agregar» es un upsert siempre visible; con la ACL sin cargar pisa `puedeEscribir`; «Nadie más tiene acceso» tras un fallo | alta | `accesosCargados` gatea agregar/toggle/revocar; error con «Reintentar» |
| A | Comentarios: los tres usos pasan por `cargarComentarios` (no se puede separar por llamador); `null` revienta y deja `cargando`; el servicio cachea `null` | media | opt-in en `cargarComentarios`, `error:` en `:103` y `:489`, `null` = error, sin cachear |
| A | `tipoGastoFilter`/`preGastoFilter`: `catchError` bien ubicado pero devuelve `null` → «no hay datos» | media | aviso + flag de error |
| A | `obtenerModulos` cachea `[]` (no `null`) tras un error GraphQL | media | texto corregido; no se cachea |
| B | Notificaciones: disparos que llegan mientras refresca se pierden (ahora la ventana puede ser ~20 s) | media | flag `pendiente`, un relanzamiento, sin bucle (verificado) |
| B | Sin `distinctUntilChanged`: refresco doble tras cambiar de columna | baja | aceptado, anotado |
| B | Conteo: `count || 0` borra el badge; el `catchError` devolvía 0 | baja | `count == null` conserva; `catchError` devuelve el último valor |
| A | `preGastoFilter` ya tiene los parámetros (#396) | baja | tabla corregida |
| A/B | Sin bucle de realimentación; `finalize` correcto; resto de suscriptores cubiertos; poll de comentarios sobrevive sin cambio | — | verificado |

## Ajustes durante la implementación

- `list-tipo-gastos` y `list-pre-gastos` no tienen leyenda de «no hay datos» en el template: alcanza el aviso (sin
  flag nuevo); el total del paginador vuelve a 0 si la consulta falla.

## Prueba de runtime (paso 9, 2026-10-03)

Central local `:8081` (rama local de pruebas = `develop` 70f1429d, sin perfil, replicación apagada y verificada en
*Negative matches*), congelado con `kill -STOP` y un respaldo `kill -CONT`. Desktop `ng serve -c web` a `:8081`.

| # | Caso | Resultado |
|---|---|---|
| 1 | Notificaciones, central normal: tres disparos del refresco separados 2,5 s | **3 refrescos** (antes solo el primero de la sesión) |
| 2 | Notificaciones, central congelado: disparo + otro durante el refresco | `isRefreshing` se libera a los ~21 s; el disparo pendiente se relanza una vez; el badge conserva su valor (no pasa a 0). Al descongelar el refresco sigue vivo y toma el conteo real |
| 3 | Accesos de caja, recarga congelado | mientras carga «Agregar» deshabilitado; al fallar «No se pudieron cargar los accesos» + «Reintentar» (no «Nadie más tiene acceso»); «Reintentar» con el central normal recupera |
| 4 | Lista de cajas, recarga congelado | aviso a los 60 s y sin spinner |
| 5 | Tipos de gasto abierto congelado con el catálogo sin cachear | avisos del catálogo (59 s) y de la lista (62 s), sin traba; al descongelar «Buscar» carga (la lista siguió viva); el servicio cachea el catálogo real (13 módulos): el fallo **no** quedó guardado |

**Verificado por código:** comentarios, bancos y cuentas, operaciones financieras, entradas varias, maletín, casos de
retiro, pre-gastos, impresiones; y los casos `null` (error GraphQL).

## Auditoría del diff (paso 8, 2026-10-03)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Suscriptores de todo lo que propaga en servicio; parámetros opcionales; estructura del código | — | verificado |
| Comentarios: si el comentario se guardaba y fallaba solo la recarga, se lo sacaba de pantalla como si no se hubiera enviado | media | `catchError` propio de la recarga: conserva el comentario y avisa «enviado, no se pudieron recargar» |
| Pre-gastos / tipos de gasto: el paginador conservaba el total anterior tras un fallo | baja | total a 0 |
| `obtenerModulos` ignora `servidor` con caché (los 3 llamadores usan `true`) | baja | sin cambio (igual que antes) |
| `list-tipo-gastos` queda sin etiquetas de módulo hasta reabrir si el catálogo falló | baja | aceptado (plan) |
