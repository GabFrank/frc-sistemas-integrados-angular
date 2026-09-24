# Plan — ocultar el stock de la sucursal COMPRAS en compras a quien no tiene el rol

Rama: `fix/compras-stock-compras-por-rol` (desde `origin/develop` `ee3f1fea`). Pieza: **desktop**.
Independiente del PR #338 (stock en cero): toca otras líneas de los mismos archivos.

## Problema

El stock de la sucursal COMPRAS se oculta a quien no tiene `VER_STOCK_COMPRAS` (o ADMIN) en la
lista de productos y en el stock por lotes (`48cf53fd`, `3c15401f`). En **gestión de compras** no
hay ningún filtro: COMPRAS es `deposito=true, activo=true` (id 999 en bodega), así que entra en
`sucursalesInfluenciaFiltradas` y en la opción «Todos», que es el default. Cualquier usuario de
compras ve su stock. Stable tampoco lo filtraba: es un hueco de origen, no una regresión.

Es un control de **UX** (regla 10 del desktop): el dato igual viaja en la respuesta de
`stockPorSucursales`, que no tiene control de rol en el central. Cerrar eso es backend y queda
fuera de este plan.

## Dónde se ve hoy el stock de COMPRAS en compras

| # | Lugar | Qué muestra |
|---|---|---|
| 1 | `gestion-compras` → productos del proveedor, columna stock | total (suma de positivos) |
| 2 | idem → `StockDetalladoDialog` (clic en el stock) | fila por sucursal, COMPRAS incluida |
| 3 | `add-edit-item-dialog` → distribución de una fila con influencia COMPRAS | stock actual |
| 4 | idem | cantidad sugerida: resta el stock, así que también lo revela |
| 5 | idem, modo simplificado | stock total y tooltip con el desglose por sucursal |

Fuera de alcance: `compras-search-producto-dialog.mostrarStock` muestra el stock **total** del
producto (`sucId` null), que suma COMPRAS pero no la muestra aparte. La lista de productos
tampoco la descuenta de un total. Queda anotado para decidir aparte.

## Criterio

El mismo de la lista de productos: **se oculta el número, no la sucursal como opción**. COMPRAS
sigue pudiendo elegirse como influencia o entrega; lo que no se muestra es su stock.

- Flag `puedeVerStockCompras`, calculado en `ngOnInit` con
  `mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS])` (incluye el bypass de ADMIN por rol o
  nickname). Nunca una función en el HTML.
- COMPRAS se identifica por `nombre === 'COMPRAS'`, igual que los dos lugares existentes (el id
  999 es de bodega y no está garantizado en farmacia).

## Cambios

**`gestion-compras.component.ts`**
- `puedeVerStockCompras` en `ngOnInit`.
- `loadStockForProductosProveedor`: las sucursales de las que se arma `stockPorSucursal` excluyen
  COMPRAS si no hay rol. Eso cubre #1 (el total se calcula de esas entradas) y #2 (el diálogo
  recibe las mismas entradas). Si la única influencia era COMPRAS, queda el camino existente de
  «sin sucursales» (`stockTotal = null`, se ve «—»).

**`add-edit-item-dialog.component.ts` / `.html`**
- Inyectar `MainService`; `puedeVerStockCompras` en `ngOnInit`.
- `DistribucionItem.stockOculto: boolean`. Se decide en los dos caminos que cargan stock
  (`loadStockActualDeTodasLasDistribuciones` y `loadStockActual`, el de cuando cambia la
  influencia de una fila): si está oculto, no se pide el stock, `stockActual = 0` y la sugerida
  cierra sin calcular (`cantidadSugerida = null`). **En los dos caminos se apagan
  `stockActualLoading` y `cantidadSugeridaLoading` en el mismo paso**, con el mismo patrón que ya
  usan las filas sin sucursal de influencia; si no, la fila queda en «Calculando...» para siempre.
  Todo camino que crea o recarga una fila (edición, cambio de producto o presentación, «+»,
  simplificado) termina en uno de esos dos (auditoría eje B).
