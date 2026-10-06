# Plan: un pago sin respuesta no se reintenta a ciegas (PR 13b)

Parte de #390, bloque financiero. Repo: desktop. Rama `fix/financiero-pago-sin-respuesta-no-se-reintenta-a-ciegas`
desde `origin/develop`. Sin cambios en el central.

## 1. El problema [verificado leyendo]

`pagar-compras-dialog` (Egresos de la caja mayor: paga compras, gastos, vales, liquidaciones, finiquitos y
aguinaldos; también crea gastos y vales) llama a las mutations por `PagarComprasService.mutar` (Apollo directo).

**Confirmar el pago (`onSave`)** — ante cualquier error apaga `isSaving`, muestra el mensaje (o nada si fue el
corte del link, que ya avisó) y deja **el diálogo abierto con la misma selección, los mismos montos y el botón
habilitado**. No relee los pendientes. Con un resultado vacío sin error no hace nada.

Qué hace el central con el mismo pedido repetido (relevado):
| Caso | Reintento idéntico |
|---|---|
| Compra o gasto, pago **parcial** | **se paga otra vez** la misma parte (caja o banco, y emite otro cheque), mientras no exceda el saldo |
| Compra o gasto, pago total | rechazado: «La solicitud #N ya está CONCLUIDO» |
| Vale | rechazado: «El vale #N no está pendiente de pago» |
| Liquidación, finiquito, aguinaldo | rechazado: «…no está pendiente de pago» |

Además un rechazo «ya está…» deja al usuario frente a una lista vieja: nada le dice que el pago anterior sí entró.

**Crear gasto / crear vale** — ante cualquier error deja el formulario abierto y reintentable; el central no tiene
ninguna protección: un segundo envío crea **otro gasto u otro vale** igual (quedan los dos pendientes de pago).

**Devolver a compras** — ante un error solo avisa; la fila queda aunque la devolución se haya aplicado.

**`mutar`** emite un `Error` plano con el mensaje ante un rechazo: quien lo recibe no puede distinguirlo de una
respuesta vacía salvo por el texto.

## 2. Cambio

### Helper y `mutar`
- `graphqlErrorUtils.erroresDeRechazo(error): any[] | null` — devuelve los errores si es un **rechazo** del
  servidor, en cualquiera de las formas en uso (arreglo de `onSave` / `onCustomMutation`, o `{ graphQLErrors }` de
  `onSaveCustom` y de `mutar`), y `null` si es un «sin respuesta» (red, corte, respuesta vacía).
  `esRechazoDelServidor` no cambia.
- `mutar` agrega `graphQLErrors` al `Error` que lanza (el `message` queda igual: los que hoy leen
  `err.graphQLErrors?.[0]?.message || err.message` siguen mostrando lo mismo).

### Confirmar el pago
- **Rechazo**: mensaje del servidor, como hoy, y además se **releen los pendientes**: un «ya está CONCLUIDO»
  significa que la lista estaba vieja.
- **Sin respuesta** (red, corte del link, respuesta vacía, resultado vacío sin error): el pago pudo haberse
  registrado. Entonces:
  - aviso «No se pudo confirmar si el pago se registró…» (en el corte lo da el link, no se duplica);
  - se **releen los pendientes**: la selección se pierde y los saldos vienen del servidor. Un reintento ya no es
    «el mismo pedido»: hay que volver a elegir sobre lo que realmente quedó pendiente;
  - queda un **cartel fijo** en el diálogo: «El pago anterior quedó sin confirmar: revisá los saldos antes de
    volver a pagar», hasta cerrar o hasta un pago confirmado;
  - si la relectura falla, la lista queda vacía (ya pasa hoy): no hay nada pagable hasta que cargue;
  - al **cerrar** el diálogo después de eso, quien lo abrió refresca la caja (el pago pudo haber movido saldo).

### Crear gasto / crear vale
- Rechazo: como hoy (queda el formulario, con el mensaje).
- Sin respuesta: aviso «No se pudo confirmar si el gasto se creó: revisá la lista antes de cargarlo de nuevo», se
  vuelve a la lista y se relee. El formulario **conserva lo cargado** (si no figura, se puede enviar de nuevo sin
  retipear). Lo mismo para el vale.

