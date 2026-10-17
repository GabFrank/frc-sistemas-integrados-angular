# Plan — Lista de productos: filtro de stock POSITIVO/NEGATIVO sin sucursal

Rama: `fix/productos-stock-por-signo-sin-sucursal` (desde `develop`). Pieza: **desktop**. Un PR.

## Problema

En `list-producto`, con «Stock: POSITIVO» (o NEGATIVO) y «Todas las sucursales», la búsqueda trae
bien los productos (el central filtra por la suma de todas las sucursales,
`ProductoRepository.searchWithFilters`, `HAVING SUM(ms.cantidad) > 0` / `< 0`). Pero al desplegar
una fila, la tabla «Stock por Sucursal» muestra **todas** las sucursales, también las de signo
contrario y las en cero. Con sucursal elegida ya se muestra solo esa.

## Cambio

`list-producto.component.ts`, `cargarStockDeLaFila`: cuando la respuesta llega bien, el filtro
de stock es `positivo`/`negativo` y no hay sucursal elegida, la fila queda solo con las sucursales
de existencia `> 0` / `< 0` (mismo criterio que el central: el cero no entra en ninguno).

- El signo y la sucursal se toman **de la búsqueda que armó la lista**, no del select en vivo:
  se guardan al llegar la respuesta de `onSearchWithFilters`. Si el usuario cambia el select sin
  volver a buscar, la fila desplegada sigue siendo coherente con la lista a la vista.
- El filtro va **solo en `next`**, después de poner las existencias, reasignando el arreglo en un
  paso y **solo si la lectura sigue siendo la última** (`lectura === this.lecturaStock`). Una
  respuesta tardía de un despliegue anterior no toca la fila nueva.
- Con error de lectura no se filtra: la fila sigue completa con «—» y «Reintentar» (#390).
- Con «TODOS» o con sucursal elegida: sin cambios.
- Si no queda ninguna (p. ej. el único positivo es COMPRAS y el usuario no la ve), la tabla
  muestra el aviso de lista vacía que ya existe.

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Leer el select en vivo filtra con otro signo si se cambió sin buscar | A y B | Aplicado: se usa el filtro de la búsqueda |
| Respuesta tardía de la misma fila pisa el arreglo nuevo | B | Aplicado: guard `lecturaStock` antes de reasignar |
| Filtrar antes de saber si la lectura fue buena rompe el reintento | B | Aplicado: solo en `next` |
| COMPRAS oculto deja la tabla en blanco sin aviso (html:400) | A | **Descartado**: `cargarSucursales` (ts:570) ya saca COMPRAS de `this.sucursales` sin el permiso, así que no llega al arreglo y el aviso de vacío sí sale |
| «No hay sucursales disponibles» es impreciso con el arreglo filtrado a cero | A | Se deja: solo pasa en el caso COMPRAS de arriba |

## Auditoría del diff (paso 8)

Fijo 2 (esquema, migración y espejo): `N/A para desktop porque el diff no trae migración, .graphqls
ni modelo GraphQL [ev: git diff --name-only → list-producto.component.ts/.html]`.

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Sin fuga nueva de COMPRAS/SERVIDOR: el filtro por signo solo achica `this.sucursales`, ya filtrada en `cargarSucursales` | Fijo 1 | Nada que cambiar |
| Previo, fuera de alcance: `puedeVerStockCompras` se calcula una vez en `ngOnInit`; el gate de COMPRAS es solo de UI | Fijo 1 | Se deja anotado |
| «Ajustar stock» seguía leyendo el select en vivo: la fila podía decir una sucursal y el diálogo ajustar otra | Fijo 3 | Aplicado: `onAjustarStock` y `getSucursalPreseleccionada` usan `filtroDeLaLista` |
| Si el stock cambia entre la búsqueda y el despliegue, la fila puede quedar vacía | Fijo 3 | Se deja: sale el aviso de lista vacía |
| El PDF sigue usando el select en vivo | — | A propósito: el central rearma la búsqueda con esos filtros y el reporte los imprime |

## Fuera de alcance

- El PDF (`exportarReporteConFiltros`) imprime un total por producto, no por sucursal: no tiene
  este problema.
- La semántica de la búsqueda (suma de todas las sucursales) no cambia: un producto con +10 en una
  sucursal y −20 en otra no aparece en POSITIVO. Si se quiere «al menos una sucursal positiva»,
  es un cambio del central aparte.

## Datos nuevos

Ninguno (sin columnas, campos ni claves).

## Fases

1. Fix en `list-producto.component.ts` + este plan. Build: `npm run check`.

## Tests

`N/A para desktop porque su CI no corre tests y no hay batería confiable` (§1 paso 7). Prueba por
pantalla, desktop web contra el central local:

1. POSITIVO + todas → desplegar un producto con sucursales en +, 0 y −: solo las +.
2. NEGATIVO + todas → solo las −.
3. TODOS → todas. POSITIVO + una sucursal → solo esa.
4. Error de lectura (central cortado al desplegar) → «—» y «Reintentar»; al reintentar con el
   central arriba, queda filtrada.
5. Buscar con POSITIVO, pasar el select a NEGATIVO sin buscar y desplegar → sigue mostrando las +.
6. Desplegar, cerrar y volver a desplegar rápido la misma fila (red lenta con throttling de
   Chrome) → queda filtrada y sin spinner colgado.

## Sin verificar

- Electron empaquetado (el cambio no toca IPC ni impresión).
