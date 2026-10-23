# Plan — Modificaciones del sistema: paginación con dos módulos (issue #583)

## Problema

`ModificacionesComponent.buscar()`, sin tipo de entidad y con el módulo `productos`, consulta
`productos` y `operaciones`. Pide a cada uno la página N con `pageSize`, une, ordena por fecha y se
queda con los primeros `pageSize`. Lo que sobra de esa tanda no aparece en ninguna página, y el
total (la suma) promete más filas de las que se pueden recorrer.

## Decisión

Arreglo en el cliente, sin tocar el central:

- con más de un esquema: pedir a cada uno la **página 0** con `size = (N+1) × pageSize`, unir,
  ordenar por `modificadoEn` descendente y cortar `[N × pageSize, (N+1) × pageSize)`;
- con un solo esquema: igual que hoy (página N, `pageSize`).

Por qué no el central: una query nueva obliga a dos PRs, a un deploy del central antes que el del
desktop y a que el desktop nuevo funcione contra un central viejo. El central ya ordena por
`modificadoEn DESC` (`ModificacionRegistroRepository.findBySchemaNombreAndFechaBetween`) y no limita
`size` (`ModificacionGraphQL.modificacionesPorSchema`), así que el corte en el cliente da el mismo
orden que daría una query unida.

Costo: la página N trae `2 × (N+1) × pageSize` filas. Con 15 por página, la página 20 trae 630.
Aceptable para una pantalla de auditoría; si alguien recorre cientos de páginas, la query unida en
el central es la mejora.

La rama con tipo de entidad consulta un solo esquema (`AJUSTE_STOCK` → `operaciones`, el resto el
elegido): no tiene el bug y no se toca.

## Fases

1. **Fase 1 — corte correcto** (`modificaciones.component.ts`, rama sin tipo de entidad). Test: spec
   del componente con el servicio simulado: dos esquemas, página 2 → pide página 0 con
   `size = 2 × pageSize` a cada uno y muestra las filas 15..29 del resultado unido.

## Datos nuevos

N/A: no nace ningún campo, columna ni clave.

## Pruebas

- Spec Karma con tsconfig acotado (el CI del desktop no corre tests).
- `npm run check`.
- Por pantalla, contra el central local: módulo PRODUCTOS, recorrer las páginas y comprobar que la
  cantidad de filas vistas coincide con el total y que no hay repetidas ni saltos; módulo FINANCIERO
  (un solo esquema) sigue paginando igual.

## Auditoría del plan (paso 5)

- **Eje A (contrato):** sin cambio de contrato GraphQL. `modificacionesPorSchema` solo lo usa esta
  pantalla; no aparece en mobile-pwa ni en mobile, y el filial no la tiene. El central no limita
  `size`. Riesgo: el central ordena solo por `modificadoEn`, así que con fechas iguales el orden no es
  fijo. → **Aplicado:** el `sort` del cliente desempata por `id` descendente.
- **Eje B (estado):** sin migración ni datos. Con fechas iguales, el mismo riesgo. → mismo arreglo.
  Riesgo 2: si una de las dos consultas falla, el paginador queda en la página nueva con la tabla
  vieja. → **No aplicado:** ya pasaba antes del fix y no es de #583.
- **Límite aceptado:** dentro de un mismo esquema, si el corte del `LIMIT` del central cae en medio
  de un grupo de filas con la misma fecha, Postgres puede elegir filas distintas entre dos
  consultas. Se arregla en el central con `ORDER BY modificadoEn DESC, id DESC`. Queda fuera de este
  PR, y también afecta a la paginación de un solo módulo.

## Resultado de las pruebas

- Spec (4 tests): verde con el fix. Con el código viejo fallan 3 (el de un solo módulo pasa en los
  dos casos: es el que cuida que no se rompa).
- Por pantalla, contra el central local, del 1/9 al 23/10:
  - PRODUCTOS: 8 páginas, 120 de 120 ids, sin repetidos, en el mismo orden que
    `ORDER BY modificado_en DESC, id DESC` en la base;
  - OPERACIONES sola: 4 páginas, 60 de 60, igual a la base;
  - PRODUCTOS en la página 3 de 15, pasando a 25 por página: muestra las filas 26–50 correctas.

## Sin verificar

- Rendimiento con N muy alto contra la base de producción.
