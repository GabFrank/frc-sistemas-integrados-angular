# Plan — Devoluciones: refrescar las vistas al volver a su pestaña (#222, #223)

Rama: `fix/devoluciones-refresco-entre-pestanas` (desde `origin/develop` @ `e94c2c5e`).
Pieza: **desktop** únicamente. Issues: GabFrank/frc-sistemas-integrados-angular#222 y #223.

## Diagnóstico (verificado en código; corrige a las issues)

Las issues atribuyen el problema a Apollo `cache-first`. **No es así**: todos los métodos de
`GenericCrudService` usan `fetchPolicy: "no-cache"` (`generic-crud.service.ts:98,155,228,…`). La causa
real:

- Las pestañas quedan **vivas en segundo plano**: `tab-content.component.ts` crea el componente una
  sola vez y le asigna `data = tab` (la misma instancia de `Tab` que vive en `TabService.tabs`).
- Cada vista carga **solo en `ngOnInit`**: dashboard `devolucion.component.ts` `iniciar()`, lista
  `list-devolucion.component.ts` `onFilter()`, edición `edit-devolucion.component.ts` `cargarDatos()`.
- No hay señal de "mi pestaña volvió": `TabService.tabChangedEvent` se emite y **nadie lo escucha**.

## Decisiones (Franco, 2026-09-28)

- Mecanismo: **recargar al volver a la pestaña** (no un bus de mutaciones). Cubre también cambios de
  otros usuarios/PCs y queda reutilizable por otros módulos.
- Edición: si no hay nada a medio cargar → recarga completa en silencio; si hay algo → **no pisar los
  campos**, actualizar estado y botones, y avisar.

## Fase única — `fix(devoluciones): …` (un commit + push)

1. **`TabService.tabReactivada$`** (`Subject<Tab>`): emite una pestaña cuando vuelve a quedar activa
   **después de haber estado en segundo plano**. Se registra desde `tabChanged(index)` (clic del
   usuario / cambio del `mat-tab-group`) y desde `setTabActive(index)` (programático: `addTab` de una
   pestaña ya abierta, `removeTab` que vuelve al padre). Hacen falta las dos entradas: el clic del
   usuario solo pasa por `tabChanged` (no llama `setTabActive`), y `setTabActive` rebota por
   `tabChanged` vía `mat-tab-group`. Deduplicación **por identidad de la instancia `Tab`** (resuelta
   desde `tabs[index]`; nunca por índice ni por el flag `.active`, que el clic no mantiene): misma
   pestaña dos veces seguidas no emite. Un `index` que no resuelve a una pestaña (p. ej. el `Tab` que
   pasa `removeTab:106`) se ignora. Una pestaña recién abierta **no** emite → no hay doble carga al
   abrir. `tabChangedEvent` se mantiene tal cual.
2. **Dashboard** (`devolucion.component.ts`): `@Input() data: Tab`; al reactivarse →
   `cargar()`, `cargarSerie()`, `cargarEstancadas()` (conserva el rango elegido; ya son silenciosos).
3. **Lista** (`list-devolucion.component.ts`): `@Input() data: Tab`; al reactivarse → `onFilter(true)`
   con los filtros y la página actuales, **sin** diálogo "Buscando...". `onFilter` cancela la consulta
   anterior en vuelo antes de lanzar otra (la más vieja no pisa a la nueva).
   `DevolucionService.onGetDevolucionesConFiltros` suma `silentLoad?` al final (compatible).
