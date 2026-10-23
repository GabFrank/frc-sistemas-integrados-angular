# Plan #594 — «Últimas compras» sin paginador

## Problema

En **Gestión de compras → 2. Ítems del pedido**, el panel «Últimas compras» tiene un `mat-paginator`
(5/10/25/50/100) que nunca llega a página 2: el central devuelve como máximo 5 filas
(`ProductoResolver.productoUltimasCompras`, `PageRequest.of(0, 5)`), y el desktop pagina en el
cliente sobre esas 5.

## Decisión (Franco, 2026-10-23)

El panel muestra **solo las 5 últimas**. Se saca el paginador, que hacía pensar que había más. El
central no cambia: `productoUltimasCompras` es un campo de `Producto` que piden la lista de
productos, la impresión, el vendedor, mobile y PWA, así que subir el tope pesaría en todas.

## Fase 1 — desktop (única)

`src/app/modules/operaciones/compra/gestion-compras/gestion-compras.component.{ts,html}`:

- HTML: borrar el bloque `<div class="table-footer">` con el `mat-paginator` del panel (~859-871).
- TS: borrar `ultimasComprasPageSize`, `ultimasComprasPageIndex`, `ultimasComprasTotalElements`,
  `ultimasComprasAllData` (~448-451), `applyUltimasComprasPagination()` y
  `onUltimasComprasPageChange()` (~5145-5159). `loadUltimasCompras` asigna directo
  `ultimasComprasDataSource.data = compras` (~4902-4907, con sus comentarios). Los tres resets
  quedan solo con `dataSource.data = []`: cambio de proveedor (~684), guard sin producto (~4846) y
  desvincular (~5203).
- El tope de 5 lo garantiza el central (`PageRequest.of(0, 5)`), no el cliente: si alguien lo sube,
  el panel muestra todas sin paginar.
- `@ViewChild(MatPaginator)` (~278) apunta al primer paginador («Productos del proveedor»), que
  queda; `MatPaginatorModule` lo siguen usando otros cuatro paginadores.
- SCSS: sin cambios. El `.table-footer` de la línea ~1396 es compartido con el paginador de
  «Productos del proveedor», que sigue.

Tests: N/A para desktop porque su CI no corre tests y no hay batería confiable (ciclo §1 paso 7).
Gate: `npm run check`.

## Datos nuevos

Ninguno. No hay cambios de GraphQL, migraciones ni replicación.

## Prueba por pantalla

`ng serve -c web` contra el central local (8081). En Gestión de compras, con un proveedor y un
producto con más de 5 notas de recepción, «Últimas compras» muestra las 5 más recientes y no
muestra el paginador. Con un producto sin compras sale «No hay compras anteriores». Al cambiar de
producto, la tabla se refresca. Al cambiar de proveedor o desvincular el producto, la tabla se
vacía.

Datos: sembrar por SQL más de 5 notas de recepción de un producto si la base local no tiene uno, y
restaurar al final. Casos: producto A con compras → producto B sin compras (la tabla se vacía y sale
el mensaje).

## Auditoría del plan (paso 5)

- Eje A: sin dependencias fuera del componente; pidió listar los usos exactos (hecho arriba).
- Eje B: no agrega riesgo y es solo UI (se revierte con `git revert`). Marcó tres fallas que **ya
  existen** en `loadUltimasCompras` y que este cambio no toca: una respuesta vieja puede pisar a la
  nueva al cambiar rápido de producto; una respuesta tardía puede volver a llenar la tabla después
  de cambiar de proveedor o desvincular; y un error de red deja las filas del producto anterior.
  **Fuera de alcance** de la #594: se informan a Franco para issue aparte.

## Sin verificar

- Nada del central: no se toca.
