# Plan: anulaciones que el central ya rechaza si se repiten (PR 13f)

Parte de #390, último PR del bloque financiero. Repo: desktop. Sin cambios en el central.
Rama `fix/financiero-anulaciones-releer-tras-un-error` desde `origin/develop`.

## 1. El problema [verificado leyendo]

Estas acciones no duplican plata si se repiten (el central rechaza la segunda: «ya está anulado» y similares), pero
ante un error **no releen**: la pantalla queda con la fila «activa» aunque la anulación se haya aplicado, y un
segundo intento da un rechazo que no se entiende. En varias, además, lo que cambió no llega a quien abrió la pantalla.

| Dónde | Acción | Hoy ante un error |
|---|---|---|
| `movimiento-bancario-anulacion.service` (usado por la fila de banco del dashboard de la caja y por `list-movimientos-bancarios-dialog`) | anular el pago o la operación de un movimiento bancario | devuelve `false` igual que si el usuario hubiera vuelto atrás: nadie relee. Si el servidor no confirma, dice «No se pudo anular» aunque pudo haberse anulado |
| `list-entradas-varias-dialog` | anular una entrada / salida varia | `error: () => {}`: no relee |
| `list-operacion-financiera` | anular una operación financiera | `error: () => {}`: no relee; con resultado vacío no hace nada |
| `operacion-financiera-detalle-dialog` | anular la operación desde su detalle | queda el detalle como estaba, con «Anular» habilitado |
| `list-retiro-casos` | tomar / soltar un caso de retiro | `error: () => {}`: no relee |
| `detalle-caso-dialog` | resolver un caso (puede anular la verificación o registrar un reintegro) | queda abierto y reintentable [qué hace el central con la repetición: a verificar en la auditoría] |

Lo que no llega a quien abrió la pantalla:
- El dashboard de la caja abre `list-entradas-varias-dialog` **sin mirar su cierre**: anular una entrada ahí cambia el
  saldo de la caja, y el dashboard sigue mostrando el saldo y los movimientos de antes.
- `list-operacion-financiera` abre el detalle sin mirar su cierre: anular desde el detalle no refresca la lista.

## 2. Cambio

Regla: **con cualquier resultado que no sea «el usuario volvió atrás», se relee**. Si se anuló hay que mostrarlo; un
rechazo «ya está anulado» significa que la pantalla estaba vieja; sin respuesta es la única forma de saber.

- **`movimiento-bancario-anulacion.service`**: en vez de `true / false` devuelve qué pasó: anulado, cancelado por el
  usuario, rechazado o sin confirmar. Sus dos llamadores releen salvo en «cancelado». Sin respuesta (o sin
  confirmación del servidor): «No se pudo confirmar la anulación: se vuelve a leer para verificarla» en lugar de «No
  se pudo anular». El test del servicio se actualiza.
- **Entradas varias**: relee ante cualquier error y ante un resultado vacío (con aviso de «no se pudo confirmar»);
  el diálogo recuerda si hubo cambios y, al cerrarse, el dashboard de la caja relee.
- **Operación financiera (lista y detalle)**: la lista relee ante cualquier error; el detalle vuelve a leer la
  operación (queda «anulada» si se aplicó) y cierra avisando a quien lo abrió que relea; la lista relee al cerrar el
  detalle.
- **Casos de retiro**: tomar / soltar releen ante cualquier error. Resolver: según lo que confirme la auditoría
  sobre el central (si repetir se rechaza: aviso y cierre con relectura; si no, cierre obligado como en el 13c).
- Avisos: uno por flujo. Donde el genérico ya avisó (rechazo, red, respuesta vacía por `onSaveCustom`) no se suma;
  se avisa solo lo que nadie dijo (resultado vacío, y la anulación de un pago, que va por Apollo directo).

