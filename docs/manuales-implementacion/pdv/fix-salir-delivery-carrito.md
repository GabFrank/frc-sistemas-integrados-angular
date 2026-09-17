# Fix — salir de un delivery no oculta ni borra el carrito del PDV activo (#313)

Rama: `fix/pdv-salir-delivery-carrito` (desde `origin/develop`, con #317). Pieza: **desktop**.
Opción elegida por Franco: **A** (2026-09-17).

## Diagnóstico (paso 3)

`venta-touch.component.ts` tiene tres carritos: `itemList` (PDV 1), `itemList2` (PDV 2) y
`selectedItemList` (lo que se ve y se cobra). En delivery, `selectedItemList` pasa a ser la lista de
ítems del delivery.

**Entrada a delivery:**
- *Nuevo desde el carrito*: `onDeliveryClick` (`:1465-1477`) arma `selectedDelivery` con
  `venta.ventaItemList = this.selectedItemList` (**el mismo array** del carrito walk-in).
  `ListDeliveryComponent.onNuevoDelivery()` (`list-delivery.component.ts:343`) abre
  `EditDeliveryDialogComponent`, que guarda delivery + venta con esos ítems
  (`edit-delivery-dialog.component.ts:651`). El carrito **conserva** los ítems ya guardados.
- *Editar uno existente* (`role: "edit"`, `:1512-1528`): `selectedItemList = []` y luego los ítems del
  delivery traídos del servidor. El carrito walk-in no tiene relación con ese delivery.

**Salidas de delivery hoy:**
| Salida | Línea | Hace | Problema |
|---|---|---|---|
| F2 (`pdvAuxiliarClick`) | `:1000-1003` | `selectedItemList = []` | Carrito oculto hasta dos F2 más (#313); si eran ítems de un delivery nuevo, se pueden cobrar dos veces |
| Pago de delivery concluido | `:1091-1096` | `resetForm()` | Borra una venta walk-in a medias si se editaba otro delivery |
| Pago de delivery cancelado | `:1123-1127` | `resetForm()` | Idem |
| Lista cerrada sin elegir / `default` / `para-entrega` | `:1543-1546`, `:1534-1539`, `:1505-1510` | `resetForm()` | Idem; además F10 + Salir sin delivery borra el carrito |

**Invariante rota fuera de delivery:** `removeItem({})` (`:889-896`) asigna `itemList = []` y
`selectedItemList = []` como arrays distintos; desde ahí lo agregado va a `selectedItemList` y
`itemList` queda vacío. En modo diálogo (`:244`) pasa lo mismo con la venta que se edita.

## Fase 1 — el carrito se vacía solo al pasar a un delivery, y las salidas lo vuelven a mostrar

1. **Invariante** «fuera de delivery, `selectedItemList` es el carrito del PDV activo»:
   - Método `private carritoActivo(): VentaItem[]` → `this.isAuxiliar ? this.itemList2 : this.itemList`.
   - Método `private volverAlCarritoActivo()`: `isDelivery = false`, `selectedDelivery = null`,
     `selectedItemList = carritoActivo()`, `calcularTotales()`.
   - `removeItem({})` fuera de delivery (`:889-896`): después de vaciar, `selectedItemList = carritoActivo()`.
   - Modo diálogo (`:244`): `itemList = venta.ventaItemList` y `selectedItemList = itemList`.
2. **Delivery nuevo guardado → vaciar el carrito que lo originó:**
   - `ListDeliveryData` suma `onCarritoGuardadoEnDelivery?: () => void`.
   - `ListDeliveryComponent.onNuevoDelivery(delivery?)`: si se guardó (`res.delivery != null`),
     `delivery == null` (nuevo, no «editar info») y `this.data.delivery?.id == null` (armado desde
     el carrito, no uno existente), llamar `this.data.onCarritoGuardadoEnDelivery?.()`.
   - `venta-touch` lo pasa en `onDeliveryClick`: vacía **en el lugar** (`splice(0)`) el array
     `selectedDelivery.venta.ventaItemList` (es el carrito activo) y recalcula totales. En el lugar
     para que un segundo «Nuevo delivery» sobre el mismo `data.delivery` no reenvíe los ítems.
3. **Salidas** usan `volverAlCarritoActivo()` en vez de `resetForm()` / `selectedItemList = []`:
   F2 en delivery (`:1000-1003`), pago de delivery concluido (`:1093-1096`) y cancelado
   (`:1123-1127`), lista cerrada (`:1543-1546`), `default` (`:1534-1539`), `para-entrega` (`:1505-1510`).
   - `resetForm()` sigue en `onSaveVenta` (`:1432`), que es la venta walk-in cobrada.
   - `volverAlCarritoActivo()` también vuelve `selectedTipoPrecio = tiposPrecios[0]`, como hacía
     `resetForm()` en esas salidas (hallazgo A1). En `onPagoClick` se borran las asignaciones sueltas
     de `isDelivery`/`selectedDelivery` que quedarían duplicadas (B4).
4. **«Eliminar todo» en delivery** (`:845-888`, hallazgo A2): hoy recorre y hace `splice` sobre
   `itemList`/`itemList2` (el carrito walk-in, con `splice(index, index2)` e `index` undefined) en
   vez de los ítems del delivery. Recorrer una copia de `selectedItemList`, borrar cada ítem en el
   servidor y, al confirmarse, quitarlo de `selectedItemList` por referencia y actualizar los totales
   de la venta del delivery. Sin esto, la opción A se rompe: editar un delivery existente y «Eliminar
   todo» mutila el carrito walk-in que ahora se conserva.
5. La condición del callback usa **`this.data.delivery?.id`**, no `venta.id`: `list-delivery:121`
   pone `data.delivery.venta.id = null` al reabrir la lista estando en un delivery existente, sobre el
   mismo objeto (B1). Comentario en el código.

Sin cambios de GraphQL, modelos, backend ni Electron main.

Commit: `fix(pdv): salir de un delivery no oculta ni borra el carrito del pdv` (Closes #313 en el PR).

### Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `ListDeliveryData.onCarritoGuardadoEnDelivery` (callback, no persiste) | `VentaTouchComponent.onDeliveryClick` | `ListDeliveryComponent.onNuevoDelivery` |

### Tests

- Automatizados: N/A para desktop (sin batería en CI).
- Gate: `npm run check` leído del log.
- Manual en local (se pueden crear datos, ver memoria), leyendo `c = ng.getComponent(document.querySelector('app-venta-touch'))`:
  1. **#313 (falla con el código viejo):** PDV 1 con ítems → F10 → editar ítems de un delivery existente → F2: el carrito del PDV 1 se ve con sus ítems.
  2. Idem, pero salir cancelando el pago de «Finalizar», y concluyendo el pago del delivery: el carrito del PDV 1 sigue.
  3. PDV 1 con ítems → F10 → Salir: el carrito sigue (hoy se borra).
  4. PDV 1 con ítems → F10 → Nuevo delivery → guardar: el carrito del PDV 1 queda **vacío** y el delivery tiene los ítems. Salir con F2 o cerrando la lista: sigue vacío.
  5. Idem 4 pero cancelar el diálogo de nuevo delivery: el carrito conserva los ítems.
  6. Mismo 1 y 4 desde PDV 2 (con PDV 1 con otros ítems): cada carrito conserva lo suyo.
  7. «Eliminar todo» en PDV 1 → agregar un ítem → F2 → F2: el ítem sigue en PDV 1.
  8. Escenario f: estando en un delivery existente → F10 → «Nuevo delivery» (F10 en la lista) → cancelar: los ítems del delivery siguen en pantalla (el callback no se dispara).
  9. PDV 1 con ítems → editar delivery existente → «Eliminar todo»: se borran los ítems del delivery y el carrito del PDV 1 queda intacto al salir.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | `resetForm()` también volvía `selectedTipoPrecio` al primero; `volverAlCarritoActivo()` no | baja | **Adoptado** (ítem 3) |
| A2 | A | «Eliminar todo» en delivery recorre y muta `itemList`/`itemList2` en vez de los ítems del delivery (`:845-886`) | media | **Adoptado** (ítem 4), verificado en código |
| A3 | A | `ListDeliveryComponent`/`EditDeliveryDialogComponent`/`ListDeliveryData` solo los usa `venta-touch`/`list-delivery`; el callback opcional no afecta a nadie más | — | Verificado |
| A4 | A | La condición cubre los 3 llamados reales de `onNuevoDelivery` (`:138`, `:143`, `:207`, botón F10) y excluye «editar info» (`:289`, con parámetro) | — | Verificado |
| A5 | A | `onGuardar` persiste `venta.toItemInputList()` (mismo array del carrito): vaciar el carrito tras guardar es correcto | — | Verificado |
| A6 | A | `splice(0)` en el lugar: `app-item-list` recorre el contenido en cada CD; no hay lectores de `itemList` por identidad | — | Verificado; comentario del porqué en el código |
| B1 | B | Condición del callback: debe ser `delivery.id` (no `venta.id`, que `list-delivery:121` pone en null sobre el mismo objeto) | alta si se implementa mal | **Adoptado** (ítem 5) + prueba 8 |
| B2 | B | **Preexistente, fuera de alcance**: estando en un delivery existente, F10 → «Nuevo delivery» → guardar manda `onSaveDeliveryAndVenta` con el delivery real, `venta.id = null` e ítems de la venta original | media | Se informa a Franco, candidato a issue |
| B3 | B | Modo diálogo: sin `itemList = venta.ventaItemList`, `volverAlCarritoActivo()` mostraría el carrito walk-in en vez de la venta del diálogo | media | Obligatorio en ítem 1 |
| B4 | B | Asignaciones sueltas de `isDelivery`/`selectedDelivery` junto a las salidas de `onPagoClick` | baja | **Adoptado** |
| B5 | B | «Finalizar» con delivery sin ítems no abre el pago y deja `isDelivery` en true sin aviso (salida con F2) | baja | Preexistente, sin cambio |
| B6 | B | Secuencias a–e y g trazadas con el plan: carrito correcto en PDV 1/PDV 2, sin ítems en dos carritos | — | Verificado |

## Qué queda sin verificar

- `list-delivery.component.ts:120-130` y `:136-155` (apertura con `data.delivery` con id o nuevo con
  ítems) llaman `onNuevoDelivery()` automáticamente: quedan cubiertos por la misma condición.
- Modo diálogo de `venta-touch` (`dialogData.venta`): se ajusta la invariante; su flujo de guardado no
  se prueba acá.

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
