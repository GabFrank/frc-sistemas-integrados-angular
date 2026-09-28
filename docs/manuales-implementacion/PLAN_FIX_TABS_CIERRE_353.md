# Plan — Pestañas: `currentIndex` sincronizado con el clic y cierre que vuelve al padre (#353)

Rama: `fix/tabs-cierre-vuelve-al-padre`, **apilada sobre** `fix/devoluciones-refresco-entre-pestanas`
(PR #354, sin mergear) porque toca las mismas líneas de `TabService` (`tabChanged`, `setTabActive`).
Cuando #354 se mergee: rebase sobre `origin/develop` antes del PR (memoria *rama con PR mergeado pierde
commits*). Pieza: **desktop** únicamente. Issue: GabFrank/frc-sistemas-integrados-angular#353.

## Diagnóstico (verificado en código)

`src/app/layouts/tab/tab.service.ts`:

1. `tabChanged(index)` (clic del usuario / `selectedTabChange`) no actualiza `currentIndex` ni
   `tabs[i].active`: la llamada a `setTabActive(index)` está **comentada desde `3810e37e`**
   ("implementando delivery 50%", 2022). Muy probablemente porque `setTabActive` emite `tabSub`, y
   `tabSub` (a) hace que `default.component` vuelva a fijar `selectedIndex` y (b) lo escuchan POS
   (`venta-touch.component.ts:400`) y delivery (`delivery-dialog.component.ts:316`) para enfocar el
   buscador / teléfono.
2. `removeTab(index)` solo vuelve al padre / vecina si `currentIndex == index` → con `currentIndex`
   viejo no activa nada y `mat-tab-group` elige solo.
3. `removeTab` rama "padre no abierto": `setTabActive(this.tabs[index])` pasa un `Tab`, no un índice
   → ninguna pestaña queda `active`, `currentIndex` queda con un objeto.
4. Cerrar una pestaña **anterior** a la activa no corre `currentIndex` → queda apuntando a la vecina.

**Consecuencia no mencionada en la issue:** 12+ llamadas `removeTab(this.tabService.currentIndex)`
("cerrá mi pestaña") en POS (`venta-touch.component.ts:287,303,323,342,363,491,509`), inventario,
ventas, gastos, vehículos; y `changeCurrentTabName` / `currentTab()` (8 archivos). Con `currentIndex`
viejo pueden **cerrar o renombrar otra pestaña**. El arreglo las vuelve correctas sin tocarlas.

## Fase única — `fix(tabs): …` (un commit + push)

`src/app/layouts/tab/tab.service.ts` y `src/app/layouts/default/default.component.{ts,html}`.