4. **Edición** (`edit-devolucion.component.ts`): al reactivarse → `refrescarAlVolver()`:
   - no hace nada si es nueva sin guardar o si hay una acción en curso (`procesando`);
   - relee la devolución en silencio (`onGetDevolucion(id, true, silentLoad)`), protegida con
     `timeout` + `catchError` (memoria *onGetById no emite en error*), cancelando un refresco anterior
     en vuelo;
   - **sin edición pendiente** → aplica todo (se extrae `aplicarDevolucion(res)` de `cargarDatos`) y
     recarga ítems en silencio;
   - **con edición pendiente** → `Object.assign(selectedDevolucion, res)` + `computeEstadoFlags()`
     sin tocar controles ni ítems; si el estado cambió y estaba en modo canje/acreditar y el nuevo
     estado ya no es `RETIRADO`, sale del modo (la acción fallaría);
   - si el estado cambió → aviso "La devolución cambió a X en otra pestaña".
   - "Edición pendiente" = `canjeMode || acreditarMode || algún control dirty` (tipo, sucursal,
     observación, nro. NC, monto) `|| proveedor elegido ≠ proveedor guardado`. Los controles se marcan
     *pristine* al aplicar datos del servidor y tras guardar la cabecera / acreditar.
   - `onGetDevolucion` y `onGetDevolucionItemsPorDevolucion` suman `silentLoad?` al final (compatibles).

### Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `TabService.tabReactivada$` | `TabService.registrarActivacion()` (desde `tabChanged` y `setTabActive`) | dashboard, lista, edición |
| `TabService.ultimaActiva`, `yaDesactivadas` (WeakSet) | `registrarActivacion()` | `registrarActivacion()` |
| `data: Tab` en dashboard y lista | `tab-content.component.ts:43` (ya lo asigna) | filtro de `tabReactivada$` |
| parámetro `silentLoad` en 3 métodos de `DevolucionService` | lista, edición | `GenericCrudService` |

Nada persiste: sin migración, sin cambio de GraphQL.

### Tests

`N/A para desktop porque su CI no corre tests y no hay batería confiable [ev: .github/workflows/ci.yml
— ningún paso de test]`. Gate: `npm run check` (AOT) leído del log. Prueba de runtime en Chrome contra
central local (8081, perfil `dev`), con las devoluciones `T224-*` de la base local.

## Casos de prueba manual

