# Plan: listas de Financiero vuelven a la página 1 al filtrar

Issue: #574 (fase Financiero). Rama: `fix/financiero-listas-volver-pagina-1`. Pieza: **desktop** solamente.
Fase RRHH ya hecha con el mismo patrón: PR #575.

## Problema

Al aplicar, cambiar o limpiar un filtro estando en la página X, la lista pide la página X del resultado
nuevo y queda vacía (paginación del backend), o el paginador sigue marcando X.

## Patrón

El de `productos/producto/list-producto` y el de la fase RRHH:

- el método que hoy consulta con la página vigente pasa a llamarse `buscar()` (o se conserva si ya se llama
  así) y lo usan **arranque, paginador y recargas tras una acción**: conservan la página;
- el método que dispara el filtro (el que ya llama el template) pone `pageIndex = 0` y
  `paginator.pageIndex = 0` (o el `[pageIndex]` enlazado) y llama a `buscar()`;
- sin `paginator.firstPage()` en paginación del backend (emite `page` → segunda consulta). En filtro local
  (`MatTableDataSource`) sí se usa `firstPage()`.

## Archivos (fase única)

Carpetas bajo `src/app/modules/financiero/`; archivo `<carpeta>/<nombre>.component.ts`:

| Pantalla | Componente | Cambio |
|---|---|---|
| Cajas (PDV) | `pdv/caja/list-caja` | `onFilter` → `buscar` + `onFilter` nuevo que reinicia. Usan `buscar()`: `handlePageEvent` y la recarga tras el diálogo (L266). Siguen en `onFilter`: `(filtrar)`, Enter, `onSelectSucursal`, `onSelectCajero`, `onSelectMaletin`, `onClearCajero`. Se agrega `@ViewChild(MatPaginator)`; el reinicio va con guarda `if (this.paginator)` porque `ngOnInit` filtra (vía `onSelectSucursal`) antes de que exista. `onResetFilter`: hoy dispara dos consultas que compiten (la de `onSelectCajero(null)` sale con el maletín viejo, las dos con las fechas viejas). Pasa a dejar todo el estado limpio primero (cajero, maletín y sus controles, fechas, `conObsControl`) y llamar `onFilter()` **una sola vez**. `verificadoControl` no se resetea hoy: fuera de alcance. |
| Retiros | `retiro/list-retiro` | `onFiltrar` → `buscar` + `onFiltrar` nuevo. `buscar()`: `ngOnInit`, `handlePageEvent`, recargas tras anular/corte (L149, L155). Se agrega `@ViewChild(MatPaginator)`. `resetFiltro` sigue vaciando la tabla sin consultar, pero además reinicia la página (`pageIndex`, paginador) y `selectedPageInfo = null`: hoy, tras Limpiar, «siguiente» pedía la página X+1 sin filtros. |
| Cajas virtuales | `caja-virtual/list-caja-virtual` | `onFiltrar` → `buscar` (con el snapshot `filtrosAplicados` adentro, como hoy) + `onFiltrar` nuevo. `buscar()`: `ngOnInit`, `handlePageEvent`, recargas tras diálogos/acciones (L157, L207, L264, L282). La relectura de fondo (`cargar(filtrosAplicados, true)`) no cambia. `onResetFiltro` llama `onFiltrar()` sin asignar `pageIndex` a mano. Se agrega `@ViewChild(MatPaginator)`. |
| Historial de movimientos de caja virtual | `caja-virtual/historial-movimientos-caja-virtual` | `onFiltrar` → `buscar` + `onFiltrar` nuevo. `buscar()`: `ngOnInit`, `handlePageEvent`. `onResetFiltro` ya llama `onFiltrar()`. Se agrega `@ViewChild(MatPaginator)`. |
| Lotes de documentos electrónicos | `documento-electronico/lote-de/list-lote-de` | `onSearch` → `buscar` + `onSearch` nuevo que reinicia (ya tiene `@ViewChild`). `buscar()`: `ngOnInit`, `handlePageEvent`. `onResetFiltro` ya llama `onSearch()`. |
| Notas de crédito | `nota-credito/list-nota-credito` | `buscar()` queda; `onFiltrar()` nuevo (`pageIndex = 0` + `buscar()`; el paginador tiene `[pageIndex]` enlazado). El botón Buscar del `.html` pasa a `onFiltrar()`. Recargas tras enviar/reenviar/anular siguen en `buscar()`. |
| Notas de remisión | `nota-remision/list-nota-remision` | Igual que notas de crédito. |
| Solicitudes de gasto | `gastos/pages/list-pre-gastos` | `onRefrescar()` (lo usan `(filtrar)`, Enter en ID y `onLimpiarFiltro`) pasa a emitir solo `paginationSubject.next({...value, pageIndex: 0})` en vez de `refetchSubject.next()`: el `combineLatest` vuelve a consultar con una sola emisión (con las dos saldrían dos consultas). Conserva `enviosSinConfirmar = {}`. Las recargas tras acción usan `refetchSubject` directo y conservan la página. No tiene otros llamadores. `onFiltrarFechas()` (sin llamadores) no se toca. |
| Pagar compras/gastos/vales (diálogo) | `caja-virtual/pagar-compras-dialog` | Filtro local. Las 7 suscripciones `valueChanges` de filtros (L342 RRHH, L352-353 vales, L359-361 gastos, L387 proveedor/funcionario en todos los modos) pasan a un método que llama `aplicarFiltro()` y `dataSource.paginator?.firstPage()`. Los `setValue(..., {emitEvent:false})` no pasan por ahí. La carga, la recarga y «devolver a compras» siguen con `aplicarFiltro()` solo (conservan la página). |

