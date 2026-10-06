# Plan: las lecturas por id y por texto siempre terminan (PR 14e)

Parte de #390. Repo: desktop. Sin cambios en el central.
Rama `fix/generico-lecturas-por-id-siempre-terminan`, **apilada sobre la del #436** (que va sobre el #435): toca
archivos que esos dos PRs ya cambian (`venta-touch`, el diálogo de gasto, el retiro de pre-gasto).

## 1. El problema [relevado sobre `origin/develop`]

`onGetById`, `onGetByTexto` y `onGetByFecha` del genérico, cuando la consulta falla:

| | Error del servidor | Error de red |
|---|---|---|
| `onGetById` | avisa «Ups!…» y no termina | avisa «Problema al realizar esta operación» y no termina |
| `onGetByTexto` | avisa «Ups!…» y no termina | **no avisa** y no termina |
| `onGetByFecha` | avisa «Ups!…» y no termina | no avisa y no termina |

Quien llama queda esperando para siempre. La mayor parte del sistema ya se migró módulo por módulo pasando un
`errorConf` (operaciones, activos, productos, caja, financiero). Quedan unos **30 lugares sin migrar**; 11 quedan
colgados a la vista: garantía en el PDV («Buscando venta» eterno), factura legal (edición y lista de ítems), conteo
de billetes, lista de personas, lista de sectores, proveedor y proveedor de servicio (el formulario no carga), el
selector de productos de compras, el retiro de pre-gasto (botón trabado), y la carga de la caja al abrir el PDV
(queda en blanco).

## 2. Cambio

### En el genérico: el error llega siempre a quien llama
A diferencia de `onGetAll` (que ante un error emite `null`), acá **se propaga el error**. En una lectura por id o por
texto `null` ya significa «no existe»: si un error se disfrazara de `null`, el PDV ofrecería abrir una caja teniendo
una abierta, vendería un producto sin su control de lote, una factura se editaría vacía, un retiro se guardaría sin
autorizador. Con el error propagado, quien no lo maneja no hace nada (como hoy) y quien tiene un `error:` escrito
—hoy inalcanzable en 13 lugares— por fin lo ejecuta.

- Sin `errorConf` (los ~30): un error del servidor o de red **falla** hacia quien llama, con aviso del genérico.
- Con `errorConf` (los ya migrados): **no cambia nada**, salvo que el error de red ahora llega siempre (hoy solo si
  lo pedían; los que no lo pedían quedaban colgados).
- Avisos de red sin repetir (hay búsquedas que consultan por tecla y pantallas que consultan una vez por grupo).
- `onGetByTexto` pasa a avisar el error de red, que hoy calla.
- Si la consulta completa sin emitir, falla (hoy quedaría esperando).

### Consumidores que se tocan en el mismo PR
Los que tienen un `error:` que ahora corre y **decide mal**, y los que quedan colgados sin `error:`:
- **PDV, producto con lote** (`venta-touch`): su `error:` agrega el ítem igual, sin el dato de lote. → no se agrega;
  aviso «No se pudo leer el producto: volvé a escanearlo».
- **PDV, caja al abrir** (`venta-touch`): sin `error:`. → aviso de que no se pudo leer la caja y cómo reintentar;
  no se ofrece abrir otra.
- **Factura legal, edición**: su `error:` trata al cliente como «persona que todavía no es cliente». → avisa y no
  rellena. La lista de ítems no guarda «sin ítems» cuando falló la lectura.
- **Garantía** (PDV) y **lista de sectores**: cierran su «Buscando…» también ante un error.
- **Crear inventario**: si no se pudo verificar que no haya uno abierto, no deja crear otro.
- **Conteo de billetes** y **lista de personas**: apagan su «cargando» y lo dicen.
- **Búsquedas por tecla** (responsable y autorizador en retiro y gasto de caja, usuario en entrada / salida de
  stock, proveedor en pago de compras, marcas en bienes) y las **categorías del PDV** (una consulta por grupo):
  manejan el error en silencio (el aviso lo da el genérico, una vez).
