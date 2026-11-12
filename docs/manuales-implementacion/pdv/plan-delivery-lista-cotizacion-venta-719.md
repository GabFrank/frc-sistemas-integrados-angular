# Plan — Lista de deliverys en otra moneda: no mostrar el total con la cotización del día (#719)

## Problema

En un PDV en otra moneda, la columna «Valor en US$» de `list-delivery` muestra un delivery todavía no
leído como `(venta.valorTotal + precio.valor) / cotizacionPdv`, es decir, con la **cotización del día**.
El total que se cobra usa la cotización con la que se guardó la venta, y esa cotización la trae
`DeliveryMonedaService.convertirABase` recién al hacer clic en la fila. Ejemplo en alpha: 5,55 US$ en la
lista contra 5,61 US$ al cobrar.

La consulta de la lista (`deliveryPorCajaIdAndEstados`) no trae ni el id ni la cotización de la venta,
así que la lista no tiene con qué calcular el valor correcto.

## Decisión

El issue acepta dos salidas: mostrar el valor con la cotización de la venta, o no mostrarlo hasta tenerlo
convertido. Se toma la segunda: la fila sin convertir muestra «—», y la convertida (`envioEnBase != null`)
muestra el valor de siempre.

Se descarta convertir cada fila al abrir la lista porque:

- obliga a pedir `venta { id }` en la consulta, y `onDeliveryClick` usa `venta.id == null` para decidir si
  recarga el delivery con sus ítems. La fila quedaría marcada como cargada sin tener los ítems;
- suma una consulta `ventaMoneda` al filial por fila, cada vez que se abre o se filtra la lista.

## Fases

**Fase única** — `list-delivery.component.html`, rama `esOtraMoneda` de la columna `valor`: el `else` que
dividía por `cotizacionPdv` pasa a `"—"`.

- Tabla de datos nuevos: ninguno.
- Persistencia y backend: N/A, solo cambia el template.
- Tests: N/A para el desktop porque su CI no corre tests (ver el ciclo, §1, paso 7). La prueba es por la
  pantalla.

## Alcance (eje A)

- `cotizacionPdv` deja de usarse en el template, pero lo sigue usando `armarFilasPresupuesto`. Se mantiene.
- Con la moneda de la empresa (`!esOtraMoneda`) no cambia nada.
- El detalle de la derecha y el cobro usan `selectedDelivery`, que siempre pasa por `convertirABase`
  (`onDeliveryClick` recarga toda fila sin `venta.id`). No cambian.
- `adicionar-caja-dialog` usa la misma consulta, pero no esta columna. No cambia.

## Prueba por pantalla

1. PDV en moneda de la empresa: la lista muestra los valores igual que antes.
2. PDV en US$ con un delivery armado con otra cotización que la del día:
   - al abrir la lista, la fila muestra «—»;
   - al hacer clic, la fila muestra el total con la cotización de su venta, el mismo que el detalle y el
     cobro;
   - al filtrar de nuevo, las filas vuelven a «—» porque llegan sin convertir.
3. Si `convertirABase` falla (delivery armado en la moneda de la empresa, o la red cortada al hacer clic):
   aparece el aviso y la fila sigue en «—». Antes se veía una cifra aproximada; ahora no se ve ninguna, y
   es lo buscado, porque ese delivery no se puede cobrar en el PDV en US$ (auditoría eje B).

## Registro de desvíos del ciclo

- El cambio del template se escribió antes que este plan. Es una sola línea y no altera el alcance.

## Auditoría del plan (paso 5)

- **Eje A:** un delivery sin tarifa (`precio.valor == null`) queda con `envioEnBase` undefined y sigue en
  «—» aun convertido. Antes mostraba el total convertido dos veces y el detalle de la derecha ya daba NaN:
  no es regresión. Queda fuera de alcance; el cobro avisa «sin tarifa de envío» (`pago-touch`).
- **Eje B:** sin riesgo de estado ni de rollback. El riesgo de UX (la conversión falla y la fila queda en
  «—») se sumó como prueba 3.

## Auditoría del diff (paso 8)

El diff cambia solo una interpolación del template. Fijo 1 (autorización): N/A para el desktop porque no
toca resolvers, roles ni botones. Fijo 2 (esquema y migración): N/A porque no hay persistencia ni GraphQL
nuevo. Fijo 3 (contrato con los clientes): N/A porque la consulta y los modelos no cambian. Ningún
condicional aplica. No se lanzaron agentes; los dos ejes del plan ya revisaron el mismo archivo.

## Resultado de la prueba (12/11/2026)

Desktop del worktree (`ng serve -c web`) contra el filial alpha (:8080, SUC. CALLE 10) y el central alpha
(:8083), usuario MR. Solo lecturas. El PDV de alpha opera hoy en Gs, así que en memoria se puso el
`venta-touch` en US$ con la cotización del día en 6.500 (la del issue) y `selectedCaja` = 3018 (cerrada,
con los deliverys 9–16 guardados a 6.450). La lista se abrió con `abrirDelivery()`, el mismo camino del F10.

1. PDV en Gs: «Valor en Gs», con los totales de siempre (delivery 13: 36.154). OK.
2. PDV en US$: al abrir, las 8 filas muestran «—» (antes, el 13 habría mostrado 36.154 / 6.500 = 5,56). Al
   hacer clic, el 13 muestra 5,61, igual que el detalle (4,83 + 0,78). Al volver a «Buscar», todas vuelven a
   «—». OK.
3. Delivery 14, armado en Gs: aviso «Este delivery se armó en la moneda de la empresa…» y la fila sigue en
   «—». Con `onGetById` forzado a fallar (red), la fila 15 sigue en «—». OK.

## Sin verificar

- Cómo lo vive el cajero: ve «—» en las filas que todavía no abrió. Si molesta, el seguimiento es
  convertir en segundo plano (ver «Decisión»).
