# Plan — errores de red en login, arranque, marcación y horarios (issue #390, PR 3)

Rama creada desde `79e07706` (merge de #393). Pieza: **desktop**. Rama: `fix/errores-de-red-en-login-y-marcacion`, desde `origin/develop` **después del merge
de #393**. Usa `PROPAGAR_ERROR_DE_RED`, `TIMEOUT_CONSULTA_MOSTRADOR_MS`, `TIMEOUT_CONSULTA_DE_FONDO_MS`,
`ContextoConsulta` (#391). Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`.

## Regla (la de #391–#393)

Todos los suscriptores con `error:` → propagar en el servicio; si no → opt-in. «Propagar» = solo `networkError`.

## 1. Login (`login.service.ts:161`)

Tras autenticar, a los 500 ms pide el usuario con `usuarioService.onGetUsuarioParaLogin` (`usuario.service:74`,
**único suscriptor**). Solo emite si `res?.id != null`: con el servidor sin responder (error de red, nunca
emite) o con un error GraphQL (`null`), el Observable del login **no emite nunca** y la pantalla de login
queda esperando.

Cambio:
- `onGetUsuarioParaLogin` propaga en el servicio, con `TIMEOUT_CONSULTA_DE_FONDO_MS` silenciado (puede ir al
  central si `!config.isLocal`);
- en `login.service`: `res?.id == null` y `error:` emiten `{ usuario: null, error:
  buildServerErrorResponse("No se pudo cargar el usuario: el servidor no responde. Intente nuevamente.") }`,
  el mismo camino que ya usa un error de conexión del login (`:241-245`). El componente lo muestra
  (`login.component.ts:80-110` lee `res.error?.error?.message`) y el botón no depende de un estado de carga;
- en ese error se **limpian** `token`, `usuarioId` y `token_central` (ya guardados en `:140-146` y por
  `autenticarEnCentral`): con `keepLogged` el próximo arranque entraba con un token sin sesión registrada
  (`registrarSesionActiva` no corrió). Reintentar el login funciona igual (sobrescribe).

## 2. Arranque (`main.service.getUsuario`, `:135-152`)

Con sesión guardada (`keepLogged`), el arranque pide el usuario con `usuarioService.onGetUsuario`. Sin
respuesta, `getUsuario()` no emite y `isAuthenticated` (`:107`) tampoco: la app queda sin decidir entre
entrar y mostrar el login.

`onGetUsuario` tiene otros suscriptores: `list-movimiento-stock:645` (**sin `error:`**) y `marcar-horario:248`
(`firstValueFrom` + `timeout` en `try/catch`) → **opt-in**: `errorConf?` y `contexto?` opcionales.

Ojo (auditoría): `isAuthenticated` (`main.service.ts:114-119`) **borra el token** cuando `getUsuario` da
`false` y no hay `keepLogged`. Un corte de red no puede contar como `false`: cerraría la sesión.

Cambio:
- `getUsuario()` pasa a emitir **tres estados**: `true` (usuario cargado), `false` (el servidor respondió y no
  hay usuario: lo de hoy) y `null` (no respondió: error de red o timeout de `TIMEOUT_CONSULTA_DE_FONDO_MS`), y
  completa;
- `isAuthenticated` con `null` emite `false` (el login queda visible, como hoy con el diálogo ya abierto por
  `initializeApp`) **sin borrar** `token`/`usuarioId`;
- sin aviso propio: el login ya está a la vista (no queda en blanco, corrección de la auditoría) y
  `verficarAuth` se repite en cada reconexión (`login.component.ts:53-57`), un aviso ahí se repetiría.

## 3. Marcación (`marcar-horario.component.ts:286-320`)

`verificarMarcacionActivaAsync` hace dos consultas con `firstValueFrom`. La primera ya tiene
`networkError.propagate` y `timeout(5000)`; la segunda, `consultarJornadaActualAsync` →
`marcacionService.onGetEstadoMarcacionUsuario` (`marcacion.service:126`, **único suscriptor**), no. Si la
primera responde y la segunda no, el `await` no vuelve: `cargando` (pasado al hijo como `[cargando]`) queda en
`true` y el botón de marcar bloqueado hasta 300 s; el `catch` (`:316`, que resetea a ENTRADA) es inalcanzable.

Ojo (auditoría, verificado): el `catch` (`:315-321`) y `aplicarEstadoMarcacion(null)` (error GraphQL,
`:327-335`) vuelven a ENTRADA y **pisan** lo que `procesarMarcaciones` ya dedujo de la primera consulta. Un
funcionario con la entrada abierta vería ENTRADA y no podría marcar la salida («No hay una entrada activa»,
`validarRegistro` ~`:518`); la doble entrada la rechaza el backend (`JornadaMarcacionRules.validarEntrada`).

Cambio:
- `onGetEstadoMarcacionUsuario` propaga en el servicio con `{ timeoutMs: 5000, silenciarAvisoTimeout: true }`;
- si la segunda consulta falla o devuelve `null`: **se conserva** lo deducido de la primera (no se resetea) y
  se avisa «No se pudo verificar la jornada actual: se usan las marcaciones de hoy.». `cargando` vuelve a
  `false` por el `finally` que ya existe.

## 4. Asignar horarios en lote (`list-funcioario.component.ts:204-255`)

Por cada usuario seleccionado consulta `horarioService.onGetHorariosPorUsuario` y cuenta los terminados para
avisar «Horarios asignados correctamente» y limpiar la selección. Sin respuesta, ese usuario nunca suma: el
aviso no sale y la selección queda, sin decir nada.

`onGetHorariosPorUsuario` tiene otro suscriptor sin `error:` (`asignar-horario-dialog:76`) → **opt-in**.

Además (auditoría): `onSaveHorario` (`:245`) no tiene `error:` y lee `res.id` sin chequear, y
`vincularMultiplesFuncionarios` lee `saved.horario` sin chequear (`onSaveFuncionario`): con un error o `null`
tiran TypeError, `onComplete` no corre y tampoco hay aviso. Y con `null` en la consulta, `(horariosExistentes
|| [])` crea un horario nuevo en cada reintento (duplicados).

Cambio: `list-funcioario` pasa `PROPAGAR_ERROR_DE_RED` + `TIMEOUT_CONSULTA_DE_FONDO_MS` a la consulta; **consulta
con error o `null`, guardado de horario con error o `null`, y vínculo de funcionario con error o `null`**
cuentan el usuario como terminado con falla (un `null` de la consulta ya no crea horario); al final, si hubo fallas: «Se asignaron horarios a X de N usuarios: el
servidor no respondió para el resto.». La selección se limpia, como hoy, solo si todos terminaron bien: así
se puede reintentar con los que fallaron.

Fuera de este PR: el resto de RRHH (PR 4), la lista de jornadas e impresión de marcaciones (B, sin traba).

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| opt-in `errorConf`/`contexto` en `onGetUsuario`, `onGetHorariosPorUsuario` | `main.service`, `list-funcioario` | `onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(login): no dejar el login esperando si no carga el usuario` | 1, 2 (sin borrar el token por un corte de red) |
| 2 | `fix(marcacion): no bloquear el boton de marcar sin respuesta del servidor` | 3 |
| 3 | `fix(rrhh): avisar los usuarios a los que no se pudo asignar horario` | 4 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final; prueba de runtime.

## Prueba de runtime

Filial `:8080` congelado (`kill -STOP` + respaldo). **El login lo hace Franco** (no se tipean contraseñas).

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal: recargar la app con sesión guardada | entra como hoy |
| 2 | Filial congelado: recargar la app con sesión guardada | a los ~20 s aviso y pantalla de login (no queda en blanco) |
| 3 | Login con el filial congelado justo después de autenticar | **No reproducible a mano** (500 ms entre la autenticación y la consulta del usuario): verificado por código |
| 4 | Marcación con entrada abierta: primera consulta OK y segunda bloqueada (DevTools → Network request blocking sobre la operación `getEstadoMarcacionUsuario`, si la extensión lo permite) | se ve SALIDA (no ENTRADA) y avisa «No se pudo verificar la jornada…». Si no se puede bloquear solo esa operación: verificado por código |
| 5 | Asignar horario a 2 funcionarios con el servidor sin responder | aviso «Se asignaron horarios a 0 de 2…». La consulta va al central (alpha compartido) → **no verificable** sin congelarlo: verificado por código |

## Riesgos y qué queda sin verificar

- **Arranque sin servidor**: la app va al login en vez de quedar en blanco; el usuario intenta entrar y el login
  también avisa. Con `keepLogged` el token se conserva y al volver el servidor la próxima recarga entra sola.
- La mayoría de los casos no se pueden reproducir a mano (ventanas de milisegundos o el central compartido):
  el PR depende más de la lectura de código que los anteriores.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Marcación: el `catch` y `aplicarEstadoMarcacion(null)` vuelven a ENTRADA y pisan la SALIDA deducida: con la entrada abierta, no se puede marcar la salida | alta | **verificado**; se conserva lo de la primera consulta y se avisa |
| B | Horarios: `onSaveHorario` y `onSaveFuncionario` sin `error:` ni chequeo de `null` cuelgan el lote; un `null` en la consulta duplica horarios | alta | cubierto: todo error o `null` cuenta como falla; `null` no crea horario |
| A | Arranque: con `false` `isAuthenticated` borra el token (sin `keepLogged`): un corte de red cerraba la sesión | media | tres estados; `null` no borra nada |
| B | Login: si falla la carga del usuario quedan `token`/`usuarioId`/`token_central` sin sesión registrada | media | se limpian en el error |
| A | Aviso del arranque repetido en cada reconexión; el login ya está visible (no «en blanco») | baja | sin aviso propio en el arranque |
| A | `contexto` va en 6.ª posición de `onCustomQuery` (5.ª es `silentLoad`) | — | anotado: pasar `undefined` en `silentLoad` |
| A | Firmas opcionales sin colisión; suscriptores únicos de lo que propaga en servicio | — | verificado |
