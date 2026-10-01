# Plan — el PDV guarda el costo medio en cada ítem de venta

Rama: `fix/pdv-costo-medio-venta` (desde `develop` @ `66e192ce`). Pieza: **desktop**, sola.

## Qué resuelve

La ventana de lucro por producto calcula el costo con `venta_item.costo_unitario`, que el PDV
llena al agregar el ítem. Según por dónde entre el producto, el PDV guarda una cosa u otra:

| Ruta | Archivo | Hoy guarda |
|---|---|---|
| Buscador (F-búsqueda) | `pdv/layout/buscador/buscador.component.ts:163` | `ultimoPrecioCompra` |
| Grupo PDV → diálogo de selección | `pdv/comercial/venta-touch/venta-touch.component.ts:631` | `ultimoPrecioCompra` |
| Escaneo / toque directo | `pdv/comercial/venta-touch/venta-touch.component.ts:956` | `costoMedio` |

`ultimoPrecioCompra` es el precio de **una** compra. Caso real (bodega, 2026-09-17): CERVEPAR
facturó 660 latas de BRAHMITA ULTRA CERO a 42,5 Gs como promoción (factura 140215, pedido 1810,
cargado sin marca de bonificación). El costo medio quedó bien (2.162,97) pero 1.813 ítems de venta
entre el 17/09 y el 30/09 se guardaron con costo 42,5, y el lucro del 29/09 mostró costo medio
120 Gs.

El costo que corresponde a la mercadería vendida es el **costo medio ponderado**.

## Fase única — commit `fix(pdv): guardar el costo medio en los items de venta`

1. Las tres asignaciones pasan a `producto?.costo?.costoMedio || producto?.costo?.ultimoPrecioCompra`.
   El respaldo cubre el producto sin costo medio (alta nueva, consulta cacheada vieja): sin él
   el ítem quedaría sin costo y el reporte caería al último costo global, que es peor.
2. Pedir `costoMedio` en las consultas que alimentan esas rutas y hoy no lo piden:
   - `productos/producto/graphql/graphql-query.ts` → `productoSearchPdv` (lista del buscador) y
     `findByPdvGrupoProductoQuery` (productos de un grupo PDV).
   - `pdv/comercial/venta-touch/pdv-categoria/graphql/graphql-query.ts` → bloque
     `pdvGruposProductos.producto.costo` (línea 44).
   Las que ya lo piden: `productoPorCodigoQuery`, `productoQuery` (detalle), el segundo bloque de
   `pdv-categoria` (línea 165).

Fuera de alcance (pedido explícito del usuario): corregir los ítems de venta ya guardados.

## Datos nuevos

Ninguno. No hay columna, campo GraphQL ni migración nueva: `CostoPorProducto.costoMedio` ya
existe en el schema del central y del filial (`costo-por-producto.graphqls:8` en filial).

| Dato | Escribe | Lee |
|---|---|---|
| `venta_item.costo_unitario` (existente, cambia el valor) | desktop PDV (estas 3 rutas) → filial `VentaItemInput.precioCosto` | central `ProductoRepository.findLucroPorProducto` y `VentaItemRepository` (lucro por funcionario, l.60); desktop `pago-touch.component.ts:1084` (tope de descuento) |

Efecto colateral buscado: el tope de descuento de `pago-touch` (`onDescuento`) usa el mismo
`precioCosto`; pasa a calcularse con el costo medio.

## Tests

- Paso 9: `N/A para desktop porque no hay batería en ningún gate [ev: desktop:.github/workflows/ci.yml]`.
  Gate: `npm run check` (AOT producción), leído del log.
- Prueba de runtime: verificar en el PDV servido como web contra un filial que el `saveVenta`
  manda `precioCosto` = costo medio por las rutas buscador y grupo.

## Qué queda sin verificar

- El flujo de **delivery** no asigna `precioCosto` (los ítems quedan con costo nulo y el reporte
  usa el último costo global). No se toca acá; queda anotado.
- Clientes desktop sin actualizar siguen guardando `ultimoPrecioCompra` hasta que acepten el update.

## Auditoría del plan (paso 5) y qué se hizo

| Eje | Hallazgo | Verificación | Decisión |
|---|---|---|---|
| A | Si la última fila de `costo_por_producto` tiene `costo_medio` nulo/0, el respaldo vuelve a `ultimoPrecioCompra` | bodega 2026-10-01: de 6.881 productos, 15 sin costo medio y **0** con costo medio vacío y último precio > 0 | se mantiene el respaldo; hoy no se da el caso |
| A | El lucro por funcionario también lee `costo_unitario` | `VentaItemRepository.java:60` (central) | agregado a la tabla de datos; mejora igual que el de producto |
| A | El ítem de envase (`seleccionar-envase-dialog.component.ts:49`) se crea sin costo | leído | preexistente, fuera de alcance; anotado |
| A | `item2` (venta partida en caja) | `Object.assign(item2, item)` en `venta-touch.component.ts:776` copia el costo | sin cambio |
| B | El tope de descuento de `pago-touch` cambia: con costo 42,5 el margen era casi 100% | `pago-touch.component.ts:1076-1090` + `descuento-dialog` | buscado; avisar a cajeros que el tope baja en productos que tenían último precio bajo |
| B | Costos medios < 100 Gs (posibles importes en otra moneda) | bodega: 18 productos | no se agrega guarda en el PDV: no hay valor mejor al que caer; es un problema del dato |
| B | `crearItem` (l.956) recibe el producto de `productoPorCodigoQuery` | `buscador.component.ts:206,276` + query pide `costoMedio` | correcto; se le agrega el mismo respaldo por consistencia |
| B | Clientes sin actualizar siguen guardando el último precio | — | se acepta; el lucro mejora a medida que actualizan |
| A | `pago-touch` multiplica `precioCosto * cantidad` sin la cantidad de la presentación | `pago-touch.component.ts:1085` | preexistente, fuera de alcance; anotado |

## Despliegue

Solo desktop. Sin cambio de contrato: un desktop nuevo contra un filial viejo funciona igual
(el campo ya existía). Al mergear, el auto-update muestra *Cerrar y actualizar* en ≤5 min por canal.
