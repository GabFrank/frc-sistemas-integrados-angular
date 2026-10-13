# Plan — ítem a precio cero en el PDV (#473, segunda parte)

Rama: `fix/pdv-item-precio-cero` (desde `develop`, `9bbd4533`). Solo desktop. PR aparte del #483.

## Qué resuelve

Un ítem a precio cero no se puede facturar electrónicamente: el filial exige precio unitario mayor a
cero al armar el documento (`SifenService`, «El precio unitario del item … debe ser mayor a cero»).
Desde el filial `5.0.0-alpha.44` esa venta se guarda **sin factura** y el desktop muestra «Venta
guardada con éxito», sin ninguna señal.

El #473 pedía avisar y definir qué hacer con regalos y bonificaciones. Lo verificado cambia el enfoque.

## Lo que se verificó (13/10/2026)

- **El PDV no tiene regalos ni bonificaciones.** El precio de un ítem sale solo del precio del
  catálogo (`item.precioVenta.precio`). No hay edición de precio ni descuento por ítem:
  `edit-item-dialog` solo cambia la cantidad y nada en `modules/pdv` asigna `valorDescuento` a un ítem.
- **La única vía a un precio cero es el catálogo.** `adicionar-precio-dialog` (alta y edición de
  precio por sucursal) valida `Validators.required` y acepta 0. `precio-especial-dialog` y la ficha
  del producto ya exigen `Validators.min(1)`.
- **En los datos no ocurre.** Copia local del central de bodega: 0 ítems vendidos a precio ≤ 0 sobre
  2.183.233 de los últimos 12 meses; 0 precios activos en 0 sobre 11.419; 0 precios especiales en 0.
  Copia local de una filial de farmacia: 0 precios en 0 sobre 13.827 (tiene solo 1.418 ventas, así
  que farmacia queda casi sin verificar en ventas).
- El PDV ya rechaza el producto **sin** precio en `crearItem` («El producto no tiene precio»,
  `venta-touch.component.ts`, condición `item.presentacion == null || item.precioVenta == null`), pero
  `addItem`, por donde entran todos los ítems, no valida nada.

Conclusión: un ítem a precio cero en el PDV es un error de carga del catálogo. Además de no poder
facturarse, entrega mercadería gratis.

## Decisión (aprobada por Franco el 13/10/2026)

Bloquear antes en vez de avisar después. No se toca el filial.

## Fases

### Fase 1 — el PDV no acepta un ítem sin precio vendible

- Funciones puras en `venta-touch/precio-vendible.ts`, con spec:
  `tienePrecioVendible(precio)` (precio numérico mayor a cero) e `itemConPrecioEnCero(items)` (el
  primer ítem cuyo precio es un número menor o igual a cero; un precio que no vino no cuenta).
- **Elegir el precio:** los `find` que resuelven `precioVenta` en `crearItem` y `addItem` (también el
  de la presentación caja) solo toman precios vendibles. Así un precio en 0 no tapa a otro válido del
  mismo producto, que con el bloqueo dejaría de poder venderse.
- `crearItem`: avisa también cuando no quedó ningún precio vendible.
- `agregarConLote`: si el ítem ya trae un precio y no es vendible, avisa antes de abrir el selector de
  lote, para que el cajero no elija lote y recién después se entere.
- `addItem` (el embudo: buscador, selector de productos, lotes, envases, partición en cajas): después
  de resolver `item.precioVenta`, si no hay precio vendible —**también si no hay precio**: hoy un ítem
  sin precio entra al carrito con precio indefinido—, aviso con el nombre del producto y `return`,
  reiniciando `cantidadControl` y `selectedTipoPrecio` como hace el final del método.
  El aviso nombra el producto porque un envase entra por acá después de su producto.
- Partición en cajas: la rama que mueve unidades a una presentación mayor solo se toma si esa
  presentación tiene precio vendible. Si no, las unidades quedan en la presentación original.
- **Al cobrar** (`onTicketClick` y `onPagoClick`): si el carrito tiene un ítem con precio en cero
  —uno recuperado de una venta guardada o de un delivery abierto, que no pasó por `addItem`—, aviso
  con el nombre y no se cobra hasta quitarlo. Solo cuenta un precio que es un número menor o igual a
  cero: un ítem cuyo precio no vino en la consulta no bloquea el cobro.
- Tests (Karma): spec de las dos funciones. El cableado en `venta-touch.component.ts`, que no tiene
  spec, se cubre con la prueba de runtime.

### Fase 2 — el alta de precio por sucursal no acepta cero

- `adicionar-precio-dialog`: antes de guardar, el precio tiene que ser un número mayor o igual a 1.
  Mismo criterio que `precio-especial-dialog` y la ficha del producto.