Altas (`onAdd`, `onAdicionar`, `abrirNueva`) recargan con `buscar()` y conservan la página, igual que en la fase RRHH: son recargas, no filtros.

Commit: `git add` por archivo (hay carpetas `.omc/` sin trackear que no van).

Fuera de alcance: las demás fases de #574.

## Tabla de datos nuevos

N/A para desktop porque no nace ningún campo, columna ni clave.

## Migraciones / backend

N/A: no toca central ni filial; las queries y su firma no cambian.

## Tests

- Batería: N/A para desktop (su CI no corre tests) [ev: ciclo §1 paso 9]. Gate: `npm run check` leído del log.
- Prueba por pantalla en local (central 8081 `dev` + `ng serve -c web`), en **cada una de las 9**:
  0. `count(*)` sin filtro > 15 y con el filtro elegido ≤ 15; si no, sembrar datos marcados y borrarlos al final.
     Filtros: Cajas → estado o sucursal; Retiros → sucursal o id de caja; Cajas virtuales → tipo/activo;
     Historial → rango de fechas; Lotes DE → estado; Notas → sucursal; Pre-gastos → ID + Enter o fechas;
     Pagar compras → proveedor/id (modo gastos y un modo RRHH).
  1. Página > 1 → cada filtro (select, Enter, buscador, botón Filtrar/Buscar) → página 1 con datos, paginador en 1,
     consulta con página 0 en la red.
  2. Limpiar desde página > 1 → página 1 (Retiros: tabla vacía, como hoy).
  3. Paginar sigue funcionando; una recarga tras acción conserva la página (al menos en una pantalla con acción).
  4. Cajas: Limpiar desde página > 1 con cajero y maletín elegidos → **una** consulta, con fechas por defecto y sin
     cajero ni maletín. Abrir la pantalla sin errores de consola.
  4b. Pre-gastos: cada filtro produce exactamente **una** consulta, también estando en página 0.
  4c. Retiros: Limpiar → paginador en 1 y vacío; «siguiente» no consulta páginas sin filtro.
  5. Pagar compras: filtrar desde página 2 → página 1; recargar conserva la página.
  6. Contraste: una pantalla con el código de `origin/develop` muestra la tabla vacía con los mismos pasos.
- Pantallas que leen datos del filial o de SIFEN: si hace falta, filial propio en 8082 con SIFEN apagado.

## Qué queda sin verificar / fuera de alcance

- Preexistente, no se arregla: respuestas fuera de orden (una consulta vieja puede pisar a la nueva) y la
  recarga tras anular el único ítem de la última página deja la tabla vacía.
