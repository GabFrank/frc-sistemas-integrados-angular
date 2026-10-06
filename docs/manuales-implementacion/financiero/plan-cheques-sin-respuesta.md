# Plan: cheques y chequeras sin respuesta (PR 13e)

Parte de #390, bloque financiero. Repo: desktop. Sin cambios en el central.
Rama `fix/financiero-cheques-sin-respuesta` desde `origin/develop`.

## 1. El problema [verificado leyendo]

### Emitir cheque (`emitir-cheque-dialog`)
`ChequeService.onEmitirManual` llama a la mutation por Apollo directo. Ante cualquier error el diálogo muestra el
mensaje y **queda abierto con los mismos datos y el botón habilitado**. Si el cheque se emitió y se perdió la
respuesta, reintentar **emite otro cheque** con el número siguiente (el central bloquea la chequera solo para no
repetir el número, no la emisión): un cheque al día debita el banco otra vez; uno diferido reserva saldo otra vez.

### Cobrar y anular cheque (`cheques-dashboard`)
Ante un error solo avisa: **no relee**, y la fila queda con sus botones como estaba aunque la operación se haya
aplicado. El central rechaza cobrar un cheque ya cobrado y anular uno cobrado, así que no hay duplicado; lo que hay
es una lista vieja y un segundo intento que da un rechazo sin explicación. Tampoco hay marca de «en curso».

### Guardar chequera (`edit-chequera-dialog`, y «desactivar» en `gestionar-chequeras-dialog`)
`ChequeraService.onSaveChequera` usa el `onSave` genérico sin propagar el error de red:
- **error de red o corte**: el genérico no emite nada → el diálogo queda con `isSaving` para siempre («Guardar»
  deshabilitado, sin aviso). Si el alta sí entró, cerrar y cargarla de nuevo crea **otra chequera** igual.
- **rechazo**: llega como arreglo, y el diálogo busca `err.graphQLErrors`, que no existe ahí: muestra siempre «No
  se pudo guardar la chequera», encima del aviso del genérico con el motivo real.
- «desactivar»: ante un error de red no pasa nada ni se avisa.

### `ChequeService` no dice a qué servidor va
Sus tres mutations y sus tres lecturas llaman a Apollo sin `clientName`. Los cheques son del central. [a confirmar
en la auditoría: a qué cliente va una operación sin `clientName` con «Usar servidor local» tildado]

## 2. Cambio

### `ChequeService`
Las tres mutations pasan por un método común (como `PagarComprasService.mutar`): cliente del central, `errorPolicy:
'all'`, y el error de un rechazo lleva `graphQLErrors` limpios, para distinguirlo con `erroresDeRechazo`.

### Emitir cheque
- Rechazo: el mensaje del servidor, y el diálogo queda abierto (como hoy).
- Sin respuesta (red, corte, central offline, respuesta vacía, resultado nulo): se **cierra** y el dashboard relee;
  aviso «No se pudo confirmar si el cheque se emitió (<chequera>, <monto>): buscalo en la lista de cheques antes de
  emitirlo de nuevo». En el corte del link no se suma aviso.
- Mientras se guarda: no se puede cerrar y «Cancelar» queda deshabilitado.

### Cobrar y anular cheque
- El cheque queda marcado «en curso» mientras dura el pedido (un segundo clic no hace nada).
- Con cualquier resultado **se relee** la lista. Sin respuesta: aviso «No se pudo confirmar…: se vuelve a leer la
  lista de cheques». Rechazo: el mensaje del servidor.

### Chequera
- `onSaveChequera` propaga el error de red.
- Diálogo de alta / edición: `isSaving` se apaga siempre.
  - Rechazo: sin aviso propio (el genérico ya mostró el motivo); queda abierto.
  - Sin respuesta en un **alta**: se cierra y la lista se relee; aviso «No se pudo confirmar si la chequera se
    creó: revisá la lista antes de cargarla de nuevo».
  - Sin respuesta en una **edición**: aviso «No se pudo confirmar si se guardó. Probá de nuevo»; queda abierto
    (repetir es inocuo).
- «Desactivar»: sin respuesta → aviso y relectura de la lista.

## 3. Lo que no cambia (anotado)
- Las lecturas de chequeras usan `onGetAll`, que no emite ante un error (lista vacía o cargando para siempre): es
  el PR pendiente del genérico.
- Editar o desactivar una chequera manda el «siguiente número» que había en pantalla: si se emitió un cheque en el
  medio, lo pisa hacia atrás. Es del diseño de la mutation: va al central.