- **Solo en el alta o cuando el precio cambia.** Hay precios viejos en 0, inactivos (3 en la copia del
  central de bodega, 1 en la de farmacia): se tienen que poder seguir editando para inactivarlos o
  cambiarles el tipo. Por eso es un chequeo al guardar y no un `Validators.min` en el control.
- El chequeo corre en `onSave` y de nuevo en `continuarGuardado`, que es por donde pasa también el
  precio mínimo sugerido por margen (se aplica con `setValue` después de validar).
- Tests (Karma): la regla va en una función pura con spec. El spec del diálogo es el stub del CLI,
  sin providers: no se toca.

### Fase 3 — verificación

- `npm run verificar:imports` y `npm run check` (AOT), leídos del log.
- Runtime en local (desktop con `ng serve -c web`, filial `develop`): poner un precio en 0 en la base
  local para un producto de prueba y restaurarlo.

| Caso | Esperado |
|---|---|
| Producto con precio 0, por botón de categoría | aviso, no entra al carrito |
| Mismo producto por buscador / código de barras | aviso, no entra al carrito |
| Presentación caja en 0 y unidad con precio, cantidad que completa una caja | entran todas las unidades al precio unitario |
| Producto con precio normal | entra como siempre |
| Dos precios del mismo tipo de filtro, uno en 0 y otro válido | entra con el válido |
| Carrito con un ítem en 0 que no pasó por el control | no deja cobrar hasta quitarlo |
| Alta de precio por sucursal con 0, y edición que lo cambia a 0 | no guarda, avisa |
| Edición de un precio viejo en 0 sin cambiar el valor (inactivarlo) | guarda |
| Alta de precio con 1 o más | guarda |

## Datos nuevos

Ninguno.

## Compatibilidad y orden

- Sin migración, sin cambio de contrato GraphQL, un PR (desktop → `develop`), independiente del #483.
  Los dos tocan `addItem` en zonas distintas; el que se mergee segundo puede necesitar un merge de
  `develop`.
- Rollback: solo cliente.
- Roles: `N/A para desktop porque` no se agrega ninguna acción.
- Batería: `N/A para desktop porque` el CI no corre tests; el gate es `npm run check`.

## Fuera de alcance

- Regalos y bonificaciones: no existen hoy como función. Si negocio los quiere es una feature nueva,
  que tiene que resolver cómo se facturan.
- Validación en el backend: el central y el filial siguen aceptando un precio 0 si llega por otro
  cliente o por la base.
- Las otras causas de «venta guardada sin factura» del filial (`FACTURA_NO_EMITIBLE`: cantidad que
  redondea a cero, sucursal sin código de establecimiento, moneda extranjera sin tipo de cambio):
  ninguna depende del cajero.

## Auditoría del plan (paso 5, 13/10/2026)

| Hallazgo | Eje | Verificado | Qué se hizo |
|---|---|---|---|
| Un precio en 0 hallado primero tapa a otro válido y el producto queda sin poder venderse | B | sí (`find` en `addItem` y `crearItem`) | los `find` solo toman precios vendibles |
| `Validators.min(1)` impide editar un precio viejo en 0, aunque sea para inactivarlo | A y B | sí; hay 3 + 1 precios inactivos en 0 | chequeo al guardar, solo en alta o si el precio cambia |
| El precio sugerido por margen no pasa por el validador; el plan decía que sí y que era de promos | A y B | sí (`aplicarPrecioSugerido`) | el chequeo se repite en `continuarGuardado`; texto corregido |
| Ítems de un carrito guardado o de un delivery no pasan por `addItem` | A | sí | chequeo al cobrar |
| En `addItem`, un ítem sin ningún precio entra con precio indefinido | A | sí | el bloqueo cubre también la falta de precio |
| El rechazo no reinicia `selectedTipoPrecio` | B | sí | se reinicia |
| En el camino de lote el cajero elige lote y después se entera | B | sí | aviso en `agregarConLote` |
| Envase con precio 0: el producto entra y el envase no, sin explicación | A y B | sí en el código; en los datos no hay (3 envases en bodega, todos con precio activo) | el aviso nombra el producto rechazado |
| Si la presentación original está en 0 se rechaza todo, aunque la caja tenga precio | B | sí | aceptado: sin precio en la presentación que eligió el cajero no hay venta |
| Precios legítimos menores a 1 | A y B | no hay ninguno (mínimo: 250 en bodega, 100 en farmacia) | sin cambio |
| Pesable cuyo total redondea a 0 | B | sí, leído | fuera de alcance |

## Sin verificar

- Si algún producto de farmacia se vende a propósito a precio 0. En bodega no hay ni un caso en 12
  meses, y sus 3 envases tienen precio activo.
- Si la PWA o el mobile pueden cargar precios por sucursal.
