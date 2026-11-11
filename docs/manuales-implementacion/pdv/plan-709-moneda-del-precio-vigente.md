# Plan #709 — El PDV no cobra con la moneda vieja de un precio

Issue: GabFrank/frc-sistemas-integrados-angular#709. Rama: `fix/pdv-moneda-precio-vigente` (desde `develop` 5cb25e82).
Pieza: **desktop** solamente. Frena el pase a beta (CEO, 11/11/2026). Plan auditado (paso 5): ver «Auditoría».

## Problema

`venta-touch.component.ts` guarda en `preciosEnOtraMoneda` (precioId → moneda, query `preciosEnOtraMoneda` de la filial)
los precios que no están en la moneda de la empresa. Se lee al abrir el PDV (`setPrecios`) y al tocar un grupo de
favoritos (`onGridCardClick`). Al agregar un ítem, `aplicarMonedaDelPrecio` → `resolverPrecioDeItem` usa ese mapa y el
valor `precioVenta.precio` que trajo el buscador.

Si un precio cambia de moneda con el PDV abierto, el mapa está viejo:

- Precio pasado a USD (5,85): no está en el mapa → se vende 5,85 **Gs** (pantalla «6 Gs»). Visto en alpha el 10/11.
- Precio vuelto a Gs: sigue en el mapa → se convertiría como USD.

La filial no lo frena: `VentaItemGraphQL.aplicarRastroPrecio` solo loguea si hay rastro y no cierra; un ítem sin rastro no
se mira. La venta queda guardada mal y en silencio.

Además el ítem ya agregado conserva el **valor** viejo (`precioVenta.precio`): cuando un precio cambia de moneda casi
siempre cambia también su valor (20.735 Gs → 5,85 USD), así que **recalcular con el mapa nuevo no alcanza** (auditoría
A1/B1): daría 20.735 USD o 5,85 Gs.

## Enfoque: verificar antes de cobrar y **bloquear**, no recalcular

Antes de cobrar, releer el mapa de la filial (sin caché: `onCustomQuery` usa `fetchPolicy: 'no-cache'`) y comparar la
moneda de cada ítem con la vigente. Si alguno cambió: **no se cobra**, se avisa con los productos afectados y el cajero los
saca y los vuelve a cargar (el buscador trae valor y moneda vigentes). No se toca el carrito automáticamente: así no hay
valor viejo, ni descuentos reescalados, ni cajas/envases, ni carrito que cambie con el pago abierto.

### Descartado

- **Recalcular el ítem con el mapa nuevo:** usa el valor viejo (A1/B1).
- **Releer `precioPorSucursal(id)` al agregar:** vuelve asíncrono `addItem` (síncrono, recursivo, 9 llamadores; con el
  escáner los ítems se reordenarían).
- **Pedir `moneda` en la query del buscador:** contra una filial vieja falla entera (`preciosMoneda.ts`).

## Fases

### Fase 1 — Guardia al cobrar

- `PrecioMonedaService.preciosEnOtraMonedaVigente()` → `{ mapa, leido }`: misma query, `leido: false` si falla o vence el
  tope (`CONTEXTO_SONDEO`). Si `leido`, actualiza `mapaPdv` (lo usa `producto-categoria-dialog`, A7).
- Pura en `precio-en-moneda.ts`: `itemsConMonedaDesactualizada(items, mapa)` → ítems cuyo `precioVenta.id` tiene en el
  mapa una moneda distinta de la usada (`precioMonedaId`; sin rastro = la de la empresa). Sin `precioVenta.id`, no se toca.
- Componente:
  - flag nuevo `verificandoPrecios`; lo miran el handler de teclado (l.529), `onPagoClick`, `onTicketClick`,
    `onDeliveryClick` y `addItem` (aviso corto «Verificando precios…» y no agrega). Se libera con `finalize` en todos los
    caminos: éxito, bloqueo, error y vencimiento (B3).
  - `verificarMonedaDelCarrito(): Observable<boolean>`:
    1. lee el mapa vigente;
    2. `leido` y sin cambios → `this.preciosEnOtraMoneda = mapa`, `true`;
    3. `leido` con ítems cambiados → actualiza el mapa, aviso «Cambió la moneda del precio de: X, Y. Sacalos y volvé a
       cargarlos para cobrar el precio vigente.», `false`;
    4. no `leido`: si el mapa en memoria está vacío (filial vieja o empresa sin otra moneda) → `true`, como hoy; si no está
       vacío → aviso «No se pudo verificar los precios, probá de nuevo» y `false`. Se loguea en consola con los precioId
       (A4).
  - `onPagoClick` y `onTicketClick` (F8/F11) pasan la guardia y recién después corren **su cuerpo actual sin cambios**,
    movido a `abrirPago()` / `cobrarTicket(ticket)`. El `try/finally` de `disableCobroRapido` queda dentro del cuerpo
    síncrono, como hoy (B3).
  - Se verifica la lista activa (`selectedItemList`), que es la que se cobra; la segunda lista (F2) se verifica cuando se
    cobra (A2).
- **Tests (fallan con el código viejo):**
  - `precio-en-moneda.spec.ts`: `itemsConMonedaDesactualizada` — (a) sin rastro y ahora USD; (b) rastro USD y ahora
    empresa; (c) misma moneda → no; (d) sin `precioVenta.id` → no.
  - `venta-touch.component.spec.ts` (`fakeAsync`): con un ítem desactualizado, `onTicketClick` no llama a `saveVenta` y
    `onPagoClick` no abre `PagoTouchComponent`; doble F8 mientras verifica → un solo intento; lectura que falla con mapa
    no vacío → bloquea y libera los flags; con mapa vacío → cobra.

