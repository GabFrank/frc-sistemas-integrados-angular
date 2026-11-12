# Plan — el ABM del producto muestra el precio principal con su moneda (desktop #713)

Rama: `fix/productos-abm-precio-moneda` desde `develop` (c8f4f3bd). Solo desktop.

## Qué pasa

Con el precio principal de la presentación en 5,85 USD, el ABM del producto (`edit-producto`) muestra:

- Tabla de presentaciones, columna «Precio principal»: **6** (`element?.precioPrincipal?.precio | number : "1.0-0"`,
  `producto.component.html:1250`): sin moneda y redondeado a 0 decimales.
- Resumen de la izquierda, «Precio venta»: **5,85** (`selectedProducto?.precioPrincipal | number : "1.0-2"`,
  `html:133`): sin moneda.

Runbook «Moneda por módulo», D4: tiene que decir «US$ 5,85», como el listado de productos.

## Análisis (paso 3)

- El componente ya lee el mapa de precios en otra moneda (`PrecioMonedaService.mapaCentral$`, precioId → moneda,
  solo precios que no están en la moneda de la empresa; trae `simbolo` y `decimales`) y arma `simbolosPrecio` para la
  grilla de precios (`producto.component.ts:1138`, `html:1539`).
- `producto.precioPrincipal` (central, `ProductoResolver.java:170`) = precio principal de la presentación con
  `principal = true`.
- **`presentacion.precioPrincipal.id` no es confiable** (hallazgo del eje A, verificado): el central lo resuelve con
  `findPrincipalByPresentacionId` (`PrecioPorSucursalRepository.java:19-22`), native query `select *` sobre
  `presentacion` join `precio_por_sucursal`. Las dos tablas tienen `id` y el driver toma la primera: el de la
  presentación. Por eso el id de precio sale de `precios { id precio principal activo }` de la misma fila, que la query de
  presentaciones ya trae.
- El listado formatea con `{{ simbolo }} {{ precio | number : '1.d-d' }}` (d = decimales de la moneda); con la moneda
  de la empresa, el número como siempre. `LOCALE_ID` es `es-PY` (`app.module.ts:44`): «5,85».

## Fase 1 — moneda en la tabla y en el resumen (un commit)

1. `precio-moneda.service.ts`: función pura `precioPrincipalDePresentacion(presentacion)` = el precio con
   `principal === true` y activo, si no el principal (criterio que ya usa `monedaDelPrecioPrincipalDe`, que pasa a
   usarla).
2. `producto.component.ts`: un solo método `calcularPreciosPrincipales()` que arma, desde `presentacionesList` y el
   mapa actual:
   - por presentación: `precioPrincipalFila[presentacionId] = { precio, simbolo, formato }`;
   - para el resumen: `precioPrincipalResumen` de la presentación con `principal === true` (número **y** moneda de la
     misma fila; así el resumen no queda desfasado cuando se cambia un precio en la grilla).
   Se llama desde la suscripción al mapa **y** al llegar las presentaciones (el mapa puede llegar antes o después).
   Se limpia al empezar la carga y en `marcarPresentacionesSinCargar`.
3. `producto.component.html`:
   - Columna «Precio principal»: con moneda → «US$ 5,85»; sin moneda, el número con `1.0-2` (hoy `1.0-0` redondeaba
     a 6 también cuando no hay mapa).
   - Resumen «Precio venta»: de `precioPrincipalResumen`; si las presentaciones no cargaron, el número de
     `selectedProducto.precioPrincipal` como hoy (sin moneda).
4. Sin funciones en el HTML: todo son campos calculados en el `.ts`.

**Tests:** `precio-moneda.util.spec.ts` o un spec nuevo para `precioPrincipalDePresentacion` (principal activo,
principal inactivo como respaldo, sin precios). Karma acotado al spec (el CI del desktop no lo corre).

## Datos nuevos

Ninguno: no hay columnas, campos ni claves nuevas. Se usan el mapa y la query que ya existen.

## Prueba por pantalla (paso 9)

Desktop web local contra central local (8081):
- Producto con el precio principal de la presentación principal en USD (5,85): tabla «US$ 5,85», resumen «US$ 5,85».
- Producto en Gs: tabla y resumen sin símbolo ni decimales sobrantes.
- Presentación no principal con precio en USD: su fila con «US$»; el resumen según la principal.
- Cambiar la moneda o el precio en la grilla y guardar: la tabla y el resumen se actualizan juntos.
- Comprobar en la respuesta de GraphQL si `precioPrincipal.id` es el de la presentación (confirma el hallazgo A1).
- Restaurar el precio de prueba en la base al final.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `precioPrincipal.id` puede ser el id de la presentación (`select *` con dos `id`) | Verificado en el repositorio; se usa `precios` de la fila. Bug del central anotado, fuera de este fix |
| A | Si el mapa no cargó (error, sondeo lento), el USD se ve sin símbolo | Ya pasa en la grilla y en el listado; se deja igual, pero sin el redondeo a 0 decimales |
| A | Solo `html:134` y `html:1250` muestran `precioPrincipal` en el componente | Confirma el alcance |
| B | El resumen tomaba el número de `selectedProducto` (no se refresca al recargar presentaciones) y la moneda de la fila: podían desfasarse | Número y moneda del resumen salen de la misma fila |
| B | Orden de llegada mapa / presentaciones: la suscripción se crea una sola vez | Un único método de recálculo llamado desde los dos lados |
| B | Moneda vieja al recargar o al fallar la carga | Se limpia al iniciar la carga y en `marcarPresentacionesSinCargar` |
| B | Reversibilidad | Cambio visual, sin datos: un revert alcanza |

## Sin verificar / fuera de alcance

- La grilla de precios muestra el número crudo («US$ 5.85», con punto): el issue la da por buena; no se toca.
- El `select *` de `findPrincipalByPresentacionId` en el central: issue aparte si se confirma en la prueba.
- Otras pantallas con «Precio venta» (transferencias, búsqueda de envase): fuera del #713.
