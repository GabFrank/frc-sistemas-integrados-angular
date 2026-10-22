# Plan: listas «Otras» de #574 vuelven a la página 1 al filtrar

Issue: #574 (fase «Otras»). Rama: `fix/listas-otras-volver-pagina-1`. Pieza: **desktop** solamente.
Fases anteriores con el mismo patrón: RRHH (#575), Financiero (#580), Operaciones (#584).

## Patrón

Filtrar, Buscar y Limpiar vuelven a la página 1 (variable y paginador); el paginador y las recargas tras una
acción conservan la página. Sin `firstPage()` cuando pagina el backend.

## Archivos (fase única)

| Pantalla | Archivo | Cambio |
|---|---|---|
| Clientes | `modules/personas/clientes/list-clientes/list-clientes.component.ts` | `onFiltrar(keepSelection)` → `buscar(keepSelection)` + `onFiltrar()` nuevo: `clearTimeout(this.timer)` (el debounce pendiente no repite la consulta), `pageIndex = 0`, `if (this.paginator) this.paginator.pageIndex = 0` (no emite `page`; sin `firstPage()`) y `buscar()`. Usan `buscar()`: `setTimeout` de `ngOnInit`, `handlePageEvent` y las recargas `onFiltrar(true)` (L333, L341 → `buscar(true)`). Siguen en `onFiltrar()`: `(filtrar)` (aplica también el select «tipo de cliente», que no consulta solo), Enter, y el debounce de 800 ms del texto (ahora reinicia también el paginador). `resetFiltro` sigue vaciando sin consultar, y además reinicia el paginador. |
| Vehículos | `modules/activos/vehiculos/vehiculo/service/vehiculo.service.ts` y `pages/list-vehiculos/list-vehiculos.component.ts` | Paginación en memoria (el servicio trae hasta 1000 y recorta por página). `refrescar(volverAPagina1 = false)`: con `true`, vuelve a la página 0 **al llegar la respuesta** (antes de publicar la lista), así no se ve la página 0 de la lista vieja durante la red y un error no mueve la página. `setSearchText` (debounce del texto) y el botón Buscar (`onFiltrar` del componente) llaman `refrescar(true)`. `updatePagination` conserva el `pageSize`. Las recargas tras guardar/eliminar (`refrescar()` del servicio) conservan la página. El paginador ya tiene `[pageIndex]` enlazado al estado del servicio. `setSearchText` del servicio solo lo usa `list-vehiculos` (los otros activos tienen su propio servicio). |
| Editar producto: pasos familia y subfamilia | `modules/productos/producto/edit-producto/producto.component.ts` y `.html` | `onFilterFamilia()` y `onFilterSubfamilia()` ponen su página (`familiaPageIndex` / `subfamiliaPageIndex`) en 0 antes de buscar. Cerrar el filtro (`abrirFiltroFamilia` / `abrirFiltroSubfamilia`) también vuelve a la 0. Elegir otra familia (`nextFamilia` → `onFilterSubfamilia`) arranca la subfamilia en la 0. Se enlazan `[pageIndex]` y `[pageSize]` en los dos `<mat-paginator>` (los handlers ya mantienen las variables): hoy el paginador muestra 50 por defecto mientras la consulta pide 15, y al pasar de página las filas 16–50 nunca se veían. `onSearchSubfamilia` gana una guarda `if (!this.selectedFamilia) return;` (preexistente: `onSearchFamilia` deselecciona la familia y luego filtrar la subfamilia tiraba TypeError; cerrar el filtro de familia suma un camino a ese estado). La recarga tras un alta sin confirmar (L893, `onSearchSubfamilia`) conserva la página. |
| Diálogo genérico de búsqueda | `shared/components/search-list-dialog/search-list-dialog.component.ts` y `.html` | `onBuscar()` (botón Buscar y Enter) pone `pageIndex = 0` antes de `onSearch()`; si ya hay una búsqueda en curso no hace nada (hoy `onSearch` la descarta igual, y así la página no queda desfasada de la tabla). Se enlazan `[pageIndex]="pageIndex"` y `[pageSize]="pageSize"` en su `<mat-paginator>` (en un `*ngIf`): mismo desfase de tamaño que en Editar producto (muestra 50, pide 15). Así `clearSearch` (que ya pone 0) se ve en el paginador. La búsqueda inicial y el paginador siguen llamando `onSearch()`. Lo usan muchos buscadores: el cambio solo afecta a Buscar/Enter. |

**Desvío encontrado al probar (paso 9):** en `producto.component.html`, el botón que cierra el filtro de
**subfamilia** tenía `*ngIf="filtroFamiliaOpen"` (el de familia): solo aparecía con el filtro de familia abierto, así
que el filtro de subfamilia no se podía cerrar desde la pantalla. Se corrige a `filtroSubfamiliaOpen`.

Commit: `git add` por archivo (hay carpetas `.omc/` sin trackear que no van).

## Tabla de datos nuevos

N/A para desktop porque no nace ningún campo, columna ni clave.

## Migraciones / backend

N/A: no toca central ni filial; las queries y su firma no cambian.

## Tests

- Batería: N/A para desktop (su CI no corre tests) [ev: ciclo §1 paso 9]. Gate: `npm run check` leído del log.
- Prueba por pantalla en local (central 8081 `dev` + `ng serve -c web`):
  1. Clientes: página > 1 → tipo de cliente + Buscar; Enter; texto con debounce → página 1 (red: página 0);
     Limpiar → tabla vacía y paginador en 0; paginar sigue; recarga `buscar(true)` conserva la página.
  2. Vehículos: página > 1 → texto (debounce) y tipo → página 1 con datos; Buscar → página 1. Sembrar
     vehículos si no hay más de una página.
  3. Editar producto: en el paso familia, página > 1 → filtro con Enter → página 1; cerrar el filtro →
     página 1. Subfamilia: idem; elegir otra familia → subfamilia en la 1.
  4. Diálogo de búsqueda (por ejemplo el de sucursal de Cajas o el de cargo de Funcionarios): página > 1 →
     Buscar/Enter → página 1 (red: página 0).
  5. Contraste: una pantalla con el código de `origin/develop` muestra la tabla vacía.

## Qué queda sin verificar / fuera de alcance

- Editar producto: filtrar o paginar en el paso familia deselecciona la familia (`onSearchFamilia` → `onFamiliaSelect(null)`), y cerrar el filtro ahora además vuelve a la página 1. Preexistente.
- Vehículos: el servicio es singleton y conserva texto y página al cerrar la pestaña (preexistente); en la prueba, reabrir la pestaña entre casos.

- Preexistente: respuestas fuera de orden en Clientes; el `isSearching` del diálogo descarta búsquedas
  pedidas mientras otra está en curso.