### Fase 2 — Delivery

- `onDeliveryClick` (nuevo delivery con ítems): misma guardia antes de crearlo.
- Ítem agregado a un delivery abierto (`addItem`, rama `isDelivery`): **sin guardia asíncrona** (A5/B4: reordenaría el
  escáner). Usa el mapa en memoria, que refresca la fase 3. La guardia fuerte es la del cobro del delivery (`onPagoClick`):
  si un ítem guardado quedó con moneda vieja, se bloquea y el cajero lo saca con el botón de siempre (que lo borra en la
  filial) y lo vuelve a cargar.
- **Test:** spec: cobrar un delivery con un ítem desactualizado no abre el pago.

### Fase 3 — Refresco del mapa

- Cada 60 s mientras el PDV está abierto (`untilDestroyed`), y si no hay `isDialogOpen`/`guardandoVenta`/`verificandoPrecios`:
  relee el mapa y **solo** reemplaza `preciosEnOtraMoneda` / `mapaPdv`. **No toca el carrito** (B2). Los ítems nuevos ya
  entran con la moneda vigente; los del carrito los atrapa la guardia.
- **Test:** `fakeAsync`: a los 60 s pide el mapa; no lo pide con el diálogo de pago abierto; `ngOnDestroy` corta.

## Fuera de alcance (anotado)

- `calcularTotales` acumula `descuentoGs` con `+=` sin resetearlo si el carrito no está vacío (l.930–938, B5). Este plan no
  agrega llamadas a `calcularTotales`; se abre aparte si se confirma que afecta.
- Ventas ya guardadas antes del fix con la moneda vieja: no se corrigen. Se detectan en la filial con
  `venta_item.precio_moneda_id IS NULL` y un `precio_por_sucursal` con `moneda_id` no nulo para ese precio.
- Reapertura de una venta, cancelaciones y reimpresiones: no vuelven a fijar precios.

## Datos nuevos

Ninguno: sin columna, campo GraphQL, input ni enum. Se reusa `preciosEnOtraMoneda` (filial V110.5).

## Contrato y canales (eje A)

Sin cambios de esquema. Desktop viejo contra filial nueva: igual que hoy. Desktop nuevo contra filial sin la query: la
lectura falla, el mapa en memoria está vacío → se cobra como hoy. Costo: una query por cobro y una por minuto, solo
precios fuera de la moneda de la empresa (vacío en bodega); medir en alpha.

## Pruebas de runtime (alpha, PDV servido por http contra filial :8080)

1. Antes del fix: PDV abierto, BANES FORTE a 5,85 USD desde otra pestaña, agregar → 6 Gs (reproducción).
2. Con el fix: F8, F11 y Pago → bloquea con el aviso; sacar y re-cargar → 37.733 Gs / US$ 5,85; cobra; `venta_item`
   con `precio_moneda_id` dólar y `precio_lista` 5,85.
3. Caso inverso: USD → Gs con el PDV abierto → bloquea; re-cargar → 20.735 Gs.
4. Delivery: nuevo delivery con el ítem desactualizado (bloquea); ítem desactualizado en delivery abierto → bloquea al
   cobrar; sacarlo lo borra en la filial.
5. Doble F8 durante la verificación; filial demorada/caída con mapa no vacío (bloquea) y con mapa vacío (cobra).
6. Refresco: cambiar la moneda, esperar 60 s y agregar el producto → entra con la moneda nueva sin recargar.
7. Regresión: PDV en Gs sin precios en otra moneda (nada cambia); PDV en USD (bloque E); segunda lista (F2).

Al terminar: precios y configuración de alpha restaurados.

## Auditoría (paso 5, 11/11/2026)

| # | Hallazgo | Qué se hizo |
|---|---|---|
| A1/B1 | El recálculo usa el valor de lista viejo del ítem | Se cambió el enfoque: bloquear y re-cargar, no recalcular |
| B2 | El refresco de 60 s podía cambiar el carrito con el pago abierto | La fase 3 solo actualiza el mapa; nunca el carrito |
| B3 | `onTicketClick` es síncrono con `try/finally`: una lectura asíncrona adentro liberaba el flag antes | Guardia antes del cuerpo, flag propio con `finalize`, cuerpos sin cambios |
| A5/B4 | Guardia asíncrona en el ítem de delivery reordenaría el escáner | Sin guardia ahí; se bloquea al cobrar el delivery |
| A4 | Lectura fallida indistinguible de filial vieja | Bloquea si el mapa en memoria no está vacío; cobra si está vacío; log |
| A2 | Segunda lista (F2) | Se verifica la lista que se cobra |
| A3 | Caminos no listados | Grep: los únicos que fijan precios son `onPagoClick` (incluye crédito, convenio, factura y delivery), `onTicketClick` y `onDeliveryClick`. Reapertura y cancelaciones: fuera de alcance |
| A6 | Caché de Apollo | `onCustomQuery` usa `no-cache`: sin riesgo |
| A7 | `mapaPdv` de los diálogos | Se actualiza en cada lectura vigente |
| B5 | `descuentoGs` acumula | Fuera de alcance; el plan no agrega llamadas a `calcularTotales` |
| B6 | Descuentos/balanza/cajas al recalcular | No aplica: no se recalcula |
| B7 | Tests solo de la función pura | Se agregaron specs de componente con `fakeAsync` |

## Sin verificar

- Tamaño del mapa en una empresa con muchos precios en USD (no hay datos así).
- Que el botón de quitar ítem de un delivery abierto borre el ítem en la filial con moneda vieja (se prueba en el paso 4
  de runtime).
