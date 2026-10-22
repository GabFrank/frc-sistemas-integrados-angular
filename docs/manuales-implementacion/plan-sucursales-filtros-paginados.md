# Plan: Sucursales filtra y pagina en el central (#593)

Rama `fix/sucursal-lista-filtros-paginados` en **central** y **desktop**. Dos PRs, central primero.

## Problema

`SucursalService.onSearchConFiltros` (desktop) usa la query `findByNombre(nombre, page, size)` pero le manda `texto`,
`deposito` y `activo`: `nombre` llega `null` y el central devuelve **todas** las sucursales paginadas. El desktop
filtra depósito y activo dentro de esa página y pisa el total con las filas que quedan. Resultado: el buscador no
filtra, «siguiente» nunca se habilita y con 25 por página se ven 18 activas de 22.

El central ya tiene la query que filtra los tres campos en la consulta, `findByNombreConFiltros`, pero devuelve
`[Sucursal]` (solo el contenido), sin total.

## Cambio

### Fase 1 — central

- `sucursal.graphqls`: `findByNombreConFiltros(...)` pasa de `[Sucursal]` a `SucursalPage`.
- `SucursalGraphQL.findByNombreConFiltros` y `SucursalService.findByNombreConFiltros` devuelven el `Page<Sucursal>` del
  repositorio (hoy hacen `.getContent()`). Repositorio y filtros no cambian: nombre por `LIKE` en mayúsculas con
  espacios como comodín, depósito y activo opcionales, orden por id.
- Test unitario `SucursalGraphQLTest` (Mockito, estilo `PrecioEspecialSucursalGraphQLTest`): devuelve la página del
  servicio con su total; sin `page`/`size` usa 0 y 1000 (los defaults de hoy).

Cambiar el tipo de retorno es seguro: **nadie llama a esa query**. En el desktop solo está declarada
(`sucursalesSearchConFiltros` en `graphql-query.ts`), sin llamador, en `develop`, `release/beta` y `master`; mobile
y mobile-pwa no la usan; el filial no la tiene.

### Fase 2 — desktop

- `graphql-query.ts`: `sucursalesSearchConFiltros` pide la página (`getTotalElements`, … `getContent { … }`) con los
  mismos campos que hoy trae `sucursalesByNombreQuery` (la tabla y el diálogo de edición usan `usuario.nickname`,
  `depositoPredeterminado`, `codigoEstablecimientoFactura`, que la versión actual no pide).
- `sucursal.service.ts` `onSearchConFiltros`: usa `this.sucursalesSearchConFiltros` y devuelve la página tal cual.
  Se borra el filtro en el cliente y la sobreescritura del total. `SucursalesByNombreGQL` sigue (lo usa el diálogo
  de búsqueda, L209).
- `list-sucursal` no cambia (ya pasa texto en mayúsculas, depósito, activo, página y tamaño).

Cambio de comportamiento visible: el buscador empieza a filtrar por **nombre** (el placeholder dice «nombre o
localización»; la localización son coordenadas y la query del central no la mira; no se agrega). La sucursal
«Servidor» (id 0) sigue apareciendo, como hoy.

## Tabla de datos nuevos / migraciones

Ningún dato nuevo. Sin migraciones. El filial no se toca.

## Orden de despliegue y de rollback

El desktop nuevo llama a `findByNombreConFiltros` esperando página: **el central tiene que estar desplegado en el
canal antes que el desktop**. Un desktop viejo con un central nuevo no se entera (no la llama). Si el desktop llegara
antes, la lista de Sucursales muestra «Ups! Algo salió mal» y queda vacía (`onCustomQuery` emite `null`); el resto de
la app sigue igual. Es una pantalla administrativa, sin escritura.

- Mergear el central a `develop` **no despliega**: antes de mergear el desktop (que publica alpha al mergear), correr
  `gh workflow run Deploy` del central para alpha y confirmar que la query devuelve `SucursalPage`.
- Beta y stable: no promover el desktop hasta confirmar la query en **las dos instancias** del central del canal
  (bodega y farmacia).
- Rollback: **primero el desktop, después el central; nunca el central solo** con el desktop nuevo publicado. Revertir
  solo el desktop es inocuo.

[auditoría eje A riesgo 1 y eje B hallazgo 1]

## Tests

- Central: `SucursalGraphQLTest` + `./mvnw clean verify -B -DskipFlyway=true` (corrido en una copia fuera de
  `dev-frc`, por jdtls).
- Desktop: N/A batería (su CI no corre tests). Gate `npm run check`.
- Por pantalla (central local 8081 con la rama + `ng serve` de la rama), 15 por página:
  - sin filtros: total real (incluye «Servidor») y «siguiente» habilitado; página 2 con las restantes;
  - texto (botón, Enter, debounce): filtra por nombre y vuelve a la página 1;
  - depósito Sí/No/Todos y Activos/Inactivos: totales correctos contra SQL en Postgres real; incluye depósito
    `null` con activo `false` (la JPQL con booleanos nulos nunca corrió en producción) [eje A riesgo 2, eje B hallazgo 2];
  - texto sin coincidencias: «0 of 0», paginador deshabilitado, sin error;
  - Limpiar: una consulta con los valores por defecto;
  - editar desde la página 2: conserva la página;
  - el diálogo de búsqueda de sucursales (usa `findByNombre`) sigue andando.
- Contraste: el central de develop con el desktop nuevo da error en la lista (confirma el orden de despliegue).
- Compatibilidad: el desktop de develop (viejo) contra el central nuevo: la lista y el diálogo de búsqueda se ven igual
  que hoy [eje B].

## Auditoría del plan (paso 5)

- Eje A: premisa verificada (nadie llama a la query en ningún canal, cliente ni test; los tests de schema del central
  no se rompen; `SucursalPage` ya la usa `sucursalesSearch`). Riesgos: orden de despliegue incompleto → agregado;
  JPQL nunca ejecutada → prueba contra SQL; el buscador no busca por id ni excluye «Servidor» → aceptado (hoy tampoco).
- Eje B: sin estado persistente ni caché (`no-cache`, sin `typePolicies`). Riesgos: rollback del central solo →
  agregado el orden; faltaban la prueba del desktop viejo y la de lista vacía → agregadas; size 1000 → sin riesgo.

## Qué queda sin verificar

- Los canales beta/stable: se confirmó por código que ningún desktop publicado llama a la query.
