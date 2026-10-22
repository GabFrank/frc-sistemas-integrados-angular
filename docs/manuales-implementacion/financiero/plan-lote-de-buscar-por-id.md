# Plan — Lotes DE: buscar por ID (issue #577)

## Problema

En Financiero → Documento electrónico (`list-lote-de`), buscar un lote por ID no muestra nada:

1. El central declara `loteDe(id: ID!, sucursalId: ID!)` y el desktop manda solo `id`: el central
   rechaza la consulta.
2. `LoteDeService.onFindByLoteId` pasa `servidor` en la posición de `page` de `onGetById`.
3. El componente solo asigna la tabla si `res != null`: ni error ni «no existe» se ven, queda la
   tabla vieja.

La PK de `lote_de` es `(id, sucursal_id)` y el ID se repite: en la base local el lote 1 existe en
18 sucursales. El ID solo no identifica un lote.

## Decisión (Franco, 2026-10-22)

Selector «Sucursal» en los filtros, **obligatorio solo para buscar por ID**, y columna Sucursal en
la tabla. La lista paginada sigue mezclando sucursales (no se toca el central).

## Fase única — desktop (`fix/lote-de-buscar-por-id`)

- `graphql-query.ts`: `loteDeQuery` pasa a `($id: ID!, $sucId: ID!)` → `loteDe(id: $id, sucursalId: $sucId)`
  (`onGetById` manda la sucursal como `sucId`). `loteDeQuery` y `loteDesQuery` piden `sucursalId`.
- `lote-de.model.ts`: campo `sucursalId`.
- `lote-de.service.ts`: `onFindByLoteId(id, sucursalId, servidor)` →
  `onGetById(gql, id, null, null, servidor, sucursalId)`.
- `list-lote-de`:
  - carga sucursales del central con `SucursalService.onSearchSucursal(null)` (`sucursalesSearch`,
    tope 1000) y arma un mapa id → nombre. **No** `onGetAllSucursales`: su query `sucursales` no
    manda `size` y el central la corta en 10 (hay 29 sucursales, 18 con lotes). Si la carga falla,
    `terminarSiFalla`: la lista paginada sigue andando, el selector queda vacío;
  - `mat-select` «Sucursal» junto al ID (mismo estilo que Estado);
  - con ID y sin sucursal: aviso «Elegí la sucursal del lote» y no consulta;
  - modo ID: `selectedPageInfo` con total 1 (o 0) y `paginator.pageIndex = 0`, para que el
    paginador no siga mostrando el total de la lista;
  - sin resultado: aviso «No se encontró el lote N en esa sucursal» y tabla vacía;
  - error (GraphQL o red): el genérico ya avisó; `terminarSiFalla(() => vaciar)` deja la tabla vacía
    en vez de la vieja;
  - columna Sucursal: nombre precalculado por el mapa en el `.ts` (sin funciones en el HTML), o el
    id si el mapa no lo tiene;
  - «Limpiar filtro» también limpia la sucursal.

### Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `LoteDE.sucursalId` (ya existe en el esquema del central) | central (`LoteDEService`) | `list-lote-de`: columna Sucursal |
| filtro sucursal | `list-lote-de` (selector) | `LoteDeService.onFindByLoteId` → `loteDe(sucursalId)` |

### Tests

`N/A batería para desktop` (el CI no corre Karma). Gate: `npm run check`. Prueba por pantalla
contra el central local (8081) con `ng serve -c web`:

0. Con el código viejo (`develop`): ID 38371 → no muestra nada ni avisa (el bug se reproduce).
1. ID 38371 + sucursal 1 → aparece el lote (RECHAZADO), columna Sucursal con el nombre.
2. ID 38371 + otra sucursal → aviso «no se encontró», tabla vacía, paginador en 0.
3. ID sin sucursal → aviso, no hay consulta.
4. Un lote de una sucursal con id alto (ej. 24) → el selector la ofrece y la búsqueda la encuentra.
5. Limpiar filtro → vuelve la lista paginada, con la columna Sucursal llena y el total correcto.
6. Lista paginada sin ID → igual que antes (estado y fechas filtran).
7. Error: central apagado o caído a mitad → tabla vacía, aviso del genérico.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `onGetAllSucursales` trae solo 10 sucursales (`sucursales(page=0,size=10)`) | verificado; se usa `onSearchSucursal(null)` (tope 1000). El tope de 10 afecta a otros 66 llamadores: queda fuera de este fix |
| A | contrato `loteDe(id, sucursalId)` y `$sucId` vía `onGetById` | verificado, sin cambios |
| B | doble aviso con «Item no encontrado» del genérico | descartado: el genérico solo avisa si la respuesta trae `error: false`, y esta query no pide `error` |
| B | ante error la tabla queda vieja (`terminarSiFalla` → EMPTY) | se vacía en `alFallar` |
| B | paginador con el total de la lista en modo ID | `selectedPageInfo` y `pageIndex` en modo ID |
| B | falla la carga de sucursales | `terminarSiFalla`, la lista sigue andando |
| B | falta probar que el bug se ve con el código viejo | paso 0 de la prueba |

## Contrato y compatibilidad

Sin cambio de backend: `loteDe(id, sucursalId)` y `LoteDE.sucursalId` ya están en el central de
`develop`; verificar que estén también en `master` / `release/beta` para los canales donde llegue
este desktop.

Verificado 2026-10-22: `origin/master`, `origin/release/beta` y `origin/develop` del central
declaran `loteDe(id: ID!, sucursalId: ID!)` y `LoteDE.sucursalId: Int`.

## Queda sin verificar

- Nada del contrato. La prueba por pantalla es contra el central local, no contra cada canal.
