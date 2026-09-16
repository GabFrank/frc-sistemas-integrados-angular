# Fix — `onDeliveryClick` pisa `isDialogOpen` con el pago abierto (#314)

Rama: `fix/pdv-delivery-dialog-open` (desde `origin/develop`, que ya trae #311 y #315). Pieza: **desktop**.

## Diagnóstico (paso 3)

`venta-touch.component.ts`, `onDeliveryClick()` (`:1456-1541`):

- `:1458` pone `isDialogOpen = true` y abre `ListDeliveryComponent`.
- En `afterClosed` hace el `switch (res.role)` y **al final, siempre**, `isDialogOpen = false` (`:1539`).
- Roles que devuelve `ListDeliveryComponent` (`list-delivery.component.ts:279-336`): `"edit"` y
  `"finalizar"`; sin `role` cae en `default`, y cerrar sin resultado entra en el `else`.
- Solo **`"finalizar"`** abre otro diálogo: `onPagoClick()` (`:1524`) abre `PagoTouchComponent`
  y pone `isDialogOpen = true`, que se resetea en su propio `afterClosed`. El `false` de `:1539`
  corre inmediatamente después, síncrono, y lo pisa **con el pago abierto**.

Impacto práctico **bajo**: el listener de atajos está en `#container` y con el `MatDialog` abierto el
foco está en el overlay, así que las teclas normalmente no llegan. Es una corrección de estado: el
flag dice «no hay diálogo» cuando sí lo hay.

## Fase 1 — resetear el flag antes del `switch`

1. Mover `this.isDialogOpen = false;` de `:1539` al **inicio** del callback de `afterClosed`
   (antes del `if (res != null)`), con un comentario de por qué.
   - `"finalizar"` con ítems → `onPagoClick()` lo vuelve a `true`; lo resetea su `afterClosed`.
   - `"finalizar"` sin ítems → `onPagoClick()` sale antes (#311) y el flag queda en `false`.
   - `"edit"`, `"para-entrega"`, `default`, `else` → quedan en `false`, igual que hoy.

Sin cambios de GraphQL, modelos, backend ni Electron main.

Commit: `fix(pdv): el delivery no marca el dialogo como cerrado con el pago abierto` (Closes #314 en el PR).

### Tabla de datos nuevos

N/A: no nace ningún campo, columna ni clave.

### Tests

- Automatizados: N/A para desktop (sin batería en CI).
- Gate: `npm run check` leído del log.
- Manual (`ng serve -c web`, central 8081 + filial 8082 con `isLocal:true`):
  1. **Prueba que falla con el código viejo:** F10 → delivery con ítems → «Finalizar». Con el pago
     abierto, en la consola: `ng.getComponent(document.querySelector('app-venta-touch')).isDialogOpen`
     → antes `false`, con el fix `true`. Leerlo **apenas abre el pago**, antes de interactuar:
     cualquier request con spinner lo vuelve a pisar (ver B/A2). **Cerrar el pago sin cobrar.**
  2. Tras cerrar el pago: el flag vuelve a `false` y F12/F2/F9 andan.
  3. F10 → cerrar la lista sin elegir nada: los atajos andan.
  4. F10 → «editar ítems» de un delivery: carga los ítems y los atajos andan.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | Inventario de `isDialogOpen`: lectores `keydown` (`:396`), `(click)` de las dos `mat-card` y `[focusEvent]` del buscador (`.html`); escritores en `onGridCardClick`, lote, envase, `onPagoClick`, `openUtilitarios` ya resetean al inicio de su `afterClosed`. Ninguno cambia de forma indeseada; con el fix el buscador deja de recibir foco con el pago abierto (buscado) | — | Verificado |
| A2 | A | **Tercer escritor**: `cargandoService.dialogState$()` (`:244-249`) asigna `isDialogOpen = isOpen` del spinner. Una request con spinner dentro del pago lo vuelve a `false` con el pago abierto | media | Verificado. **Preexistente y fuera de alcance**: afecta también a F12 fuera de delivery. Candidato a issue aparte; prueba 1 ajustada |
| A3 | A | `openSelectCajaDialog` (`:497-501`): mismo patrón que #314 (reabre el diálogo y pone `false` después) | media | Verificado. Fuera de alcance, candidato a issue aparte |
| A4 | A | `case "para-entrega"` del `switch` en `venta-touch` es código muerto: `ListDeliveryComponent` lo resuelve adentro sin cerrar (`list-delivery.component.ts:291`) | baja | Sin cambio |
| A5 | A | Sin cambios de contrato GraphQL/IPC; los `isDialogOpen` de `list-delivery`, `pago-touch` y `delivery-dialog` son propios de cada componente | — | Verificado |
| B1 | B | Ningún camino nuevo deja el flag en `true`: el cambio copia el patrón de `onPagoClick` (reset al inicio del `afterClosed`) | — | Verificado |
| B2 | B | Mejora de rebote: hoy una excepción dentro del `switch` (p. ej. `selectedDelivery.venta` null en `"finalizar"`, `:1522`) corta antes del `false` final y deja los atajos muertos; con el fix el flag ya quedó en `false` | baja | Sin evidencia de que `venta` venga null en la práctica; se anota |
| B3 | B | Si `dialog.open` lanzara dentro de `onPagoClick`, el flag queda en `true` igual antes y después | baja | Preexistente, simétrico |

## Qué queda sin verificar

- Si hay un camino real donde el foco vuelve a `#container` con el pago abierto (sería el síntoma
  visible). No se busca: el fix corrige el flag sin depender de eso.
- `openSelectCajaDialog` y otros métodos con el mismo patrón (flag reseteado después de abrir un
  diálogo encadenado) no se revisan acá.

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
