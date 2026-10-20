# Plan — total de aumento y total final en el detalle de una venta (issue #553)

Pieza: **desktop**. Rama: `fix/venta-total-aumento-lista`, desde `origin/develop` (e2c8b876). Sin cambios de
backend, de GraphQL ni de base.

## Qué pasa hoy

`getTotales(venta)` arma el pie del detalle de **una venta** (la fila desplegada) en tres componentes con el
mismo bloque copiado: `list-venta` (lista de ventas de la caja), `generic-list-venta` (lista con filtros; la abren
el menú lateral e `historial-lote`) y `list-movimiento-stock` (detalle de un movimiento de tipo VENTA; ahí el
aumento solo se suma en guaraníes).

- **Total aumento** suma `valor` con su signo. Hasta 2024-10 el aumento se guardaba **negativo** (caja 2945 /
  sucursal 1: venta 367692 muestra −270), desde entonces positivo. El balance de la caja (central #457) ya lo toma
  en valor absoluto.
- **Total final** = pagos + vueltos + aumento. El pago **ya incluye** el aumento: en las ventas nuevas lo cuenta
  dos veces (venta 79120: total 72.000, pago 80.000, aumento 8.000 → muestra 88.000); en las viejas lo resta.
  Mismo caso que central #454.

Corrección a la issue: el «−273» del ejemplo es la suma de `valor` sin `cambio`; la pantalla muestra −270 (Gs) y
−411, −1.424… (Rs × 1.300) por venta. La comparación con el balance es contra la **suma** de los aumentos de las
ventas de la caja, no contra un total de la lista.

## Cambio (fase única)

En `getTotales` de los tres componentes:

1. `totalAumento += Math.abs(valor × cambio)` (Gs: `Math.abs(valor)`, como el resto de esa rama). En
   `list-movimiento-stock` se agrega la rama de aumento en REAL y DOLAR, que hoy falta.
2. Las líneas `totalFinal += …` se borran. `totalFinal` pasa a ser **el total de la venta** (decisión de Franco,
   2026-10-20), con la misma cuenta que la columna «Total» y el «Total:» del detalle:
   `(venta?.totalGs ?? 0) + (venta?.delivery?.precio?.valor ?? 0)`, asignado **después de los resets y fuera del
   `forEach`**: una venta sin cobro (a crédito) muestra igual su total y no 0.
   `totalGs` es el total de los ítems **antes** del descuento (venta 65008: total 52.500, descuento 750, pago 51.750),
   y no incluye el envío (`venta-touch.component.ts:calcularTotales` suma solo los ítems).

`totalRecibido*` y `totalDescuento` no cambian.

## Auditoría del plan (paso 5)

- **Eje A** — tercera copia en `list-movimiento-stock.component.ts:951` (MAYOR): **entra** en este fix, para que la
  misma venta no muestre dos aumentos según la pantalla. Nadie más lee `totalFinal`/`totalAumento` (solo sus
  templates); las tres queries ya traen `totalGs` y `delivery.precio.valor`; sin cambio de contrato GraphQL.
  Fuera de alcance, sin el bug: `analisis-diferencia:calcularTotalesDeVentas` (ignora el aumento),
  `getCobroTotalGeneral`/`getCobroTotalFinal` (lo excluyen a propósito).
- **Eje B** — asignar `totalFinal` fuera del `forEach` (aplicado arriba). Riesgo conocido, aceptado por la decisión
  de Franco: con descuento, «Total final» (52.500) queda por encima de lo cobrado («Total recibido» 51.750); el
  rótulo no se cambia. Preexistente y fuera de alcance: los totales son campos únicos del componente, con dos filas
  desplegadas ambas muestran los de la última. Sin estado persistido: un desktop sin actualizar sigue con el cálculo
  viejo.

## Datos nuevos

Ninguno: no nace campo, columna ni clave. `totalGs` y `delivery.precio.valor` ya vienen en las dos queries de lista
y ya los lee el template.

## Tests

- Batería: `N/A para desktop porque su CI no corre tests [ev: .github/workflows/ci.yml]`; gate `npm run check`.
- Prueba por pantalla (desktop web contra el central local 8081, base `bodega`):
  - lista de ventas de la caja 2945 / sucursal 1: venta 367692 → aumento 270 y total final 256.730; las 5 ventas
    en reales con aumento → aumento positivo; suma de los 6 aumentos ≈ 4.570 = «Aumento» del balance;
  - una venta reciente con aumento (79120): aumento 8.000, total final 72.000 (antes 88.000);
  - una venta con descuento (65008): total final 52.500, igual a la columna «Total»;
  - una venta con delivery: total final = columna «Total» (incluye el envío);
  - una venta a crédito sin cobro y una cancelada: total final = columna «Total»;
  - lo mismo en la lista con filtros (`generic-list-venta`), filtrando «con aumento»;
  - movimientos de stock: desplegar el movimiento VENTA de la 367692 y de una venta en reales con aumento.

## Qué queda sin verificar

- Ventas en dólares con aumento: no hay casos en la base local (se verifica la rama por lectura: es la misma
  cuenta que la de reales).
