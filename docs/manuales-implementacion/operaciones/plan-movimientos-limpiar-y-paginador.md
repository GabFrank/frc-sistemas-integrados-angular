# Plan — Movimientos de stock: Limpiar, paginador y búsqueda sin producto (issue #581)

Pieza: **desktop**. Rama: `fix/operaciones-movimientos-filtro-paginador`, desde `origin/develop` (`aad4076c`).
Pantalla: Operaciones → Movimientos (`operaciones/movimiento-stock/list-movimiento-stock`). Sin cambios en el central
ni en el filial: todo lo que se usa ya existe en el esquema.

## Relevamiento (leído de `origin/develop` y `origin/master`, 2026-10-23)

| # | Lo que dice la issue | Lo que hay | Estado |
|---|---|---|---|
| 1 | «Limpiar» no hace nada | `resetFiltro() { }` vacío (L700), igual en `master` | confirmado |
| 2 | La 1.ª página no coincide con el paginador | `size = 20` (L148); el `<mat-paginator>` no tiene `[pageSize]`, opciones `[15, 25, 50, 100]`: la 1.ª consulta trae 20 filas, la 2.ª pide `page 1, size 15` y repite las filas 16–20 | confirmado |
| 3 | Sin producto queda vacía sin aviso | Ya avisa «Debe seleccionar un producto…» y pone el resumen en `sin-producto` (L265, desde 2025-08, también en `master`). Pero **antes** dispara `onGetMovimientos()` con `productoId` nulo: el central (`MovimientoGraphQL.findMovimientoStockByFilters`) devuelve `null` y la consulta sobra. El aviso además depende de `sucursalIdList.length > 0` | parcial |
| 4 | — (sospecha del relevamiento) | Se sospechó que `onGetAllSucursales` traía solo 10 sucursales porque el esquema declara `sucursales(page:Int = 0, size:Int = 10)`. **Falso** (auditoría eje A): `SucursalService.findAll(pageable)` ignora el `Pageable` y devuelve `findAllByActivoTrueOrderByIdAsc()` (develop y master). La pantalla ve todas las activas (22 de 29 en la base local, 21 sin la 0). **Fuera del alcance**: no se toca | descartado |
| 5 | — | `@ViewChild("buscadorUsuarioInput")` no tiene ref en el template (el input es `#usuarioInput`): la «x» de usuario limpia y después tira `TypeError` en `nativeElement.focus()` | nuevo, menor |

## Fase 1 (única) — `list-movimiento-stock.component.{ts,html}`

