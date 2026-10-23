# Plan — Cajas: el filtro Abiertas/Cerradas filtra (#599)

Rama `fix/caja-filtro-activo` en **central** y **desktop**. El filial no se toca.

## Problema

En Cajas (`financiero/pdv/caja/list-caja`) el checkbox TODAS / Abiertas / Cerradas (`activoControl`)
cambia el texto pero no filtra: `buscar()` no lo manda y `cajasWithFilters` del central no tiene
parámetro para eso.

## Decisiones

- **Se filtra por `pdv_caja.activo`**, no por `estado`. En la base local `estado` es NULL en las
  51.196 cajas; `activo` está en todas (150 en `true`). `activo = true` es «nunca se cerró»: incluye
  cajas viejas abandonadas (ver `CajerosConCajaAbiertaIT`), pero es lo que la lista ya muestra y el
  rango de fechas lo acota.
- **«Últimas cajas» del PDV no cambia.** Usa la misma query contra el **filial**
  (`ultimas-cajas-dialog`, `servidor=false`). El filial no tiene `activo` y rechazaría una query que
  lo declare, en las 18 filiales. Por eso el desktop arma una segunda query, `cajasWithFiltersActivo`,
  solo para el central, con los mismos campos.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| argumento `activo: Boolean` de `cajasWithFilters` (central) | `list-caja.component.ts` → `CajaService.onGetCajasWithFilters` → `CajasWithFiltersActivoGQL` | `PdvCajaGraphQL.cajasWithFilters` → `PdvCajaService.findAllWithFilters` → `PdvCajaRepository.findAllWithFilters` (`:activo is null or c.activo = :activo`) |

Sin columnas ni migraciones: `activo` ya existe y ya está mapeada en `PdvCaja`.

## Fases

### Fase 1 — central (PR primero)

- `pdv-caja.graphqls`: `activo: Boolean` en `cajasWithFilters`, después de `verificado`.
- `PdvCajaGraphQL.cajasWithFilters`, `PdvCajaService.findAllWithFilters`,
  `PdvCajaRepository.findAllWithFilters`: parámetro `Boolean activo` en la misma posición; el JPQL
  suma `(:activo is null or c.activo = :activo)`, igual que `verificado`.
- Sin control por rol nuevo: la query es de lectura y ya existía sin rol; agregar un filtro no
  expone nada que no devolviera antes.
- **Tests**: `CajasWithFiltersActivoIT` (estilo `CajerosConCajaAbiertaIT`, `-Dit.caja=true`, solo
  lectura), sobre una sucursal con cajas de los dos tipos: con `true` no vacío y todas activas, con
  `false` no vacío y ninguna activa, y `total(true) + total(false) = total(null)` (auditoría B: si
  no, un resultado vacío pasa sin querer).
  Revertir solo la línea del JPQL y ver que falla. Batería `./mvnw clean verify -B -DskipFlyway=true`.

### Fase 2 — desktop

- `graphql-query.ts`: el bloque de campos de `cajasWithFilters` pasa a una constante y se suma
  `cajasWithFiltersActivo` (mismos campos + `$activo`). El texto de `cajasWithFilters` no cambia.
- `graphql/cajaWithFiltersActivo.ts`: clase `CajasWithFiltersActivoGQL`.
- `CajaService.onGetCajasWithFilters`: parámetro `activo` después de `verificado`. Usa la query
  nueva solo si `servidor` es `true` **y** `activo` no es null; si no, la de hoy sin `activo`. Así
  TODAS sigue andando contra un central sin el argumento (auditoría A).
- `list-caja`: `buscar()` manda `activoControl.value`. Se borra el comentario de #578 en
  `onResetFilter` que dice que no viaja.
- `ultimas-cajas-dialog`: pasa `null` en la posición nueva.
- **Tests**: N/A batería (el CI del desktop no corre tests). Gate `npm run check`.

## Prueba de runtime (local)

Central de la rama en 8081 (perfil dev), desktop `ng serve -c web`, usuario MR.

1. Cajas, sucursal con abiertas y cerradas en el rango: TODAS / Abiertas / Cerradas con Filtrar →
   cada lista coincide con un `count` por SQL; página 2 respeta el filtro.
2. Limpiar vuelve a TODAS y trae todas.
3. Últimas cajas del PDV (filial propio 8082, sucursal 24) sigue abriendo y listando.

## Orden de despliegue

Central antes que desktop en cada canal: un desktop nuevo contra un central sin `activo` da error
de validación en Cajas (solo en esa pantalla; el PDV no se entera).

## Sin verificar

- Desktop nuevo contra central viejo: se describe, no se prueba.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Desktop nuevo contra central viejo rompe Cajas incluso con TODAS | La query con `activo` solo viaja si se eligió Abiertas o Cerradas |
| A | `graphql-tag` concatena strings interpolados (`lib/index.js:76-92`) | Se usa así; patrón válido aunque nuevo en el repo |
| A | Sin uso de `cajasWithFilters` en mobile ni mobile-pwa; sin specs que lo mockeen | Nada que cambiar |
| B | El IT pasaría con un resultado vacío | Asserts de no vacío y de partición |
| B | El IT no corre en CI (`-Dit.caja=true`) | Se acepta, igual que los otros IT; se corre a mano en la fase 1 |
| B | `servidor=false` con `activo` descartaría el filtro en silencio | Comentario en `CajaService`; hoy el único llamador al filial pasa null |
| B | Un `activo` NULL saldría como «Cerrado» en la tabla y no entraría en Cerradas | Hoy no hay ninguno (default true); se deja así, igual que `verificado` |