## 3. Lo que no cambia
- El central.
- La anulación desde la tabla de caja del dashboard (13a), cheques (13e).
- Notas de crédito y de remisión (`onAnular` sin manejo de error): son de facturación, no de este bloque; anotado.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): releer tras anular un movimiento bancario aunque falle` (servicio de anulación bancaria + sus dos llamadores) |
| 2 | `fix(financiero): releer tras anular una entrada varia o una operacion financiera aunque falle` (y avisar a quien abrió) |
| 3 | `fix(financiero): releer los casos de retiro tras un error` |

`npm run check` antes de cada push.

## Prueba de runtime

Central local (replicación apagada), caja y cuenta bancaria locales.
1. Entrada varia: crear una, anularla **por fuera** (mutation directa) y después desde la lista → rechazo «ya está
   anulada» y relectura; anular otra con la respuesta perdida → se relee y figura anulada; al cerrar la lista, el
   dashboard muestra el saldo nuevo.
2. Operación financiera (depósito de caja a banco): lo mismo desde la lista y desde el detalle.
3. Fila de banco del dashboard y `list-movimientos-bancarios-dialog`: anular la operación con la respuesta perdida →
   aviso «no se pudo confirmar» y relectura; cancelar el motivo → no relee.
4. Casos de retiro: con el servicio reemplazado (la base local puede no tener casos).

Lo creado se anula o compensa al terminar.

## Riesgos
- Cambiar el tipo de retorno del servicio de anulación bancaria: tiene dos llamadores y un test.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **Desde la lista de operaciones el detalle es solo lectura**: el botón «Anular» del detalle solo aparece cuando lo
  abre el dashboard de la caja (que ya relee al cerrarse). «Anular desde el detalle no refresca la lista» no puede
  pasar: se saca del plan.
- `list-entradas-varias-dialog` no tiene referencia a su propio diálogo ni botón de cierre (se cierra con Esc o
  clic afuera). El dashboard lo abre en dos lugares, sin mirar el cierre: confirmado.
- **Resolver un caso de retiro repetido no mueve plata dos veces**: el central responde «El caso ya está resuelto».
  Pero no es atómico: guarda el caso como resuelto y **después** anula la verificación; si esa anulación falla, el
  caso queda resuelto con la verificación vigente, y la respuesta es un error. Tomar y soltar un caso son inocuos.
- Anular una entrada varia o una operación financiera: repetidas en secuencia se rechazan, pero el central no
  bloquea el documento: dos anulaciones **simultáneas** podrían revertir la caja dos veces (no probado). Refuerza la
  regla: tras un «sin respuesta», releer antes de ofrecer otra vez la acción.
- `npm run check` **no compila los tests**: el test del servicio de anulación bancaria hay que correrlo aparte.

### Diseño corregido
- **Servicio de anulación bancaria**: sigue devolviendo verdadero / falso, pero con el significado «hay que releer»
  (verdadero salvo que el usuario haya vuelto atrás). Más simple que cuatro valores; sus dos llamadores no cambian de
  forma. El aviso sin respuesta pasa a «No se pudo confirmar la anulación: se vuelve a leer para verificarla».
- **Entradas varias**: el dashboard lee del diálogo si hubo cambios al cerrarse (mismo patrón que ya usa la pantalla
  de cuentas bancarias), desde un único método para sus dos aperturas. «Hubo cambios» se marca **antes** de mandar
  la anulación: si el diálogo se cierra a mitad de camino, igual se relee.
- **Detalle de operación**: tras cualquier resultado relee la operación dentro del detalle (queda «anulada» si se
  aplicó), no se puede cerrar mientras anula, y al cerrar avisa a quien lo abrió si hubo un intento.
- **Resolver un caso**:
  - sin respuesta → aviso y cierre con relectura;
  - rechazo → queda abierto, **salvo** que se haya pedido anular la verificación: ahí el caso pudo quedar guardado
    aunque llegue un error, así que también se cierra y relee;
  - cerrar después de cualquier intento hace releer la lista de casos.
- Avisos: en los flujos por `onSaveCustom` (operación, entrada varia, casos) el genérico ya avisa el rechazo, el
  error de red y la respuesta vacía, y el link el corte: ahí solo se relee. Aviso propio solo donde nadie avisó:
  resultado vacío, y la anulación de un pago (Apollo directo) sin respuesta.

### Fuera de este PR (anotado)
- Cancelar un retiro y cancelar un gasto son **interruptores** en el central (repetir los invierte): no se les aplica
  esta regla a ciegas. Notas de crédito y de remisión: sin manejo de error al anular.
- `verificar-retiro-dialog` sin respuesta queda abierto; repetir se rechaza («ya fue verificado»).

### Para el central (anotado)
Resolver un caso no es atómico; tomar un caso no valida que no esté resuelto ni que sea de otro; anular entrada varia
y operación financiera sin bloqueo del documento, y `revertir` sin verificar que el movimiento siga activo.

## Fases (sin cambios en los commits; se agrega)
- Fase 1: correr el test del servicio de anulación bancaria (`ng test` solo de ese archivo), aparte de `npm run check`.

## Prueba de runtime (corrige el caso 2)
La anulación desde el detalle de una operación se prueba entrando por «Ver operación» en la fila de caja del
dashboard, no por la lista.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Desde la lista de operaciones el detalle no permite anular | alta | se saca esa parte |
| A | El diálogo de entradas varias no tiene referencia propia; cerrar a mitad de una anulación pierde la respuesta | alta | «hubo cambios» antes de enviar; el dashboard lo lee al cerrar |
| A | `npm run check` no compila los tests | alta | el test se corre aparte |
| A | Resolver un caso no duplica, pero no es atómico en el central | media | cierre con relectura también ante un rechazo si se pidió anular la verificación |
| B | Cuatro valores de retorno eran de más | media | verdadero / falso = «hay que releer» |
| B | Detalle de operación: releer adentro y avisar al cerrar | media | definido |
| A | Anulaciones sin bloqueo del documento en el central; cancelar retiro / gasto son interruptores | media | anotado |
| A | Qué hace hoy cada acción y qué responde el central al repetirla | — | verificado |

## Implementación: desvíos

- **El test del servicio de anulación bancaria no se pudo ejecutar.** El spec está actualizado al contrato nuevo y
  compila (`tsc -p src/tsconfig.spec.json`), pero Karma falla antes de correr cualquier test
  (`__webpack_require__(...).context is not a function` en `src/test.ts:18`), igual que en `develop`. Arreglar la
  infraestructura de tests queda fuera de este PR.
- **Resolver un caso sin respuesta suma un aviso propio** al cerrar («No se pudo confirmar si el caso quedó
  resuelto…»): el plan decía «solo se relee», pero cerrar un diálogo con texto escrito sin decir por qué confunde.
  En el corte del link no se suma.
- **Detalle de operación y detalle de caso: después de un intento, Esc y el clic afuera quedan deshabilitados** y
  se sale por «Cerrar», que es lo que hace releer a quien abrió.
- Si la relectura dentro del detalle de operación falla o no trae dato, el detalle se cierra y el dashboard relee.
- Tomar y soltar un caso releen también con resultado vacío.

## Prueba de runtime (paso 9, 2026-10-06)

Central local `:8081` (worktree de pruebas adelantado a `develop`; replicación apagada, los dos schedulers en
«Negative matches»; sin migraciones nuevas), desktop con `ng serve -c web`, caja «RRHH» y cuenta «000-REPORTE».

| Caso | Resultado |
|---|---|
| Entrada varia anulada por fuera, después desde la lista vieja | rechazo «ya está anulada», lista releída |
| Entrada varia, la anulación llega y se pierde la respuesta | lista releída, figura anulada |
| Cerrar la lista de entradas varias tras un intento (botón y menú de la fila) / sin intento | el dashboard relee / no relee |
| Operación financiera desde la lista: rechazo por lista vieja y respuesta perdida | relee en los dos |
| Detalle de operación (desde la fila de caja): rechazo y respuesta perdida | queda abierto mostrando «Anulada», sin «Anular»; al cerrar, el dashboard relee |
| Detalle: la relectura falla o no trae dato | se cierra y el dashboard relee |
| Fila de banco del dashboard: cancelar el motivo / respuesta perdida | no relee / relee |
| Movimientos de la cuenta bancaria: cancelar / rechazo por lista vieja | no marca cambios / relee y la lista de cuentas relee al cerrar; no se cierra mientras anula |
| Anulación de un pago (servicio reemplazado): sin red / rechazo | «No se pudo confirmar la anulación…» / mensaje del servidor; relee |
| Casos de retiro (servicio reemplazado; la base local no tiene casos): tomar y soltar con error | releen |
| Resolver: rechazo / sin red / resultado vacío / rechazo con anulación de verificación pedida / éxito | queda abierto y al cerrar relee / los otros cierran con aviso y relectura / cierra y relee |

No probado: el corte del link (60 s) y el de «central offline» sobre estas acciones; casos de retiro reales.
Lo creado (entradas varias 3 y 4, operaciones 4 a 10) quedó anulado; la caja volvió a 8.300.000.

## Auditoría del diff (paso 8, 2026-10-06)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Detalle de operación: si la relectura no trae dato, «Anular» vuelve a quedar ofrecido sobre el estado viejo | media | se cierra con relectura, como ante el error; reprobado |
| Resolver con anulación de verificación pedida: un rechazo común también cierra y se pierde lo escrito | media | se deja: el desktop no puede distinguir ese rechazo del fallo parcial del central; anotado |
| Tras un intento, Esc y clic afuera quedan deshabilitados en los dos detalles | baja | intencional: «Cerrar» es lo que hace releer |
| Otros llamadores, caché de la relectura (`no-cache`), reglas del HTML, coherencia del spec | — | verificado, sin hallazgos |
