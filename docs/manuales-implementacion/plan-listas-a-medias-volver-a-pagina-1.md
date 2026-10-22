# Plan: listas «a medias» de #574 vuelven a la página 1 al filtrar

Issue: #574 (última fase). Rama: `fix/listas-a-medias-volver-pagina-1`. Pieza: **desktop** solamente.
Fases anteriores: RRHH (#575), Financiero (#580), Operaciones (#584), «Otras» (#590).

## Problema

En estas listas el filtro ya ponía `pageIndex = 0` (los datos vuelven a la página 1), pero **el paginador seguía
marcando la página X**: el usuario ve «26 – 50 of 12» con la página 1 en pantalla, y «anterior/siguiente» salta
desde la X. En algunas, además, el botón Buscar / Enter no reiniciaba.

## Patrón

Filtrar, Buscar y Limpiar dejan **la variable y el paginador** en la página 1:
`this.pageIndex = 0; if (this.paginator) this.paginator.pageIndex = 0;` (sin `firstPage()`, que emite `page` y
consulta dos veces). El paginador y las recargas tras una acción conservan la página.

## Archivos (fase única)

Carpetas bajo `src/app/modules/`:

| Pantalla | Archivo | Cambio |
|---|---|---|
| Sucursales | `empresarial/sucursal/list-sucursal` | `onFiltrar` → `buscar` + `onFiltrar()` nuevo (`clearTimeout(this.timer)`, reinicio, `buscar()`). Usan `buscar()`: `setTimeout` de `ngOnInit`, recargas tras editar/nueva (L150, L161), `handlePageEvent`. Siguen en `onFiltrar()`: `(filtrar)`, Enter y los `valueChanges` de texto (debounce), depósito y activo. `resetFiltro`: hoy sus 3 `setValue` disparan los `valueChanges` y salen 2–3 consultas, una con el filtro viejo (depósito limpio, activo todavía viejo) que puede llegar última. Pasa a `setValue(..., { emitEvent: false })` en los tres y un único `onFiltrar()` al final (que reinicia página y paginador): una consulta, sin estado intermedio. |
| Proveedores | `personas/proveedor/list-proveedor` | `onFilter` y `onResetFiltro` ya ponen `pageIndex = 0`: suman el reinicio del paginador. `loadPage` (arranque, paginador, recargas) no cambia. |
| Proveedores de servicios | `personas/proveedor-servicio/list-proveedor-servicio` | Igual que Proveedores. |
| Usuarios | `personas/usuarios/list-usuario` | `onFiltrar` → `buscar` + `onFiltrar()` nuevo (`clearTimeout`, reinicio, `buscar()`). Usan `buscar()`: `setTimeout` de `ngOnInit`, `handlePageEvent`, recarga tras alta (L170). Siguen en `onFiltrar()`: `(filtrar)`, Enter, debounce del texto y `onRolesOpenedChange` (que ya reiniciaba). `resetFiltro` reinicia el paginador (sigue buscando vía el `valueChanges` del texto). |
| Solicitudes de pago | `operaciones/solicitud-pago/list-solicitud-pago` | Igual que Proveedores: `onFilter` y `onResetFiltro` suman el reinicio del paginador. |
| Recuperación de contraseñas | `rrhh/recuperacion-contrasena/list-solicitud-recuperacion` | Se agrega `@ViewChild(MatPaginator)`. `onFiltrar` → `buscar` + `onFiltrar()` nuevo que reinicia. `onCambiarEstado` (select de estado) pasa a llamar `onFiltrar()`. Usan `buscar()`: `ngOnInit`, `handlePageEvent`, recargas tras aprobar/rechazar (L123, L139). Es `OnPush`: el setter de `pageIndex` del paginador marca para revisar. |
| Gestión de compras | `operaciones/compra/gestion-compras/gestion-compras.component.ts` | (1) Al cambiar el proveedor (el `valueChanges` del form, ~L662), `productosProveedorPageIndex = 0` antes de cargar, en las dos ramas: la carga al entrar a la pestaña Ítems usa esa misma variable. (2) `loadUltimasCompras(productoId)` vuelve a `ultimasComprasPageIndex = 0` **al llegar la respuesta** (en el `next`, antes de `applyUltimasComprasPagination()`): así durante la consulta, o si falla, no queda el paginador en 1 con las filas viejas de la página X. Solo la llaman al elegir un producto (clic L4947, teclado L5379); efecto: un clic sobre la misma fila estando en la página 2 vuelve a la 1. Los dos paginadores ya tienen `[pageIndex]` enlazado. La paginación con el teclado y los botones propios (L5296–5351) no cambian. |

Commit: `git add` por archivo (hay carpetas `.omc/` sin trackear que no van).

## Tabla de datos nuevos / Migraciones / backend

N/A para desktop: no nace ningún campo; no toca central ni filial; las queries no cambian.

## Tests

- Batería: N/A para desktop (su CI no corre tests) [ev: ciclo §1 paso 9]. Gate: `npm run check` leído del log.
- Prueba por pantalla en local (central 8081 `dev` + `ng serve -c web`), en cada una: desde la página 2, cada
  filtro, Buscar/Enter y Limpiar → **el paginador marca 1** («1 – N of …») y la consulta sale con página 0;
  paginar sigue funcionando; una recarga tras acción conserva la página. Sembrar datos marcados donde no
  alcancen y borrarlos al final.
- Sucursales: Limpiar con «Inactivas» y depósito elegido → **una** consulta con los filtros por defecto. Teclear y paginar antes de los 500 ms del debounce.
- Usuarios: Limpiar con el texto vacío y roles elegidos → una consulta sin roles. Teclear y paginar antes del debounce.
- Proveedores / Proveedores de servicios / Solicitudes de pago: el paginador no enlaza `[pageSize]` (marca 15 y la consulta pide 25 hasta el primer cambio): elegir 15 por página antes de probar.
- Gestión de compras: con un proveedor con más de una página de productos, ir a la página 2 y cambiar de
  proveedor → página 1; en «últimas compras», ir a la página 2 y elegir otro producto → página 1.
- Contraste: una pantalla con el código de `origin/develop` muestra el paginador en la página vieja.

## Qué queda sin verificar / fuera de alcance

- Preexistente: respuestas fuera de orden (en Gestión de compras, una carga de productos del proveedor anterior en vuelo puede pisar la del nuevo: `loadProductosProveedor` no cancela la anterior); doble consulta al abrir Sucursales/Usuarios (`_changePageSize` emite `page`); `OnPush` + `app-generic-list` (#576) puede bloquear Buscar en
  Recuperación de contraseñas.
