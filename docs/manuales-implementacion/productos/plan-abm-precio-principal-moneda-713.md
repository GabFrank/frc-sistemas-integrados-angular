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

## Resultado de la prueba por pantalla (12/11/2026)

Central local de `develop` (58ebaaa9, perfil dev, Flyway apagado) y desktop web en `127.0.0.1:4200`, usuario MR.
Producto 8538 NIKO PIÑA 3 L; precio 12865 (presentación principal 11137) pasado a 5,85 USD por SQL.

- Resumen «Precio venta: US$ 5,85»; tabla 11137 «US$ 5,85», 11138 «32.000» (Gs, sin símbolo).
- Desde la grilla, 12866 (CAJA X 4) a 22,40 USD: la fila pasa a «US$ 22,40» sin recargar; el resumen sigue en la principal.
  Para guardar en USD el central exige `cliente.desktop.version_minima`: se puso `0.0.1` y se volvió a vaciar.
- Desde la grilla, 12865 a 8.000 Gs: resumen y tabla pasan juntos a «8.000».
- `marcarPresentacionesSinCargar`: la tabla se vacía y el resumen cae al número de `selectedProducto` («5,85», el
  del momento en que se abrió la pestaña, sin moneda), como antes del fix. «Reintentar» lo recupera («8.000»).
- **El hallazgo A1 no se confirmó**: `precioPrincipal.id` llegó con el id del precio (12865/12866), no el de la
  presentación. Igual se usa `precios`, que no depende de cómo resuelva Hibernate el `select *`. No hace falta issue.
- Base restaurada: 12865 = 8000 y 12866 = 32000, sin moneda; versión mínima vacía.

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

## Auditoría del diff (paso 8)

Fijo 1 y Fijo 2: N/A para desktop porque el diff no toca resolvers, esquema ni migraciones. Condicionales: N/A
(no toca release ni replicación). Fijo 3 sin bloqueantes. Hallazgos menores:

| Hallazgo | Qué se hizo |
|---|---|
| Con dos presentaciones principales el resumen tomaba la última | Toma la primera, como `monedaDelPrecioPrincipalDe` |
| Sin presentación principal el resumen cae a «No posee» | Se deja: el central también da `precioPrincipal` nulo |
| Precio 0 mostraría «0» en vez de «No posee» | Falso: antes `0 \| number` ya daba «0» (texto, truthy) |
| La tabla pasa de `1.0-0` a `1.0-2` en Gs | Se acepta: los precios en Gs son enteros; es el formato del resumen |

## Sin verificar / fuera de alcance

- La grilla de precios muestra el número crudo («US$ 5.85», con punto): el issue la da por buena; no se toca.
- El `select *` de `findPrincipalByPresentacionId` en el central: en la prueba devolvió el id correcto; no se abre issue.
- Con las presentaciones sin cargar, el resumen muestra el número de la carga del producto, sin moneda (como antes).
- El mapa de monedas es una caché de sesión (`PrecioMonedaService`): un precio pasado a otra moneda desde otro lado
  (otra PC, SQL) se ve sin símbolo hasta volver a entrar o guardar un precio. Ya era así en la grilla y el listado.
- No se limpia la moneda al *empezar* una recarga (es el mismo producto: evita el parpadeo); sí al fallar.
- Otras pantallas con «Precio venta» (transferencias, búsqueda de envase): fuera del #713.
