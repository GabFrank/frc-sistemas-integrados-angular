# Plan #582 — Ventas de caja: Limpiar filtro no reinicia Modo ni Moneda

Rama: `fix/ventas-caja-limpiar-filtro-modo-moneda` (desde `develop`). Pieza: desktop. Un PR.

## Problema

`ListVentaComponent.onResetFiltro()` (`src/app/modules/operaciones/venta/list-venta/list-venta.component.ts`)
limpia ID, forma de pago, estado, toggles y paginador, pero no `modoControl` ni `monedaControl`.
`onGetVentas()` manda los dos a `ventaService.onSearch` (`modoControl.value`, `monedaControl.value?.id`),
así que el próximo Buscar sigue filtrando por el modo y la moneda viejos.

## Fase 1 (única)

- En `onResetFiltro()`: `this.modoControl.setValue(null)` y `this.monedaControl.setValue(null)`.
  `null` es el valor de la opción «Todas» de los dos `mat-select` del HTML.
- Sin cambios en backend, consulta GraphQL, modelos ni HTML.

## Tests

- N/A batería para desktop (el CI no corre Karma; ciclo §1 paso 9). Gate: `npm run check`.
- Prueba por pantalla (desktop web contra central/filial local): Ventas de caja de una caja con
  ventas → elegir Modo = Delivery y Moneda = una moneda → Buscar (lista filtrada) → Limpiar filtro
  (los dos selects muestran «Todas») → Buscar (vuelven todas las ventas; la request GraphQL lleva
  modo y moneda en null).
- Mirar la variable enviada en la request `ventasPorCajaId` (Network): `isDelivery` null y
  `monedaId` ausente, no solo que el select diga «Todas». Repetir con Modo = Local (`false`).

## Datos nuevos

Ninguno.

## Sin verificar

- Electron (impresión, IPC): no se toca.