- **Balance por fecha** (lista de cajas): `error:`.

### Lo que se arregla solo (se verifica)
Retiro de pre-gasto (botón destrabado), proveedor y proveedor de servicio, selector de productos de compras,
consulta de la factura recién emitida.

## 3. Lo que no cambia
- Los consumidores ya migrados.
- Los wrappers sin llamadores y los componentes que nadie abre (código muerto, listado en el relevamiento).
- `onGetByFecha`: solo tiene un llamador vivo; se arregla igual por consistencia. Su cálculo de fechas por defecto
  está mal (`getDay()`), pero nadie lo usa sin fechas: anotado.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(pdv): no vender sin control de lote ni ofrecer abrir caja cuando la lectura falla` |
| 2 | `fix: manejar el error de lectura en factura legal, inventario, garantia y listas` |
| 3 | `fix: propagar el error en onGetById, onGetByTexto y onGetByFecha en vez de no terminar` (genérico + tests) |

Los consumidores van primero. `npm run check` antes de cada push; tests del genérico con Karma.

## Prueba de runtime

Central y filial locales, desktop en el navegador, fallas inyectadas por consulta (red, HTTP, rechazo).
1. PDV contra el filial: abrir con la lectura de la caja fallando (no ofrece abrir otra); escanear un producto con
   la lectura por id fallando (no se agrega); categorías con error (un solo aviso); todo normal.
2. Garantía, factura legal (editar, expandir ítems), crear inventario, conteo de billetes, lista de personas,
   lista de sectores: ninguna colgada; mensaje correcto; normal sigue igual.
3. Búsquedas por tecla con error: un aviso, sin errores en consola.
4. Proveedor, selector de productos de compras, retiro de pre-gasto: destrabados.
5. Un consumidor ya migrado (lista de deliverys, pedido): sin cambios.

## Riesgos
- Cambio de comportamiento para los ~30 consumidores sin `errorConf`, y para los migrados que no pedían el error de
  red (pasan de colgarse a recibirlo).
- Los `error:` que hoy no corren pasan a correr: se revisan uno por uno (13).
- Va apilado sobre dos PRs sin mergear.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- El #435 ya está en `develop`; solo el #436 sigue abierto. La rama se apila sobre la del #436 (se solapan el diálogo
  de gasto, el de abrir caja y el servicio de caja); si el #436 se mergea antes, se rebasa sobre `develop`.
- **Todos los ya migrados piden el error de red**: no hay ninguno que pase `errorConf` sin propagarlo. Entonces
  «que el error de red llegue siempre a los migrados» no cambia nada: **se deja a los migrados exactamente como
  están** y se cambia solo el caso sin `errorConf`.
- Sin `errorConf` hay 85 llamadas en servicios (no ~30): varios wrappers lo aceptan como opcional y hay llamadores
  que no lo pasan. La lista de consumidores sale de esas 85.
- La lista de ítems de factura legal **ya** no guarda «sin ítems» ante un error: solo le falta avisar. El `error:` de
  la edición (carga de la factura) ya cierra bien. Uno de los «13» era de otra consulta.
- La lectura del producto por id al escanear es una **red de seguridad**: solo corre si la consulta que trajo el
  producto no pidió el dato de lote. El comentario del código dice que hoy se agrega igual «para no trabar el
  mostrador»; hoy eso no corre nunca.
- La carga de la caja del PDV se llama una sola vez (al validar el PDV); nada la reintenta. Y las acciones de venta
  **no miran si hay caja**: tras un fallo podría quedar la caja de una sesión anterior.
- Un consumidor sin `error:` que recibe el error no «queda como hoy»: deja un error sin capturar en la consola.

### Agregados
- **`onGetByTexto` con `errorConf` se sigue colgando ante un rechazo del servidor** (a diferencia de `onGetById`, que
  ahí emite `null`). Afecta a tres ya «migrados»: cliente en el delivery, cliente en venta a crédito y maletín al
  abrir caja. → esos tres piden también el rechazo; el genérico no emite `null` ahí (diría «no existe el maletín»).
- **PDV, lectura del lote y de la caja: corte de mostrador (10 s)** en vez de los 60 s del link con el modal puesto.
- **PDV, caja**: ante el error, `Reintentar / Salir` (el mismo diálogo que ya usa la validación del PDV), sin dejar
  la caja de una sesión anterior y sin ofrecer abrir otra.
- **PDV, editar un delivery**: vacía el carrito antes de leer la venta y no tiene `error:` → restaurar y avisar.
- **Selector de productos de compras**: su `error:` avisa pero deja el spinner de la fila girando → se apaga.
- **Movimiento de stock** (detalle de inventario) y **relecturas de inventario** tras guardar: `error:` para que
  avisen o armen lo básico.
- **Consulta de la factura recién emitida**: tres intentos, cada uno abre el modal y avisa → silenciosa.
- **Avisos**: el aviso de red del genérico pasa a no repetirse (hoy sale uno por consulta). Los consumidores que
  dicen lo suyo piden silencio al genérico (hoy salen dos avisos con el mismo texto en retiro y gasto de caja).
- `onGetByFecha`: además, el texto interno «Eliminando…» de su modal (no se ve, pero confunde) y el cálculo de
  fechas por defecto.

### Partición y orden (reemplaza «Fases»)
El genérico va **primero**: mientras no propague, los `error:` nuevos no se pueden probar.

**PR 14e (este): el genérico y los consumidores que deciden**
| Fase | Commit |
|---|---|
| 1 | `fix: propagar el error en onGetById, onGetByTexto y onGetByFecha en vez de no terminar` (genérico, avisos sin repetir, tests) |
| 2 | `fix(pdv): no vender sin control de lote ni seguir sin caja cuando la lectura falla` (lote, caja con reintento, edición de delivery, categorías) |
| 3 | `fix: no decidir sobre una lectura que fallo en factura legal, inventario y abrir caja` (cliente de la factura, crear inventario, maletín y los otros dos de `onGetByTexto`, selector de compras, factura recién emitida) |

**PR 14f (después): lo que solo queda mudo o colgado**
Garantía, lista de sectores, conteo de billetes, lista de personas, movimiento de stock, relecturas de inventario,
búsquedas por tecla, balance por fecha.

Como entre la fase 1 y el 14f esos consumidores reciben un error que no manejan (queda en la consola; garantía y
sectores siguen con su «Buscando…» abierto, igual que hoy), el 14f va inmediatamente después.

## Prueba de runtime (agrega)
Cada tipo de falla por separado (red, corte de 10 s, rechazo, respuesta vacía); filial lento (15 s) en lote y caja;
reabrir el PDV tras una carga de caja fallida; que los ya protegidos (balance en retiro y gasto, crédito del
legajo) no den dos avisos; consola sin errores en lo tocado; los tres de `onGetByTexto` ante un rechazo.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Todos los migrados ya piden el error de red: cambiarles algo no aporta | media | se dejan como están |
| A | `onGetByTexto` con `errorConf` se cuelga ante un rechazo (3 consumidores) | media | piden el rechazo |
| A | PDV: 60 s con el modal puesto; la caja no se reintenta; las ventas no miran si hay caja | alta | corte de 10 s, Reintentar / Salir, sin caja vieja |
| A | Editar delivery vacía el carrito y no maneja el error | media | entra |
| A | Selector de compras: spinner eterno pese al aviso | media | entra |
| A | Sin `error:` no es «como hoy»: error en consola | media | dicho; 14f inmediato |
| A | Doble aviso en los que ya avisan; un aviso por consulta | media | sin repetir; piden silencio |
| A | Varias referencias del plan mal (lista de ítems, uno de los 13, #435) | baja | corregidas |
| B | El genérico último impide probar | media | va primero |
| B | Tamaño | media | dos PRs |
| B | Propagar y no `null` | — | confirmado |

## Decisiones de Franco (2026-10-06)
- Aprobado. La rama sale de `develop`: el #435 y el #436 ya están mergeados (no se apila).
- Producto con lote cuya lectura falla: **no se agrega y se avisa**.
