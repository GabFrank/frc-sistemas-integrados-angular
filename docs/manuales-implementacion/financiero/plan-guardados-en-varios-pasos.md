# Plan: guardados en varios pasos y lotes que no se pueden repetir a ciegas (PR 14c)

Parte de #390. Repo: desktop. Sin cambios en el central.
Rama `fix/guardados-en-pasos-y-lotes-sin-respuesta`, **apilada sobre la del #435** (todavía no está en `develop`):
necesita que `onSave` propague el error de red.

## 1. El problema [verificado leyendo]

Cinco flujos que con el #435 dejan de colgarse, pero que ante un error (ya hoy ante un rechazo) quedan en un estado
que invita a repetir y duplicar, o dejan datos a medias.

### a. Alta de funcionario desde un pre-registro (`funcionario-wizard`)
Guarda en cadena persona → usuario → funcionario → pre-registro verificado, cada guardado dentro del éxito del
anterior, **sin manejo de error**. Si un paso falla:
- lo creado antes queda huérfano (una persona marcada como funcionario sin funcionario; un usuario sin funcionario);
- al reintentar, las guardas del principio lo frenan: «Ya existe un usuario con ese nickname» o «La persona ya
  existe…». El usuario queda sin camino: no puede terminar el alta desde ahí.
- La «compensación» que tiene (borrar usuario y persona) solo corre si el guardado devuelve vacío sin error, que
  en la práctica no ocurre.
- Aparte: **el sueldo se guarda con el valor de la sucursal** (`funcionario.sueldo = this.sucursalFuncionario.value`);
  el control `sueldoFuncionario` existe y es obligatorio, pero no se usa.

### b. Abrir caja (`adicionar-caja-dialog`)
Al elegir el maletín manda a crear la caja y avanza al paso de apertura sin esperar. Si el guardado queda sin
respuesta, la caja pudo haberse abierto; con el #435 se vuelve al paso del maletín, y elegirlo de nuevo crea
**otra caja**.

### c. Gasto de caja (`adicionar-gasto-dialog`)
Tras un «sin respuesta» el formulario queda cargado y «Guardar» habilitado (el #435 relee la lista, pero no espera
a verla): un segundo clic crea otro gasto y otro ticket.

### d. Asignar hoja de ruta a varias transferencias (`list-transferencia`)
Guarda una por una. Si el servidor deja de responder, sigue intentando con todas las demás (cada una espera su
corte) y al final dice «No se pudo asignar a: …», cuando pudieron haberse asignado.

### e. Agregar impresoras desde una sucursal (`agregar-desde-sucursal-dialog`)
Igual: sigue con las demás, dice «Error al guardar X» y cierra el diálogo aunque no haya quedado claro qué se guardó.

## 2. Cambio

### a. Alta de funcionario: se puede **reanudar**
- La cadena deja de estar anidada: persona → usuario → funcionario → pre-registro, en serie, con un solo manejo de
  error. Se recuerda lo que ya se creó en esta sesión del diálogo.
- Ante un error se frena y se dice qué quedó: «Se creó la persona y el usuario; falta el funcionario. Volvé a
  guardar para completar el alta.» (o «no se pudo confirmar si se creó X» si fue sin respuesta).
- Al volver a guardar se **retoma desde lo que falta**: lo ya creado no se repite, y lo que quedó en duda se busca
  antes de crearlo (la persona por documento; el usuario y el funcionario por persona). Las guardas «ya existe»
  siguen valiendo para un primer intento, no para lo que creó este mismo diálogo.
- Mientras guarda, el diálogo no se cierra ni se puede volver a guardar.
- Se quita la compensación que borra usuario y persona: con la reanudación no hace falta, y borrar una persona
  automáticamente es más riesgoso que dejarla.
- **Sueldo**: se guarda el del control `sueldoFuncionario`. Commit aparte. [a confirmar por Franco]

