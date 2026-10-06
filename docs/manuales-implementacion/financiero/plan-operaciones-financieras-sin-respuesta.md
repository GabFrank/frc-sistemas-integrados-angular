# Plan: operaciones financieras, entradas varias y ajuste de saldo bancario sin respuesta (PR 13d)

Parte de #390, bloque financiero. Repo: desktop. Sin cambios en el central.
Rama `fix/financiero-operaciones-sin-respuesta` desde `origin/develop`.

## 1. El problema [verificado leyendo]

Tres diálogos guardan por `onSaveCustom`. Ante cualquier error apagan `isSaving` y **quedan abiertos con los mismos
datos y el botón habilitado**; no distinguen un rechazo de un «sin respuesta», y el central registra de nuevo un
pedido repetido:

| Diálogo | Operación | Reintento idéntico en el central |
|---|---|---|
| `add-operacion-financiera-dialog` | cambio de divisa, depósito / retiro bancario, transferencia entre cajas o bancaria | otra operación (mueve caja y / o banco otra vez) |
| `add-entrada-varia-dialog` | ingreso o egreso vario de la caja mayor | otra entrada con su movimiento (el número de comprobante lo genera el central si no se carga) |
| `ajustar-saldo-cuenta-dialog` | ajuste del saldo de una cuenta bancaria | otro ajuste |

Además:
- Con un resultado vacío sin error no hacen nada (ni aviso ni cierre).
- Operación financiera y entrada varia: «Cancelar», Esc o el clic afuera **durante el guardado** cierran sin que
  quien abrió el diálogo refresque nada. (El ajuste de saldo ya deshabilita «Cancelar».)

## 2. Cambio

La misma regla que en el 13c para el conteo y el maletín:
- **Rechazo** del servidor (`erroresDeRechazo`): el diálogo queda abierto, como hoy; el motivo ya lo mostró el
  genérico.
- **Sin respuesta** (red, corte, central offline, respuesta vacía, resultado vacío): la operación pudo haberse
  registrado. El diálogo **se cierra con un valor** (quien lo abrió relee: la caja, la lista de operaciones o las
  cuentas) y un aviso dice qué mirar antes de repetirla:
  - operación financiera: «No se pudo confirmar si la operación se registró: buscala en los movimientos antes de
    repetirla»;
  - entrada varia: «No se pudo confirmar si el ingreso (egreso) se registró: revisá los movimientos de la caja
    antes de repetirlo»;
  - ajuste de saldo: «No se pudo confirmar si el ajuste se aplicó: revisá el saldo de la cuenta antes de repetirlo».
  En el corte del link no se suma aviso propio (ya dice «pudo haberse aplicado, verificá»).
- **Mientras se guarda**: el diálogo no se cierra (ni Esc ni clic afuera) y «Cancelar» queda deshabilitado.

