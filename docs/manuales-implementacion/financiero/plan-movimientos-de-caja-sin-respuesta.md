# Plan: movimientos de caja mayor sin respuesta (PR 13c)

Parte de #390, bloque financiero. Repo: desktop. Sin cambios en el central.
Rama `fix/financiero-movimientos-de-caja-sin-respuesta`. **Depende del helper `erroresDeRechazo` del PR #425**
(todavía no está en `develop`): se parte de `develop` cuando el #425 esté mergeado.

## 1. El problema [verificado leyendo]

Cuatro diálogos de la caja mayor guardan por `onSaveCustom`. Ante cualquier error apagan su `isSaving` y **quedan
abiertos con los mismos datos y el botón habilitado**; el aviso lo da el genérico («Ups…», «Error de red») o el
link. Ninguno distingue un rechazo de un «sin respuesta», y el central **duplica** un pedido repetido en todos:

| Diálogo | Operación | Reintento idéntico en el central |
|---|---|---|
| `add-movimiento-caja-virtual-dialog` | ingreso, egreso o ajuste manual, hasta tres monedas | otro movimiento por cada moneda |
| `transferencia-caja-virtual-dialog` | transferencia entre cajas, hasta tres monedas | otra transferencia |
| `conteo-caja-dialog` (`onCrearAjuste`) | ajuste por la diferencia del conteo | otro ajuste por la misma diferencia |
| `maletin-tesoreria-dialog` | ingreso del cierre de un maletín / egreso | otro ingreso (no hay marca de «ya ingresado») u otro egreso |

**Lotes de varias monedas** (los dos primeros): mandan hasta tres pedidos **a la vez** (`forkJoin`). Si uno falla
—incluso por un rechazo, p. ej. saldo insuficiente en reales— el diálogo queda abierto con los tres montos, pero
los otros dos **ya se aplicaron**: reintentar los duplica. Y como salen en paralelo, no se sabe cuál entró.

**Conteo**: tras un «sin respuesta» el diálogo conserva la diferencia calculada contra el saldo viejo; reintentar
postea otro ajuste por la misma diferencia aunque el primero ya haya corregido el saldo.

Con un resultado vacío sin error (conteo, maletín) no pasa nada: ni aviso ni cierre.

## 2. Cambio

Regla común: **un «sin respuesta» cierra el diálogo y hace releer la caja**. Con el formulario cerrado no hay
reintento a ciegas: para repetir hay que mirar la caja ya releída y volver a cargar.

### Movimiento y transferencia (lotes)
- Las monedas se envían **una por una, en orden** (guaraní, real, dólar), no en paralelo; ante el primer problema
  **no se envían las siguientes**. Así siempre se sabe cuál entró.
- Todas bien → como hoy.
- **Rechazo** en una moneda: las anteriores ya entraron. El diálogo queda abierto, pero **se vacían los montos ya
  registrados** y un aviso dice cuáles entraron y cuál fue rechazada. Al cerrar, la caja se refresca.
- **Sin respuesta** en una moneda: se cierra, con un aviso que dice qué monedas se registraron, cuál quedó sin
  confirmar y cuáles no se enviaron; la caja se relee.

### Ajuste por conteo
- Sin respuesta o resultado vacío: se cierra y la caja se relee (los saldos vuelven del servidor); aviso «No se
  pudo confirmar si el ajuste se registró: volvé a contar contra el saldo actualizado».
- Rechazo: queda abierto, como hoy.

### Maletín
- Sin respuesta o resultado vacío: se cierra y la caja se relee; aviso «No se pudo confirmar si el ingreso (egreso)
  del maletín se registró: revisá los movimientos de la caja antes de repetirlo».
- Rechazo: queda abierto, como hoy.

### Avisos
En un «sin respuesta» el genérico ya dijo «Error de red» o «Respuesta vacía», que no explica qué hacer: se suma el
aviso propio. En el corte del link (que ya dice «pudo haberse aplicado, verificá») no se suma, salvo en los lotes,
donde hay que decir qué monedas entraron.