- HTML: si `item.stockOculto`, las columnas stock actual y sugerida muestran «—» (con tooltip
  «Sin permiso para ver el stock de COMPRAS»).
- Modo simplificado (#5): las filas ocultas se **filtran** antes de armar el total y el tooltip.
  No alcanza con el `stockActual = 0`: el tooltip igual escribiría «COMPRAS: 0.00 (0 unidades)»,
  un cero falso.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `puedeVerStockCompras` (gestion-compras) | `ngOnInit` | `loadStockForProductosProveedor` |
| `puedeVerStockCompras` (diálogo) | `ngOnInit` | los dos caminos de carga de stock |
| `DistribucionItem.stockOculto` | los dos caminos de carga de stock | HTML (2 columnas), `updateComputedProperties` (total y tooltip), `calcularCantidadSugeridaDeDistribuciones` |

No se persiste nada: `DistribucionItem` no viaja al guardar (`cantidadPedir` sí, sin cambios).

## Fases

**Fase 1** — `fix(compras): ocultar el stock de la sucursal COMPRAS sin el rol que lo permite`
(gestión de compras + diálogo de ítem + helper).

**Fase 2** — `fix(transferencias): ocultar el stock de COMPRAS como origen o destino sin el rol`
(T1, T2, T3).

## Tests y verificación

- Batería: **N/A para desktop** (el runner no compila; el CI no corre tests).
- Build: `npm run check`, leído del log.
- Runtime, `ng serve -c web` contra el central local (perfil `dev`), con dos usuarios:
  1. Sin `VER_STOCK_COMPRAS` ni ADMIN: productos del proveedor con «Todos» → COMPRAS no está en
     el detalle y el total no la suma; añadir ítem con influencia COMPRAS → «—» en stock y
     sugerida, y el simplificado no la suma.
  2. Con el rol: todo como hoy.
  3. Transferencia desde el central con origen COMPRAS: buscador, lotes y aviso de negativo sin
     número, y el botón «Ver» no aparece; con el rol, con número.
  4. Transferencia desde una filial con **destino** COMPRAS: la columna de destino del buscador
     muestra «—».
  - La sesión de prueba actual es de un usuario con ADMIN. Para el caso 1 hace falta un usuario
    sin el rol: se pide al usuario, o se simula sacando el rol del `usuarioActual` en memoria
    (no toca la base).

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | La tabla de lugares está completa: ningún otro diálogo de compras muestra stock por sucursal; `StockDetalladoDialog` solo pinta lo que recibe | Confirma el alcance |
| A | **Ajustar stock** (`ajustar-stock-dialog.component.ts:91`) solo excluye SERVIDOR: con la sucursal habilitada se puede elegir COMPRAS y **ver y ajustar** su stock sin `VER_STOCK_COMPRAS` | Decisión del usuario (abajo) |
| A | **Transferencias** (`seleccionar-sucursal-dialog.component.ts:71-75`): conectado al central, COMPRAS es origen elegible y `edit-transferencia` muestra su stock | Decisión del usuario (abajo) |
| A | `tieneAlgunRol` suma el bypass por nickname ADMIN, que los dos gates viejos no tienen: es más permisivo, nunca más restrictivo | Se usa `tieneAlgunRol` (regla 10); diferencia anotada |
| A | Ya conviven dos formas de identificar COMPRAS: por nombre (stock) y `SUCURSAL_COMPRAS_ID = 999` (gastos, `sucursal-servidor.util.ts`) | Se sigue por nombre, como el precedente de stock |
| B | `DistribucionItem` no se guarda y ningún gate de guardado depende del stock ni de la sugerida; nada autocompleta `cantidadPedir` desde la sugerida | Confirma que no hay estado |
| B | Riesgo de «Calculando...» colgado si no se apagan los dos flags en los dos caminos | Detallado en Cambios |
| B | El tooltip simplificado mostraría un 0 falso para COMPRAS | Se filtra en Cambios |
| B | Filtrar COMPRAS en `loadStockForProductosProveedor` no toca `sucursalesInfluenciaFiltradas` ni la opción «Todos»; si la única influencia es COMPRAS, cae en el camino existente «sin sucursales» | Sin código extra |

Auditoría de la Fase 2: eje A confirmó que T1-T3 son todo el flujo (lista, hoja de ruta,
diálogos de ítem, impresión: ninguno muestra stock) y que solo `edit-transferencia` le pasa
`transferencia` al buscador, así que la rama queda aislada. Eje B marcó el botón «Ver», el
subtexto de unidades y el aviso duplicado: ya están en la tabla.

## Decisiones del usuario (2026-09-24)

1. **Ajustar stock: fix aparte.** No entra en este PR.
2. **Transferencias: ocultar solo el stock.** COMPRAS sigue siendo origen o destino elegible;
   lo que no se muestra es su stock. Va como Fase 2.

## Fase 2 — Transferencias

COMPRAS puede ser **origen** solo conectado al central (`sucursalActual.id == 0`), y **destino
desde cualquier filial** (`seleccionar-sucursal-dialog.component.ts:73,98`: el destino solo
excluye al origen). Su stock aparece en tres lugares:

| # | Lugar | Qué muestra | Cambio |
|---|---|---|---|
| T1 | `PdvSearchProductoDialog` abierto desde la transferencia (`mostrarStock: true`), rama `isTransferencia` de `mostrarStock()` | stock de origen y de destino por producto | si origen o destino es COMPRAS sin el rol, no se pide ese stock y la celda muestra «—». El `*ngIf` del botón «Ver» (html:143-152) también depende del flag de ese lado: si no, un clic lo vuelve a pedir y lo muestra. Flag por lado calculado al abrir; nada de funciones en el HTML |
| T2 | `SeleccionarLotesDialog` (origen) | columna «Disponible», subtexto de equivalencia en unidades (`disponibleUnidadesLabel`, `armarDetalleUnidades`) y el aviso «El lote X solo tiene N disponible» (ts:478) | con origen COMPRAS sin el rol: «—» en la columna, subtexto vacío y el aviso sin el número. `fila.disponible` y el `[attr.max]` se mantienen, así que la validación no cambia (el número queda en el DOM: residuo aceptado, es UX) |
| T3 | `edit-transferencia.onEjecutarGuardadoItem` | aviso «stock negativo (N)», **dos veces** (rama normal ~1827 y rama de error de config ~1837) | con origen COMPRAS sin el rol, los dos avisos sin el número. El fetch y la comparación `stock < 0` / `permitirStockNegativo` no cambian |

`PdvSearchProductoDialog` se usa en muchas pantallas: el cambio queda **solo** en la rama de
transferencia, las demás no se tocan.

Helper compartido nuevo: `esSucursalCompras(sucursal)` en `empresarial/sucursal/`, por nombre
exacto (`=== 'COMPRAS'`, el criterio de stock de la lista de productos y del stock por lote), con
un comentario que dice por qué no se usa el id. Los lugares viejos no se tocan en este PR: ni esos
dos gates de stock ni los `includes("COMPRAS")` / `includes("COMPRA")` de `edit-transferencia`
(1622, 1692). Esos dos deciden el flujo de carga de precio al cargar un ítem, no el stock:
cambiarlos arriesga ese flujo. Quedan anotadas **cuatro** formas de decir «es COMPRAS» (nombre
exacto, dos `includes` distintos, id 999 en gastos) para unificar aparte.

## Qué queda sin verificar

- El total de `compras-search-producto-dialog` (fuera de alcance, ver arriba).
- El backend sigue entregando el dato a quien lo pida.

## Despliegue

`develop` → alpha → `release/beta`. Solo desktop, sin migración ni schema.
