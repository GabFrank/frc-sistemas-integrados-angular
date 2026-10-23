# Plan — Clientes: aviso en vez de lista vacía sin filtro (#587)

## Problema

`personas/clientes/list-clientes` consulta al abrir con `texto: null, tipo: null`. El central
(`ClienteGraphQL.onSearchWithFilters`) devuelve `null` en ese caso **a propósito** (no listar los
~6000 clientes de bodega; confirmado por Franco el 2026-10-23). La tabla queda vacía («0 of 0»)
sin ningún aviso, y Buscar sin texto ni tipo hace lo mismo.

## Decisión

- El central **no cambia**. Solo el desktop usa `onSearchWithFilters` (grep en desktop, mobile,
  mobile-pwa y filial).
- El desktop no consulta sin texto ni tipo y muestra «Escribí un nombre, código o documento, o
  elegí un tipo».

## Fase única — `list-clientes.component.{ts,html}`

- `buscar()` (punto único: apertura, Buscar, Enter, paginador, refresco tras cobrar) cancela la
  consulta anterior. Si el texto no tiene ningún carácter distinto de espacio, `%` o `_` y no hay
  tipo → vacía la tabla, `selectedPageInfo = null`, limpia la selección, `sinFiltro = true` y no
  consulta. Si hay filtro → `sinFiltro = false` y sigue como hoy. Espacios, `%` y `_` cuentan como
  vacío porque `ClienteService.findByAll2` cambia espacios por `%` y el `like` los toma como
  comodines: listarían todos.
- Borrar el texto llama a `onFiltrar()` (antes solo vaciaba la tabla): sin tipo muestra el aviso,
  con tipo lista por tipo.
- Cambiar el tipo recarga la tabla (`valueChanges` del tipo → `onFiltrar()`), sin apretar Buscar.
  «Todas» sin texto muestra el aviso. Pedido por Franco el 2026-10-23.
- `resetFiltro()` limpia el tipo sin evento y después el texto: la limpieza del texto dispara una
  sola `onFiltrar()`, ya sin filtro.
- `onNewCliente()` limpia la selección (antes «Cobrar todo» quedaba activo sobre clientes que ya
  no se veían) y pone `sinFiltro = false`.
- HTML: texto centrado bajo la tabla con `*ngIf="sinFiltro"` (bandera, no función).
- Sin datos nuevos: `sinFiltro` lo escribe y lo lee el mismo componente.

## Tests

- N/A batería para desktop porque el CI no corre Karma y no se ejecuta en esta máquina (memoria
  `karma-desktop-inejecutable`). Gate: `npm run check`.
- Runtime (`ng serve -c web` contra el central local 8081, usuario `MR`):
  1. abrir Clientes → aviso, sin request `onSearchWithFilters` en la red;
  2. Buscar vacío y con solo espacios → aviso, sin request;
  3. texto «MARIA» → lista, sin aviso; paginar → sigue;
  4. solo tipo → lista;
  5. borrar el texto sin tipo → aviso; Limpiar Filtro → aviso;
  6. texto inexistente → «Cliente no encontrado», sin aviso;
  7. buscar, tildar un cliente, borrar el texto → aviso y «Cobrar todo» deshabilitado;
  8. tipo elegido, escribir y borrar el texto → sigue listando por tipo;
  9. texto `%` o `_` → aviso, sin request;
  10. borrar el texto con la consulta en vuelo (red lenta) → no aparecen filas;
  11. + Adicionar un cliente → se ve el cliente, sin aviso.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Contrato: sin riesgo. Solo el desktop usa `onSearchWithFilters`; siempre va al central; nadie abre Clientes esperando datos | — |
| A, B | `onNewCliente` mostraría el aviso junto al cliente creado | `sinFiltro = false` ahí |
| A, B | Borrar el texto con tipo elegido deja la tabla vacía sin aviso | borrar el texto pasa por `onFiltrar()` |
| B | Borrar el texto deja la selección viva: «Cobrar todo» activo sobre clientes ocultos | el camino sin filtro limpia la selección |
| B | Una respuesta tardía pisa el aviso | `buscar()` cancela la suscripción anterior |
| B | `%` o `_` solos listan todo | cuentan como texto vacío |

## Prueba de runtime (2026-10-23)

`ng serve -c web` + central local 8081 (perfil `dev`, base `bodega`), usuario `MR`. Requests
contadas interceptando `fetch`/`XHR` del navegador.

- 1–11: pasan. Abrir y Buscar vacío / espacios / `%_ ` → 0 requests y aviso. «MARIA» → 119,
  paginar → 26–50. Solo FUNCIONARIO → 149. Borrar el texto con tipo → vuelve a 149. Tildar y
  borrar → selección 0 y botones deshabilitados. Consulta en vuelo + borrar → 0 filas. Texto
  inexistente → «Cliente no encontrado». + Adicionar → fila del cliente nuevo, sin aviso
  (cliente 6385 y persona 6696 borrados al terminar; la base volvió a 5934 clientes).
- Ajustes (segunda vuelta): elegir FUNCIONARIO lista 149 sin Buscar; «Todas» → aviso, 0
  requests. Limpiar filtro con texto «MARIA» + tipo ASOCIADO → 0 requests y aviso. + Adicionar
  con un cliente tildado → selección 0 y botones deshabilitados (cliente 6386 borrado).
- Imprimir recibo de FREDDY RODOLFO VERA (cliente 433): abre Reportes con la venta 1269, 60.000.
- Refresco tras cobrar: `buscar(true)` con filtro y un cliente tildado → 1 request, la selección
  se conserva. No se cobró de verdad: cerraría ventas a crédito de la base.

## Sin verificar

- Cobrar todo de punta a punta: el permiso de la sesión bloqueó el clic por ser una transacción.
  Lo prueba Franco con el cliente 433 (venta 1269/24, ABIERTO); restaurar con
  `update financiero.venta_credito set estado='ABIERTO', fecha_cobro=null where id=1269 and sucursal_id=24`.
- Electron: el cambio no toca IPC ni el main process.
