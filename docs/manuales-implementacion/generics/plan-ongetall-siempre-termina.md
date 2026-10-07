# Plan: `onGetAll` siempre termina (PR 14a)

Parte de #390. Repo: desktop. Sin cambios en el central.
Rama `fix/generico-ongetall-siempre-termina` desde `origin/develop`.

## 1. El problema [relevado sobre `origin/develop`]

`GenericCrudService.onGetAll` abre el modal «Buscando…» y, si la consulta falla, **no emite ni completa**:

| Falla | Hoy |
|---|---|
| Error GraphQL | avisa «Ups! Algo salió mal…» y queda sin terminar |
| Corte del link a los 60 s | el link avisa «El servidor no respondió a tiempo»; queda sin terminar |
| Central offline (corte a los 3 s) o servidor caído | **nadie avisa**; queda sin terminar |

Lo consumen unos 100 lugares (casi todos listas de monedas, formas de pago, cargos, roles, cajas, observaciones):

- **5 pantallas quedan colgadas a la vista**: configuración de RRHH (spinner eterno), lista de personas (deja de
  paginar), confirmar vale (botón «Confirmar» muerto, sin aviso), detalle de pago (overlay y botones bloqueados),
  alta de impresora («buscando dispositivos» eterno).
- **7 `forkJoin`** dependen de que termine: 3 ya se protegieron con un `timeout` de 65 s propio (análisis de
  diferencia, gestión de compras, nota de recepción); 4 no (detalle de pago, alta de funcionario, observación de
  venta, observación de caja, detalle de timbrado).
- **2 cadenas** no avanzan: en el diálogo de delivery no se piden los precios; en ventas con tarjeta de la caja no
  se cargan los datos.
- **~80 lugares** quedan con la lista vacía o vieja sin aviso (entre ellos la impresión de un ticket, que no sale).
- **13 lugares** ya tienen un `error:` o `catchError` que hoy es inalcanzable.

## 2. Cambio

### En el genérico
Ante cualquier falla, `onGetAll` **emite `null` y completa** (lo mismo que ya hace `onCustomQuery` ante un error
GraphQL). Avisos:
- error GraphQL: el «Ups!…» de hoy, sin cambios;
- corte del link (60 s): nada nuevo, el link ya avisó;
- central offline o servidor caído: **aviso nuevo** «No se pudo cargar: el servidor no responde.», uno solo aunque
  fallen varias consultas juntas (ventana de unos segundos, por texto).

Parámetro opcional `errorConf` (como en `onCustomQuery`): con `PROPAGAR_ERROR_DE_RED` el error de red llega al
`error:` de quien llama, sin aviso del genérico. Sin pasarlo, el comportamiento es el de arriba.

Por qué `null` y no «completar sin emitir» ni «error»:
- completar sin emitir no apaga ninguna bandera, deja los `forkJoin` sin resultado y **anula** los `timeout` de 65 s
  que hoy protegen tres pantallas;
- un error sin `error:` en ~80 suscriptores (y en constructores de servicios que cargan al arrancar) son errores no
  capturados;
- `null` es lo que ya chequean o toleran ~76 de los ~100 consumidores (`if (res != null)`, `res || []`).

### En los consumidores que no toleran `null` (mismo PR)
Los ~24 que hoy harían `null.length`, `null.find`, `null[0]` o guardarían `null` en una lista que después se
recorre. Se endurecen para que con `null` quede lo que hay hoy (lista vacía o la anterior):
- PDV: `pago-touch` (formas de pago y monedas), `delivery-dialog` (monedas, formas de pago), y
  `forma-pago.service` (su constructor guarda la lista que usa `venta-touch` al cobrar);
- `list-persona`, `list-pre-registro-funcionario`, `main-venta-observacion`, `main-caja-observacion`,
  `venta-observacion.service`, `caja-observacion.service`, `list-venta`, `generic-list-venta`,
  `pago-detalle-dialog`, `list-actualizacion`.

### Lo que se arregla solo con el cambio del genérico (se verifica, no se toca)
Las 5 pantallas colgadas, los 4 `forkJoin` sin protección, las 2 cadenas, y los 3 `timeout` de 65 s (que pasan a
reaccionar al instante: ya tratan `null` como falla).