1. **`TabService.sincronizarActiva(index)`**, llamado desde `(selectedIndexChange)` del
   `mat-tab-group` (nuevo binding en `default.component.html` → `indiceCambiado(index)`): pone `active`
   y `currentIndex` en la pestaña visible **sin emitir `tabSub`** (emitir es justo lo que se desactivó
   en 2022: rebote de `selectedIndex` y foco del POS en cada clic). Ignora índices que no resuelven a
   una pestaña. **Por qué `selectedIndexChange` y no `selectedTabChange`** (hallazgo eje B, verificado
   en `@angular/material/fesm2020/tabs.mjs`): cuando se quita la pestaña activa y el índice numérico
   no cambia, Material emite `selectedTabChange` **diferido** con el índice capturado
   (`tabs.mjs:1486-1490`); si en el mismo tick corre un `addTab`, ese evento viejo llega después y
   pisaría el `currentIndex` correcto. `selectedIndexChange` se encola en el orden de los cambios
   (`tabs.mjs:1435-1438`, el último gana) y no se emite en el caso "pestaña reemplazada", que
   `removeTab` ya resuelve con `setTabActive`. `tabChanged` queda como está (emite `tabChangedEvent`
   y `registrarActivacion` de #354).
2. **`removeTab(index)`** reescrito con la misma intención:
   - cerrar la **activa** → la padre si está abierta; si no, la vecina (`min(index, len-1)`, la que
     ocupa su lugar o la anterior si era la última) → `setTabActive(destino)`;
   - cerrar **otra** anterior a la activa → `currentIndex--` (misma pestaña activa);
   - quedan 0 → `currentIndex = -1`;
   - se elimina el `this.tabs[index] = null` previo al `splice` (no hacía nada útil) y el
     `setTabActive(this.tabs[index])`.
   - `tabSub.next` al final, como hoy.
3. `setTabActive(index)`: guardia — si `index` no es un número válido, no hace nada (hoy deja todo
   sin `active`).

### Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| (ninguno nuevo) `currentIndex` / `tabs[i].active` pasan a escribirse también con el clic | `sincronizarActiva()` (desde `default.component.indiceCambiado`, `(selectedIndexChange)`) | `removeTab`, `currentTab()`, `changeCurrentTabName`, las 12+ llamadas `removeTab(currentIndex)`, `default.component.ts:119` |

Sin persistencia, sin GraphQL.

### Tests

`N/A para desktop porque su CI no corre tests y no hay batería confiable [ev: .github/workflows/ci.yml
— ningún paso de test]`. Gate: `npm run check`. Prueba de runtime en Chrome con espía sobre
`TabService` (índice activo real vs `currentIndex`).

## Casos de prueba manual

1. Repro de #353: Dashboard → Lista → Devol. X → otra pestaña → volver a Devol. X **por clic** →
   cerrarla → queda activa la **Lista** (y se refresca, por #354).
2. Cerrar una pestaña que **no** es la activa (anterior a la activa) → la activa sigue siendo la misma
   y `currentIndex` apunta a ella.
3. Cerrar la última pestaña activa sin padre → queda la anterior.
4. Cerrar la pestaña hija cuando su padre ya se cerró antes → queda la vecina (no "ninguna").
5. Guardar una devolución nueva tras haber cambiado de pestañas por clic → `changeCurrentTabName`
   renombra **esa** pestaña.
6. POS: con *Venta* abierta, pasar a otra pestaña por clic y volver → el buscador se comporta igual que
   hoy (no se agrega foco en cada clic). Si no hay caja/PDV configurado, el "salir" cierra la pestaña
   *Venta* y no otra. *(Si no se puede abrir Venta en local, queda NO VERIFICADO y se dice.)*
7. Clic rápido entre varias pestañas → sin parpadeo ni bucle de selección.
8. Vehículos → *Pre-registro* → *Continuar* (`addTab` + `removeTab(currentIndex - 1)`) → queda activa
   *Agregar Vehículo* y `currentTab()` es esa (hoy `currentIndex` queda fuera de rango).

## Auditoría del plan (paso 5)

Dos auditores Sonnet, sin verse, 2026-09-28.

**Eje A — contrato y propagación**
- MEDIA · `pre-registro-vehiculo.component.ts:117` sí cambia (cierra una pestaña anterior a la
  activa → `currentIndex--`), y lo corrige → **aplicado**: caso 8 y nota corregida.
- Los 8 usos de `currentTab()`/`changeCurrentTabName` y las 12+ `removeTab(currentIndex)` asumen "la
  visible" → se corrigen. POS: sus `removeTab(currentIndex)` corren dentro de diálogos modales del
  arranque de *Venta* → sin cambio. Sus suscripciones a `tabSub` siguen recibiendo lo mismo (el clic
  no emite). Sin GraphQL/migración/env.

**Eje B — reversibilidad y estado**
- ALTA · `selectedTabChange` diferido de Material (`tabs.mjs:1486-1490`) puede llegar después de un
  `addTab` del mismo tick y pisar `currentIndex` → **verificado en el código de Material y aplicado**:
  sincronizar desde `selectedIndexChange` (punto 1). Se descartan las alternativas propuestas
  (`trackBy`, `setTimeout` en `reiniciarTab`) por tocar más superficie; `reiniciarTab` no tiene
  llamadores.
- Sin persistencia: rollback = revertir el commit.

## Qué queda sin verificar / fuera de alcance

- Las 12+ llamadas `removeTab(currentIndex)` no se tocan: el arreglo las corrige de rebote. Solo se
  prueban las de Devoluciones y, si se puede, POS.
- `pre-registro-vehiculo.component.ts:117` usa `currentIndex - 1` tras un `addTab` (asume que el
  pre-registro era la última pestaña). **Sí cambia** (hallazgo eje A): cierra una pestaña anterior a
  la activa, y la rama nueva `currentIndex--` la deja apuntando a *Agregar Vehículo*; hoy queda fuera
  de rango. Se prueba (caso 8). Sigue asumiendo que el pre-registro era la última: no se toca.
- `addTab` asigna `tab.id = tabs.length + 1` y `currentIndex = tab.id - 1`: coherente porque agrega al
  final; no se toca.
