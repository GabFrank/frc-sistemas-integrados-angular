# Ítem a precio cero en el PDV

Un ítem a precio cero no se puede facturar electrónicamente: el filial exige precio unitario mayor a
cero al armar el documento («El precio unitario del item … debe ser mayor a cero»). Desde el filial
`5.0.0-alpha.44` esa venta se guarda **sin factura** y el PDV muestra «Venta guardada con éxito», sin
ninguna señal. Además entrega mercadería gratis (#473).

## Por qué se bloquea y no se avisa

- El PDV no tiene regalos ni bonificaciones: el precio de un ítem sale solo del catálogo
  (`item.precioVenta.precio`). No hay edición de precio ni descuento por ítem.
- La única vía a un precio cero era el alta de precio por sucursal (`adicionar-precio-dialog`), que
  solo exigía el campo. `precio-especial-dialog` y la ficha del producto ya exigían 1 o más.
- En los datos no ocurre (13/10/2026): copia local del central de bodega, 0 ítems vendidos a precio ≤ 0
  sobre 2.183.233 de 12 meses y 0 precios activos en 0 sobre 11.419; copia de una filial de farmacia, 0
  precios activos en 0 sobre 13.827. Precio positivo mínimo: 250 en bodega, 100 en farmacia.

Un precio en cero es un error de carga del catálogo: se frena en el catálogo y en el PDV.

## PDV (`venta-touch`)

Reglas puras en `venta-touch/precio-vendible.ts`, con spec:

- `tienePrecioVendible(precio)`: precio numérico mayor a cero.
- `itemConPrecioEnCero(items)`: el primer ítem cuyo precio (`item.precio`, si no `item.precioVenta.precio`)
  es un número ≤ 0. Un precio que no vino en la consulta no cuenta.

En `venta-touch.component.ts`:

- **Elegir el precio:** los `find` que resuelven `precioVenta` en `addItem` y `crearItem` (también el de
  la presentación caja) solo toman precios vendibles. Un precio en 0 no tapa a otro válido del mismo
  producto.
- **`addItem`**, por donde entran todos los ítems (botones, buscador, lotes, envases, partición en
  cajas): sin precio vendible —también sin ningún precio— avisa con el nombre del producto y no lo
  agrega. El aviso nombra al producto porque un envase entra por acá después de su producto.
- **`crearItem`** (código de barras): «El producto no tiene precio» también cuando no quedó ningún
  precio vendible.
- **`agregarConLote`**: avisa antes de abrir el selector de lote.
- **Partición en cajas:** las unidades pasan a la caja solo si la caja tiene precio vendible; si no,
  quedan en la presentación que eligió el cajero.
- **Al cobrar** (F8, F11, F12): si el carrito tiene un ítem a precio cero —uno de una venta guardada o
  de un delivery, que no pasó por `addItem`— avisa con el nombre y no cobra hasta quitarlo.

## Catálogo (`adicionar-precio-dialog`)

- `esPrecioGuardable(nuevo, guardado)` (`precio-por-sucursal/precio-guardable.ts`, con spec): número de
  1 o más. Mismo criterio que el precio especial y la ficha del producto.
- **Excepción:** editar un precio viejo que ya estaba en 0 sin cambiarle el valor, para poder
  inactivarlo o cambiarle el tipo. Por eso es un chequeo al guardar y no un `Validators.min`.
- Corre en `onSave` y de nuevo en `continuarGuardado`, por donde pasa también el precio mínimo sugerido
  por margen.
- Aviso: «El precio tiene que ser de 1 o más».

## Probado en runtime (14/10/2026)

Desktop con `ng serve -c web`, filial y central `develop` locales. Unidad en 0 por botón, buscador y
código de barras: no entra. Caja en 0 y 12 unidades: entran al precio unitario. Dos precios, el primero
en 0: entra con el válido. Ítem del carrito en 0: F8, F11 y F12 no cobran. Alta en 0 y en 0,5 y edición
a 0: no guarda. Alta de 7.000: guarda. Precio viejo en 0 inactivado sin cambiar el valor: guarda.

## Sin cubrir

- Envase con precio 0: el producto entra y el envase no, con un aviso. En bodega no hay ninguno.
- El backend (central y filial) sigue aceptando un precio 0 si llega por otro cliente o por la base.
- Regalos y bonificaciones no existen como función; si hacen falta, es una feature que tiene que
  resolver cómo se facturan.
- El cableado en `venta-touch.component.ts` no tiene spec; se probó en runtime.
- No se verificó si la PWA o el mobile cargan precios por sucursal.