## 3. Lo que no cambia
- `onCustomQuery`, `onGetById`, `onGetByTexto`, `onSave` (PRs aparte; #390 pide no cambiar el default de
  `onCustomQuery`).
- Los `error:` inalcanzables de los 13 lugares: siguen sin ejecutarse (ahora reciben `null`); migrarlos a
  `PROPAGAR_ERROR_DE_RED` se hace por módulo, no acá.
- Mejorar el mensaje de cada pantalla ante la falla (p. ej. «sin cajas» en confirmar vale cuando en realidad no se
  pudo leer): por módulo.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(pdv): tolerar que no lleguen las monedas o las formas de pago` (consumidores del PDV; sin efecto mientras el genérico no emita `null`) |
| 2 | `fix: tolerar listas que no llegaron en personas, observaciones, ventas y pagos` (resto de los consumidores) |
| 3 | `fix: terminar onGetAll ante un error en vez de dejar esperando a quien llama` (genérico + `errorConf`) |

Los consumidores van primero para que ningún commit intermedio rompa. `npm run check` antes de cada push.

## Prueba de runtime

Central local (replicación apagada), filial local `:8080`, desktop en el navegador.
1. Con el central congelado o apagado: configuración de RRHH, lista de personas, confirmar vale, detalle de pago y
   alta de impresora ya no quedan colgados; sale un solo aviso.
2. PDV (servidor local): abrir venta touch y el cobro con la lectura de monedas / formas de pago fallando (central y
   filial): no rompe, se puede seguir; delivery pide los precios.
3. Arranque del desktop con el central apagado: un solo aviso, sin errores en consola.
4. `forkJoin`: alta de funcionario, observación de venta y de caja, detalle de timbrado, gestión de compras
   (reacciona al instante con «Reintentar»).
5. Error GraphQL real (consulta rechazada): aviso «Ups!» y la pantalla sigue.
6. Todo normal con los servidores arriba: las mismas pantallas cargan como antes.

## Riesgos
- Es un cambio de comportamiento para ~100 consumidores. Mitigación: se endurecen antes los que no toleran `null`,
  y la prueba recorre el PDV, que es lo más sensible.
- **Aviso nuevo en pantallas que hoy fallan en silencio** (central offline): en #355 se decidió no hacerlo para
  `onCustomQuery`. Acá se propone sí avisar, porque `onGetAll` ya muestra un modal «Buscando…» (el usuario está
  esperando) y sin aviso la pantalla diría algo falso («sin cajas»). Alternativa: no avisar y solo terminar.
  **A decidir por Franco.**

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **Tres `forkJoin` no se arreglan solos**: en detalle de pago, alta de funcionario y detalle de timbrado la otra
  pata (sucursales) usa `onCustomQuery` sin propagar el error de red, que tampoco termina. → esas tres patas pasan a
  propagar el error y a resolverse con `null` (mismo patrón que ya usan análisis de diferencia y gestión de
  compras); alta de funcionario además tolera sucursales `null` (hoy ya rompe ante un error GraphQL).
- **No hay ningún `onGetAll` en el arranque de la app** ni en un poll: todas las llamadas son por acción del
  usuario. El caso «arranque con el central apagado» se saca de la prueba.
- `list-venta` y `generic-list-venta` no rompen con `null` (solo `*ngFor`): salen del alcance. Los servicios de
  observaciones ya filtran `null` al cachear.
- El genérico tiene otras dos formas de no terminar: que la consulta complete sin emitir, y una excepción dentro de
  su propio `next` (p. ej. `errors: []`, o `data` nulo sin errores). → se cubren las dos (emiten `null`).

### Consumidores: lo que hay que hacer bien, no solo «tolerar»
- **Delivery**: toda la cadena (precios de delivery) cuelga del `next` de monedas. Con `null` se sigue con lista
  vacía y se piden los precios igual.
- **Lista de personas y de pre-registros**: al pedir más, la página ya se incrementó. Con `null` se vuelve la página
  atrás y **no** se marca «última página» (tratarlo como lista vacía cortaría la paginación para siempre).
- **Impresión de ticket**: con `null` hoy diría «No hay impresora de ticket configurada», que es falso. → mensaje
  propio «No se pudieron leer las impresoras: el ticket no se imprimió».
- **Confirmar vale** y **configuración de RRHH**: dejan de colgarse, pero muestran «sin cajas» / panel en blanco.
  → un cartel «No se pudo cargar» en esas dos (son las pantallas que el PR dice arreglar).

### Avisos
- **Doble aviso** en análisis de diferencia, gestión de compras y nota de recepción (tienen aviso propio y hoy lo
  muestran recién a los 65 s). → `monedaService.onGetAll` y `formaPagoService.onGetAllFormaPago` reenvían el
  `errorConf`, y esas tres pantallas piden «sin aviso del genérico»: queda solo el suyo, y al instante.
- **Texto del aviso nuevo**: «el servidor no responde» sería falso ante un HTTP 401 / 500. → se usa el texto que
  ya da `mensajeErrorTransporte` («Error de red» / «El servidor rechazó la operación (HTTP N)»), como `onSaveCustom`.
- Deduplicado por texto con ventana de 5 s (el mecanismo actual del genérico es por mutation: se hace uno propio).
- Ya existen otros avisos de desconexión (indicador del header, «PROBLEMAS DE CONEXIÓN…» a los 5 reintentos): el
  nuevo puede sumarse a esos. Y con el central recién arrancando (websocket sin confirmar) una consulta que tarde
  más de 3 s daría el aviso aunque el central esté sano.
- **El aviso nuevo va en su propio commit**, el último, para poder sacarlo sin tocar el resto. Sigue siendo
  decisión de Franco.

### Test
Se agregan casos de `onGetAll` al spec del genérico (red, GraphQL, completar sin emitir, `errorConf`). Karma hoy no
corre en el repo (`src/test.ts`): se deja escrito y compilando, y se dice.

## Fases (reemplaza la tabla de arriba)

| Fase | Commit |
|---|---|
| 1 | `fix(pdv): tolerar que no lleguen las monedas o las formas de pago` (pago-touch, delivery, forma-pago.service, impresión de ticket) |
| 2 | `fix: tolerar listas que no llegaron en personas, observaciones y pagos` (+ las tres patas de sucursales, carteles de confirmar vale y configuración de RRHH) |
| 3 | `fix: terminar onGetAll ante un error en vez de dejar esperando a quien llama` (genérico, `errorConf`, wrappers de monedas y formas de pago, las tres pantallas con aviso propio; comentarios viejos) |
| 4 | `fix: avisar cuando onGetAll no pudo leer por un error de red` (solo el aviso; opcional) |

Un solo PR: las fases 1 y 2 no cambian nada por sí solas, pero separadas en otro PR no se pueden probar.

## Prueba de runtime (reemplaza la lista de arriba)
1. Central apagado: configuración de RRHH y confirmar vale (cartel), lista de personas (pedir más, volver el
   central, pedir más: no salta página), alta de impresora, detalle de pago, alta de funcionario, detalle de
   timbrado, observación de venta y de caja. Ninguna colgada; ningún «Buscando…» abierto.
2. Gestión de compras, análisis de diferencia y nota de recepción con el central apagado: **un** aviso, al instante.
3. PDV con servidor local: monedas / formas de pago fallando → venta touch y cobro no rompen; delivery pide precios;
   impresión de ticket con el central caído → mensaje propio.
4. Error GraphQL real, HTTP 401 / 500 simulado, cuerpo vacío: texto del aviso y que termine.
5. Varias consultas fallando juntas (un diálogo con monedas + formas de pago): un solo aviso.
6. Todo normal con los servidores arriba: las mismas pantallas cargan como antes.

No se va a poder probar: el central «lento pero sano» al arrancar.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Tres `forkJoin` siguen colgados por la pata de sucursales (`onCustomQuery`) | alta | esas patas entran en la fase 2 |
| A | Doble aviso en las tres pantallas que ya avisan | alta | piden «sin aviso del genérico» |
| A | Delivery, paginación de personas e impresión de ticket: «tolerar null» a secas dejaba igual o peor | alta/media | tratamiento propio en cada una |
| A | Texto falso ante HTTP 4xx / 5xx; el dedupe existente no sirve | media | `mensajeErrorTransporte`; dedupe por texto |
| A | El genérico puede no terminar por completar sin emitir o por una excepción propia | media | cubierto |
| A | No hay `onGetAll` en el arranque ni en polls | media | prueba corregida |
| B | El aviso nuevo es discutible (#355, otros avisos de desconexión) | media | commit aparte, decisión de Franco |
| B | Confirmar vale y configuración de RRHH quedaban con un mensaje falso o en blanco | media | cartel |
| B | Tamaño del PR | media | un PR, cuatro fases; `list-venta` fuera |
| B | `null` y no `[]`; orden de fases | — | confirmado |

## Implementación: desvíos

- **Tres de los diálogos del relevamiento no tienen quién los abra** (código muerto): el diálogo de delivery viejo
  (`delivery-dialog`; el flujo real usa `edit-delivery-dialog`), el alta de funcionario (`adicionar-funcionario-dialog`;
  el alta vive en el legajo) y el detalle de pago (`pago-detalle-dialog`, solo lo abre `edit-pago`, que nadie abre).
  Los cambios ahí quedan, son inocuos, pero no se pudieron probar. De las «5 pantallas colgadas» del plan, las
  alcanzables son 4 (el detalle de pago no).
- Un error GraphQL **no emite datos parciales**: `null` aunque haya venido algo (el plan decía «como onCustomQuery»,
  que emite lo parcial; una lista a medias pasaría por completa).
- Los `timeout` de 65 s de análisis de diferencia, gestión de compras y nota de recepción quedaron: ya no se
  disparan (el genérico termina antes), no estorban.
- El aviso de red del genérico es de color de advertencia, 4 s, con ventana de 5 s por texto.
- Los tests del genérico (`generic-crud.on-get-all.spec.ts`) compilan pero no se ejecutaron: Karma no corre en el
  repo (`require.context` en `src/test.ts`).

## Prueba de runtime (paso 9, 2026-10-06)

Central local `:8081` (replicación apagada, schedulers en «Negative matches»), filial local `:8080`, desktop con
`ng serve -c web`. Fallas inyectadas en el navegador por consulta (red, HTTP 404, rechazo GraphQL) y una pasada con
el central local realmente apagado.

| Caso | Resultado |
|---|---|
| Configuración de RRHH sin red / central apagado | cartel «No se pudo cargar la configuración», un aviso, sin spinner |
| Lista de personas: pedir más con falla y después bien | no avanza de página ni marca última página; el reintento trae la página que faltaba |
| Confirmar vale sin red | cartel «No se pudieron cargar las cajas», un aviso |
| Detalle de timbrado sin red / normal | abre con listas vacías, un aviso / 20 sucursales y 26 puntos de venta |
| Alta de impresora: buscar dispositivos y colas sin red / normal | deja de buscar, un aviso / 10 dispositivos |
| Observaciones de venta: red, HTTP 404, rechazo GraphQL | sin errores; «Error de red» / «El servidor rechazó la operación (HTTP 404)» / «Ups!…» (uno por consulta, como antes) |
| Análisis de diferencia y gestión de compras sin red | solo su aviso propio, al instante |
| PDV (filial local): abrir venta y cobro con monedas y formas de pago fallando | sin errores, un aviso; el delivery avisa que no se puede cobrar ni guardar (guarda que ya existía) |
| PDV normal | 5 formas de pago, 4 monedas, EFECTIVO seleccionado |

No probado: impresión de ticket (solo Electron), nota de recepción, los tres diálogos sin llamador, el corte del
link a los 60 s, el central «lento pero sano» al arrancar, y los arreglos posteriores a la auditoría del diff
(compilan; son guardas de una línea).

## Auditoría del diff (paso 8, 2026-10-06)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| El diálogo de delivery pisaba con `null` las cotizaciones que le pasa venta-touch | media | se conservan; precios de delivery tolera `null` |
| Listas de actualizaciones y de pre-registros se vaciaban si fallaba un refresco | baja/media | queda lo que había |
| Servicios de observaciones publicaban `null` tras guardar si la relectura fallaba | baja | no publican |
| Nota de recepción: ante un rechazo GraphQL faltaba su guía | baja | aviso propio |
| El aviso de red podía salir después de haber terminado | baja | guarda |
| Cartel de configuración de RRHH sin color de aviso; faltaba test de `graphError.propagate` | baja | agregados |
| Consumidores restantes, `forkJoin`, forma del error propagado, reglas del HTML, spec | — | verificado, sin hallazgos |
| Tres «Ups!» iguales ante un rechazo en una pantalla que pide tres listas | — | ya pasaba; no se toca |
