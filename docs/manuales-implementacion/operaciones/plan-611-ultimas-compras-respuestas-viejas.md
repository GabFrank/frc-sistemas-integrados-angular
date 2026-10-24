# Plan #611 — «Últimas compras» no muestra compras de otro producto

## Problema

En **Gestión de compras → 2. Ítems del pedido**, `loadUltimasCompras(productoId)`
(`gestion-compras.component.ts` ~4837) se suscribe plano a `productoUltimasComprasGQL.fetch` y
asigna la respuesta sin mirar si sigue siendo la del producto seleccionado:

1. **Clics rápidos** (A y enseguida B): si la respuesta de A llega última, la tabla queda con las
   compras de A con B seleccionado. La primera respuesta además apaga la carga con la otra en vuelo.
2. **Respuesta tardía tras limpiar** (quitar/cambiar proveedor ~680, desvincular ~5168): la limpieza
   vacía la tabla y la respuesta posterior la vuelve a llenar, con `selectedProductoProveedor = null`
   (salen filas junto al mensaje «Seleccione un producto»).
3. **Error de red**: el `error` no vacía la tabla; quedan las filas del producto anterior.

## Decisión

Descartar la respuesta (éxito o error) cuyo `productoId` ya no es
`selectedProductoProveedor?.producto?.id`, y vaciar la tabla en el `error`. Se compara por
`producto.id` y no por referencia porque `loadProductosProveedor` (~4678) reemplaza el objeto
seleccionado por el de la lista nueva con el mismo producto.

Indicador de carga en una respuesta descartada:

- Si hay otro producto seleccionado con id, su propio fetch está en vuelo (todos los caminos que
  seleccionan llaman a `loadUltimasCompras`: clic ~4938 y teclado ~5348), así que la carga sigue
  prendida hasta que llegue esa respuesta. Excepción benigna: con dos fetches del **mismo**
  producto (A→B→A), la primera respuesta de A pasa el guard y apaga la carga con la segunda en
  vuelo; los datos son los mismos.
- Si no queda producto seleccionado (o no tiene `producto.id`, caso en que no se pidió nada), se
  apaga la carga: no hay otra respuesta que la apague.

Además (auditoría): las limpiezas al quitar/cambiar proveedor (~680) y al desvincular (~5170)
apagan también la carga, para que no quede el spinner junto a «Seleccione un producto» mientras
llega la respuesta que se va a descartar. Y `loadUltimasCompras` vacía la tabla al empezar a cargar,
para que durante la carga de B no se vean las filas de A con B seleccionado.

Se descarta `Subject + switchMap`: obliga a que las limpiezas (que no pasan por
`loadUltimasCompras`) también emitan para cancelar, y toca más código para el mismo resultado.

## Fase 1 — desktop (única)

`src/app/modules/operaciones/compra/gestion-compras/gestion-compras.component.ts`:

- Método privado `descartarUltimasCompras(productoId)`: `false` si `productoId` es el del
  seleccionado; si no, apaga la carga cuando no queda seleccionado con id y devuelve `true`.
- `next`: primera línea `if (this.descartarUltimasCompras(productoId)) return;`. Se borra el
  comentario «Si falla, quedan las filas de antes».
- `error`: el mismo guard al principio (una respuesta vieja que falla no muestra alerta ni toca la
  tabla); si es la vigente, la alerta y la carga apagada (la tabla ya quedó vacía al empezar).
- Al empezar la carga, `ultimasComprasDataSource.data = []` junto a `ultimasComprasLoading = true`.
- Limpiezas ~680 y ~5170: `this.ultimasComprasLoading = false;`.

HTML y SCSS: sin cambios. **Compromiso conocido:** con la tabla vacía tras un error, el template
muestra «No hay compras anteriores para este producto» (línea ~841) junto a la alerta de error,
aunque no se sabe si hay compras. Es lo que pide la issue (vaciar la tabla en el error) con el
texto existente; un estado de error propio en el panel sería un cambio de template aparte.

Tests: N/A para desktop porque su CI no corre tests y no hay batería confiable (ciclo §1 paso 7).
Gate: `npm run check`.

## Datos nuevos

Ninguno. Sin cambios de GraphQL, migraciones ni replicación.

## Prueba por pantalla

`ng serve -c web` (4200) contra el central local (8081), en Chrome con DevTools.

Throttling no sirve para el orden inverso: enlentece A y B por igual y todas las consultas son POST
al mismo `/graphql`. Apollo sale por `HttpClient` (XHR), así que desde la consola se parchea
`XMLHttpRequest.prototype.send` para **demorar 6 s solo la respuesta** cuyo body tenga
`productoUltimasCompras` con el id de A (el timeout de Apollo es 60 s), y se loguea el orden real
de llegada. Para el error, el mismo parche aborta la request en vez de demorarla.

