# Plan: listas de Operaciones vuelven a la página 1 al filtrar

Issue: #574 (fase Operaciones). Rama: `fix/operaciones-listas-volver-pagina-1`. Pieza: **desktop** solamente.
Fases anteriores con el mismo patrón: RRHH (#575, mergeada) y Financiero (#580).

## Patrón

- El método que hoy consulta con la página vigente pasa a llamarse `buscar()` y lo usan **arranque,
  paginador, refresco automático, relectura al volver a la pestaña y recargas tras una acción**: conservan la página.
- El método que dispara el filtro (el que ya llama el template) pone `pageIndex = 0` y
  `paginator.pageIndex = 0` (con guarda `if (this.paginator)`), y llama a `buscar()`.
- Sin `paginator.firstPage()` (emite `page` → segunda consulta).

## Archivos (fase única)

Carpetas bajo `src/app/modules/operaciones/`; archivo `<carpeta>/<nombre>.component.ts`:

| Pantalla | Componente | Cambio |
|---|---|---|
| Ventas de caja | `venta/list-venta` | `onFiltrar` → `buscar` + `onFiltrar` nuevo. `(cargarMasDatos)` es código muerto (`isCargarMas` en false) y queda igual. `buscar()`: las dos llamadas de `ngOnInit` y `handlePageEvent`. `(filtrar)` y Enter en ID siguen en `onFiltrar()`. Los toggles solo setean valores (se aplican con Buscar). `onResetFiltro` sigue vaciando la tabla sin consultar, pero reinicia página, paginador y `selectedPageInfo` (como Retiros en Financiero). |
| Compras/pedidos | `compra/list-compra` | `onFilter` → `buscar` + `onFilter` nuevo. `buscar()`: `setTimeout` de `ngOnInit`, `interval` de 5 min, `onGetPedidos` (arranque), recargas tras cancelar (L380, L409) y `handlePageEvent`. `onResetFiltro` llama `onFilter()` (ya lo hace). Producto y proveedor solo setean (se aplican con Buscar). `buscar()` desuscribe la consulta anterior (`listaSub`): el refresco de 5 min o una página lenta no pisa el resultado nuevo. |
| Transferencias | `transferencia/list-transferencia` | `onFilter` → `buscar` + `onFilter` nuevo. `buscar()`: `setTimeout` de `ngOnInit`, `interval` de 5 min, `onGetTransferencias` (arranque), recarga tras asignar ruta (L623), `handlePageEvent`. **`onResetFiltro` hoy limpia los controles pero no consulta: la tabla queda con el filtro viejo. Pasa a llamar `onFilter()` al final** (Limpiar recarga desde la página 1, como en Compras y Devoluciones; manda `estados: []` igual que el arranque). `buscar()` desuscribe la consulta anterior, como Compras. |
| Ítems de una transferencia | `transferencia/edit-transferencia` | Campo nuevo `filtroProductoAplicado` (texto **aplicado**, no el del input). `getTransferenciaItemList()` decide por él: con texto usa la consulta con filtro, sin texto la de siempre. Así el paginador, la carga inicial (y el `page` que emite su `_changePageSize`) y las recargas vía `cargarDatos` (refresh, cambio de etapa, etc.) piden lo mismo: hoy paginar perdía el filtro, y con dos consultas distintas en vuelo ganaba la última. `onFilterProducto()` (Enter) guarda el texto (vacío = sin filtro), pone `pageIndex = 0` y `paginator.pageIndex = 0` (guarda) y recarga. Cerrar el filtro (`abrirFiltroProductos`) limpia el aplicado, vuelve a la 0 y recarga sin filtro. Texto escrito sin Enter no se aplica al paginar. |
| Devoluciones | `devolucion/list-devolucion` | `onFilter(silencioso)` → `buscar(silencioso)` + `onFilter()` nuevo. `buscar()`: `setTimeout` de `ngOnInit`, relectura al reactivar la pestaña (`buscar(true)`), `handlePageEvent`. Siguen en `onFilter()`: `(filtrar)`, `onBuscarProveedor` (Enter/clic), `onRemoverProveedor`, `onResetFiltro` (sin asignar `pageIndex` a mano). |
| Movimientos de stock | `movimiento-stock/list-movimiento-stock` | Ya distingue `onFiltrar(isPagination)`. Cuando **no** es paginación, `page = 0` y `paginator.pageIndex = 0`. Se agrega `@ViewChild(MatPaginator)`. `resetFiltro()` está vacío hoy (Limpiar no hace nada): fuera de alcance, va a issue aparte. |
| Modificaciones del sistema | `modificaciones-sistema/modificaciones` | `onFiltrar` → `buscar` + `onFiltrar` nuevo. `buscar()`: `ngAfterViewInit` y `handlePageEvent`. Las dos validaciones (módulo y fechas) pasan a un `filtrosValidos()` que usan los dos: el `onFiltrar` nuevo valida **antes** de reiniciar la página (si no, el paginador marcaría 1 con la tabla en N). `resetFiltro` sigue vaciando sin consultar, pero reinicia también el paginador y `selectedPageInfo`. Es `OnPush`: Buscar/Limpiar quedan bloqueados tras el primer clic (#576, aparte). |

Commit: `git add` por archivo (hay carpetas `.omc/` sin trackear que no van).

## Tabla de datos nuevos

N/A para desktop porque no nace ningún campo, columna ni clave.

## Migraciones / backend

N/A: no toca central ni filial; las queries y su firma no cambian.

## Tests

- Batería: N/A para desktop (su CI no corre tests) [ev: ciclo §1 paso 9]. Gate: `npm run check` leído del log.
- Prueba por pantalla en local (central 8081 `dev` + `ng serve -c web`), en **cada una de las 7**:
  0. Datos: más de una página sin filtro y ≤ 1 página con el filtro; si no, sembrar marcados y borrar al final.
  1. Página > 1 → cada filtro (select, Enter, buscador, botón Buscar) → página 1 con datos, paginador en 1,
     consulta con página 0 en la red.
  2. Limpiar desde página > 1 → página 1 (Ventas de caja y Modificaciones: tabla vacía y paginador en 0).
  3. Paginar sigue funcionando; refresco/recarga conservan la página (Compras/Transferencias: disparar
     `buscar()` del intervalo; Devoluciones: volver a la pestaña).
  4. Ítems de transferencia: Enter con texto → página 1 filtrada; paginar conserva el filtro (red: texto y
     página 1); escribir otro texto sin Enter y paginar sigue con el aplicado; Refresh con filtro → mismo
     resultado, una sola variante de consulta; cerrar el filtro → página 1 sin filtro; reabrir con texto viejo
     y paginar → sin filtro; Enter con texto vacío → sin filtro.
  4b. Modificaciones es OnPush (#576): reabrir la pestaña entre Buscar y Limpiar si el botón queda bloqueado.
  4c. No usar el ID como filtro discriminante en Compras/Transferencias (esa rama no pagina).
  5. Contraste: una pantalla con el código de `origin/develop` muestra la tabla vacía con los mismos pasos.

## Qué queda sin verificar / fuera de alcance

- Preexistente, no se arregla (van a issues aparte si el usuario quiere): respuestas fuera de orden en Ventas y
  Modificaciones; recarga tras borrar el único ítem de la última página; Movimientos de stock: Limpiar no hace
  nada y `size = 20` no coincide con el paginador; Ventas de caja: Limpiar no reinicia Modo ni Moneda;
  Modificaciones: con dos esquemas corta cada uno a `pageSize`; filtro por ID en Compras/Transferencias no
  actualiza el paginador.
- Ítems de transferencia: `cargarPaginaItems` llama `verificarEtapa()`, que en algunas etapas filtra la tabla
  por rechazados; ahora también corre al paginar con filtro (antes solo con Enter).