1. (#223) Dashboard abierto → en otra pestaña crear/separar una devolución → volver al dashboard →
   KPIs actualizados sin tocar *Actualizar*.
2. (#223) Lista abierta con filtros → cambiar el estado de una devolución desde su pestaña → volver a
   la lista → la fila muestra el estado nuevo, con los mismos filtros y página, sin diálogo "Buscando".
3. (#222) Devolución abierta en pestaña A → cambiar su estado desde otra pestaña (p. ej. revertir
   desde el historial, o colectar desde *Colecta interna*) → volver a A → estado y botones nuevos +
   aviso.
4. Igual que 3 pero con la observación a medio tipear en A → el texto se conserva; estado y botones
   se actualizan; aviso.
5. Volver a una pestaña sin cambios → sin aviso, sin diálogo, datos iguales.
6. Abrir una pestaña nueva → carga una sola vez (una sola consulta en la red).
7. Cerrar la pestaña de edición → la lista (padre) queda activa y se refresca.

## Auditoría del plan (paso 5)

Dos auditores Sonnet, sin verse, 2026-09-28.

**Eje A — contrato y propagación**
- MEDIA · `setTabActive` rebota por `tabChanged` (el `mat-tab-group` emite `selectedTabChange` al
  cambiar `selectedIndex`) → doble registro. **Aplicado**: dedupe por identidad de `Tab`. Se
  descarta "registrar solo desde `setTabActive`": el clic del usuario no pasa por ahí.
- MEDIA · respuestas fuera de orden al alternar rápido → **aplicado** en lista y edición (se cancela
  la consulta anterior). Dashboard: se deja, son las mismas consultas idénticas que ya dispara hoy.
- Contrato: `silentLoad?` al final es compatible con los 3 llamadores (colecta, edición, lista).
  Sin GraphQL/migración/enums/env. POS y venta-touch escuchan `tabSub`, no el Subject nuevo.

**Eje B — reversibilidad y estado**
- ALTA (preexistente) · `removeTab:106` pasa un `Tab` a `setTabActive(index)` cuando el padre no está
  abierto → ninguna pestaña queda `active`. **Mitigado**: `registrarActivacion` ignora lo que no
  resuelva a una pestaña. **No se arregla `removeTab` en este PR** (cambiaría qué pestaña queda
  activa al cerrar en toda la app): se reporta aparte.
- MEDIA · no depender de `.active` (el clic no lo actualiza) → **aplicado** (identidad de `Tab`).
- Sin migración ni DML: rollback = revertir el commit.

## Auditoría del diff (paso 8)

Sobre `df0c19cd`; ningún condicional disparado. **Desvío del ciclo:** Fijo 1 y Fijo 2 corrieron en
un mismo auditor (los dos casi N/A en un diff solo de UI); Fijo 3 aparte.
- Fijo 1 — sin hallazgos: solo re-disparo de lecturas existentes con los mismos filtros; la sucursal
  fija del dashboard pasa por el mismo getter.
- Fijo 2 — sin esquema; todos los datos nuevos con escritor y lector.
- Fijo 3 — `proveedorTexto` tipeado sin buscar no contaba como edición pendiente y un refresco lo
  pisaba → **aplicado**. "Cancelar `filtroSub` deja colgado el diálogo Buscando" → **descartado**:
  `onCustomQuery` no devuelve la suscripción interna como teardown, así que el `closeDialog` corre
  igual; comprobado en runtime (dos `onFilter()` seguidos → 0 diálogos abiertos).

## Prueba de runtime (paso 9) — 2026-09-28

`ng serve -c web` (worktree) + central local 8081 perfil `dev`, base `bodega@5551`. Espías en
`tabReactivada$` y en `DevolucionService`. Cambios "de otra PC" simulados por SQL.
- Caso 6 OK: abrir Devol. 3 y Devol. 6 → una consulta cada una, cero reactivaciones.
- Caso 1 OK: SQL inserta una devolución → volver al dashboard → 6→7 devoluciones, 5→6 pendientes de
  retiro, sin diálogo, una reactivación.
- Caso 3 OK (#222): revertir colecta desde *Histórico de colectas* → volver a Devol. 3 → Estado
  Separado, botones de SEPARADO, aviso "cambió a SEPARADO en otra pestaña", consulta silenciosa.
- Caso 4 OK: observación tipeada en Devol. 6 (PENDIENTE) + SQL la pasa a SEPARADO → volver → texto
  conservado (sigue dirty), estado y botones nuevos, aviso. Misma instancia del componente.
- Caso 2 OK (#223): volver a la lista → la nueva aparece y las revertidas figuran SEPARADO, silencioso.
- Caso 5 OK: volver a una pestaña sin cambios → consulta silenciosa, sin aviso.
- Caso 7 **distinto a lo planeado**: al cerrar Devol. 3 quedó activa *Histórico de colectas*, no la
  lista padre. Causa preexistente: `removeTab` vuelve al padre solo si `currentIndex == index`, y
  `currentIndex` no se actualiza con el clic del usuario. La señal emitió para la pestaña que quedó
  visible (correcto); la lista se refresca al volver a ella (caso 2). Se reporta aparte con
  `removeTab:106`.

Verificado además: al cambiar de pestaña el componente **no se destruye** (misma instancia al
volver; Material solo saca el contenido inactivo del DOM).

## Qué queda sin verificar / fuera de alcance

- Otras vistas del módulo con el mismo patrón (historial de retiros/colectas, colecta interna, retiro
  a proveedor): quedan fuera; el mecanismo queda listo para sumarlas. *Colecta interna* además tiene
  selección en curso que un refresco pisaría: requiere decidir aparte (y la toca el PR #352).
- Otros módulos (p. ej. saldo de caja): mismo mecanismo reutilizable, fuera de alcance.
- `TabService.currentIndex` no se actualiza cuando el usuario hace clic en una pestaña
  (`tabChanged` no llama `setTabActive`, comentado): preexistente, no se toca.
- Refresco de una vista en segundo plano mientras la ventana de Electron pierde/recupera foco: no se
  cubre (solo cambio de pestaña interna).
