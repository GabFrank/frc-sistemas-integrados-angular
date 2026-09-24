# Plan — stock por sucursal en cero (id de sucursal string vs number)

Rama: `fix/stock-por-sucursal-id-string` (desde `origin/develop` `ee3f1fea`). Pieza: **desktop** únicamente.

## Síntoma

En beta (`v4.2.0-beta.3`), Productos → lista → expandir un producto: la tabla de existencias por
sucursal muestra **0 en todas las sucursales**. Stable (`master`) no tiene el problema.

## Causa

`8ea7cf7d fix(stock): pedir el stock de todas las sucursales en un request` reemplazó 31 consultas
por una (`stockPorSucursales(proId)`) y devuelve un `Map<number, number>`:
`ProductoService.onGetStockPorSucursales` convierte la **clave** con `Number(fila.sucursalId)`.

Los consumidores buscan con `sucursal.id` tal como vino de GraphQL. El modelo `Sucursal` declara
`id: number`, pero es `ID` en el schema y Apollo lo entrega como **string** (`"1"`). `Map.get("1")`
no encuentra la clave `1`, y el `?? 0` lo tapa como cero. Antes el id viajaba como variable de la
query y el tipo daba igual.

`8ceef155 fix(compras): pedir la cantidad sugerida en un request` copió el mismo contrato en
`MovimientoStockService.onGetCantidadSugeridaPorSucursales`.

Ninguno de los dos commits está en `master`; los dos están en `release/beta` y `develop`.

## Alcance: los 4 lugares con el mismo defecto

| # | Archivo | Qué se ve mal |
|---|---|---|
| 1 | `productos/producto/list-producto/list-producto.component.ts` (`onRowClick`) | existencias por sucursal en 0 — **el reportado** |
| 2 | `operaciones/compra/gestion-compras/gestion-compras.component.ts` (`loadStockPorSucursalesDeProducto`) | stock por sucursal y total de los productos del proveedor en 0 |
| 3 | `operaciones/compra/gestion-compras/dialogs/add-edit-item-dialog/add-edit-item-dialog.component.ts` (stock actual de distribuciones) | `stockActual` en 0 → sugerida inflada |
| 4 | mismo diálogo, cantidad sugerida (`onGetCantidadSugeridaPorSucursales`) | historial vacío → sugerida sin ventas/compras del año pasado |

Los #3 y #4 afectan la cantidad sugerida de compra: el daño no es solo visual.

## Solución

Arreglar el **contrato**, no los 4 `get`: un tipo que normaliza el id en las dos puntas, para que
un consumidor futuro no pueda repetir el error.

- Nuevo `src/app/commons/core/utils/por-sucursal.ts`: clase `PorSucursal<T>` con
  `set(sucursalId: number | string, valor)` y `get(sucursalId: number | string): T | undefined`.
  Las dos pasan por una misma normalización: `null`, `undefined`, `""` o algo que no sea un entero
  → sin clave (`set` lo ignora, `get` da `undefined`); si no, `Number(id)`. Sin eso,
  `Number("")` da `0` y `Number("abc")` da `NaN`, y `Map` trata a todos los `NaN` como la misma
  clave: dos ids basura se encontrarían entre sí (auditoría eje B, hallazgos 1 y 2).
- `onGetStockPorSucursales` devuelve `Observable<PorSucursal<number>>`;
  `onGetCantidadSugeridaPorSucursales` devuelve `Observable<PorSucursal<CantidadSugeridaPorSucursal>>`.
- En los 4 consumidores solo cambia la anotación de tipo del `next` (`Map<…>` → `PorSucursal<…>`);
  las llamadas `.get(x.id)` quedan igual. Se verificó que ningún consumidor usa otro método del
  `Map` (`size`, `has`, `forEach`, iteración).
- Se corrigen los javadocs de los dos services, que hoy dicen que Sucursal trae un `id` numérico.

Descartado: `Number(...)` en cada uno de los 4 `get` — arregla hoy y deja la trampa armada.
Descartado: cambiar `Sucursal.id` a `string` — toca toda la app.

## Tabla de datos nuevos

N/A: no nace ningún campo, columna ni clave. Cambia solo el tipo del valor de retorno de dos
métodos del desktop. Escritor: los dos services; lectores: los 4 consumidores de arriba.

## Fases

**Fase 1 (única)** — `fix(stock): buscar el stock por sucursal aunque el id llegue como string`.
Util + dos services + 4 anotaciones + javadocs. Un commit, un push.

## Tests y verificación

- Batería: **N/A para desktop** — el CI no corre tests y el runner de unit tests no compila
  (desajuste devkit v16 / Angular 15, anotado en `8ea7cf7d`). No se agrega un `.spec` que nadie
  puede correr.
- **Prueba de la util con `ts-node`** (ya es devDependency), en un script fuera del árbol de specs
  y sin commitear: `get("1")` y `get(1)` encuentran la clave `1`; `null`, `""` y `"abc"` dan
  `undefined`, y `set("abc")` no deja nada que `get("xyz")` pueda encontrar. **Revertido el fix**
  (el `Map` actual con `get("1")`), el primer caso tiene que fallar.
- Build: `npm run check` (AOT producción), leído del log entero.
- Runtime (paso 9): `ng serve -c web` contra un central local en 8081 con perfil `dev`:
  1. Productos → expandir un producto con stock conocido → existencias ≠ 0 y coinciden con SQL
     sobre `bodega@5551`.
  2. Gestión de compras → proveedor → productos del proveedor → stock por sucursal ≠ 0.
  3. Gestión de compras → agregar/editar ítem con distribuciones → stock actual y cantidad
     sugerida ≠ 0 en una sucursal con historial.
- Backend: sin cambios. Central y filial N/A.

## Qué queda sin verificar

- Electron empaquetado (la prueba es web pura). El cambio no toca IPC ni main process.
- Beta real: se verifica cuando el fix llegue a alpha/beta por el canal normal.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Los 4 consumidores son todos: no hay un quinto y ninguno usa otro método del `Map`. En los 4, el id llega como string (resultado crudo de Apollo) | Confirma el alcance |
| A | PWA y mobile no se enteran: la PWA tiene su propia implementación (`String()` en las dos puntas) y mobile no usa estas queries | Sin acción |
| A | `gestion-compras.component.ts:4272` compara `s.id === -1`: el `-1` es un centinela local de «Todos», así que funciona | Fuera de alcance, preexistente |
| B | `Number("")` → `0` | Guarda en la normalización |
| B | `Number("abc")` → `NaN`, y todos los `NaN` son la misma clave del `Map` | Guarda en la normalización |
| B | La batería de desktop no corre, pero la util es una función pura que se puede probar con `ts-node` | Se agregó la prueba, con el caso que tiene que fallar sin el fix |
| B | La cantidad sugerida no se guarda: solo se muestra (`cantidadPedir` lo escribe el usuario). Con el stock real va a bajar, que es lo correcto | Sin acción: no hay estado que revertir |
| B | Un desktop que no se actualiza sigue mostrando los ceros de hoy: nada nuevo se rompe | Sin acción |

## Despliegue

`develop` → alpha; después a `release/beta`. El usuario ve *Cerrar y actualizar* en ≤5 min.
Sin migración, sin cambio de schema, sin orden multi-repo.