### b. Abrir caja: se adopta la que ya quedó abierta
Ante un «sin respuesta», antes de volver al maletín se consulta si el usuario ya tiene una caja abierta. Si la
tiene, se toma esa y se sigue en la apertura; si no, se vuelve al maletín (como en el #435). Si la consulta también
falla, se vuelve al maletín con el aviso de revisar antes de abrir otra.

### c. Gasto de caja: no se puede repetir hasta ver la lista
Ante un «sin respuesta», «Guardar» queda deshabilitado mientras se relee la lista de gastos de la caja:
- si aparece un gasto nuevo igual al que se envió (responsable, montos y observación): se da por guardado, se avisa
  «El gasto ya figura (#N)» y se limpia el formulario;
- si no aparece: se rehabilita con «No figura en la lista: podés guardarlo de nuevo»;
- si la lista no se pudo leer: queda deshabilitado, con el aviso de cerrar y volver a abrir.

### d y e. Lotes: se cortan al primer «sin respuesta»
- Asignar ruta: al primer error que no sea un rechazo, no se intenta con las restantes. El resumen distingue:
  asignadas, rechazadas, **sin confirmar** y no intentadas. La lista se relee igual.
- Impresoras: lo mismo; y el diálogo **no se cierra** si hubo algo sin confirmar (queda la selección para revisar).

## 3. Lo que no cambia
- El central (ninguna de estas operaciones es idempotente, #376).
- Los ~50 consumidores de `onSave` sin manejo de error.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(personas): poder reanudar el alta de un funcionario que fallo a mitad de camino` |
| 2 | `fix(personas): guardar el sueldo del funcionario y no la sucursal` |
| 3 | `fix(financiero): adoptar la caja que quedo abierta en vez de abrir otra` |
| 4 | `fix(financiero): no repetir un gasto de caja hasta ver si ya figura` |
| 5 | `fix: cortar el lote al primer guardado sin respuesta al asignar ruta y agregar impresoras` |

`npm run check` y los specs existentes de lo tocado antes de cada push.

## Prueba de runtime

Central local (replicación apagada), filial local, desktop en el navegador, fallas inyectadas por operación.
1. Alta de funcionario desde un pre-registro de prueba: fallo (rechazo y sin respuesta, con la respuesta perdida de
   verdad) en cada uno de los cuatro pasos; reanudar y terminar; verificar en la base que queda **una** persona, un
   usuario y un funcionario. Alta normal de punta a punta. Sueldo guardado.
2. Abrir caja con la respuesta perdida (la caja sí se crea) → se adopta; sin que llegue → vuelve al maletín.
3. Gasto con la respuesta perdida (el gasto sí se crea) → «ya figura»; sin que llegue → se rehabilita.
4. Asignar ruta a tres transferencias con corte en la segunda; agregar tres impresoras con corte en la segunda.

Lo creado se borra o anula al terminar.

## Riesgos
- El alta de funcionario se reescribe (misma secuencia, otra estructura): es la parte con más riesgo de regresión.
- «Gasto igual al enviado» es una heurística: dos gastos idénticos seguidos a propósito se verían como uno ya
  guardado. Solo se aplica tras un «sin respuesta», y solo sobre gastos que no estaban en la lista antes.
- Abrir una caja real y guardar un gasto real en la prueba imprime en el filial local.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Premisas corregidas
- **Persona, usuario y funcionario no se pueden duplicar en el central**: hay unicidad por documento, por nickname,
  de un usuario por persona y de un funcionario por persona. Repetir un guardado da un rechazo (con mensaje técnico),
  no un duplicado. El problema del alta de funcionario es **quedar trabado**, no duplicar. Y la persona huérfana no
  figura «marcada como funcionario» (ese dato se calcula).
- `saveFuncionario` en el central crea además el **cliente** de la persona (y un usuario si no tiene), fuera de la
  transacción: puede responder con un rechazo habiendo guardado el funcionario. Al reanudar hay que mirar siempre el
  estado real, no solo tras un «sin respuesta».
- **Abrir caja: el filial ya rechaza una segunda caja abierta del mismo usuario** («Ya existe una caja abierta»).
  Elegir de nuevo el maletín no crea otra caja: deja al cajero trabado. Adoptar sirve para destrabarlo.
- **Asignar ruta es repetible sin riesgo** (actualiza la transferencia con la misma hoja). El motivo para cortar el
  lote es no esperar un corte por cada transferencia. Pero hoy **no se puede reintentar con la misma hoja**: el
  diálogo siempre crea una hoja nueva, y la primera queda huérfana.
- **Impresoras: no hay unicidad**; reenviar una cola ya guardada crea otra impresora igual.
- El gasto de caja guarda la observación en mayúsculas y recortada; el ticket se imprime dentro del guardado.

### Dato nuevo: el alta por pasos guarda mal sueldo **y sucursal**, desde 2022
- `funcionario.sueldo` recibe el id de la sucursal, y `funcionario.sucursal` recibe un número donde se espera un
  objeto, así que **la sucursal no viaja** (el funcionario y su cliente quedan sin sucursal).
- En la copia local de bodega: 114 funcionarios creados por este camino tienen el sueldo menor a 1000 (el id de una
  sucursal) y 86 no tienen sucursal. El último es del 2023-09-20 [la copia local puede ser vieja: a confirmar si
  esta pantalla se sigue usando].

### Diseño corregido

**Alta de funcionario** (PR aparte, ver «Partición»)
- La reanudación sale del **estado de la base**, no de la memoria del diálogo: persona por documento → usuario por
  persona → funcionario por persona, y se retoma desde lo que falte. Así también funciona al cerrar y reabrir.
- Reglas: el usuario existente de esa persona se reusa (aunque tenga otro nickname, con aviso); si la persona no
  tiene usuario y el nickname es de otro, se frena con mensaje claro; una persona que ya existía (p. ej. un cliente)
  se adopta **con confirmación** mostrando su nombre; documento normalizado como lo guarda el central; documento y
  nickname quedan bloqueados cuando algo ya se creó.
- Las lecturas de la reanudación pasan a distinguir «no existe» de «no se pudo consultar» (hoy una se cuelga y otra
  devuelve vacío ante un error, lo que se leería como «no existe»).
- «Cancelar» deshabilitado mientras guarda. Se quita la compensación que borra usuario y persona.
- El diálogo hoy rompe antes de guardar si las sucursales no cargan o si el nombre de sucursal del pre-registro no
  coincide: se maneja.
- Sueldo y sucursal: se guardan los correctos. Los datos ya cargados mal **no** se tocan en este PR.

**Abrir caja**: adoptar solo si la caja abierta del usuario es la de ese maletín, sin conteo de apertura y sin
cierre; si no, volver al maletín. También ante el rechazo «Ya existe una caja abierta». La consulta se hace con
corte propio (hoy no termina si falla).

**Gasto de caja**: «igual al enviado» = mismo responsable, tipo, montos y observación (normalizada), y que **no
estaba en la lista antes** de enviar. Si la lista no estaba cargada, o hay más de un candidato, no se adopta. Al
darlo por guardado se manda la notificación que hoy acompaña al guardado. Solo para altas (una edición es repetible).

**Asignar ruta**: al cortar, se conserva la hoja creada y quedan seleccionadas las transferencias pendientes; el
aviso nombra la hoja y ofrece reintentar **con la misma**.

**Impresoras**: al cortar, el diálogo queda abierto con las ya guardadas desmarcadas; al cerrarlo, la lista se relee
si algo se guardó o quedó en duda.

### Partición (reemplaza «Fases»)
- **PR 14c (este)**: caja, gasto y lotes.
  | Fase | Commit |
  |---|---|
  | 1 | `fix(financiero): adoptar la caja que quedo abierta en vez de dejar trabado al cajero` |
  | 2 | `fix(financiero): no repetir un gasto de caja hasta ver si ya figura` |
  | 3 | `fix(operaciones): reintentar la asignacion de ruta con la misma hoja` |
  | 4 | `fix(configuracion): cortar el alta de impresoras al primer guardado sin respuesta` |
- **PR 14d (después, si la pantalla se usa)**: alta de funcionario por pasos, con el arreglo de sueldo y sucursal en
  su propio commit.

## Prueba de runtime (reemplaza la de arriba, para este PR)
1. Abrir caja con la respuesta perdida (la caja sí se crea) → se adopta y sigue en la apertura; sin que llegue →
   vuelve al maletín; con otra caja vieja abierta de otro maletín → no se adopta.
2. Gasto con la respuesta perdida (el gasto sí se crea) → «ya figura (#N)», formulario limpio; sin que llegue → se
   rehabilita; lista sin leer → queda deshabilitado; observación en minúsculas.
3. Asignar ruta a tres transferencias con corte en la segunda → hoja conservada, reintento con la misma; rechazo en
   la segunda (no corta).
4. Tres impresoras con corte en la segunda → diálogo abierto, la primera desmarcada; cancelar relee la lista.

Abrir una caja y guardar un gasto reales imprime en el filial local; lo creado se anula al terminar.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Persona, usuario y funcionario no se duplican (unicidad): el problema es quedar trabado | alta | premisa corregida |
| A/B | Reanudar solo dentro del diálogo deja sin salida al cerrar y reabrir | alta | reanudación por estado de la base (14d) |
| A | Las lecturas de la reanudación se cuelgan o confunden error con «no existe» | alta | entran en el 14d |
| A | Además del sueldo, la sucursal tampoco se guarda; 114 y 86 casos en la copia local | alta | al 14d; datos a decidir |
| A | El filial ya rechaza una segunda caja abierta | media | adoptar con condiciones |
| A | Asignar ruta es repetible, pero no con la misma hoja | alta | se conserva la hoja |
| A | Impresoras sin unicidad; el diálogo siempre cierra | media | queda abierto, desmarca lo guardado |
| A | Gasto: observación en mayúsculas, notificación, línea base de ids | media | heurística endurecida |
| B | Tamaño | media | dos PRs |

## Decisiones de Franco (2026-10-06)
- Aprobado este PR con caja, gasto y lotes.
- El alta de funcionario desde un pre-registro ya no se usa: no se hace la reescritura (14d). Queda anotado, sin
  fecha, el arreglo de sueldo y sucursal de esa pantalla.
- Los funcionarios con sueldo y sucursal mal cargados ya están resueltos en producción: no se revisan.