- Las altas de cheque por formulario genérico (`onSaveCheque`, `onDeleteCheque`) si no tienen llamadores.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): no emitir dos veces un cheque cuando la emision queda sin respuesta` (servicio, emitir, cobrar / anular) |
| 2 | `fix(financiero): no dejar colgado el guardado de una chequera ante un error de red` |

`npm run check` antes de cada push.

## Prueba de runtime

Central local (replicación apagada), cuenta bancaria local.
1. Crear una chequera de prueba. Alta con cuerpo HTTP vacío → cierra, aviso, lista releída; alta con error de red
   (central congelado o simulado) → ya no queda colgado.
2. Emitir un cheque diferido que **llega al central** y se pierde la respuesta → cierra con el aviso; el dashboard
   releído lo muestra; no se emite un segundo.
3. Emitir con rechazo real (chequera agotada o monto inválido) → queda abierto con el motivo.
4. Cobrar el cheque con la respuesta perdida → se relee y figura cobrado; segundo intento desde una lista vieja →
   rechazo del central y relectura.
5. Anular un cheque: normal y sin respuesta.
6. Desactivar la chequera de prueba: normal y sin respuesta.
7. Mientras guarda: no cerrable.

Los cheques de prueba se anulan y la chequera se desactiva al terminar.

## Riesgos
- Cambiar el cliente de las mutations de cheques: si hoy funcionan es porque llegan al central; se verifica que
  sigan llegando.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Un bug funcional aparte: con «Usar servidor local» los cheques van al filial
Confirmado leyendo el enrutado: una operación sin `clientName` va al servidor **local** cuando el desktop tiene
«Usar servidor local» tildado, y al central solo en modo web. `ChequeService` no lo indica en sus tres mutations
(emitir, cobrar, anular) ni en las tres lecturas del dashboard de cheques, y el filial no tiene ese módulo: en una
PC con servidor local **el dashboard de cheques y esas tres acciones fallan hoy**. Las seis pasan al cliente del
central. Se comprueba en runtime en ese modo (esta máquina lo tiene tildado).

### Hechos corregidos
- **Un cheque al día no aparece nunca en el dashboard**: se guarda sin fecha de pago y el dashboard filtra por fecha
  de pago. Un diferido aparece solo si su fecha cae en el rango filtrado (por defecto, el mes actual). «Buscalo en la
  lista de cheques» no sirve para verificar. → el aviso de una emisión sin confirmar dice el **número esperado**
  (el siguiente de la chequera al abrir el diálogo), la chequera y el monto, y manda a mirar en **Chequeras** si el
  próximo número avanzó (y, para un cheque al día, los movimientos de la cuenta).
- **Anular dos veces no duplica** (verificado línea por línea: la reserva solo se libera si el cheque está
  diferido): el segundo intento responde bien. Cobrar dos veces sí se rechaza («El cheque ya está cobrado»).
- Rechazos reales de emitir: chequera no activa o agotada, y saldo insuficiente solo en un cheque al día. El monto
  y la fecha los valida solo el desktop.
- Alta de chequera repetida: crea otra con el **mismo rango de números** (no hay unicidad). En una edición, el
  «siguiente número» del formulario pisa al guardado.
- El corte de 3 s por «central offline» también aplica acá: un cheque puede emitirse y el desktop cortar antes.

### Lecturas que hoy dejan la pantalla vieja sin avisar (entran, porque son el «verificá» del usuario)
- **Dashboard de cheques**: sus tres lecturas no tienen manejo de error (queda «cargando» con los datos viejos) ni
  contador contra respuestas viejas. → manejo de error con aviso y contador.
- **Lista de chequeras** (`gestionar-chequeras`) y el selector de chequeras al emitir: leen con una consulta que no
  emite ante un error (lista vieja o selector vacío, sin aviso). → lectura que propaga el error, con aviso.

### Chequera
- Mientras guarda no se puede cerrar y «Cancelar» queda deshabilitado (el plan solo lo decía para emitir).
- Edición sin respuesta: el aviso agrega «revisá el siguiente número antes de guardar de nuevo» (reintentar manda el
  número que había al abrir).
- En el éxito hoy salen dos avisos (el del genérico y el del diálogo): queda como está, anotado.

### Cobrar / anular
- La marca «en curso» se guarda en el componente y se aplica al armar cada fila (las filas se reconstruyen al
  releer). Se relee con cualquier resultado, también con uno vacío.

### Para el central (anotado)
Unicidad de (chequera, número) y de rangos entre chequeras de una cuenta; clave de idempotencia al emitir; no tomar
el «siguiente número» del formulario al editar; validar monto, fecha y rango al emitir; **dar fecha de pago al
cheque al día** para que figure en el dashboard; el filial no tiene el módulo de cheques.

## Fases (reemplaza la tabla de arriba)

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): mandar al central las operaciones de cheques y avisar si no se pudieron leer` (cliente del central en las seis, errores tipados, lecturas del dashboard con manejo de error y contador) |
| 2 | `fix(financiero): no emitir dos veces un cheque cuando la emision queda sin respuesta` (emitir, cobrar, anular) |
| 3 | `fix(financiero): no dejar colgado el guardado de una chequera ante un error de red` (alta, edición, desactivar, lista) |

## Prueba de runtime: casos que se agregan o cambian
- Con «Usar servidor local» tildado: el dashboard de cheques carga y se puede emitir, cobrar y anular (hoy falla).
- Emitir un cheque **al día** con la respuesta perdida: no aparece en el dashboard; el número de la chequera avanzó.
- Diferido con fecha de pago fuera del mes filtrado.
- Anular dos veces: la segunda responde bien, sin mover plata.
- Dashboard y lista de chequeras sin red: aviso, sin quedar cargando.
- Esc y «Cancelar» mientras guarda, en emitir y en chequera.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Con servidor local, las mutations y lecturas de cheques van al filial, que no tiene el módulo | alta | las seis al central; fase propia |
| A/B | El cheque al día no figura en el dashboard; el diferido, solo si cae en el rango | alta | aviso con el número esperado; verificar en Chequeras |
| A | Alta de chequera repetida crea otra con el mismo rango | alta | cerrar y releer (ya previsto); al central |
| A | La lista de chequeras y el dashboard quedan viejos sin aviso ante un error | media | lecturas con manejo de error y contador |
| A | Anular dos veces es inocuo, no un rechazo | media | corregido en el plan y la prueba |
| A | `disableClose` faltaba en el diálogo de chequera | media | agregado |
| A | Reintentar una edición manda el «siguiente número» viejo | media | aviso; al central |
| B | Dos avisos en el éxito de la chequera | baja | se deja, anotado |
| A | Emitir duplica; cobrar rechaza; quién abre y relee | — | verificado |
