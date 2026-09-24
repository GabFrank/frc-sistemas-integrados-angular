# Plan — no ajustar el stock de COMPRAS sin el rol que permite verlo

Rama: `fix/ajustar-stock-compras-por-rol` (desde `origin/develop` `ed99ed18`, que ya trae el #339 y
su `esSucursalCompras()`). Pieza: **desktop**.

## Problema

«Ajustar stock» registra un movimiento `AJUSTE` por la diferencia entre lo contado y el stock
actual: escribe stock. Lo ve quien tiene `EDITAR_PRODUCTOS`. Hay dos diálogos: el común
(`ajustar-stock-dialog`) y el de productos con lote (`ajustar-stock-lote-dialog`).

Los dos arman su selector de sucursal excluyendo solo SERVIDOR (`ajustar-stock-dialog.component.ts:93`,
`ajustar-stock-lote-dialog.component.ts:157`). Quien no tiene `VER_STOCK_COMPRAS` elige COMPRAS,
**ve su stock y lo ajusta**, aunque en la lista de productos ese stock está oculto.

## Puntos de entrada

| # | Desde | Cómo llega COMPRAS hoy |
|---|---|---|
| E1 | Lista de productos → menú del producto → Ajustar stock | con el filtro de stock en «todos» el diálogo deja elegir sucursal, y el selector la incluye. Preseleccionada no puede venir: el filtro de sucursal de la lista ya la excluye sin el rol |
| E2 | Stock por lote → Ajustar (fila o desglose) | sin filtro de sucursal, el diálogo con lote la ofrece en el selector. **Con filtro**: el selector de filtro de esta pantalla (`list-stock-lote.component.ts:276`) **no** excluye COMPRAS, y `sucursalVisible` deja pasar cualquier sucursal filtrada (línea 646): sin el rol se ve el stock por lote de COMPRAS y el ajuste abre con COMPRAS fija |

## Criterio

Acá no alcanza con ocultar el número: ajustar exige conocer el stock. **Sin el rol, COMPRAS no se
puede elegir para ajustar**, y en stock por lote no se puede filtrar por ella (mismo criterio que
el filtro de sucursal de la lista de productos).

Permiso: `mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS])` en `ngOnInit`. COMPRAS:
`esSucursalCompras()`.

## Cambios

1. **`ajustar-stock-dialog`** y **`ajustar-stock-lote-dialog`**: el selector excluye COMPRAS sin el
   rol. Defensa para cualquier llamador futuro: si llega **preseleccionada** COMPRAS sin el rol, se
   avisa «Sin permiso para ajustar el stock de COMPRAS» y el diálogo se cierra sin resultado.
   - La defensa va en `ngOnInit`, **antes** de `cargarSucursales()`: esa función es la que pide el
     stock cuando hay sucursal preseleccionada (`ajustar-stock-dialog:96`,
     `ajustar-stock-lote-dialog:158-161`). Si se pone después, el stock ya se pidió.
   - Cada diálogo cierra con **su** valor de cancelar: `close(false)` el común (como su
     `onCancelar`, :188) y `close(null)` el de lote (como el suyo, :356). No da lo mismo:
     `list-stock-lote:544` recarga con `resultado != null`, así que un `false` ahí dispararía una
     búsqueda de más.
2. **`list-stock-lote`**: el selector del filtro de sucursal excluye COMPRAS sin el rol. Con eso
   `sucursalVisible` ya no puede recibir COMPRAS filtrada sin el rol, y E2 queda cubierto por (1).

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `puedeVerStockCompras` en los dos diálogos | `ngOnInit` | `cargarSucursales` y la defensa de preseleccionada |

`list-stock-lote` ya tiene `puedeVerStockCompras`; se reutiliza. Nada se persiste.

## Fases

**Fase 1 (única)** — `fix(stock): no dejar ajustar el stock de COMPRAS sin el rol que permite verlo`.

## Tests y verificación

- Batería: **N/A para desktop** (el runner no compila; el CI no corre tests).
- Build: `npm run check`, leído del log.
- Runtime, central local (perfil `dev`) + `ng serve -c web`, con rol y sin rol (roles sacados en
  memoria):
  1. Lista de productos, filtro de stock «todos» → Ajustar stock del 3424: sin el rol COMPRAS no
     está en el selector; con el rol sí.
  2. Stock por lote → el filtro de sucursal sin el rol no ofrece COMPRAS; con el rol sí.
  3. Defensa: abrir los dos diálogos con COMPRAS preseleccionada sin el rol → aviso y cierre, sin
     pedir el stock.
  - Sin guardar ningún ajuste: no hace falta para probar el selector.
  - Cada caso sin rol se hace **reabriendo** la pantalla después de sacar el rol.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | E1 y E2 son los únicos que abren los dos diálogos; no hay otro que escriba stock con AJUSTE | Confirma el alcance |
| A | En `list-stock-lote`, `this.sucursales` solo alimenta el filtro y el `find` del desglose; el desglose ya oculta COMPRAS sin el rol (`sucursalVisible`), así que el `find` no puede recibir COMPRAS. El hueco real es el filtro, que este plan cierra | Confirma el cambio 2 |
| A | Sin persistencia de filtros (ni localStorage ni queryParams) que pueda traer COMPRAS guardada | Sin acción |
| A | **Entrada/Salida** deja elegir cualquier sucursal (incluidas COMPRAS y SERVIDOR) y escribe stock; el acceso es `ANALISIS-PRODUCTOS`. El «Actual» del aviso de salida es el stock **total** (buscador sin sucursal), no el de COMPRAS | Fuera de alcance: no muestra el stock de COMPRAS, la deja mover. Otra decisión de permisos, anotada para el usuario |
| B | La defensa tiene que cortar antes de `cargarSucursales()` | Detallado en Cambios |
| B | Valores de cierre distintos por diálogo; `list-stock-lote` reacciona a `!= null` | Detallado en Cambios |
| B | `selectedSucursal` preseleccionada se asigna directo desde `data`, no con `find` sobre la lista filtrada: filtrar COMPRAS no la deja en `undefined` | Sin acción |
| B | El permiso se calcula una vez al abrir: la prueba sin rol tiene que reabrir la pantalla, no sacar el rol con la pantalla abierta | Aplicado en la prueba |
| B | Con el rol, nada cambia | Confirmado |

## Qué queda sin verificar

- El backend acepta un `AJUSTE` sobre COMPRAS de cualquiera con sesión (UX, como el #339).
- La base local no tiene lotes: el diálogo con lote se prueba en su selector y en la defensa, no en
  un ajuste real.

## Despliegue

`develop` → alpha → `release/beta`. Solo desktop, sin migración ni schema.