### Devolver a compras
- Sin respuesta: aviso y relectura de la lista (si se aplicó, la fila ya no está).

## 3. Lo que no cambia
- El motor de pago del central y sus guards.
- El pago parcial repetido **a propósito** sigue siendo posible (es una operación válida): lo que se evita es
  repetirlo sin haber visto el saldo actualizado.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): no reintentar a ciegas un pago que quedo sin respuesta` (helper, `mutar`, confirmar pago, cierre) |
| 2 | `fix(financiero): no duplicar un gasto o un vale cuando el alta queda sin respuesta` (altas y devolver) |

`npm run check` antes de cada push.

## Prueba de runtime

Central local :8081 (replicación apagada y verificada), desktop en el navegador, caja mayor local.
1. Crear un gasto de prueba y pagarlo **parcial** con cuerpo HTTP vacío real (la petición se desvía en el
   navegador: no llega al servidor) → aviso, cartel, lista releída, selección vacía.
2. Lo mismo dejando que el pago **sí llegue** y perdiendo solo la respuesta (central congelado después de recibir,
   o respuesta descartada en el navegador): al releer, el saldo del gasto bajó; no se puede repetir «el mismo» pago
   sin volver a seleccionar.
3. Pago total rechazado por lista vieja (se paga por fuera con la mutation y después desde la pantalla) → mensaje
   del central y lista releída.
4. Sin respuesta + la relectura falla → lista vacía, nada pagable.
5. Cerrar después de un pago sin confirmar → la caja se refresca.
6. Crear gasto y crear vale con cuerpo vacío real → aviso, vuelve a la lista, formulario conservado; rechazo → queda.
7. Devolver a compras sin respuesta → aviso y relectura.
8. Un pago normal sigue funcionando (gasto de prueba, total).

Los modos de RRHH y vales se prueban con el servicio reemplazado si no hay documentos pendientes en la base local.

## Riesgos
- Releer borra la selección y obliga a re-elegir: es intencional, pero es más trabajo para el usuario tras un corte.
- Las líneas de forma de pago ya cargadas (incluido un plan de cheques) se conservan o no según cómo esté armado
  el diálogo: se define al implementar y se deja dicho.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Correcciones a los hechos
- La respuesta vacía llega a `mutar` como error (el link la convierte en `errors`), confirmado siguiendo la cadena
  de links. La rama «resultado vacío sin error» se conserva para un cuerpo `{}` o `{"data":null}`.
- **«Central offline» (corte de 3 s)**: cuando el websocket del central no está confirmado, cualquier operación al
  central que tarde más de 3 s se corta **en el cliente**, pero el servidor la sigue ejecutando. Ese error no lo
  avisa nadie y no cuenta como corte del link. El «sin respuesta» no es un caso raro: se trata igual, con aviso
  propio.
- Tabla del central, completa:
  | Caso | Reintento idéntico |
  |---|---|
  | Compra o gasto, parcial | se paga otra vez; si justo completa el saldo, concluye la solicitud |
  | Compra o gasto, parcial que excede | «El pago excede el saldo de la solicitud #N (restante)» |
  | Compra o gasto, total | «La solicitud #N ya está CONCLUIDO» |
  | Vale | «El vale #N no esta pendiente de pago (esta …)» |
  | Liquidación, finiquito, aguinaldo | «La liquidacion #N no esta pendiente de pago (esta …)» |
  Cada pago repetido **emite cheques nuevos**, con el número siguiente (y un diferido reserva saldo otra vez).
  Los mensajes no se comparan por texto en el desktop.
- Devolver a compras repetido: el central lo rechaza («…está en DEVUELTO»). Se relee también ante ese rechazo.

### El diálogo hoy no se puede «releer» sin quedar inconsistente (entra en la fase 1)
- `cargar()` con éxito **no limpia** la selección ni lo derivado (líneas, `balanceOk`, proveedor, moneda, plan de
  cheques): tras releer quedaría «Confirmar» habilitado sobre una selección que ya no existe. → al terminar bien,
  `recomputarSeleccion()`; el plan de cheques y las líneas se descartan (es lo que ya pasa con la selección vacía).
- El stepper queda en «Revisar»: se vuelve al primer paso al releer tras un error.
- **Ventana de doble pago**: mientras la relectura espera (hasta 60 s) «Confirmar» sigue habilitado. → ante un
  «sin respuesta» la selección y las líneas se limpian **de inmediato**, sin esperar la lectura, y «Confirmar» se
  deshabilita también mientras se carga.
- `cargar()` sin contador: dos lecturas pueden pisarse. → contador; solo cuenta la última.
- **Cierre**: Cancelar cierra con `null`, y Esc o el clic afuera con `undefined`; con esos valores quien abrió el
  diálogo **no refresca la caja** (y el diálogo de egresos queda abierto). → con un pago sin confirmar se cierra
  con un valor que hace refrescar, y Esc / clic afuera quedan deshabilitados hasta entonces.
- Tras un pago sin confirmar se releen también las **chequeras** (números y hojas disponibles pueden haber cambiado).

### Que el usuario vea qué quedó sin confirmar
- El cartel **lista las solicitudes y los montos** del pago sin confirmar, con el saldo que tenían antes, y esas
  filas quedan **marcadas** en la tabla («pago sin confirmar») hasta cerrar o hasta un pago confirmado. No se
  bloquean: comparar el saldo de antes con el releído alcanza para saber si entró.
- Alta de gasto o de vale sin respuesta: el cartel resume lo enviado (descripción, monto) y la lista vuelve
  **filtrada** por esa descripción (o por el funcionario, en el vale), para ver de un vistazo si ya figura.

### Helper y `mutar`
- `mutar` agrega `graphQLErrors` **ya limpios** (`limpiarErroresGraphQL`): crudos traerían de vuelta el prefijo
  «Exception while fetching data…» en los avisos que leen ese campo primero.
- `erroresDeRechazo`: si el error trae `networkError`, es «sin respuesta» aunque traiga también `graphQLErrors`.
  Un 401 / 403 (no se ejecutó nada) se trata igual que «sin respuesta»: es el lado seguro, solo cuesta una relectura.
- Sin tests unitarios nuevos: el gate del repo no los corre.

### Anotado para el central
- El pago no tiene idempotencia: una clave por evento de pago, generada por el desktop y reenviada en el reintento,
  haría que el central devuelva el pago ya creado. Lo mismo para el alta de gasto y de vale.

## Prueba de runtime: casos que se agregan
Confirmar durante la relectura lenta (deshabilitado); cerrar con Cancelar tras un pago sin confirmar (la caja se
refresca) y Esc / clic afuera (no cierran); pago con el corte de «central offline»; chequeras releídas; marca de
las filas y cartel con los montos; filtro precargado tras el alta sin respuesta.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Releer no limpia la selección ni lo derivado; el stepper queda en «Revisar» | alta | entra en la fase 1 |
| A | «Confirmar» sigue habilitado mientras la relectura espera | alta | limpiar de inmediato y deshabilitar al cargar |
| A | Cerrar con Cancelar / Esc no refresca la caja | alta | cierre con valor; Esc deshabilitado |
| A | Corte de «central offline» a los 3 s: el servidor sigue ejecutando y nadie avisa | alta | se trata como «sin respuesta» con aviso propio |
| B | `graphQLErrors` crudos romperían el texto de otros avisos | alta | limpios |
| A | Cada pago repetido emite cheques nuevos; fila «excede el saldo»; textos reales | alta/baja | tabla corregida |
| B | Releer solo no le dice al usuario qué mirar | media | cartel con solicitudes y montos; filas marcadas |
| B | El usuario no reconoce el gasto recién creado en la lista | media | lista filtrada por lo enviado |
| A | `cargar()` sin contador; chequeras viejas; devolver repetido | media | contador; se releen; se relee ante el rechazo |
| B | Idempotencia del pago en el central | baja | anotado |