1. **Paginador** (#2): `size = 15`, la primera opción del paginador. No se agrega `[pageSize]`: `handlePageEvent`
   ya copia el tamaño elegido a `size`.
2. **Limpiar** (#1): `resetFiltro()` vuelve el formulario al estado de `ngOnInit` y **no consulta** (sin producto la
   consulta solo daría el aviso «Debe seleccionar un producto», a cada clic en Limpiar):
   - fechas: dos `Date` **nuevos** (hoy − 7 y hoy), como `ngOnInit`: `onGetResumen`/`onGetMovimientos` mutan con
     `setHours` el objeto del control, así que no se reusa ni ese objeto ni `today` (lo usa el `[max]`); horas
     `00:00` / `23:59`;
   - sucursales, tipo de movimiento, referencia: `null`;
   - producto: `selectedProducto = null`, `buscarProductoControl` `null`, `productoList = []`, `isPesable = false`;
   - usuario: `selectedUsuario = null`, `buscarUsuarioControl` `null`;
   - resultados (helper `vaciarResultados()`, compartido con el punto 3): `dataSource.data = []`,
     `selectedPageInfo = null`, `expandedMovimiento = null`, `page = 0`, `paginator.pageIndex = 0` (con `if`, como
     `onFiltrar`), `++cargaLista` y `++cargaResumen` (descartan respuestas en vuelo de un filtro anterior),
     `stockTotal = null`, `stockPorRangoFecha = null`, `stockPorTipoMovimiento = []`, `stockActualDesglose = []`,
     `stockPeriodoSinRespuesta = ''`, `desgloseHabilitado = false`;
   - resumen en `inicial`.
   El tamaño de página que eligió el usuario se conserva (lo mismo hace `onFiltrar`). `generic-list` desbloquea
   solo el botón Limpiar al segundo: el padre no tiene que hacer nada.
3. **Sin producto** (#3): en `onGetResumen`, el chequeo de producto pasa **antes** de `onGetMovimientos()` y deja
   de depender de las sucursales: `vaciarResultados()` (incluye los dos `++carga`, para que una respuesta lenta del
   filtro anterior no repinte), resumen en `sin-producto`, mismo aviso, y no consulta. Cambio deliberado: hoy el
   aviso no sale si la lista de sucursales no cargó; va en la descripción del PR. Nadie abre esta pestaña con
   datos precargados (`side-mini-variant:1072`, `notification-board:321`), así que no hay otro camino sin producto.
   La issue proponía avisar «Elegí un producto»: el aviso ya existe; lo que se corrige es la consulta de más.
4. **Sucursales** (#4): sin cambios (ver relevamiento).
5. **Usuario** (#5): el `@ViewChild` pasa a `"usuarioInput"`, el ref que sí existe.

## Datos nuevos

Ninguno: no hay campo, columna ni clave nueva.

## Tests

- **Spec** (`list-movimiento-stock.component.spec.ts`): el actual («should create» con `TestBed` sin providers,
  13 dependencias en el constructor) no levanta en `develop`. Se reescribe instanciando con
  `new ListMovimientoStockComponent(stubs…)`, con spies en `onGetMovimientoStockPorFiltros` y `openWarn`. Casos:
  `size` inicial 15; `resetFiltro` deja formulario y resumen en el estado inicial y no llama al servicio;
  `onGetResumen` sin producto no llama a movimientos y avisa; una respuesta tardía de un filtro con producto no
  repinta después de Limpiar. **Se confirma el rojo contra el código viejo** antes de aplicar el fix. Se corre con
  Karma y tsconfig temporal acotado (`DISPLAY=:0`, memoria «Desktop: arranque sin xvfb»).
- **Gate:** `npm run check` (AOT), leído del log.
- **Pantalla** (central local 8081 + `ng serve -c web`, usuario MR):
  1. Filtrar sin producto → aviso, tabla vacía, **sin** request a `findMovimientoStockByFilters` (pestaña red).
  2. Elegir producto con > 15 movimientos en el rango → la 1.ª página muestra 15 filas y «1 – 15»; la 2.ª
     arranca en la 16 sin repetir.
  3. Llenar todos los filtros, Limpiar → todo vuelve al inicio, tabla y resumen vacíos, sin aviso ni request.
     Limpiar mientras carga un filtro → la respuesta vieja no repinta.
  4. «x» de usuario → limpia sin error en consola.

## Auditoría del plan (paso 5)

- **Eje A** (contrato y propagación): la premisa de «10 de 29 sucursales» era falsa → el punto 4 se sacó. Sin
  cambio de esquema ni de backend: un desktop viejo o nuevo contra cualquier central se comporta igual. Anotado,
  fuera de alcance: el filtro de sucursales no ofrece las inactivas (ni por esta vía ni por `sucursalesSearch`),
  así que no se ven movimientos de una sucursal cerrada; y `onSearchSucursal` manda `filtro` cuando la query
  declara `$texto` (latente, hoy solo se llama con `null`).
- **Eje B** (estado): el camino sin producto tenía que llevarse los `++carga` (si no, una respuesta lenta repinta
  tras Limpiar) → incorporado con `vaciarResultados()`. La lista de campos de Limpiar quedó explícita. El spec actual
  no levanta → se reescribe con instancia directa y se confirma el rojo con el código viejo.

## Sin verificar / riesgos

- Ninguno de persistencia ni de contrato. Lo único sin red automática en el CI es la propia pantalla: se prueba
  por el navegador (sección Tests).
