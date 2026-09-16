# Fix — F12 (Pago) no responde en PDV 2

Rama: `fix/pdv-f12-pdv2` (desde `origin/develop`). Pieza: **desktop** únicamente.

## Reporte

«El botón F12 no funciona cuando está activo el modo PDV 2». Franco lo probó y le funcionó en los
dos PDV. Pregunta: ¿es real, es un delay, o hay configuración distinta?

## Diagnóstico (paso 3)

No hay delay ni configuración distinta: PDV 1 y PDV 2 comparten el mismo listener `keydown` de
`venta-touch.component.ts` (`ngAfterViewInit`). La diferencia es **qué carrito mira el guard**:

| Atajo | Guard del teclado | Guard del botón en pantalla |
|---|---|---|
| F12 Pago | `this.itemList.length > 0` (`venta-touch.component.ts:399`) | `selectedItemList.length == 0` → disabled (`venta-touch.component.html:60`) |
| F11 CR + Ticket | `this.itemList.length > 0 && !disableCobroRapido` (`:404`) | `selectedItemList.length == 0 \|\| isDelivery` (`.html:98`) |

- `itemList` es el carrito del **PDV 1**. `pdvAuxiliarClick()` (F2) apunta `selectedItemList` a
  `itemList2` (PDV 2) o a `itemList` (PDV 1). `onPagoClick()` cobra `selectedItemList`.
- Por eso con el mouse anda siempre y con F12 depende del **otro** carrito.

Matriz de comportamiento actual:

| Modo | PDV 1 | PDV 2 | F12 hoy | Esperado |
|---|---|---|---|---|
| PDV 1 | con ítems | — | abre pago | abre pago |
| PDV 2 | **vacío** | con ítems | **no hace nada** (el reporte) | abre pago con PDV 2 |
| PDV 2 | con ítems | con ítems | abre pago con PDV 2 (lo que probó Franco) | idem |
| PDV 2 | con ítems | **vacío** | `onPagoClick` pone `isDialogOpen = true`, no abre diálogo y **no lo resetea**: todos los atajos (F1…F12, Esc) quedan muertos | no hace nada, atajos vivos |
| Delivery (F10 → editar) | vacío | — | no hace nada | abre pago del delivery |

El bloqueo de la fila 4 sale de `onPagoClick()` (`:1005-1009`): `isDialogOpen = true` se asigna
antes del `if (selectedItemList?.length > 0)` y solo se vuelve a `false` dentro del `afterClosed`
del diálogo que en ese caso nunca se abre.

## Fase 1 — guards alineados con el carrito activo

Archivo: `src/app/modules/pdv/comercial/venta-touch/venta-touch.component.ts`.

1. F12: `this.itemList.length > 0` → `this.selectedItemList?.length > 0`.
2. F11: `this.itemList.length > 0 && !this.disableCobroRapido` →
   `this.selectedItemList?.length > 0 && !this.disableCobroRapido && !this.isDelivery`
   (mismo criterio que el botón «CR + Ticket (F11)»).
3. `onPagoClick()`: salir temprano si `selectedItemList` está vacío, **antes** de
   `isDialogOpen = true`, para que ningún camino deje los atajos bloqueados.

Sin cambios de GraphQL, modelos, backend, migraciones ni Electron main.

Commit: `fix(pdv): F12 y F11 usan el carrito activo en PDV 2`.

### Tabla de datos nuevos

N/A: no nace ningún campo, columna ni clave.

### Tests de la fase

- **Automatizados: N/A para desktop** porque el repo no tiene batería ejecutable en ningún gate
  (`venta-touch.component.spec.ts` es el boilerplate «should create» sin providers; el CI solo
  corre `npm run check`). `[ev: skill frc-desktop, «Paso 9»]`
- **Gate:** `npm run check` (AOT) leído del log.
- **Prueba manual** (`ng serve -c web` contra filial dev, o build instalado): recorrer las 5 filas
  de la matriz, más:
  - F2 ida y vuelta varias veces con ítems en ambos carritos; F12 cobra solo el carrito activo.
  - F11 en PDV 2 con PDV 1 vacío → cobro rápido del PDV 2; en delivery → no hace nada.
  - Tras cobrar en PDV 2, el PDV 1 conserva sus ítems.
  - F10 → editar un delivery existente → «Finalizar»: abre pago; al cerrarlo los atajos siguen vivos.

## Auditoría del plan (paso 5)

Dos auditores (sonnet), sin verse entre sí. Ningún riesgo alto; el plan no cambia.

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | F11 suma `!isDelivery`: bloquea por teclado lo que el botón ya bloquea | baja | Se mantiene (alineado con la UI); cubierto en pruebas |
| A2 | A | `onDeliveryClick` → «finalizar» llama `onPagoClick()` directo (`:1507-1509`); asigna `selectedItemList` antes, el early-return es compatible y corrige el cuelgue si la venta viniera sin ítems | media | Sin cambio; caso agregado a pruebas |
| A3 | A | `onDeliveryClick` pone `isDialogOpen = false` (`:1523`) con el diálogo de pago recién abierto | baja | Preexistente. Impacto bajo: con el diálogo abierto el foco está en el overlay, fuera de `#container`. Deuda aparte |
| A4 | A | Sin contratos tocados: ni GraphQL, ni `@Input`/`@Output`, ni IPC; los que abren `VentaTouchComponent` como tab/diálogo no usan estos métodos | — | Verificado |
| B1 | B | El early-return cubre más casos que la fila 4 (cualquier `selectedItemList` vacío) | baja | Sin cambio |
| B2 | B | No hay cobro del carrito equivocado: guard, render y cobro usan `selectedItemList`; el guard viejo era el que podía mirar un carrito y cobrar otro | — | Verificado |
| B3 | B | Salir de delivery con F2 (`pdvAuxiliarClick`, `:986-989`) deja `selectedItemList = []` sin volver a apuntar a `itemList`/`itemList2`: el carrito walk-in queda oculto (no perdido) hasta dos F2 más | media | **Preexistente, fuera de alcance**; se propone fix separado |
| B4 | B | Desktop sin actualizar: sigue con el bug, sin incompatibilidad con backend | — | Verificado |

## Qué queda sin verificar

- **F8 (Cobro Rápido) no tiene guard de carrito vacío** en el teclado (`:414`); `onTicketClick`
  tampoco lo chequea. No está en el reporte: se anota, no se toca en este fix. Verificar con F8 en
  un carrito vacío si guarda una venta sin ítems.
- Hallazgos B3 (salir de delivery con F2) y A3 (`isDialogOpen` en `onDeliveryClick`): preexistentes,
  candidatos a un `fix/pdv-delivery-*` aparte.
- `ngOnInit` lee `tabData.data.auxiliar` pero deja `selectedItemList = itemList`; ningún llamador
  pasa `auxiliar` (`grep -rn auxiliar src/app`), así que hoy es inalcanzable. Fuera de alcance.
- Si el reporte original venía de otra causa (foco fuera de `#container`, p. ej. dentro de un
  diálogo), este fix no la cubre. Confirmar con quien reportó el escenario exacto.

## Pasos del ciclo que no aplican

- Migraciones / espejo filial / replicación: N/A para desktop porque no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón; el atajo ya existía.