1. **Clics rápidos, A llega última**: demorar A; elegir A y enseguida B. Esperado: durante la
   espera, tabla vacía y spinner; llega B → compras de B y sin spinner; llega A (log) → nada cambia.
2. **Respuesta tardía tras limpiar**: demorar A; elegir A y enseguida quitar el proveedor en
   «1. Datos generales». Esperado: tabla vacía, sin spinner desde el momento de la limpieza, solo
   «Seleccione un producto»; al llegar A, sigue igual. Repetir con «Desvincular» del producto A
   (y volver a vincularlo al terminar).
3. **Error de red de la vigente**: cargar A, abortar las de B, elegir B. Esperado: alerta de error,
   tabla vacía (con «No hay compras anteriores», ver compromiso), sin spinner.
4. **Error de una vieja con la vigente OK**: abortar A con demora; elegir A y enseguida B.
   Esperado: compras de B, sin alerta, sin spinner colgado.
5. **Regresión**: sin parche, A → B → teclado ↑/↓: la tabla sigue al seleccionado; producto sin
   compras → «No hay compras anteriores».

Datos: proveedor con al menos dos productos con compras en la base local; si no hay, sembrar por
SQL y restaurar.

### Resultado (2026-10-24)

Build `web-production` servido en `127.0.0.1:4201` contra un central propio en `:8084` (copia en
V254.3, sin migrar la base), sesión de MR, pedido de prueba 39 del proveedor 1. Las respuestas se
demoraron o se hicieron fallar desde la consola (parche de XHR por `variables.id`; el error es un
reenvío a un puerto cerrado, `status 0`), con el orden real de llegada registrado.

1. A llega última: OK. LIMON llegó a los 46 ms y COCA a los 6046 ms; la tabla quedó con LIMON, sin
   spinner. Mientras COCA estaba en vuelo: tabla vacía y spinner.
2. Quitar proveedor con COCA en vuelo: OK. Llegó a los 7091 ms; al volver a «2. Ítems», panel vacío,
   sin spinner, «Seleccione un producto». Desvincular COCA con su respuesta en vuelo: OK. A los
   150 ms, sin spinner y «Seleccione…»; la respuesta (7029 ms) no volvió a llenar la tabla.
   Vínculo 2 restaurado por SQL (`activo = true`, motivo `null`).
3. Falla la vigente (MONSTER): OK. Alerta «Error al cargar las últimas compras del producto»,
   tabla vacía, sin spinner, «No hay compras anteriores» (el compromiso de arriba).
4. Falla una vieja (ECOPOWER, 3003 ms) con LIMON ya cargado (34 ms): OK. Sin alerta ni spinner,
   quedan las 4 compras de LIMON.
5. Regresión: COCA (2 compras) → LIMON (4); teclado ↓ → MONSTER (1), ↑ → LIMON (4). OK.

No probado aparte: un producto sin compras (los cuatro del proveedor tienen); el mensaje sale de la
misma condición del template que se vio en el caso 3. Visto de paso: una request que nunca termina
deja el spinner hasta el timeout de 60 s de Apollo, y una consulta igual mientras tanto se une a
esa (deduplicación de Apollo). Pasaba antes; no lo cambia este fix.

## Fuera de alcance

Cambiar de página o buscar en «Productos del proveedor» (~5079, ~5094) y que el seleccionado
desaparezca de la lista recargada (~4667, ~4689) ponen `selectedProductoProveedor = null` sin vaciar
la tabla: quedan las filas viejas junto a «Seleccione un producto». Lo mismo al elegir un vínculo
sin `producto.id` (~4937, ~5347): no se pide nada y quedan las filas del anterior; en la práctica
todo vínculo trae su producto. No es una respuesta fuera de orden y no está en la #611; se informa
a Franco.

## Auditoría del plan (paso 5)

- **Eje A** (propagación): nada sale del componente; `loadUltimasCompras` solo tiene los dos
  llamadores citados, la comparación por `producto.id` vale para los tres objetos que se asignan a
  la selección. Riesgo: al limpiar, el spinner seguía visible junto a «Seleccione un producto»
  hasta la respuesta descartada → **aplicado** (limpiezas apagan la carga). Vínculo sin
  `producto.id` → a «Fuera de alcance».
- **Eje B** (estado): el guard se sostiene en A→B, A→limpiar→B, error viejo con vigente OK, doble
  clic y reemplazo por `loadProductosProveedor`; reversión limpia. Riesgos: (1) vínculo sin id →
  «Fuera de alcance»; (2) A→B→A apaga la carga antes → texto corregido, benigno; (3) vaciar en el
  error muestra «No hay compras» → **anotado como compromiso**, es lo que pide la issue; (4) filas
  de A visibles mientras carga B → **aplicado** (vaciar al empezar); (5) la prueba no forzaba el
  orden inverso → **aplicado** (parche de XHR con demora por body); (6) faltaba el caso de error
  viejo con vigente OK → **agregado** (caso 4).

## Sin verificar

- Nada del central: no se toca.
