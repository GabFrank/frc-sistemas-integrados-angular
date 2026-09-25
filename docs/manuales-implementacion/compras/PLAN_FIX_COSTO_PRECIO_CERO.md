# Plan — fix: el costo de compras no se aplica cuando el ítem queda con precio 0

Rama: `fix/compras-costo-precio-cero` en **desktop** y **central** (misma rama, dos PRs).
Estado: en implementación. Este archivo se borra en el PR final (ciclo §1 paso 11).

## Problema (verificado)

El costo de un producto (`productos.costo_por_producto`) solo se escribe al finalizar la recepción
física: `RecepcionMercaderiaService.finalizarRecepcion` → `procesarItemRecepcion` →
`actualizarCostoPorProducto` → `CostosPorProductoService.aplicarCostoCompra`. Si el precio del ítem
en la nota es 0, `aplicarCostoCompra` hace `return null` sin escribir fila **y sin loguear nada**
(`CostosPorProductoService.java:173`). El stock entra igual.

Con un producto **nuevo** el precio arranca en 0: el diálogo del ítem del pedido lo precarga con
`producto?.costo?.ultimoPrecioCompra || 0` (`add-edit-item-dialog.component.ts`), el formulario
acepta 0 (`Validators.min(0)`) y el aviso de «precio 0» (`onPrecioUnitarioBlur`) solo corre al
perder el foco el input de precio unitario, que el diálogo no enfoca. El 0 viaja a la nota
(`NotaRecepcionService.asignarItemsANota`, `setPrecioUnitarioEnNota(pedidoItem.getPrecioUnitarioSolicitado())`)
y la recepción lo saltea. Producto sin costo → precio 0 → sin costo, en círculo.

Evidencia en producción (bodega, consultado por Franco el 2026-09-25): 47 ítems recibidos con
precio 0 y sin marcar como bonificación desde junio; 9 productos nuevos cuyo costo no salió de la
compra (9204, 9203, 5748, 8026, 8799, 8574, 5750, 6058, 8382); 9203 MULTIMAX ESCOBA sin ningún
costo.

## Criterio

Precio 0 en una compra es legítimo **solo** si el ítem es bonificación. Los dos diálogos ya tienen
el tilde «Bonificación», que fuerza el precio a 0 y lo deshabilita. Por lo tanto: un ítem que no es
bonificación exige precio > 0; si de verdad no se paga, se marca como bonificación.

## Fases

### Fase 1 — desktop: no guardar ítems de compra con precio 0 salvo bonificación

- `add-edit-item-dialog.component.ts` (`onSave`): si `!esBonificacion` y `!(precioUnitarioSolicitado > 0)`
  → `notificacionService.openWarn(...)` con el texto «El precio unitario debe ser mayor a 0. Si el
  producto viene sin cargo, marcalo como bonificación», foco en el input de precio por presentación,
  y no guardar. El guard va **junto a los otros guards, antes de `this.savingComputed = true`**
  (si va después, el botón Guardar queda deshabilitado). No va en `canSaveComputed`: Enter debe
  seguir llegando a `onSave` para mostrar el aviso.
- `edit-nota-recepcion-item-dialog.component.ts` (`onSave`): misma regla, excepto si el estado es
  `RECHAZADO` (un ítem rechazado no se recibe y no genera costo). Además `formValue` pasa de
  `itemForm.value` a `itemForm.getRawValue()`: con bonificación el control de precio está
  deshabilitado y `value` lo omite, así que hoy se envía `precioUnitarioEnNota: undefined` en vez de
  0 (bug preexistente en la misma línea; el precio es el único control que el diálogo deshabilita).
- Efecto buscado, a avisar a compras antes del despliegue: un ítem de pedido o de nota que ya quedó
  con precio 0 y no es bonificación no se puede volver a guardar desde estos diálogos sin ponerle
  precio o marcarlo como bonificación. No se acota a «solo si cambió el precio» porque eso dejaría
  pasar en silencio justamente esos ítems.
- Tests: N/A para desktop porque el CI no corre tests y no hay batería confiable
  [ev: ciclo §1 paso 7 y paso 9, fila desktop]. Gate: `npm run check`. Prueba manual en browser
  (`ng serve -c web`).

### Fase 2 — central: avisar en el log cuando una compra no actualiza el costo

- `CostosPorProductoService.aplicarCostoCompra`: cuando el costo en Gs es ≤ 0 (o el costo es null),
  `log.warn` con producto, cantidad, costo, moneda y cotización antes del `return null`. Sin cambio
  de comportamiento. `RecepcionMercaderiaService` ya no llama para bonificaciones, así que el aviso
  solo aparece para ítems no bonificación con precio 0.
- Tests: nuevo caso en `CostosPorProductoServiceTest` que engancha un `ListAppender` de logback al
  logger de la clase y verifica un WARN con el id del producto cuando el costo es 0; se comprueba
  que falla con el código viejo (paso 7). Los casos existentes siguen verdes. Batería:
  `./mvnw clean verify -B -DskipFlyway=true`.

## Datos nuevos

Ninguno: no hay campos, columnas, claves ni migraciones. Sin cambios de GraphQL.

## Orden de despliegue

Independientes: ninguna fase depende de la otra ni de un cambio de schema. Central no replica nada
nuevo (solo un log). Sin migración → sin dry-run (paso 10: N/A).

## Fuera de alcance (anotado)

- **Pedidos y notas ya cargados con precio 0**: los ítems que ya están en una nota se asignaron sin
  abrir el diálogo; la fase 1 los frena solo si alguien los edita. Seguirán recibiéndose sin costo
  (ahora con aviso en el log). Corrección de datos: «Ajustar costo» o editar el ítem de la nota
  antes de finalizar.
- `dividir-item-dialog` crea ítems **nuevos** de nota (`CONCILIADO`) copiando
  `pedidoItem.precioUnitarioSolicitado || 0` (`dividir-item-dialog.component.ts:245`). Con la fase 1
  el pedido ya no queda en 0, así que el hueco solo queda para pedidos viejos; lo cubre el aviso de
  la fase 2. `rechazar-item-dialog` crea ítems `RECHAZADO`, que no generan costo.
- Mobile y mobile-pwa no crean ni editan precios de pedido/nota (auditoría eje A): sin cambios.
- Ítems agregados a la nota sin distribución / recepciones que quedan `EN_PROCESO`: otras causas
  del mismo síntoma, no tratadas acá.
- Validación en el backend al guardar pedido/nota: no se agrega para no romper clientes ni los
  diálogos de dividir/rechazar ítem, que re-guardan ítems existentes con su precio.

## Auditoría del plan (paso 5)

- Eje A (contrato): sin cambios de GraphQL, enums, tablas replicadas ni env. Hallazgos: el hueco de
  `dividir-item-dialog` y el bloqueo de ítems viejos en 0 → anotados arriba.
- Eje B (reversibilidad): sin migración ni datos; desktop viejo + central nuevo y al revés funcionan.
  Hallazgos aplicados: test con `ListAppender`, lugar del guard, `getRawValue()`, aviso a compras.
  Descartado: acotar el bloqueo a «precio cambiado» (razón arriba).

## Sin verificar

- Prueba en UI real de los dos diálogos (se hace en local con `ng serve -c web`).