## 3. Lo que no cambia
- Las mutations y el central.
- La anulación de entradas varias y de operaciones (13f).

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): no repetir a ciegas una operacion financiera, entrada varia o ajuste sin respuesta` |

`npm run check` antes del push.

## Prueba de runtime

Central local (replicación apagada), caja mayor y cuenta bancaria locales.
1. Entrada varia (ingreso) que **llega al central** y se pierde la respuesta (la petición se envía y la respuesta
   se descarta en el navegador) → cierra con el aviso; la caja releída la muestra.
2. Entrada varia con cuerpo HTTP vacío (no llega) → cierra y relee; rechazo (simulado) → queda abierto.
3. Ajuste de saldo bancario que llega y se pierde la respuesta → cierra; la cuenta releída muestra el saldo nuevo.
4. Operación financiera (depósito de caja a banco, si la base local lo permite; si no, con el servicio
   reemplazado): sin respuesta → cierra y relee; rechazo → queda abierto.
5. Mientras guarda: «Cancelar» deshabilitado y diálogo no cerrable, en los tres.
6. Una entrada varia y un ajuste normales siguen funcionando.

Lo creado en la prueba se anula o se compensa al terminar.

## Riesgos
- Cerrar ante un «sin respuesta» hace perder lo tipeado (el formulario de operación financiera es largo): es
  intencional; la alternativa —dejarlo abierto— es la que permite duplicar.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **No hay unicidad del número de comprobante** (ni en operación financiera ni en entrada varia): un segundo pedido
  con el mismo número cargado a mano tampoco se rechaza. Nada en el central frena el duplicado.
- La frase «el número lo genera el central si no se carga» era falsa en la práctica: el desktop manda un texto
  vacío y el central solo lo genera si llega nulo. Se quita del plan y se anota para el central.
- Las tres operaciones son atómicas en el central (una transacción). Los rechazos reales (saldo insuficiente en caja
  o en banco, permisos, datos mal combinados) llegan con mensaje de negocio.
- El ajuste de saldo es **relativo** (+/− monto), y el saldo que muestra el diálogo es el de la lista al abrirlo:
  puede estar viejo.

### Dónde mirar (los textos de aviso)
- **Operación financiera**: desde el dashboard de la caja el diálogo se abre sin caja fija, y la operación puede
  no tocar esa caja (transferencia bancaria, otra caja): «revisá los movimientos» no alcanza. El aviso, para los dos
  orígenes, dice: «No se pudo confirmar si la operación se registró (<tipo>, <monto>): buscala en Operaciones
  financieras antes de repetirla».
- **Entrada varia**: «…revisá los movimientos de la caja (y sus filtros) antes de repetirlo», con el monto.
- **Ajuste de saldo**: el aviso incluye el signo, el monto y **el saldo que se veía antes**, para compararlo con la
  cuenta releída.
- Al volver de un alta a la lista de operaciones financieras, la lista vuelve a la primera página (la operación
  nueva queda arriba; hoy conserva la página).

### Cierre
- El valor de cierre ante un «sin respuesta» tiene que ser verdadero (`true`): los que abren relean con
  `if (res)` o `if (res != null)`, y los selectores de ingreso / egreso solo propagan valores verdaderos.
- `disableClose` se pone al empezar a guardar y **se quita ante un rechazo** (el diálogo queda abierto y editable).
  Vale también para el ajuste de saldo, que hoy deshabilita «Cancelar» pero no Esc ni el clic afuera.

### Ajuste de saldo: doble clic
`isSaving` se enciende recién después de la confirmación: dos clics rápidos en «Guardar» pueden abrir dos
confirmaciones y aplicar dos ajustes. Se agrega una marca desde el primer clic.

### Alcance
- Los diálogos de ingreso / egreso / ajuste de caja y de transferencia entre cajas, que la auditoría marcó como
  «sin cubrir», son los del PR #426 (13c).
- Fuera de este PR: el alta de cuenta bancaria (no mueve plata; un reintento podría duplicar la cuenta) y las
  lecturas del formulario sin manejo de error (monedas, cotización).

### Para el central (anotado)
Clave de idempotencia en las tres mutations; normalizar el número de comprobante vacío a nulo; ajuste de saldo con
saldo esperado; un error al armar la respuesta después de confirmar se vería como rechazo.

## Prueba de runtime: casos que se agregan
Operación financiera real que llega y se pierde la respuesta (depósito de caja a banco, si la base local lo
permite); rechazo real por saldo insuficiente (queda abierto y se puede cerrar con Esc); apertura desde la lista y
desde el dashboard; entrada varia abierta desde el selector de ingresos; doble clic en el ajuste.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | El aviso de operación financiera mandaba a «los movimientos», que pueden no mostrarla | alta | apunta a Operaciones financieras, con tipo y monto |
| A | El valor de cierre debe ser verdadero; `disableClose` hay que quitarlo ante un rechazo | alta/media | definido |
| A | No hay unicidad del número de comprobante; la frase del número autogenerado era falsa | media | corregido |
| A | Doble clic en el ajuste de saldo antes de la confirmación | media | marca desde el primer clic |
| B | El aviso del ajuste sin el saldo anterior no deja comparar | media | incluye el saldo que se veía |
| A | La lista de operaciones conserva la página al volver del alta | baja | vuelve a la primera |
| A | Diálogos de caja «sin cubrir» | — | son los del #426 |
| A | Duplicado en las tres, atomicidad, quién relee con qué valor | — | verificado |
