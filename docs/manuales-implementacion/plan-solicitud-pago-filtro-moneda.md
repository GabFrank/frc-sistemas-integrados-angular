# Plan — filtro por moneda en la lista de solicitudes de pago

Pedido (Franco, 13/11/2026): en la lista de solicitudes de pago, un filtro por moneda con selección
múltiple en el header; achicar el select de estado (y un poco el número) para que entre.

Ramas: `feature/solicitud-pago-filtro-moneda` en central y desktop, desde `develop`.

## Por qué toca el central

La lista pagina en el servidor (`solicitudesPagoPaginated`). Filtrar en el cliente solo filtraría la
página visible y el total del paginador mentiría. El filtro va como argumento de la query.

## Fase 1 — central

- `solicitud-pago.graphqls`: `solicitudesPagoPaginated(..., monedaIds: [ID])`, opcional.
- `SolicitudPagoGraphQL.solicitudesPagoPaginated`: parámetro `List<Long> monedaIds`; si no es nulo
  ni vacío, `root.get("moneda").get("id").in(monedaIds)`. Lista vacía o nula = todas (como hoy).
- Sin migración, sin entidad nueva, sin tabla replicada (la solicitud de pago es del central).
- Tests: el resolver no tiene tests propios hoy; se verifica por API (GraphiQL/curl) con 0, 1 y 2
  monedas contra la base local y comparando con `SELECT count(*) … WHERE moneda_id IN (…)`.

## Fase 2 — desktop

- `graphql-query.ts` (`solicitudesPagoPaginatedQuery`): variable `$monedaIds: [ID]`.
- `getSolicitudesPagoPaginated.ts`: `monedaIds?: number[]` en las variables.
- `SolicitudPagoService.onGetSolicitudesPagoPaginated`: parámetro opcional al final `monedaIds?`.
  El otro llamador (`solicitud-pago-dashboard`) no lo pasa y sigue igual.
- `list-solicitud-pago`:
  - `monedaControl = new FormControl<number[]>([])`, `monedaList` cargada con
    `MonedaService.onGetAll()` en `ngOnInit` (mismo patrón que `add-cuenta-bancaria-dialog`).
  - `mat-select multiple` «Moneda»; vacío = todas. Se manda `undefined` si no hay selección.
  - `onResetFiltro` limpia la selección.
  - Anchos: número 15→10, proveedor 25 (igual), estado 25→15, moneda 15 nuevo, fecha 25 (igual).
- Tests: no hay spec del componente; verificación por pantalla.

## Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| arg `monedaIds` | `ListSolicitudPagoComponent.loadPage` → `SolicitudPagoService` | `SolicitudPagoGraphQL.solicitudesPagoPaginated` |

## Compatibilidad y orden

- Desktop viejo, mobile (`frc-mobile`) y PWA contra central nuevo: sin cambio (argumento opcional,
  no lo mandan). El filial no usa la query; la solicitud de pago no replica.
- Desktop nuevo contra central viejo: la query declara `monedaIds` y el central la rechaza en la
  validación **aunque la variable vaya vacía**. Caen **la lista y el dashboard de solicitudes**
  (`solicitud-pago-dashboard.component.ts:75` usa el mismo documento). Hoy ese error de validación
  llega como `null` al `next` y la lista se ve vacía («no hay solicitudes») en vez de avisar.
- Mitigaciones:
  - En `onGetSolicitudesPagoPaginated`, `graphError: { propagate: true }` además del error de red,
    para que el rechazo caiga en el `error:` de `loadPage` y se vea el aviso (dashboard: revisar que
    su `error:` también avise).
  - Orden por canal: el central llega a cada canal (develop/alpha, `release/beta`, `master`) y se
    **deploya** antes de promover el desktop a ese canal. `Deploy Auto` no corre solo: verificar en
    GraphiQL de cada instancia (mauro alpha, bodega, farmacia) que el argumento existe.
  - Rollback solo del central con el desktop ya nuevo = mismo síntoma: revertir los dos juntos.
- La carga de monedas va aparte de `loadPage`; si falla, `monedaList` queda vacía y la lista
  funciona igual sin el filtro.
- Índice: `solicitud_pago.moneda_id` no tiene índice; no se agrega (pocas monedas, baja
  selectividad, el rango de fecha indexado corta antes).

## Auditoría del plan (paso 5)

- Eje A: el dashboard comparte el documento (arriba). `[ID]` → `List<Long>` ya se usa así
  (`MaletinTesoreriaGraphQL.java:46`).
- Eje B: lista vacía sin aviso con central viejo; orden por canal y deploy manual (arriba).

## Pruebas por pantalla

Central local 8081 + desktop `ng serve -c web`: abrir Lista de solicitudes de pago, filtrar por
1 moneda, por 2, limpiar; combinar con estado y proveedor; paginar con filtro; resetear filtro.
Ver que el header entra en una línea al ancho habitual. Abrir también el dashboard de solicitudes.
Con el central de `develop` sin el cambio (8084), ver que la lista avisa en vez de quedar vacía.

## Sin verificar

- Cómo se ve el header en pantallas angostas (el `row wrap` ya hace bajar campos).
