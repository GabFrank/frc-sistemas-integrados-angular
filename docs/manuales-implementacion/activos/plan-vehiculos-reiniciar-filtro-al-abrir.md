# Plan: la lista de vehículos arranca sin filtro al reabrirla (#589)

## Problema

`VehiculoService` es `providedIn: 'root'` y guarda el texto de búsqueda (`_searchText$`), el tipo
(`_tipoFilter$`) y la página (`_paginationState$`). Al cerrar la pestaña de **Lista de vehículos**
y abrirla de nuevo, el componente nace con `filtroControl` y `tipoControl` vacíos, pero
`ngOnInit` llama a `refrescar()`, que busca con el texto viejo; el tipo viejo sigue filtrando en
`filteredVehiculos$` y el paginador muestra la página donde había quedado.

## Arreglo

Una sola fase, solo desktop.

- `vehiculo.service.ts`: método `reiniciarFiltros()` que deja texto `''`, tipo `null` y página 0,
  conservando el tamaño de página que eligió el usuario, y vacía la lista cargada (sin eso se ve
  un instante la lista vieja filtrada con los campos vacíos). Mueve los `BehaviorSubject`
  directo, sin `setSearchText` ni `updateTipoFilter`, para no disparar un segundo `refrescar`.
- `list-vehiculos.component.ts`: `ngOnInit` llama a `reiniciarFiltros()` **antes** de
  `refrescar()` (al revés, `refrescar()` lee el texto viejo).

No se mueve el estado al componente: el servicio lo usan también `VehiculoDialogService`
(`refrescar()` después de guardar) y el alta/eliminación, y esos refrescos tienen que respetar el
filtro que está a la vista.

## Quién escribe / quién lee

Sin datos nuevos (ni campos, ni columnas, ni claves). Solo se reinicia estado en memoria.

## Tests

`N/A para desktop porque su CI no corre tests y no hay batería confiable` (ciclo §1 paso 7 y 9).
Gate: `npm run check`. Prueba por pantalla con `ng serve -c web`:

1. Abrir Lista de vehículos, filtrar por texto y por tipo, ir a la página 2 con tamaño 25.
2. Cerrar la pestaña y reabrirla: campos vacíos, lista completa, página 1, tamaño 25.
3. Sin cerrar: filtrar, guardar un vehículo editado → el refresco respeta el filtro visible.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Solo `list-vehiculos` lee el estado de filtro; los demás solo llaman `refrescar()`. Dos pestañas de la lista no conviven (`tab.service.ts` deduplica por título) | Nada que cambiar |
| A | El orden reiniciar → `refrescar()` es obligatorio | Fijado arriba |
| A | `resetFiltro()` repite parte de la lógica | No se toca: anda, y vaciar la lista ahí sumaría un parpadeo |
| B | La lista vieja filtrada se ve hasta que llega la respuesta | `reiniciarFiltros()` vacía la lista |
| B | `refrescar()` no cancela una respuesta en vuelo: una vieja puede pisar a la nueva | Ya existía; hace falta cerrar y reabrir antes de que vuelva la consulta. Fuera de alcance |

## Sin verificar

- Las otras listas de activos (equipos, muebles, inmuebles, GPS, bienes por sucursal) usan el
  mismo patrón de servicio singleton; no están en el alcance de #589.
