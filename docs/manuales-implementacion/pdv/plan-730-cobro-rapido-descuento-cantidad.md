# Plan #730 — el descuento del cobro rápido no multiplica por la cantidad

Rama `fix/pdv-cobro-rapido-descuento-cantidad` desde `develop` (con #731 / #716 ya mergeado). Una sola
pieza: desktop.

## Problema

`VentaTouchComponent.cobrarTicket` (F8 / F11) arma la línea de descuento del cobro
(`cobroDetalleDesc.valor`) sumando `vi.valorDescuento` de cada ítem. `valorDescuento` es unitario
(`descuento_unitario` en el filial). El pago (`abrirPago`) y `calcularTotales` (#716) ya lo multiplican
por la cantidad.

Además (auditoría A-R1): el cobro rápido registra el efectivo y `cobro.totalGs` por el **bruto**
(`totalGs`), mientras que el Pago (F12) los deja **netos** del descuento (`pago-touch` precarga la línea de
descuento y el saldo es `valor - descuento`; `abrirPago` resta cada línea de descuento de
`cobro.totalGs`). Con un descuento, el cobro rápido quedaba con pago + descuento > total.

Latente: el cobro rápido no corre con delivery (`isDelivery` corta antes) y en el carrito normal ningún
camino del desktop escribe `valorDescuento` (nace en 0).

## Datos nuevos

Ninguno. Escribe `cobrarTicket` (`cobro.totalGs`, línea de pago y línea de descuento); lo lee el filial al
guardar el cobro (`cobro_detalle`; el cierre de caja, `AjusteCobro` y la factura legal ya toman la línea de
descuento como total). No cambia GraphQL, ni roles, ni migraciones.

## Fase 1 (única) — commit + push

- `cobrarTicket`: `descuento = Σ cantidad × valorDescuento` (con `|| 0` para no dejar NaN), calculado antes
  de armar el cobro; `cobro.totalGs` y la línea de efectivo = `totalGs - descuento`; `venta.totalGs` sigue
  en el bruto. Igual que el Pago.
- Spec nuevo `cobro-rapido-descuento.spec.ts` (patrón `Object.create(VentaTouchComponent.prototype)` de
  `calcular-totales.spec.ts`), capturando venta y cobro que llegan a `onSaveVenta`:
  - cantidad 3 × descuento 100 → línea de descuento 300, pago y `cobro.totalGs` netos, venta bruta;
  - `valorDescuento` indefinido → sin línea de descuento y pago = total;
  - sin descuento → sin línea y pago = total.
  Con el código viejo el primero falla (100 en vez de 300; 4000 en vez de 3700): verificado.
- `resetForm`: `descuentoGs = 0` junto a `totalGs = 0` (hallazgo de la prueba por pantalla, P-1).

## Pruebas

- Karma acotado a `cobro-rapido-descuento.spec.ts` + `calcular-totales.spec.ts` (el CI del desktop no
  corre tests).
- `npm run check` (gate del repo).
- Por pantalla (desktop web contra filial local 8082, sucursal 24, usuario MR): cargar un producto con
  cantidad 3, darle `valorDescuento` al ítem desde la consola (`ng.getComponent`, no hay camino de UI que
  lo escriba) y recalcular totales, F8, y mirar en `general` el `cobro` y sus `cobro_detalle` de esa
  venta: descuento = 3 × unitario, efectivo y `cobro.total_gs` netos. Repetir sin descuento.

Resultado (12/11, filial 8082 de `develop`, PDV 25, caja 1185, BURGUESA LATA 3 × 3.000 con descuento
unitario 500 inyectado): ventas 79337 (F8) y 79340 (F11) quedaron con `venta.total_gs` 9000, `cobro.total_gs`
7500, pago 7500 y descuento 1500; 79338 (F8 sin descuento) con cobro 9000 y una sola línea de pago; 79339
repite 79337 con `resetForm` corregido (la pantalla vuelve a 0 sin el «-1.500»). F11 intentó imprimir en una
cola inexistente: no salió nada.

## Qué queda sin verificar

- Que exista un camino real que cargue un descuento al carrito normal: hoy ninguno (por eso la prueba
  lo inyecta en memoria).

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Qué se hizo |
|---|---|---|---|
| A-R1 | A | `cobroDetalle.valor = totalGs` asume un total neto, pero `totalGs` es bruto (`calcularTotales`); el spec debería verificar pago + descuento = bruto. Verificado contra `pago-touch` (~l.362-379) y `abrirPago` (`cobro.totalGs -= descuento`). | Entra en la fase: misma función y mismo síntoma (el cobro no coincide con `app-totales`). Pago y `cobro.totalGs` netos; el spec lo cubre. |
| A-2 | A | Lectores en el filial (`PdvCajaService`, `AjusteCobro`, `FacturaLegalGraphQL`, `VentaService`) toman la línea de descuento como total; `VentaResolver.valorDescuento` ya multiplica. Ningún otro camino del desktop ni la PWA tiene el mismo bug. | Sin cambio: el fix los alinea. |
| A-3 | A | `aplicarMonedaAlCobro` no convierte `cd.valor`: el descuento debe sumarse en la moneda del PDV, antes de convertir. | Se respeta: el cálculo va antes de `aplicarMonedaDelPdv`. |
| B-1 | B | `valorDescuento` indefinido → NaN, escondido por `descuento > 0`. Con la resta en el pago, el NaN llegaría al efectivo. | `+vi.valorDescuento \|\| 0` y caso en el spec. |
| B-2 | B | El descuento no se redondea con `redondearEnMoneda` (balanza 0.35 × 100). | Sin cambio: `calcularTotales` y el Pago tampoco lo redondean; preexistente. |
| B-3 | B | El spec necesita stubs de `pdvSinValidar`, `carritoConPrecioEnCero`, `monedaDeCobro`, monedas y formas de pago, y `onSaveVenta` devolviendo un observable. | Aplicado. |
| B-4 | B | La prueba por pantalla guarda una venta real en el filial local; no se verificó si el filial valida pagos contra el total. | Se mira en la prueba: el filial aceptó el cobro neto (venta 79337). |

## Auditoría del diff (paso 8)

Fijo 1 y Fijo 2: N/A para el desktop porque el diff no toca resolvers, roles, migraciones ni GraphQL.
Condicionales: no se disparan (ni release ni replicación).

| # | Eje | Hallazgo | Qué se hizo |
|---|---|---|---|
| F3-1 | Fijo 3 | El cobro armado tiene la misma forma que el de `abrirPago`, también con moneda del PDV (`aplicarMonedaAlCobro` convierte `cobro.totalGs` neto en ambos). El filial no valida `cobro.totalGs` (`CobroGraphQL.saveCobro`) y un filial viejo recibe la misma forma. | Sin cambio. |
| F3-2 | Fijo 3 | El movimiento de caja del filial usa la línea de pago (`CobroGraphQL.java` ~l.82-91): antes F8/F11 con descuento registraba el bruto como efectivo; ahora el neto, como F12. | Es parte del arreglo. |
| F3-3 | Fijo 3 | Con un descuento del 100 % la línea de pago queda en 0 y el filial crea un movimiento de caja de 0. | Sin cambio: hoy no hay descuentos en el carrito normal; queda anotado. |

## Hallazgos de la prueba por pantalla

| # | Hallazgo | Qué se hizo |
|---|---|---|
| P-1 | Tras el F8 con descuento, el carrito vacío mostraba «0 Gs. / -1.500 Gs.»: `resetForm` limpia `totalGs` pero no `descuentoGs` (queda hasta el próximo `calcularTotales`). Preexistente, mismo escenario. | `descuentoGs = 0` en `resetForm`. |
