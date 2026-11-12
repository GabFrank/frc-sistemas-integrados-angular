# Plan #718 — el cobro de un delivery en otra moneda usa el cambio del día

Rama `fix/delivery-cobro-cambio-venta` desde `develop` (`5779e768`). Una sola pieza: desktop.

## Problema

PDV en USD. Un delivery armado con 6.450 guarda su venta con `cotizacion = 6450`; si la cotización
del comercio pasa a 6.500 antes de finalizarlo, `pago-touch` arma cada `CobroDetalle` con el `cambio`
de la lista de monedas del día: `cobro_detalle` queda `moneda USD, valor 5.61, cambio 6500`
(36.465 Gs) mientras venta y factura dicen 36.185 Gs (5,61 × 6.450).

## Decisión

El cobro de un delivery ya armado usa **la cotización de su venta**, la misma regla que
`VentaTouchComponent.contextoDelivery()` ya aplica al guardar el delivery («una venta tiene una sola
cotización: un delivery ya guardado la conserva») y que `DeliveryMonedaService.convertirABase` usa
para precios y envío. Así caja, venta y factura cuadran en la moneda de la empresa.

## Cambio

`PagoTouchComponent.setPrecios()`: al leer las monedas, si `data.delivery.venta` tiene
`monedaId` igual a la moneda del PDV (`data.monedaBase`) y `cotizacion > 0`, la moneda del PDV de
la lista local se reemplaza por una **copia** con `cambio = venta.cotizacion × cambio de la empresa`
(inverso de `cotizacionEmpresa`). No se muta el objeto de Apollo ni el `monedaPdv` de `venta-touch`.

Todo lo que hoy lee el cambio de la moneda base sale de esa copia sin más cambios:
`item.cambio` / `item.cotizacion` de cada línea (`addCobroDetalle`), los factores de las otras
monedas (`factorDe` → un cobro en Gs o R$ se convierte por la cotización de la venta),
`completarCotizacionDeLineas` en `venta-touch` (usa `cd.moneda` de la línea), el total de la
factura (`onFacturar`, `cotBase`) y la línea de crédito (`saldoAMonedaDelCredito`).

Sin delivery, con delivery en la moneda de la empresa o con venta sin cotización (venta no
convertida), queda todo como hoy.

## Datos nuevos

Ninguno: no nace columna, campo ni clave.

## Fase 1 (única) — commit + push

- `pago-touch.component.ts`: método privado `conCotizacionDelDelivery(monedas)` usado en `setPrecios`.
- Spec nuevo `pago-touch/cotizacion-delivery.spec.ts` (patrón `Object.create(prototype)`):
  - delivery USD con cotización 6.450 y lista con USD 6.500 → la copia de USD vale 6.450; el objeto
    original no cambia; las otras monedas son las mismas;
  - sin delivery / venta en otra moneda / sin cotización → la lista tal cual.
  Se revierte el fix y se comprueba que el spec falla.

Sin migración, sin GraphQL, sin roles.

## Pruebas

- Karma acotado al spec nuevo.
- `npm run check`.
- Por pantalla (desktop web contra filial local, sucursal 24, PDV en USD): armar un delivery con la
  cotización X, cambiar la cotización del dólar a Y, finalizarlo cobrando en USD y, aparte, en Gs;
  mirar `cobro_detalle.cambio` y que el equivalente en Gs coincida con `venta.total_gs`. Restaurar
  cotización y configuración al final.

## Qué queda sin verificar

- Líneas de cobro ya guardadas con el cambio del día antes de este fix (un delivery cobrado en parte
  con el desktop viejo): en la base quedan como están; al reabrir, el replay (`addCobroDetalle`)
  toma el cambio de la moneda seleccionada antes que el de la línea, así que en memoria se las
  cuenta con la cotización de la venta, coherente con el saldo.
- Una venta de delivery que llegue sin `cotizacion` (no pasó por `convertirABase`) cae al cambio
  del día, como hoy y como `contextoDelivery`. Finalizar sale de la lista, que convierte al abrir
  la fila (`list-delivery.component.ts`, `onDeliveryClick`); sin conversión los precios tampoco
  estarían en la moneda del PDV.
- Un cobro en una tercera moneda (R$) guarda el cambio del día del R$; su equivalente en Gs
  convierte por la cotización de la venta del US$. Es aritméticamente consistente.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Qué se hizo |
|---|---|---|---|
| A1/B1 | A y B | Si la venta llega sin `monedaId`/`cotizacion` (no convertida), el fix no hace nada sin avisar. | Verificado: finalizar sale de la lista y `onDeliveryClick` convierte al leer la fila; `envioEnBase` sale del mismo dato. Se documenta el fallback (igual que `contextoDelivery`); prueba por pantalla desde la lista. |
| A2/B1' | A y B | `cotizacion` y `monedaId` pueden llegar como texto. | `Number()` + `isFinite` y comparación por `String()`; caso en el spec. |
| A3 | A | Cobro en una tercera moneda: cambio del día de esa moneda. | Documentado arriba; sin cambio. |
| A4/B2 | A y B | El orden importa: `cambioDs`/factores y `monedaEmpresa()` dependen de la lista. | La copia se arma sobre `res`, con la empresa de `empresa$` o de `res`, antes de asignar `this.monedas`. El spec pasa por `setPrecios` (no por el método suelto) e incluye empresa con cambio ≠ 1. |
| B3 | B | El replay no «queda como está»: se re-sella en memoria con la cotización de la venta. | Texto corregido arriba. |
