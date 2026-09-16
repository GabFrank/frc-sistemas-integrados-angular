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

## Fase 2 — el spinner de carga deja de pisar `isDialogOpen` (hallazgo A2)

Agregada tras la aprobación de la fase 1, a pedido de Franco (misma rama, otro commit).

`:244-249`: `cargandoService.dialogState$()` (= `spinnerService.spinnerObservable` mapeado a
`show`) asigna `isDialogOpen = isOpen`. Cualquier request con `openDialog` que termina con un
`MatDialog` abierto (pago, selección de caja, lote, utilitarios…) deja el flag en `false`.

1. Nuevo campo `isCargando = false`; la suscripción escribe `isCargando = isOpen` y ya no toca
   `isDialogOpen`.
2. Los lectores miran los dos, para conservar el bloqueo de atajos durante un guardado:
   - `keydown` (`:396`): `if (!this.isDialogOpen && !this.isCargando)`.
   - `.html:13` y `:72`: `(click)="isDialogOpen || isCargando ? null : buscadorFocusSub.next()"`.
   - `.html:37`: `[focusEvent]="!isDialogOpen && !isCargando ? … : null"`.
3. `(dialogEvent)="isDialogOpen = true"` (`.html:35`) queda igual: `BuscadorComponent` declara
   `dialogEvent` pero **nunca lo emite** (`buscador.component.ts:54`, sin `.emit`), así que no hay
   un `true` que antes bajara el spinner de rebote.

4. `onGridCardClick` (`:556-564`): mover `isDialogOpen = true` a justo antes de `dialog.open`.
   Hoy entre los dos corre `grupo.pdvGruposProductos.forEach(...)` sin guard: si lanza, el diálogo
   no abre y el flag queda en `true`. Hasta ahora lo «rescataba» el próximo spinner; al separar
   los flags ese rescate desaparece (hallazgo F2-B1).

Emparejamiento verificado: cada `isDialogOpen = true` (`:459, :556, :656, :777, :1017, :1458,
:1551`) tiene su `false` en el `afterClosed` de su diálogo; ninguno depende del spinner.

Commit: `fix(pdv): el spinner de carga no marca como cerrado un dialogo abierto`.

## Fase 3 — `openSelectCajaDialog` no pisa el diálogo reabierto (hallazgo A3)

`:458-504`. El `afterClosed` ya baja el flag al inicio (`:475`).

El `else` cubre el objeto caja y también el cierre sin resultado (`undefined`) de
`seleccionar-caja-dialog.component.ts:65`, cuando `abrirCaja()` cierra desde `ngOnInit`.

1. Quitar `:481` (`isDialogOpen = false` en `"consulta"`, redundante).
2. Quitar `:501` (`isDialogOpen = false` al final del `else`), que pisa el `true` del
   `openSelectCajaDialog()` reabierto en `:499` (caja con `conteoCierre`).
3. Confirmación «Esta caja no posee conteo inicial» (`dialogoService.confirm`, `:484`): poner
   `isDialogOpen = true` antes de abrirla y `false` al inicio de su `subscribe`; si el cajero
   acepta, `openSelectCajaDialog()` lo vuelve a `true`.

Fuera de alcance: si la caja tiene a la vez `conteoApertura == null` y `conteoCierre != null`
se abren dos diálogos (preexistente, no se toca).

Commit: `fix(pdv): la seleccion de caja no marca como cerrado el dialogo reabierto`.

### Pruebas fases 2 y 3

- F12 → pago abierto → acción del pago que dispare una request (p. ej. buscar cliente): al
  terminar, `isDialogOpen` sigue `true` (antes `false`).
- Mientras se guarda una venta (spinner visible), F12/F8 no hacen nada; al terminar, andan.
- Abrir Venta con una caja ya cerrada asignada (o forzar `conteoCierre`): se reabre la selección
  de caja y `isDialogOpen` queda `true`.
- Caja sin conteo inicial: con la confirmación abierta, `isDialogOpen` es `true`; al rechazar se
  cierra la pestaña; al aceptar se reabre la selección.

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

### Auditoría de las fases 2 y 3

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| F2-A1 | A | `dialogState$` se usa solo en `venta-touch`; un único `<ngx-spinner>` sin `name` (`app.component.html:6`); ningún hijo toca el `isDialogOpen` del padre | — | Verificado |
| F2-A2 | A | `dialogEvent` del buscador: declarado, nunca emitido | — | Verificado |
| F3-A1 | A | `SeleccionarCajaDialogComponent` también cierra con `undefined` (`:65`), cae en el mismo `else` | baja | Documentado en fase 3 |
| F3-A2 | A | `openSelectCajaDialog` solo se llama desde `venta-touch` | — | Verificado |
| F2-B1 | B | Separar flags quita el «rescate» del spinner: `onGridCardClick` tiene código que puede lanzar entre `true` y `open` → atajos muertos permanentes | media | **Adoptado**: ítem 4 de la fase 2 |
| F2-B2 | B | `spinnerObservable` es `BehaviorSubject(null)`: `isCargando` arranca en `false`; el timer de seguridad de `CargandoDialogService` siempre termina en `hide()` | — | Verificado |
| F3-B1 | B | El `confirm` de conteo inicial tiene `disableClose: true` (`dialogos.service.ts:29`): `afterClosed` siempre emite, el `true` no queda trabado | — | Verificado |
| F3-B2 | B | Si `dialog.open`/`confirm` lanzara de forma síncrona tras el `true`, antes lo rescataba el spinner y ahora queda permanente | baja | Preexistente (B3); se acepta, `open` no lanza en uso normal |
| F3-B3 | B | Caja con `conteoApertura == null` y `conteoCierre != null`: dos diálogos a la vez; el flag no queda trabado pero puede quedar `false` un instante con un diálogo visible | baja | Fuera de alcance, anotado |

## Qué queda sin verificar

- Si hay un camino real donde el foco vuelve a `#container` con el pago abierto (sería el síntoma
  visible). No se busca: el fix corrige el flag sin depender de eso.
- `openSelectCajaDialog` y otros métodos con el mismo patrón (flag reseteado después de abrir un
  diálogo encadenado) no se revisan acá.

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
