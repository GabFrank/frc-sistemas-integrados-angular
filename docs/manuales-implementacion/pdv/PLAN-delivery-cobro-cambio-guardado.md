# Plan: el delivery conserva la cotización guardada de cada línea de cobro

Rama `fix/pdv-delivery-cobro-cambio`, sale de `develop` (a11c7c57, merge del #334). Solo desktop.

## Qué resuelve

Checklist alpha → beta, punto 3.7 (2026-09-23, mauro). Se guardó un delivery con un cobro de 100 R$
(cambio 1200 en `cobro_detalle`), se dejó REAL sin cotización local y se hizo FINALIZAR. La pantalla
de pago descartó la línea de R$ con el aviso «No hay cotización cargada para REAL», recargó solo el
vuelto (−109.000), el saldo quedó en 120.000 y se cobró de nuevo. Venta 80079 (suc. 2, alpha):
`REAL 100 c=1200 | GS −109000 vuelto | GS 120000` → cobro duplicado.

## Causa raíz

`5ba9747f` hizo que el replay de `pago-touch.addCobroDetalle` use la cotización guardada en la línea
(`selectedItem.cambio`) cuando la moneda no tiene cotización actual. Pero ese dato nunca llega: los
cuatro `cobroDetalleList` de `src/app/modules/operaciones/delivery/graphql/graphql-query.ts`
(`deliverysByEstadoList`, `deliveryQuery`, `saveDelivery`, `saveDeliveryAndVentaQuery`) piden
`moneda { cambio }` (la cotización ACTUAL) y no `cambio` de la línea. `selectedItem.cambio` llega
`undefined`, el fallback no se activa y la línea se descarta.

Segundo efecto del mismo hueco, sin relación con tener o no cotización:
`edit-delivery-dialog.onGuardar` reenvía `venta.cobro.cobroDetalleList` tal como vino de la query
(sin `cambio`). `CobroDetalleGraphQL.saveCobroDetalle` (filial) mapea el input completo con
ModelMapper y guarda: **cada «Editar info.» pisa con NULL la cotización guardada de las líneas
existentes**. Evidencia: venta 80072 (delivery 2, editado) con `REAL 100 c=null`.

## Compatibilidad

`cambio: Float` está en `type CobroDetalle` del filial en `master`, `release/beta` y `develop`
desde el primer commit (750cf45, 2022-06-27), y en el central. Pedirlo no rompe contra ninguna
versión de backend de ningún canal. Sin cambios de backend, ni de esquema, ni migraciones.

## Fases

### Fase 1 — pedir `cambio` de la línea en las cuatro queries

`graphql-query.ts`: agregar `cambio` a los cuatro `cobroDetalleList`, a nivel de la línea (no
dentro de `moneda`).

Efectos: el replay de `pago-touch` usa 1200 para la línea de R$ aunque REAL no tenga cotización
(el fallback de `5ba9747f` pasa a funcionar); `onGuardar` del edit reenvía el `cambio` real y deja
de pisarlo.

### Fase 2 — el «Editar info.» también usa la cotización guardada

`edit-delivery-dialog.component.ts`: hoy el alta (`addCobroDetalle`, líneas 510-513) y las dos
bajas (`onDeleteItem`, líneas 584 y 608) usan `item.moneda.cambio` / `selectedMoneda.cambio`, la
cotización ACTUAL. Con REAL sin cotización, al reabrir la edición de un delivery con cobro en R$
la línea suma 0 (`100 * null`), el vuelto sugerido divide por null y, si se borra esa línea,
resta 0: el saldo queda inconsistente el resto de la sesión del diálogo.

Mismo criterio que `pago-touch`:
- `addCobroDetalle`: `const cambio = this.selectedMoneda?.cambio || (selectedItem?.id != null ? selectedItem?.cambio : null)`;
  `item.cambio = cambio`; `valorParcialPagado += item.valor * cambio`; el vuelto sugerido de la
  línea 513 divide por `cambio`.
- `onDeleteItem` (584 y 608): restar `item.valor * item.cambio` — la misma fuente que usó el alta
  (hallazgo R1 de la auditoría B).

Fuera de alcance, preexistente y sin cambios: una línea NUEVA sin cotización en este diálogo (no
tiene el aviso de `pago-touch`), y `calcularVuelto()` (líneas 682-689), que divide por
`selectedMoneda.cambio` / `selectedMonedaVuelto.cambio` si el cajero elige a mano una moneda sin
cotización (hallazgo R2).

### Datos nuevos

Ninguno. `cobro_detalle.cambio` ya existe; escritor: `pago-touch.addCobroDetalle` y
`edit-delivery-dialog.addCobroDetalle` (vía `CobroDetalle.toInput`); lector nuevo: el replay de
`pago-touch` y el de `edit-delivery-dialog`, y `onGuardar` al reenviar.

## Tests

- N/A batería para desktop porque el CI no corre tests `[ev: .github/workflows/ci.yml, sin paso de test]`.
- Gate: `npm run check` leído del log.
- Prueba de runtime (desktop servido por http contra la filial alpha :8080 / central :8083 de
  mauro, ver memoria `probar-pdv-local-contra-filial`):
  1. Con cotización: delivery con cobro 100 R$ → FINALIZAR → dos líneas, saldo 0 (regresión 1.6).
  2. Sin cotización de REAL (fila NULL en la filial alpha): delivery guardado con R$ → FINALIZAR
     → aparece la línea de R$ con saldo 0, sin cobro extra; la venta queda con 2 líneas (el 3.7).
  3. «Editar info.» de un delivery con cobro en R$ y Guardar → `cobro_detalle.cambio` sigue en 1200.
  4. «Editar info.» con REAL sin cotización → saldo correcto en el diálogo (fase 2).
  5. En ese mismo diálogo, borrar la línea de R$ recargada → el saldo vuelve al total, no queda
     negativo ni NaN (hallazgo R5 de la auditoría B).
  Revertir el fix y ver que 2, 3 y 5 fallan (prueba del bug).

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `cambio` existe en `CobroDetalle` de filial y central en las 3 ramas, sin resolver custom; `GenericCrudService` usa `fetchPolicy: "no-cache"` (sin riesgo de caché); mobile y mobile-pwa no tienen delivery | verificado, sin cambios |
| A | `delivery-dialog.component.ts:376/387` manda queries de este archivo al central, donde `deliverysByEstadoList` no existe | preexistente; ese componente es código muerto (el PDV abre `ListDeliveryComponent`). Fuera de alcance |
| B | R1: el borrado de línea (584, 608) resta con la cotización actual | incorporado a la fase 2 |
| B | R2: `calcularVuelto()` sin respaldo | preexistente, fuera de alcance, anotado |
| B | R3/R4/R6: lo guardado mejora, el rollback no deja estado nuevo, las filas NULL no empeoran | verificado |
| B | R5: faltaba probar el borrado | paso 5 de la prueba |

## Queda sin verificar

- Impresión térmica e IPC (la prueba web no los cubre); el diff no los toca.
- Filas históricas con `cambio` NULL (~2–3 % mensual desde 2025): el fix no las repara. Un delivery
  viejo con cobro en R$ y `cambio` NULL, reabierto sin cotización, sigue sin poder recargarse.

## Cierre

PR a `develop`, un solo repo. Aviso de reinicio: el usuario ve «Cerrar y actualizar» en ≤5 min en
el canal alpha. El plan se borra en el PR final.
