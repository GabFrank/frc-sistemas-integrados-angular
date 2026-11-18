# Plan #716 — `descuentoGs` se acumula en `calcularTotales`

Rama `fix/pdv-descuento-acumulado` desde `develop` (`aba7e08b`). Una sola pieza: desktop.

## Problema

`VentaTouchComponent.calcularTotales()` pone `totalGs = 0` en cada llamada pero `descuentoGs` solo
vuelve a 0 con el carrito vacío; después suma `item.valorDescuento` de cada ítem. Con un ítem con
descuento > 0, cada llamada (hay ~15) lo vuelve a sumar.

Latente: hoy los ítems del carrito nacen con `valorDescuento = 0`; solo un delivery guardado con
descuento que vuelve al carrito lo dispararía (0 casos en alpha).

## Quién escribe y quién lee `descuentoGs`

| Escribe | Lee |
|---|---|
| `calcularTotales` (única escritura además del inicializador) | `app-totales` (`totalGs - descuentoGs`, y si muestra la fila de descuento) |
| | `venta.valorDescuento` del delivery nuevo (`venta-touch.component.ts`, ~l.2430) |

El pago (`pago-touch`) no lo lee. No nace ningún dato nuevo.

## Fase 1 (única) — commit + push

- `calcularTotales`: `this.descuentoGs = 0;` incondicional, en lugar del `if` por carrito vacío, y
  `cantidad * valorDescuento` (descuento unitario, ver auditoría A1/B1).
- Spec nuevo `calcular-totales.spec.ts` (patrón `Object.create(VentaTouchComponent.prototype)` de
  `verificar-moneda-carrito.spec.ts`):
  - dos llamadas seguidas con un ítem con descuento → el descuento es el del ítem, no el doble;
  - tras quitar el ítem con descuento (carrito no vacío) → 0.
  Se revierte el fix y se comprueba que el spec falla.

Sin migración, sin GraphQL, sin roles.

## Pruebas

- Karma acotado al spec nuevo (el CI del desktop no corre tests).
- `npm run check` (gate del repo).
- Por pantalla (desktop web contra filial local, sucursal 24): un delivery guardado con un ítem con
  `descuento_unitario > 0` (sembrado por SQL, restaurado al final) que vuelve al carrito; agregar y
  quitar otros ítems y ver que el total de `app-totales` no baja en cada cambio.

## Qué queda sin verificar

- Que no haya otra vía que hoy cargue ítems con descuento al carrito: por lectura no se encontró.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Qué se hizo |
|---|---|---|---|
| A1/B1 | A y B | `calcularTotales` suma `valorDescuento` sin la cantidad; el pago (`onPagoClick`, `cantidad * valorDescuento`) sí la multiplica. Verificado: en el filial `VentaItem.valorDescuento` es la columna `descuento_unitario`. | Entra en esta fase: es la misma línea y el mismo síntoma (total de `app-totales` y `venta.valorDescuento` del delivery). El spec lo cubre con cantidad 3. |
| A1' | A | El cobro rápido (`venta-touch.component.ts` ~l.2102, `cobroDetalleDesc`) también suma `valorDescuento` sin la cantidad. | Fuera de alcance: es otro camino (el detalle de descuento del cobro), no lee `descuentoGs`. Se informa para un issue aparte. |
| A2/B2 | A y B | Con dos carritos (`itemList`/`itemList2`) el descuento se arrastraba de un carrito a otro. | Lo corrige el reset incondicional; no hay flujo que dependa del arrastre. |
| A3 | A | `valorDescuento` undefined daría NaN. | Sin cambio: el modelo lo inicializa en 0 y la query lo trae; con el fix un NaN ya no queda pegado. |
| B3 | B | El spec necesita `esOtraMoneda`, `monedas` y `monedaModulo` para no fallar por otra causa. | Aplicado en `calcular-totales.spec.ts`. |
| B4 | B | La prueba por pantalla debe mirar la fila de descuento, no solo el total. | Agregado: delivery 8058 (venta 79329, ítem 144025 de la 24) con cantidad 2 y `descuento_unitario` 500; se restaura a 1 y 0. |