## 3. Lo que no cambia
- Las mutations y el central. La idempotencia de estas operaciones queda anotada para el central.
- La anulación (13a) y el pago (13b).

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(financiero): no duplicar movimientos de caja cuando una moneda del lote falla` (movimiento y transferencia) |
| 2 | `fix(financiero): no repetir a ciegas un ajuste por conteo o un maletin sin respuesta` |

`npm run check` antes de cada push.

## Prueba de runtime

Central local :8081 (replicación apagada y verificada), caja mayor local.
1. Ingreso en dos monedas con la segunda **rechazada** (simulado) → la primera queda registrada, su monto se vacía,
   aviso; reintentar no duplica la primera.
2. Ingreso en dos monedas con la segunda **sin respuesta** (cuerpo HTTP vacío real en ese pedido) → cierra, aviso
   con el detalle, la caja releída muestra solo la primera.
3. Ingreso de una moneda que **llega al central** y se pierde la respuesta → cierra; la caja releída lo muestra.
4. Transferencia: los mismos tres casos (hace falta una segunda caja local; si no hay, se crea una de prueba).
5. Conteo: ajuste con la respuesta perdida → cierra, saldo releído; reabrir el conteo ya no muestra la diferencia.
6. Maletín: ingreso y egreso sin respuesta → cierra y relee; rechazo → queda abierto.
7. Un ingreso, una transferencia y un ajuste normales siguen funcionando.

Los movimientos de prueba se anulan al terminar.

## Riesgos
- Enviar las monedas en serie tarda un poco más que en paralelo (hasta tres pedidos seguidos).
- Cerrar ante un «sin respuesta» hace perder lo tipeado: es intencional.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **Qué puede rechazar una sola moneda de un lote**: solo «Saldo insuficiente en la caja virtual», que es por
  (caja, moneda) y aplica a egreso, ajuste negativo y transferencia. Un **ingreso nunca se rechaza por moneda**
  (el límite de caja chica solo es un aviso del desktop; el permiso es por caja). El parcial por rechazo es real
  para egresos y transferencias.
- La transferencia es atómica en el central (las dos patas en una transacción): el parcial existe entre monedas,
  no dentro de una transferencia. El ingreso del cierre de un maletín es un solo pedido para todas las monedas.
- Con el envío en paralelo de hoy, cuando una moneda falla **las otras siguen en vuelo y se aplican** igual.
- «Resultado vacío sin error» no es un caso real con estas mutations (siempre devuelven algo; una respuesta vacía
  llega como error): queda solo como defensa.
- En el conteo **la grilla no se pierde al cerrar**: se guarda por caja y moneda y se restaura al reabrir.

### Regla única para los lotes (reemplaza «vaciar montos y dejar abierto»)
Las monedas van en serie y se corta al primer problema. Después:
- **Nada se aplicó y fue un rechazo claro** → el diálogo queda abierto, como hoy.
- **Algo se aplicó, o hay duda** (rechazo de la segunda o tercera moneda, o cualquier «sin respuesta») → el diálogo
  **se cierra y la caja se relee**, con un aviso que dice qué monedas se registraron, cuál fue rechazada (con el
  motivo) o quedó sin confirmar, y cuáles no se enviaron.
Una sola regla, menos estado, y el usuario ve el saldo nuevo (que explica un «saldo insuficiente»).

### Cierre
- Hoy Esc, el clic afuera o «Cancelar» durante el guardado cierran **sin refrescar la caja**, aunque algo ya se haya
  aplicado. → mientras se guarda, el diálogo no se cierra (ni Esc ni clic afuera) y «Cancelar» queda deshabilitado.
  Vale para los cuatro.

### Conteo
- El aviso dice: «No se pudo confirmar si el ajuste se registró. El conteo sigue guardado: volvé a abrirlo para ver
  la diferencia con el saldo actualizado».
- Tras cerrar, los saldos se releen de forma asíncrona: si el conteo se reabre **antes** de que vuelvan, usa el
  saldo viejo y el riesgo se repite. → el dashboard marca los saldos como no disponibles al iniciar esa relectura
  (ya existe ese estado: sin saldo no se puede ajustar) hasta que terminen de cargar.

### Maletín
- El aviso nombra el maletín: «…buscá INGRESO MALETIN <código> en los movimientos de la caja antes de repetirlo».
  Dentro del diálogo no hay cómo verificarlo: el valor del cierre no cambia al ingresarlo.

### Implementación
- Envío en serie con una función compartida por los dos diálogos de lote; cada pedido se crea recién cuando le toca
  (el genérico abre su modal al llamar, no al suscribirse).
- Un aviso propio por flujo, autosuficiente; sale después del aviso del genérico (los avisos van en cola).
- **Dependencia del #425**: si al arrancar todavía no está en `develop`, la rama se apila sobre la del #425 (los PRs
  se mergean con merge commit, no hace falta reescribir nada después).
- Sin tests unitarios nuevos: el gate del repo no los corre.

### Para el central (anotado)
Clave de idempotencia en `registrar`, `transferir` e ingreso / egreso de maletín; una mutation atómica para los
lotes de monedas; marca de «cierre de maletín ya ingresado»; en el ajuste por conteo, mandar el saldo esperado y
rechazar si no coincide; el límite de caja chica no se valida en el servidor.

## Prueba de runtime (reemplaza los casos 1 y 2, y agrega)
1. **Egreso** en guaraníes y reales con saldo insuficiente en reales (real) → el egreso en guaraníes queda
   registrado, el diálogo se cierra, el aviso dice qué entró y qué se rechazó, la caja se relee.
2. Egreso con saldo insuficiente en la **primera** moneda → queda abierto, nada aplicado, las otras no se envían.
3. Ingreso en dos monedas con la segunda sin respuesta (cuerpo vacío real) → cierra con el detalle.
4. Ajuste de egreso por lote; tres monedas con falla en la segunda (la tercera no se envía).
5. «Cancelar», Esc y clic afuera durante el guardado.
6. Reabrir el conteo antes de que vuelvan los saldos → no se puede ajustar.
7. Corte «central offline» de 3 s sobre un pedido que sí llega.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | «Vaciar montos y dejar abierto» suma estado y casos; cerrar siempre que algo se aplicó es más simple y seguro | alta | regla única |
| A | Esc, clic afuera o Cancelar durante el guardado cierran sin refrescar | alta | no se cierra mientras guarda |
| A | Un ingreso no se rechaza por moneda; el parcial real es de egresos y transferencias | alta | prueba corregida |
| A | El conteo reabierto antes de que vuelvan los saldos usa el saldo viejo | media | saldos «no disponibles» durante la relectura |
| B | En el conteo la grilla no se pierde: el aviso «volvé a contar» era falso | media | texto corregido |
| B | El maletín no se puede verificar dentro del diálogo | media | el aviso nombra el maletín |
| A | El genérico abre su modal al llamar | media | cada pedido se crea cuando le toca |
| B | Dependencia del #425 | baja | apilar si no está mergeado |
| A | «Resultado vacío sin error» no es un caso real | baja | queda como defensa |
| A | Duplicados en el central, atomicidad, avisos por caso | — | verificado |
